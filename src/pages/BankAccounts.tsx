import { useState } from 'react';
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
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('bankAccounts');
    return saved ? JSON.parse(saved) : [];
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState<{
    accountName: string;
    bankName: string;
    accountNumber: string;
    branchCode: string;
    accountType: 'checking' | 'savings' | 'credit';
    currency: string;
    ledgerAccount: string;
    openingBalance: number;
  }>({
    accountName: '',
    bankName: '',
    accountNumber: '',
    branchCode: '',
    accountType: 'checking',
    currency: 'ZAR',
    ledgerAccount: '',
    openingBalance: 0,
  });

  const saveToBankAccounts = (newAccounts: BankAccount[]) => {
    setAccounts(newAccounts);
    localStorage.setItem('bankAccounts', JSON.stringify(newAccounts));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.accountName || !formData.bankName || !formData.accountNumber || !formData.ledgerAccount) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingAccount) {
      const updated = accounts.map(acc => 
        acc.id === editingAccount.id 
          ? { ...acc, ...formData }
          : acc
      );
      saveToBankAccounts(updated);
      toast.success('Bank account updated successfully');
    } else {
      const newAccount: BankAccount = {
        id: crypto.randomUUID(),
        ...formData,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      saveToBankAccounts([...accounts, newAccount]);
      toast.success('Bank account added successfully');
    }

    setIsDialogOpen(false);
    resetForm();
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
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this bank account?')) {
      saveToBankAccounts(accounts.filter(acc => acc.id !== id));
      toast.success('Bank account deleted successfully');
    }
  };

  const toggleActive = (id: string) => {
    const updated = accounts.map(acc => 
      acc.id === id ? { ...acc, isActive: !acc.isActive } : acc
    );
    saveToBankAccounts(updated);
    toast.success('Account status updated');
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
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingAccount ? 'Edit Bank Account' : 'Add New Bank Account'}
                    </DialogTitle>
                    <DialogDescription>
                      Enter the bank account details. This will be linked to your chart of accounts.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
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
            {accounts.length === 0 ? (
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
