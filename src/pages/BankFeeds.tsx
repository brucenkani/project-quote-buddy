import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, DollarSign, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BankTransaction, AllocationType } from '@/types/bankTransaction';
import { loadBankTransactions, saveBankTransaction, deleteBankTransaction } from '@/utils/bankTransactionStorage';
import { loadInvoices, saveInvoice } from '@/utils/invoiceStorage';
import { loadPurchases, savePurchase } from '@/utils/purchaseStorage';
import { loadExpenses, saveExpense } from '@/utils/accountingStorage';
import { savePurchasePayment } from '@/utils/purchasePaymentStorage';
import { saveExpensePayment } from '@/utils/expensePaymentStorage';
import { loadSettings } from '@/utils/settingsStorage';
import * as XLSX from 'xlsx';

export default function BankFeeds() {
  const [transactions, setTransactions] = useState<BankTransaction[]>(loadBankTransactions());
  const [allocateDialog, setAllocateDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
  const [allocationType, setAllocationType] = useState<AllocationType>('invoice');
  const [allocationId, setAllocationId] = useState('');
  const [allocationAmount, setAllocationAmount] = useState('');
  const [allocationNotes, setAllocationNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const settings = loadSettings();

  const downloadTemplate = () => {
    const template = [
      ['Date (YYYY-MM-DD)', 'Description', 'Reference', 'Type (debit/credit)', 'Amount', 'Balance'],
      ['2024-01-15', 'Payment from ABC Corp', 'REF001', 'credit', '5000', '25000'],
      ['2024-01-16', 'Payment to XYZ Suppliers', 'REF002', 'debit', '2000', '23000'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bank Transactions');
    XLSX.writeFile(wb, 'bank_statement_template.xlsx');

    toast({
      title: "Template Downloaded",
      description: "Use this template to upload bank transactions",
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      const newTransactions: BankTransaction[] = [];
      
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row[0] || !row[3] || !row[4]) continue;

        const transaction: BankTransaction = {
          id: `BT-${Date.now()}-${i}`,
          date: row[0],
          description: row[1] || '',
          reference: row[2] || '',
          type: row[3].toLowerCase() === 'debit' ? 'debit' : 'credit',
          amount: parseFloat(row[4]) || 0,
          balance: parseFloat(row[5]) || 0,
          status: 'unallocated',
          allocations: [],
          importedAt: new Date().toISOString(),
        };

        newTransactions.push(transaction);
      }

      const allTransactions = [...transactions, ...newTransactions];
      setTransactions(allTransactions);
      allTransactions.forEach(saveBankTransaction);

      toast({
        title: "Import Successful",
        description: `Imported ${newTransactions.length} bank transactions`,
      });

      event.target.value = '';
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to parse the bank statement file",
        variant: "destructive",
      });
    }
  };

  const handleAllocate = () => {
    if (!selectedTransaction || !allocationId || !allocationAmount) {
      toast({
        title: "Error",
        description: "Please fill in all allocation details",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(allocationAmount);
    const remainingAmount = selectedTransaction.amount - selectedTransaction.allocations.reduce((sum, a) => sum + a.amount, 0);

    if (amount > remainingAmount) {
      toast({
        title: "Error",
        description: "Allocation amount exceeds available amount",
        variant: "destructive",
      });
      return;
    }

    // Record payment based on allocation type
    try {
      if (allocationType === 'invoice') {
        const invoices = loadInvoices();
        const invoice = invoices.find(inv => inv.invoiceNumber === allocationId);
        if (!invoice) throw new Error('Invoice not found');

        // Add payment to invoice
        const payment = {
          id: `${selectedTransaction.id}-${Date.now()}`,
          amount,
          date: selectedTransaction.date,
          method: 'bank-transfer',
          reference: selectedTransaction.reference,
        };
        
        invoice.payments = invoice.payments || [];
        invoice.payments.push(payment);
        
        // Update invoice status
        const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
        if (totalPaid >= invoice.total) {
          invoice.status = 'paid';
        } else if (totalPaid > 0) {
          invoice.status = 'partly-paid';
        }
        
        saveInvoice(invoice);

      } else if (allocationType === 'purchase') {
        const purchases = loadPurchases();
        const purchase = purchases.find(p => p.purchaseNumber === allocationId);
        if (!purchase) throw new Error('Purchase not found');

        // Record payment
        savePurchasePayment({
          id: `${selectedTransaction.id}-${Date.now()}`,
          purchaseId: purchase.id,
          amount,
          date: selectedTransaction.date,
          method: 'bank-transfer',
          reference: selectedTransaction.reference,
          notes: allocationNotes,
          createdAt: new Date().toISOString(),
        });

      } else if (allocationType === 'expense') {
        const expenses = loadExpenses();
        const expense = expenses.find(e => e.reference === allocationId || e.id === allocationId);
        if (!expense) throw new Error('Expense not found');

        // Record payment
        saveExpensePayment({
          id: `${selectedTransaction.id}-${Date.now()}`,
          expenseId: expense.id,
          amount,
          date: selectedTransaction.date,
          method: 'bank-transfer',
          reference: selectedTransaction.reference,
          notes: allocationNotes,
        });
      }

      // Update transaction allocation
      const updatedTransaction = {
        ...selectedTransaction,
        allocations: [
          ...selectedTransaction.allocations,
          {
            id: `${selectedTransaction.id}-${Date.now()}`,
            allocationType,
            allocationId,
            amount,
            allocatedAt: new Date().toISOString(),
            notes: allocationNotes,
          },
        ],
      };

      const totalAllocated = updatedTransaction.allocations.reduce((sum, a) => sum + a.amount, 0);
      updatedTransaction.status = totalAllocated >= updatedTransaction.amount ? 'allocated' : 'partially-allocated';

      saveBankTransaction(updatedTransaction);
      setTransactions(transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));

      toast({
        title: "Allocation Successful",
        description: `Transaction allocated to ${allocationType}`,
      });

      setAllocateDialog(false);
      setAllocationId('');
      setAllocationAmount('');
      setAllocationNotes('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to allocate transaction",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      deleteBankTransaction(id);
      setTransactions(transactions.filter(t => t.id !== id));
      toast({
        title: "Transaction Deleted",
        description: "Bank transaction has been removed",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      unallocated: "outline",
      'partially-allocated': "secondary",
      allocated: "default",
    };
    return <Badge variant={variants[status]}>{status.replace('-', ' ')}</Badge>;
  };

  const filteredTransactions = transactions.filter(t =>
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnallocated = transactions.filter(t => t.status === 'unallocated').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              Bank Feeds
            </h1>
            <p className="text-muted-foreground mt-2">
              Import and allocate bank transactions
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadTemplate} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Download Template
            </Button>
            <Button onClick={() => document.getElementById('bank-upload')?.click()} className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Statement
            </Button>
            <input
              id="bank-upload"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Unallocated Transactions</p>
              <p className="text-3xl font-bold">{totalUnallocated}</p>
            </div>
            <DollarSign className="h-12 w-12 text-primary opacity-50" />
          </div>
        </Card>

        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.reference}</TableCell>
                  <TableCell>
                    <Badge variant={transaction.type === 'credit' ? 'default' : 'secondary'}>
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {settings.currencySymbol}{transaction.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {settings.currencySymbol}{transaction.balance.toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      {transaction.status !== 'allocated' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setAllocateDialog(true);
                          }}
                        >
                          Allocate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={allocateDialog} onOpenChange={setAllocateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Allocate Transaction</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedTransaction && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Transaction Amount</p>
                  <p className="text-2xl font-bold">
                    {settings.currencySymbol}{selectedTransaction.amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Remaining: {settings.currencySymbol}
                    {(selectedTransaction.amount - selectedTransaction.allocations.reduce((sum, a) => sum + a.amount, 0)).toFixed(2)}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Allocation Type</Label>
                <Select value={allocationType} onValueChange={(value: AllocationType) => setAllocationType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{allocationType === 'invoice' ? 'Invoice' : allocationType === 'purchase' ? 'Purchase' : 'Expense'} Number</Label>
                <Input
                  placeholder={`Enter ${allocationType} number`}
                  value={allocationId}
                  onChange={(e) => setAllocationId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={allocationAmount}
                  onChange={(e) => setAllocationAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input
                  placeholder="Add notes..."
                  value={allocationNotes}
                  onChange={(e) => setAllocationNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setAllocateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAllocate}>
                  Allocate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
