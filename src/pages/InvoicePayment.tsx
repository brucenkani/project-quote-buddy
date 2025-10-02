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
import { loadSettings } from '@/utils/settingsStorage';
import { calculateInvoiceStatus, calculateAmountDue } from '@/utils/invoiceStatusCalculator';

export default function InvoicePayment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const settings = loadSettings();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'bank' as 'cash' | 'bank',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentReference: '',
  });

  useEffect(() => {
    if (id) {
      const invoices = loadInvoices();
      const found = invoices.find(inv => inv.id === id);
      if (found) {
        setInvoice(found);
        const amountDue = calculateAmountDue(found, invoices);
        setPaymentData(prev => ({
          ...prev,
          amount: amountDue,
          paymentReference: `PAY-${found.invoiceNumber}`,
        }));
      }
    }
  }, [id]);


  const handleRecordPayment = () => {
    if (!invoice) return;

    if (!paymentData.amount || paymentData.amount <= 0) {
      toast({ title: 'Please enter a valid payment amount', variant: 'destructive' });
      return;
    }

    if (!paymentData.paymentDate || !paymentData.paymentReference) {
      toast({ title: 'Please fill in all payment details', variant: 'destructive' });
      return;
    }

    const invoices = loadInvoices();
    const currentAmountDue = calculateAmountDue(invoice, invoices);

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
      const newAmountDue = calculateAmountDue(
        { ...invoice, payments },
        invoices
      );

      // Update invoice status
      // Calculate the updated status dynamically
      const tempInvoice = { ...invoice, payments };
      const updatedStatus = calculateInvoiceStatus(tempInvoice, invoices);

      const updatedInvoice: Invoice = {
        ...invoice,
        payments,
        status: updatedStatus,
        updatedAt: new Date().toISOString(),
      };

      saveInvoice(updatedInvoice);

      // Create double-entry journal entry for payment
      recordPaymentReceived(
        { ...invoice, total: paymentData.amount },
        paymentData.paymentMethod,
        paymentData.paymentDate,
        paymentData.paymentReference
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
                    {settings.currencySymbol}{calculateAmountDue(invoice, loadInvoices()).toFixed(2)}
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
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This will credit {paymentData.paymentMethod === 'cash' ? 'Cash' : 'Bank Account'}
                </p>
              </div>

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
