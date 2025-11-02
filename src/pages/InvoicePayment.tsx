import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navigation } from '@/components/Navigation';
import { DollarSign, ArrowLeft } from 'lucide-react';
import { loadInvoices, saveInvoice } from '@/utils/invoiceStorage';
import { Invoice } from '@/types/invoice';
import { useToast } from '@/hooks/use-toast';
import { recordPaymentReceived } from '@/utils/doubleEntryManager';
import { useSettings } from '@/contexts/SettingsContext';
import { calculateInvoiceStatus, calculateAmountDue } from '@/utils/invoiceStatusCalculator';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

export default function InvoicePayment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const { settings } = useSettings();
  const { activeCompany } = useCompany();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'bank' as 'cash' | 'bank',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentReference: '',
    bankAccountId: '',
  });

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        const invoices = await loadInvoices();
        setAllInvoices(invoices);
        const found = invoices.find(inv => inv.id === id);
        if (found) {
          setInvoice(found);
          const amountDue = await calculateAmountDue(found, invoices);
          setPaymentData(prev => ({
            ...prev,
            amount: amountDue,
            paymentReference: `PAY-${found.invoiceNumber}`,
          }));
        }
      }

      // Load bank accounts
      if (activeCompany) {
        const { data: accounts } = await supabase
          .from('bank_accounts')
          .select('*')
          .eq('company_id', activeCompany.id)
          .eq('is_active', true)
          .order('account_name');
        
        if (accounts) {
          setBankAccounts(accounts);
          if (accounts.length > 0) {
            setPaymentData(prev => ({ ...prev, bankAccountId: accounts[0].id }));
          }
        }
      }
    };
    loadData();
  }, [id, activeCompany]);


  const handleRecordPayment = async () => {
    if (!invoice) return;

    if (!paymentData.amount || paymentData.amount <= 0) {
      toast({ title: 'Please enter a valid payment amount', variant: 'destructive' });
      return;
    }

    if (!paymentData.paymentDate || !paymentData.paymentReference) {
      toast({ title: 'Please fill in all payment details', variant: 'destructive' });
      return;
    }

    if (paymentData.paymentMethod === 'bank' && !paymentData.bankAccountId) {
      toast({ title: 'Please select a bank account', variant: 'destructive' });
      return;
    }

    const currentAmountDue = await calculateAmountDue(invoice, allInvoices);

    if (paymentData.amount > currentAmountDue) {
      toast({ 
        title: 'Payment amount exceeds amount due', 
        description: `Maximum payment allowed: ${settings.currencySymbol}${currentAmountDue.toFixed(2)}`,
        variant: 'destructive' 
      });
      return;
    }

    try {
      // Add payment to invoice
      const newPayment = {
        id: crypto.randomUUID(),
        amount: paymentData.amount,
        date: paymentData.paymentDate,
        method: paymentData.paymentMethod === 'cash' ? 'Cash' : 'Bank Transfer',
        reference: paymentData.paymentReference,
      };

      const payments = [...(invoice.payments || []), newPayment];
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      
      // Calculate new amount due
      const newAmountDue = await calculateAmountDue(
        { ...invoice, payments },
        allInvoices
      );

      // Update invoice status
      // Calculate the updated status dynamically
      const tempInvoice = { ...invoice, payments };
      const updatedStatus = await calculateInvoiceStatus(tempInvoice, allInvoices);

      const updatedInvoice: Invoice = {
        ...invoice,
        payments,
        status: updatedStatus,
        updatedAt: new Date().toISOString(),
      };

      await saveInvoice(updatedInvoice);

      // Create double-entry journal entry for payment (unique reference per payment)
      const uniqueRef = `PAY-${invoice.invoiceNumber}-${newPayment.id.slice(0,8)}`;
      await recordPaymentReceived(
        { ...invoice, total: paymentData.amount },
        paymentData.paymentMethod,
        paymentData.paymentDate,
        uniqueRef
      );

      toast({ 
        title: 'Payment recorded successfully',
        description: newAmountDue > 0 
          ? `Remaining balance: ${settings.currencySymbol}${newAmountDue.toFixed(2)}`
          : 'Invoice fully paid'
      });
      navigate('/invoices');
    } catch (error) {
      toast({
        title: 'Payment recording failed',
        description: error instanceof Error ? error.message : 'Transaction not balanced',
        variant: 'destructive',
      });
    }
  };

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p>Invoice not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/invoices')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Record Payment for Invoice {invoice.invoiceNumber}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client:</span>
                  <span className="font-semibold">{invoice.projectDetails.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project:</span>
                  <span className="font-semibold">{invoice.projectDetails.projectName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Total:</span>
                  <span className="font-semibold">{settings.currencySymbol}{invoice.total.toFixed(2)}</span>
                </div>
                {invoice.payments && invoice.payments.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Previous Payments:</span>
                    <span className="font-semibold text-green-600">
                      -{settings.currencySymbol}{invoice.payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="text-muted-foreground">Amount Due:</span>
                  <span className="font-bold text-primary">
                    {settings.currencySymbol}{paymentData.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="Enter payment amount"
                />
                <p className="text-xs text-muted-foreground">
                  You can enter a partial payment amount
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={paymentData.paymentMethod}
                  onValueChange={(value: 'cash' | 'bank') =>
                    setPaymentData({ ...paymentData, paymentMethod: value })
                  }
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.length > 0 && (
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                    )}
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
                {bankAccounts.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Set up a bank account to enable Bank Transfer payments
                  </p>
                )}
              </div>

              {paymentData.paymentMethod === 'bank' && (
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Bank Account *</Label>
                  <Select
                    value={paymentData.bankAccountId}
                    onValueChange={(value) =>
                      setPaymentData({ ...paymentData, bankAccountId: value })
                    }
                  >
                    <SelectTrigger id="bankAccount">
                      <SelectValue placeholder="Select bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_name} - {account.bank_name} ({account.account_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This will credit Bank Account
                  </p>
                </div>
              )}

              {paymentData.paymentMethod === 'cash' && (
                <div className="space-y-2">
                  <Label htmlFor="cashNote">Cash Account</Label>
                  <Input
                    id="cashNote"
                    value="Cash"
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    This will credit Cash Account
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentData.paymentDate}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, paymentDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentReference">Payment Reference</Label>
                <Input
                  id="paymentReference"
                  value={paymentData.paymentReference}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, paymentReference: e.target.value })
                  }
                  placeholder="e.g., PAY-001, Transaction ID, etc."
                />
              </div>

              <div className="bg-accent/50 p-4 rounded-lg space-y-2">
                <p className="font-semibold text-sm">Double-Entry Journal Entry:</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Debit: {paymentData.paymentMethod === 'cash' ? 'Cash' : 'Bank Account'}</span>
                    <span>{settings.currencySymbol}{paymentData.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credit: Accounts Receivable</span>
                    <span>{settings.currencySymbol}{paymentData.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => navigate('/invoices')} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleRecordPayment} className="flex-1 gap-2">
                  <DollarSign className="h-4 w-4" />
                  Record Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
