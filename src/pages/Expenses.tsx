import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Receipt, Pencil, Trash2, Upload, Download, Check, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Navigation } from '@/components/Navigation';
import { loadExpenses, saveExpense, deleteExpense } from '@/utils/accountingStorage';
import { loadSettings } from '@/utils/settingsStorage';
import { loadChartOfAccounts, addChartAccount } from '@/utils/chartOfAccountsStorage';
import { Expense } from '@/types/accounting';
import { AccountType } from '@/types/accounting';
import { useToast } from '@/hooks/use-toast';
import { recordExpense } from '@/utils/doubleEntryManager';
import { calculateExpenseStatus, calculateExpenseAmountDue } from '@/utils/expenseStatusCalculator';

export default function Expenses() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const settings = loadSettings();
  const [expenses, setExpenses] = useState<Expense[]>(loadExpenses());
  const [chartAccounts, setChartAccounts] = useState(loadChartOfAccounts());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showNewAccountDialog, setShowNewAccountDialog] = useState(false);
  const [newAccount, setNewAccount] = useState({ accountNumber: '', accountName: '', accountType: 'expense' as AccountType });
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkExpenses, setBulkExpenses] = useState<Partial<Expense>[]>([]);

  const [formData, setFormData] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    category: '',
    description: '',
    amount: 0,
    paymentMethod: 'cash',
    reference: '',
    supplierInvoiceRef: '',
    status: 'pending',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    payments: [],
  });

  const expenseAccounts = chartAccounts.filter(acc => acc.accountType === 'expense');

  const handleCreateAccount = () => {
    if (!newAccount.accountNumber || !newAccount.accountName) {
      toast({ title: 'Please fill in account number and name', variant: 'destructive' });
      return;
    }
    
    const created = addChartAccount({ ...newAccount, isDefault: false });
    setChartAccounts(loadChartOfAccounts());
    setFormData({ ...formData, category: created.accountName });
    setShowNewAccountDialog(false);
    setNewAccount({ accountNumber: '', accountName: '', accountType: 'expense' });
    toast({ title: 'Expense account created successfully' });
  };


  const handleSubmit = () => {
    if (!formData.category || !formData.amount) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const expense: Expense = {
      id: editingExpense?.id || crypto.randomUUID(),
      date: formData.date!,
      vendor: formData.vendor || 'General Expense',
      category: formData.category!,
      description: formData.description || '',
      amount: formData.amount!,
      paymentMethod: formData.paymentMethod || 'cash',
      reference: formData.reference || '',
      supplierInvoiceRef: formData.supplierInvoiceRef,
      status: formData.status!,
      dueDate: formData.dueDate,
      payments: editingExpense?.payments || [],
      createdAt: editingExpense?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Calculate status dynamically
    expense.status = calculateExpenseStatus(expense);

    saveExpense(expense);
    
    // Create corresponding journal entry for double-entry bookkeeping
    if (!editingExpense) {
      try {
        recordExpense(expense);
      } catch (error) {
        toast({ 
          title: 'Warning: Expense saved but journal entry failed', 
          description: error instanceof Error ? error.message : 'Transaction not balanced',
          variant: 'destructive' 
        });
      }
    }
    
    setExpenses(loadExpenses());
    setIsDialogOpen(false);
    setEditingExpense(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      category: '',
      description: '',
      amount: 0,
      paymentMethod: 'cash',
      reference: '',
      supplierInvoiceRef: '',
      status: 'pending',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payments: [],
    });
    toast({ title: editingExpense ? 'Expense updated' : 'Expense recorded with journal entry' });
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData(expense);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      deleteExpense(id);
      setExpenses(loadExpenses());
      toast({ title: 'Expense deleted successfully' });
    }
  };

  const getStatusColor = (status: Expense['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'partly-paid': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'approved': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'overdue': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'rejected': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default: return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const downloadTemplate = () => {
    const template = [
      {
        Date: '2024-01-15',
        Description: 'Office supplies purchase',
        Amount: 150.00,
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    XLSX.writeFile(wb, 'expense_template.xlsx');
    
    toast({ title: 'Template downloaded successfully' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const parsedExpenses = data.map((row: any) => ({
          date: row.Date || new Date().toISOString().split('T')[0],
          vendor: 'General Expense',
          category: '',
          description: row.Description || '',
          amount: parseFloat(row.Amount) || 0,
          paymentMethod: 'cash' as const,
          reference: '',
          status: 'paid' as Expense['status'],
        }));

        setBulkExpenses(parsedExpenses);
        setIsBulkUploadOpen(true);
        toast({ title: `${parsedExpenses.length} expenses loaded for review` });
      } catch (error) {
        toast({ title: 'Failed to parse Excel file', variant: 'destructive' });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const updateBulkExpenseAccount = (index: number, category: string) => {
    const updated = [...bulkExpenses];
    updated[index] = { ...updated[index], category };
    setBulkExpenses(updated);
  };

  const removeBulkExpense = (index: number) => {
    setBulkExpenses(bulkExpenses.filter((_, i) => i !== index));
  };

  const saveBulkExpenses = () => {
    let savedCount = 0;
    bulkExpenses.forEach((exp) => {
      if (exp.category && exp.amount) {
        const expense: Expense = {
          id: crypto.randomUUID(),
          date: exp.date!,
          vendor: 'General Expense',
          category: exp.category!,
          description: exp.description || '',
          amount: exp.amount!,
          paymentMethod: 'cash',
          reference: '',
          status: 'paid',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        saveExpense(expense);
        
        // Create corresponding journal entry for double-entry bookkeeping
        try {
          recordExpense(expense);
        } catch (error) {
          console.error('Journal entry failed for bulk expense:', error);
        }
        
        savedCount++;
      }
    });
    
    setExpenses(loadExpenses());
    setBulkExpenses([]);
    setIsBulkUploadOpen(false);
    toast({ title: `${savedCount} expenses saved with journal entries` });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              Expenses
            </h1>
            <p className="text-muted-foreground">
              Track and manage business expenses • Total: {settings.currencySymbol}{totalExpenses.toFixed(2)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={downloadTemplate}>
              <Download className="h-4 w-4" />
              Download Template
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <label>
                <Upload className="h-4 w-4" />
                Upload Excel
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                />
              </label>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={() => { 
                  setEditingExpense(null); 
                  setFormData({ 
                    date: new Date().toISOString().split('T')[0], 
                    vendor: '', 
                    category: '', 
                    description: '', 
                    amount: 0, 
                    paymentMethod: 'cash', 
                    reference: '', 
                    supplierInvoiceRef: '',
                    status: 'pending', 
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    payments: []
                  }); 
                }}>
                  <Plus className="h-4 w-4" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor">Supplier Name *</Label>
                  <Input
                    id="vendor"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    placeholder="Enter supplier name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Expense Account *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => {
                      if (value === '__new__') {
                        setShowNewAccountDialog(true);
                      } else {
                        setFormData({ ...formData, category: value });
                      }
                    }}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select expense account" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseAccounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.accountName}>
                          {acc.accountNumber} - {acc.accountName}
                        </SelectItem>
                      ))}
                      <SelectItem value="__new__" className="text-primary font-semibold">
                        + Create New Expense Account
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierInvoiceRef">Supplier Invoice Ref</Label>
                  <Input
                    id="supplierInvoiceRef"
                    value={formData.supplierInvoiceRef}
                    onChange={(e) => setFormData({ ...formData, supplierInvoiceRef: e.target.value })}
                    placeholder="Supplier's invoice number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ({settings.currencySymbol}) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                    <SelectTrigger id="paymentMethod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date (Optional)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>Save</Button>
              </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Dialog open={showNewAccountDialog} onOpenChange={setShowNewAccountDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Expense Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  value={newAccount.accountNumber}
                  onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                  placeholder="e.g., 507"
                />
              </div>
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input
                  value={newAccount.accountName}
                  onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
                  placeholder="e.g., Marketing Expense"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewAccountDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateAccount}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review and Confirm Bulk Expenses</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {bulkExpenses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No expenses to review</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Expense Account</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[80px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bulkExpenses.map((exp, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-sm">{exp.date}</TableCell>
                          <TableCell className="text-sm">{exp.vendor}</TableCell>
                          <TableCell>
                            <Select
                              value={exp.category}
                              onValueChange={(value) => {
                                if (value === '__new__') {
                                  setShowNewAccountDialog(true);
                                } else {
                                  updateBulkExpenseAccount(index, value);
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Select account" />
                              </SelectTrigger>
                              <SelectContent>
                                {expenseAccounts.map(acc => (
                                  <SelectItem key={acc.id} value={acc.accountName}>
                                    {acc.accountNumber} - {acc.accountName}
                                  </SelectItem>
                                ))}
                                <SelectItem value="__new__" className="text-primary font-semibold">
                                  + Create New Account
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm font-semibold">{settings.currencySymbol}{exp.amount?.toFixed(2)}</TableCell>
                          <TableCell className="text-sm">{exp.paymentMethod}</TableCell>
                          <TableCell>
                            <Badge className="text-xs">{exp.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBulkExpense(index)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setIsBulkUploadOpen(false)}>Cancel</Button>
                    <Button onClick={saveBulkExpenses} className="gap-2">
                      <Check className="h-4 w-4" />
                      Save All ({bulkExpenses.length})
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {expenses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No expenses recorded</h3>
              <p className="text-muted-foreground mb-4">Add your first expense to start tracking</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]">
                      <Checkbox />
                    </TableHead>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>Doc. No.</TableHead>
                    <TableHead>Supp. Inv.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Amount Due</TableHead>
                    <TableHead className="text-center">Printed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => {
                    const amountDue = expense.payments 
                      ? expense.amount - expense.payments.reduce((sum, p) => sum + p.amount, 0)
                      : expense.amount;
                    
                    return (
                      <TableRow key={expense.id}>
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell className="font-medium">
                          {expense.vendor}
                        </TableCell>
                        <TableCell>{expense.reference || expense.id.substring(0, 8).toUpperCase()}</TableCell>
                        <TableCell>{expense.supplierInvoiceRef || '-'}</TableCell>
                        <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                        <TableCell>{expense.dueDate ? new Date(expense.dueDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="text-right">
                          {settings.currencySymbol}{expense.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {settings.currencySymbol}{Math.max(0, amountDue).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox checked={false} disabled />
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(expense.status)}>
                            {expense.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="gap-1">
                                Actions
                                <span className="ml-1">▼</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => navigate(`/expenses/${expense.id}/preview`)}>
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/expenses/${expense.id}/print`)}>
                                Print
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(expense)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/expenses/${expense.id}/payment`)}>
                                Create Payment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const newExpense = {
                                  ...expense,
                                  id: crypto.randomUUID(),
                                  createdAt: new Date().toISOString(),
                                  updatedAt: new Date().toISOString(),
                                };
                                delete newExpense.payments;
                                setFormData(newExpense);
                                setIsDialogOpen(true);
                              }}>
                                Copy Expense
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/expenses/${expense.id}/history`)}>
                                View History
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(expense.id)}
                                className="text-destructive"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
