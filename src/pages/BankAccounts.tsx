import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { saveJournalEntry } from '@/utils/accountingStorage';
import { JournalEntry, JournalEntryLine } from '@/types/accounting';

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  branchCode: string;
  accountType: 'checking' | 'savings' | 'credit';
  currency: string;
  ledgerAccount: string;
  openingBalance: number;
  isActive: boolean;
  createdAt: string;
}

export default function BankAccounts() {
  const { activeCompany } = useCompany();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [chartAccounts, setChartAccounts] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<{
    accountName: string;
    bankName: string;
    accountNumber: string;
    branchCode: string;
    accountType: 'checking' | 'savings' | 'credit';
    currency: string;
    ledgerAccount: string;
    openingBalance: number;
    contraAccount: string;
  }>({
    accountName: '',
    bankName: '',
    accountNumber: '',
    branchCode: '',
    accountType: 'checking',
    currency: 'ZAR',
    ledgerAccount: '',
    openingBalance: 0,
    contraAccount: '',
  });

  useEffect(() => {
    if (activeCompany) {
      loadBankAccounts();
      loadChartOfAccounts();
    }
  }, [activeCompany]);

  const loadChartOfAccounts = async () => {
    if (!activeCompany) return;

    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('company_id', activeCompany.id)
        .eq('is_active', true)
        .order('account_number');

      if (error) throw error;
      setChartAccounts(data || []);
    } catch (error: any) {
      console.error('Failed to load chart of accounts:', error.message);
    }
  };

  const loadBankAccounts = async () => {
    if (!activeCompany) return;

    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        toast.error('Please sign in to view bank accounts');
        return;
      }

      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('company_id', activeCompany.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedAccounts: BankAccount[] = (data || []).map(acc => ({
        id: acc.id,
        accountName: acc.account_name,
        bankName: acc.bank_name,
        accountNumber: acc.account_number,
        branchCode: acc.branch_code || '',
        accountType: acc.account_type as 'checking' | 'savings' | 'credit',
        currency: acc.currency,
        ledgerAccount: acc.ledger_account,
        openingBalance: Number(acc.opening_balance),
        isActive: acc.is_active,
        createdAt: acc.created_at,
      }));

      setAccounts(formattedAccounts);
    } catch (error: any) {
      toast.error('Failed to load bank accounts: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeCompany) {
      toast.error('Please select a company first');
      return;
    }

    if (!formData.accountName || !formData.bankName || !formData.accountNumber || !formData.ledgerAccount) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.openingBalance !== 0 && !formData.contraAccount) {
      toast.error('Please select a contra account for the opening balance');
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        toast.error('Please sign in to manage bank accounts');
        return;
      }

      if (editingAccount) {
        const { error } = await supabase
          .from('bank_accounts')
          .update({
            account_name: formData.accountName,
            bank_name: formData.bankName,
            account_number: formData.accountNumber,
            branch_code: formData.branchCode,
            account_type: formData.accountType,
            currency: formData.currency,
            ledger_account: formData.ledgerAccount,
            opening_balance: formData.openingBalance,
          })
          .eq('id', editingAccount.id);

        if (error) throw error;
        toast.success('Bank account updated successfully');
      } else {
        const { data: newAccount, error } = await supabase
          .from('bank_accounts')
          .insert({
            user_id: session.session.user.id,
            company_id: activeCompany.id,
            account_name: formData.accountName,
            bank_name: formData.bankName,
            account_number: formData.accountNumber,
            branch_code: formData.branchCode,
            account_type: formData.accountType,
            currency: formData.currency,
            ledger_account: formData.ledgerAccount,
            opening_balance: formData.openingBalance,
            current_balance: formData.openingBalance,
          })
          .select()
          .single();

        if (error) throw error;

        // Create opening balance journal entry if opening balance is not zero
        if (formData.openingBalance !== 0 && newAccount && formData.contraAccount) {
          const contraAccountData = chartAccounts.find(
            acc => `${acc.account_number} - ${acc.account_name}` === formData.contraAccount
          );

          const journalEntry: JournalEntry = {
            id: crypto.randomUUID(),
            date: new Date().toISOString().split('T')[0],
            reference: `OB-BANK-${newAccount.id.slice(0, 8)}`,
            description: `Opening balance for ${formData.accountName}`,
            entries: formData.openingBalance > 0 ? [
              {
                id: crypto.randomUUID(),
                account: `${formData.ledgerAccount} - ${formData.accountName}`,
                accountType: 'current-asset',
                debit: formData.openingBalance,
                credit: 0,
                description: 'Bank opening balance',
              },
              {
                id: crypto.randomUUID(),
                account: formData.contraAccount,
                accountType: contraAccountData?.account_type || 'equity',
                debit: 0,
                credit: formData.openingBalance,
                description: 'Contra account for opening balance',
              },
            ] : [
              {
                id: crypto.randomUUID(),
                account: `${formData.ledgerAccount} - ${formData.accountName}`,
                accountType: 'current-asset',
                debit: 0,
                credit: Math.abs(formData.openingBalance),
                description: 'Bank opening balance (overdraft)',
              },
              {
                id: crypto.randomUUID(),
                account: formData.contraAccount,
                accountType: contraAccountData?.account_type || 'equity',
                debit: Math.abs(formData.openingBalance),
                credit: 0,
                description: 'Contra account for opening balance',
              },
            ],
            totalDebit: Math.abs(formData.openingBalance),
            totalCredit: Math.abs(formData.openingBalance),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await saveJournalEntry(journalEntry);
        }

        toast.success('Bank account added successfully');
      }

      await loadBankAccounts();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error('Failed to save bank account: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      accountName: '',
      bankName: '',
      accountNumber: '',
      branchCode: '',
      accountType: 'checking',
      currency: 'ZAR',
      ledgerAccount: '',
      openingBalance: 0,
      contraAccount: '',
    });
    setEditingAccount(null);
  };

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
    setFormData({
      accountName: account.accountName,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      branchCode: account.branchCode,
      accountType: account.accountType,
      currency: account.currency,
      ledgerAccount: account.ledgerAccount,
      openingBalance: account.openingBalance,
      contraAccount: '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bank account?')) return;

    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Bank account deleted successfully');
      await loadBankAccounts();
    } catch (error: any) {
      toast.error('Failed to delete bank account: ' + error.message);
    }
  };

  const toggleActive = async (id: string) => {
    try {
      const account = accounts.find(acc => acc.id === id);
      if (!account) return;

      const { error } = await supabase
        .from('bank_accounts')
        .update({ is_active: !account.isActive })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Account status updated');
      await loadBankAccounts();
    } catch (error: any) {
      toast.error('Failed to update account status: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-6 w-6" />
                  Bank Accounts
                </CardTitle>
                <CardDescription>
                  Manage your bank accounts and link them to ledger accounts for double-entry bookkeeping
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Bank Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>
                      {editingAccount ? 'Edit Bank Account' : 'Add New Bank Account'}
                    </DialogTitle>
                    <DialogDescription>
                      Enter the bank account details. This will be linked to your chart of accounts.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="grid gap-4 py-4 overflow-y-auto flex-1 px-1">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="accountName">Account Name *</Label>
                          <Input
                            id="accountName"
                            placeholder="e.g., Business Checking"
                            value={formData.accountName}
                            onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bankName">Bank Name *</Label>
                          <Input
                            id="bankName"
                            placeholder="e.g., First National Bank"
                            value={formData.bankName}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="accountNumber">Account Number *</Label>
                          <Input
                            id="accountNumber"
                            placeholder="e.g., 62764000510"
                            value={formData.accountNumber}
                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="branchCode">Branch Code</Label>
                          <Input
                            id="branchCode"
                            placeholder="e.g., 255005"
                            value={formData.branchCode}
                            onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="accountType">Account Type</Label>
                          <Select 
                            value={formData.accountType} 
                            onValueChange={(value: any) => setFormData({ ...formData, accountType: value })}
                          >
                            <SelectTrigger id="accountType">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="checking">Checking Account</SelectItem>
                              <SelectItem value="savings">Savings Account</SelectItem>
                              <SelectItem value="credit">Credit Card</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="currency">Currency</Label>
                          <Select 
                            value={formData.currency} 
                            onValueChange={(value) => setFormData({ ...formData, currency: value })}
                          >
                            <SelectTrigger id="currency">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ZAR">ZAR (South African Rand)</SelectItem>
                              <SelectItem value="USD">USD (US Dollar)</SelectItem>
                              <SelectItem value="EUR">EUR (Euro)</SelectItem>
                              <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="ledgerAccount">Ledger Account Code *</Label>
                          <Input
                            id="ledgerAccount"
                            placeholder="e.g., 1000 (Bank Account)"
                            value={formData.ledgerAccount}
                            onChange={(e) => setFormData({ ...formData, ledgerAccount: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground">
                            Link to your Chart of Accounts for double-entry bookkeeping
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="openingBalance">Opening Balance</Label>
                          <Input
                            id="openingBalance"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.openingBalance}
                            onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>

                      {formData.openingBalance !== 0 && (
                        <div className="space-y-2">
                          <Label htmlFor="contraAccount">Contra Account *</Label>
                          <Select 
                            value={formData.contraAccount} 
                            onValueChange={(value) => setFormData({ ...formData, contraAccount: value })}
                          >
                            <SelectTrigger id="contraAccount">
                              <SelectValue placeholder="Select account for double-entry" />
                            </SelectTrigger>
                            <SelectContent>
                              {chartAccounts.map((account) => (
                                <SelectItem 
                                  key={account.id} 
                                  value={`${account.account_number} - ${account.account_name}`}
                                >
                                  {account.account_number} - {account.account_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Select the account to balance this {formData.openingBalance > 0 ? 'asset' : 'liability'} (e.g., Owner's Capital, Loan, etc.)
                          </p>
                        </div>
                      )}
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingAccount ? 'Update' : 'Add'} Bank Account
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Loading bank accounts...</p>
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No bank accounts yet. Add your first bank account to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Bank Name</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Ledger Account</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.accountName}</TableCell>
                      <TableCell>{account.bankName}</TableCell>
                      <TableCell className="font-mono text-sm">{account.accountNumber}</TableCell>
                      <TableCell className="capitalize">{account.accountType}</TableCell>
                      <TableCell className="font-mono text-sm">{account.ledgerAccount}</TableCell>
                      <TableCell>{account.currency} {account.openingBalance.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant={account.isActive ? "default" : "secondary"}
                          size="sm"
                          onClick={() => toggleActive(account.id)}
                        >
                          {account.isActive ? 'Active' : 'Inactive'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(account)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(account.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
