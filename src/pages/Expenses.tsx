import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Receipt, Pencil, Trash2 } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { loadExpenses, saveExpense, deleteExpense } from '@/utils/accountingStorage';
import { loadSettings } from '@/utils/settingsStorage';
import { Expense } from '@/types/accounting';
import { useToast } from '@/hooks/use-toast';

export default function Expenses() {
  const { toast } = useToast();
  const settings = loadSettings();
  const [expenses, setExpenses] = useState<Expense[]>(loadExpenses());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [formData, setFormData] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    category: '',
    description: '',
    amount: 0,
    paymentMethod: 'cash',
    reference: '',
    status: 'pending',
  });

  const categories = [
    'Office Supplies',
    'Utilities',
    'Rent',
    'Equipment',
    'Materials',
    'Transportation',
    'Professional Services',
    'Marketing',
    'Insurance',
    'Other',
  ];

  const handleSubmit = () => {
    if (!formData.vendor || !formData.category || !formData.amount) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const expense: Expense = {
      id: editingExpense?.id || crypto.randomUUID(),
      date: formData.date!,
      vendor: formData.vendor!,
      category: formData.category!,
      description: formData.description || '',
      amount: formData.amount!,
      paymentMethod: formData.paymentMethod || 'cash',
      reference: formData.reference,
      status: formData.status || 'pending',
      createdAt: editingExpense?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveExpense(expense);
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
      status: 'pending',
    });
    toast({ title: editingExpense ? 'Expense updated' : 'Expense added successfully' });
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
      case 'approved': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'rejected': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default: return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => { setEditingExpense(null); setFormData({ date: new Date().toISOString().split('T')[0], vendor: '', category: '', description: '', amount: 0, paymentMethod: 'cash', reference: '', status: 'pending' }); }}>
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
                  <Label htmlFor="vendor">Vendor *</Label>
                  <Input
                    id="vendor"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="reference">Reference Number</Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
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

        {expenses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No expenses recorded</h3>
              <p className="text-muted-foreground mb-4">Add your first expense to start tracking</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {expenses.map((expense) => (
              <Card key={expense.id} className="shadow-[var(--shadow-elegant)] border-border/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{expense.vendor}</CardTitle>
                        <Badge className={getStatusColor(expense.status)}>{expense.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                        <p><strong>Date:</strong> {new Date(expense.date).toLocaleDateString()}</p>
                        <p><strong>Category:</strong> {expense.category}</p>
                        <p><strong>Payment:</strong> {expense.paymentMethod}</p>
                        {expense.reference && <p><strong>Ref:</strong> {expense.reference}</p>}
                        {expense.description && (
                          <p className="col-span-2"><strong>Note:</strong> {expense.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">
                        {settings.currencySymbol}{expense.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex gap-2 border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(expense)}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(expense.id)}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
