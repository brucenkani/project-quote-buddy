import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navigation } from '@/components/Navigation';
import { DollarSign, ArrowLeft } from 'lucide-react';
import { loadExpenses, saveExpense } from '@/utils/accountingStorage';
import { Expense } from '@/types/accounting';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsContext';
import { calculateExpenseAmountDue } from '@/utils/expenseStatusCalculator';
import { recordExpensePayment } from '@/utils/doubleEntryManager';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

export default function ExpensePayment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const { settings } = useSettings();
  const { activeCompany } = useCompany();

  const [expense, setExpense] = useState<Expense | null>(null);
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
        const expenses = loadExpenses();
        const found = expenses.find(exp => exp.id === id);
        if (found) {
          setExpense(found);
          const amountDue = calculateExpenseAmountDue(found);
          setPaymentData(prev => ({
            ...prev,
            amount: amountDue,
            paymentReference: `PAY-EXP-${found.id.substring(0, 8).toUpperCase()}`,
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

  const handleRecordPayment = () => {
    if (!expense) return;

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

    const currentAmountDue = calculateExpenseAmountDue(expense);

    if (paymentData.amount > currentAmountDue) {
      toast({ 
        title: 'Payment amount exceeds amount due', 
        description: `Maximum payment allowed: ${settings.currencySymbol}${currentAmountDue.toFixed(2)}`,
        variant: 'destructive' 
      });
      return;
    }

    // Add payment to expense
    const newPayment = {
      id: crypto.randomUUID(),
      amount: paymentData.amount,
      date: paymentData.paymentDate,
      method: paymentData.paymentMethod === 'cash' ? 'Cash' : 'Bank Transfer',
      reference: paymentData.paymentReference,
    };

    const payments = [...(expense.payments || []), newPayment];
    const newAmountDue = expense.amount - payments.reduce((sum, p) => sum + p.amount, 0);

    const updatedExpense: Expense = {
      ...expense,
      payments,
      updatedAt: new Date().toISOString(),
    };

    saveExpense(updatedExpense);

    // Get bank ledger account if payment method is bank
    let bankLedgerAccount: string | undefined;
    let selectedBank: any = null;
    if (paymentData.paymentMethod === 'bank' && paymentData.bankAccountId) {
      selectedBank = bankAccounts.find(b => b.id === paymentData.bankAccountId);
      if (selectedBank) {
        bankLedgerAccount = selectedBank.ledger_account;
      }
    }

    // Create journal entry for payment (double-entry bookkeeping)
    try {
      recordExpensePayment(
        expense,
        paymentData.amount,
        paymentData.paymentMethod,
        paymentData.paymentDate,
        paymentData.paymentReference,
        bankLedgerAccount
      );
    } catch (error) {
      console.error('Failed to create journal entry:', error);
    }

    // Update bank account balance if bank transfer
    if (paymentData.paymentMethod === 'bank' && selectedBank && activeCompany) {
      const updateBankBalance = async () => {
        const newBalance = Number(selectedBank.current_balance || 0) - paymentData.amount;
        const { error: balErr } = await supabase
          .from('bank_accounts')
          .update({ current_balance: newBalance })
          .eq('id', paymentData.bankAccountId);
        if (balErr) console.error('Failed updating bank balance', balErr);

        // Insert bank transaction record
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;
        if (userId) {
          const { error: txErr } = await supabase.from('bank_transactions').insert({
            id: crypto.randomUUID(),
            user_id: userId,
            company_id: activeCompany.id,
            date: paymentData.paymentDate,
            debit: 0,
            credit: paymentData.amount,
            balance: newBalance,
            is_reconciled: false,
            description: `Expense payment to ${expense.vendor}`,
            reference: paymentData.paymentReference,
            account_id: paymentData.bankAccountId,
            category: 'expense_payment',
          });
          if (txErr) console.error('Failed inserting bank transaction', txErr);
        }
      };
      updateBankBalance();
    }

    toast({
      title: 'Payment recorded successfully',
      description: newAmountDue > 0 
        ? `Remaining balance: ${settings.currencySymbol}${newAmountDue.toFixed(2)}`
        : 'Expense fully paid'
    });
    navigate('/expenses');
  };

  if (!expense) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p>Expense not found</p>
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
          onClick={() => navigate('/expenses')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Expenses
        </Button>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Record Payment for Expense
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendor:</span>
                  <span className="font-semibold">{expense.vendor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-semibold">{expense.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expense Total:</span>
                  <span className="font-semibold">{settings.currencySymbol}{expense.amount.toFixed(2)}</span>
                </div>
                {expense.payments && expense.payments.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Previous Payments:</span>
                    <span className="font-semibold text-green-600">
                      -{settings.currencySymbol}{expense.payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="text-muted-foreground">Amount Due:</span>
                  <span className="font-bold text-primary">
                    {settings.currencySymbol}{calculateExpenseAmountDue(expense).toFixed(2)}
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

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => navigate('/expenses')} className="flex-1">
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
