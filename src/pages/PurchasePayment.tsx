import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Navigation } from '@/components/Navigation';
import { loadPurchases, savePurchase } from '@/utils/purchaseStorage';
import { savePurchasePayment, getPurchasePayments, getTotalPaid } from '@/utils/purchasePaymentStorage';
import { useSettings } from '@/contexts/SettingsContext';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PurchasePayment, PaymentMethod } from '@/types/purchasePayment';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { saveJournalEntry } from '@/utils/accountingStorage';
import { JournalEntry, JournalEntryLine } from '@/types/accounting';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

export default function PurchasePayment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useSettings();
  const { activeCompany } = useCompany();
  const [purchase, setPurchase] = useState<any>(null);
  const [payments, setPayments] = useState<PurchasePayment[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    method: 'bank-transfer' as PaymentMethod,
    reference: '',
    notes: '',
    bankAccountId: '',
  });

  useEffect(() => {
    const loadData = async () => {
      const purchases = await loadPurchases();
      const found = purchases.find(p => p.id === id);
      setPurchase(found);
      
      if (found) {
        const purchasePayments = await getPurchasePayments(id!);
        setPayments(purchasePayments);
        const paid = await getTotalPaid(id!);
        setTotalPaid(paid);
        setFormData(prev => ({ ...prev, amount: found.total - paid }));
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
            setFormData(prev => ({ ...prev, bankAccountId: accounts[0].id }));
          }
        }
      }
    };
    loadData();
  }, [id, activeCompany]);

  if (!purchase) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Purchase not found</p>
              <Button onClick={() => navigate('/purchases')} className="mt-4">
                Back to Purchases
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const remainingBalance = purchase.total - totalPaid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.amount <= 0) {
      toast({ title: 'Amount must be greater than 0', variant: 'destructive' });
      return;
    }

    if (formData.amount > remainingBalance) {
      toast({ title: 'Amount exceeds remaining balance', variant: 'destructive' });
      return;
    }

    if (!formData.bankAccountId) {
      toast({ title: 'Please select a bank account', variant: 'destructive' });
      return;
    }

    const payment: PurchasePayment = {
      id: crypto.randomUUID(),
      purchaseId: purchase.id,
      amount: formData.amount,
      date: formData.date,
      method: formData.method,
      reference: formData.reference,
      notes: formData.notes,
      bankAccountId: formData.bankAccountId,
      createdAt: new Date().toISOString(),
    };

    savePurchasePayment(payment);

    // Record payment in accounting: Dr Accounts Payable, Cr Bank
    const journalEntries: JournalEntryLine[] = [
      {
        id: crypto.randomUUID(),
        account: 'Accounts Payable',
        accountType: 'current-liability',
        debit: formData.amount,
        credit: 0,
        description: `Payment for ${purchase.purchaseNumber}`,
      },
      {
        id: crypto.randomUUID(),
        account: 'Bank',
        accountType: 'current-asset',
        debit: 0,
        credit: formData.amount,
        description: `Payment via ${formData.method}`,
      },
    ];

    const journalEntry: JournalEntry = {
      id: crypto.randomUUID(),
      date: formData.date,
      reference: `PAY-${purchase.purchaseNumber}`,
      description: `Payment for purchase ${purchase.purchaseNumber}`,
      entries: journalEntries,
      totalDebit: formData.amount,
      totalCredit: formData.amount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveJournalEntry(journalEntry);

    // Update purchase status if fully paid
    const newTotalPaid = totalPaid + formData.amount;
    if (newTotalPaid >= purchase.total && purchase.status !== 'received') {
      purchase.status = 'received';
      purchase.updatedAt = new Date().toISOString();
      savePurchase(purchase);
    }

    toast({ title: 'Payment recorded successfully' });
    navigate('/purchases');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/purchases')} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Purchases
        </Button>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Payment</CardTitle>
              <p className="text-muted-foreground">Purchase #{purchase.purchaseNumber}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">{settings.currencySymbol}{purchase.total.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">{settings.currencySymbol}{totalPaid.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance Due</p>
                  <p className="text-2xl font-bold text-orange-600">{settings.currencySymbol}{remainingBalance.toFixed(2)}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Payment Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Payment Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bankAccount">Bank Account *</Label>
                  <Select
                    value={formData.bankAccountId}
                    onValueChange={(value) => setFormData({ ...formData, bankAccountId: value })}
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="method">Payment Method</Label>
                    <Select
                      value={formData.method}
                      onValueChange={(value: PaymentMethod) => setFormData({ ...formData, method: value })}
                    >
                      <SelectTrigger id="method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="credit-card">Credit Card</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="reference">Reference Number</Label>
                    <Input
                      id="reference"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      placeholder="Transaction reference"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional payment details"
                  />
                </div>

                <Button type="submit" className="w-full gap-2">
                  <DollarSign className="h-4 w-4" />
                  Record Payment
                </Button>
              </form>
            </CardContent>
          </Card>

          {payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                        <TableCell className="capitalize">{payment.method.replace('-', ' ')}</TableCell>
                        <TableCell>{payment.reference || '-'}</TableCell>
                        <TableCell className="text-right">
                          {settings.currencySymbol}{payment.amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
