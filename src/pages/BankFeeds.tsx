import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, DollarSign, Check, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { BankTransaction } from '@/types/bankTransaction';
import { loadBankTransactions, saveBankTransaction, deleteBankTransaction } from '@/utils/bankTransactionStorage';
import { loadInvoices, saveInvoice } from '@/utils/invoiceStorage';
import { loadPurchases, savePurchase } from '@/utils/purchaseStorage';
import { loadExpenses, saveExpense } from '@/utils/accountingStorage';
import { savePurchasePayment } from '@/utils/purchasePaymentStorage';
import { saveExpensePayment } from '@/utils/expensePaymentStorage';
import { loadSettings } from '@/utils/settingsStorage';
import { loadContacts } from '@/utils/contactsStorage';
import { loadChartOfAccounts } from '@/utils/chartOfAccountsStorage';
import * as XLSX from 'xlsx';

type TransactionType = 'account' | 'supplier' | 'customer';

interface TransactionRow extends BankTransaction {
  transactionType?: TransactionType;
  selectionId?: string;
  includesVAT?: boolean;
}

export default function BankFeeds() {
  const [transactions, setTransactions] = useState<TransactionRow[]>(loadBankTransactions());
  const { toast } = useToast();
  const settings = loadSettings();
  const contacts = loadContacts();
  const chartOfAccounts = loadChartOfAccounts();

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

  const updateTransaction = (id: string, updates: Partial<TransactionRow>) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const confirmTransaction = (transaction: TransactionRow) => {
    if (!transaction.transactionType || !transaction.selectionId) {
      toast({
        title: "Error",
        description: "Please select Type and Selection",
        variant: "destructive",
      });
      return;
    }

    try {
      const amount = transaction.amount;
      const transactionType = transaction.transactionType;
      const selectionId = transaction.selectionId;

      // Process based on transaction type
      if (transactionType === 'customer' && transaction.type === 'credit') {
        // Customer payment - allocate to invoice
        const invoices = loadInvoices();
        const invoice = invoices.find(inv => inv.id === selectionId || inv.invoiceNumber === selectionId);
        if (!invoice) throw new Error('Invoice not found');

        const payment = {
          id: `${transaction.id}-${Date.now()}`,
          amount,
          date: transaction.date,
          method: 'bank-transfer',
          reference: transaction.reference,
        };
        
        invoice.payments = invoice.payments || [];
        invoice.payments.push(payment);
        
        const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
        if (totalPaid >= invoice.total) {
          invoice.status = 'paid';
        } else if (totalPaid > 0) {
          invoice.status = 'partly-paid';
        }
        
        saveInvoice(invoice);

      } else if (transactionType === 'supplier' && transaction.type === 'debit') {
        // Supplier payment - allocate to purchase
        const purchases = loadPurchases();
        const purchase = purchases.find(p => p.id === selectionId || p.purchaseNumber === selectionId);
        if (!purchase) throw new Error('Purchase not found');

        savePurchasePayment({
          id: `${transaction.id}-${Date.now()}`,
          purchaseId: purchase.id,
          amount,
          date: transaction.date,
          method: 'bank-transfer',
          reference: transaction.reference,
          notes: '',
          createdAt: new Date().toISOString(),
        });

      } else if (transactionType === 'account') {
        // Direct account allocation - create expense entry
        const account = chartOfAccounts.find(acc => acc.id === selectionId);
        if (!account) throw new Error('Account not found');

        const expense = {
          id: `EXP-${Date.now()}`,
          date: transaction.date,
          vendor: 'Bank Transaction',
          category: account.accountName,
          description: transaction.description,
          amount,
          paymentMethod: 'bank-transfer',
          reference: transaction.reference,
          status: 'paid' as const,
          includesVAT: transaction.includesVAT || false,
          vatRate: transaction.includesVAT ? 0.15 : 0,
          vatAmount: transaction.includesVAT ? amount * (0.15 / 1.15) : 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        saveExpense(expense);
      }

      // Mark transaction as reviewed
      const updatedTransaction = {
        ...transaction,
        status: 'allocated' as const,
        allocations: [{
          id: `${transaction.id}-${Date.now()}`,
          allocationType: transactionType === 'customer' ? 'invoice' as const : 
                         transactionType === 'supplier' ? 'purchase' as const : 'expense' as const,
          allocationId: selectionId,
          amount,
          allocatedAt: new Date().toISOString(),
        }],
      };

      saveBankTransaction(updatedTransaction);
      setTransactions(transactions.map(t => t.id === transaction.id ? updatedTransaction : t));

      toast({
        title: "Transaction Confirmed",
        description: `Transaction allocated successfully`,
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm transaction",
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

  const newTransactions = transactions.filter(t => t.status === 'unallocated');
  const reviewedTransactions = transactions.filter(t => t.status !== 'unallocated');
  
  const totalBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance : 0;

  const getSelectionOptions = (type: TransactionType | undefined) => {
    if (type === 'customer') {
      const invoices = loadInvoices();
      return invoices.map(inv => ({
        value: inv.id,
        label: `${inv.invoiceNumber} - ${settings.currencySymbol}${inv.total.toFixed(2)}`,
      }));
    } else if (type === 'supplier') {
      const purchases = loadPurchases();
      return purchases.map(p => ({
        value: p.id,
        label: `${p.purchaseNumber} - ${p.vendor} - ${settings.currencySymbol}${p.total.toFixed(2)}`,
      }));
    } else if (type === 'account') {
      return chartOfAccounts.map(acc => ({
        value: acc.id,
        label: `${acc.accountNumber} - ${acc.accountName}`,
      }));
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              Banking
            </h1>
            <p className="text-muted-foreground mt-2">
              Import and review bank transactions
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadTemplate} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Download Template
            </Button>
            <Button onClick={() => document.getElementById('bank-upload')?.click()} className="gap-2">
              <Upload className="h-4 w-4" />
              Import Bank Statements
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

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Bank Balance</p>
            <p className="text-3xl font-bold">{settings.currencySymbol}{totalBalance.toFixed(2)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">To be Reviewed</p>
            <p className="text-3xl font-bold">{newTransactions.length} Transactions</p>
          </Card>
        </div>

        <Tabs defaultValue="new" className="w-full">
          <TabsList>
            <TabsTrigger value="new">New Transactions</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Selection</TableHead>
                    <TableHead>VAT</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        You have no new Bank Statement transactions to review. Import your Bank Statements or manually enter banking transactions below.
                      </TableCell>
                    </TableRow>
                  ) : (
                    newTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <Select
                            value={transaction.transactionType || ''}
                            onValueChange={(value: TransactionType) => updateTransaction(transaction.id, { transactionType: value, selectionId: undefined })}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="bg-background z-50">
                              <SelectItem value="account">Account</SelectItem>
                              <SelectItem value="supplier">Supplier</SelectItem>
                              <SelectItem value="customer">Customer</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={transaction.selectionId || ''}
                            onValueChange={(value) => updateTransaction(transaction.id, { selectionId: value })}
                            disabled={!transaction.transactionType}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent className="bg-background z-50">
                              {getSelectionOptions(transaction.transactionType).map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={transaction.includesVAT || false}
                            onCheckedChange={(checked) => updateTransaction(transaction.id, { includesVAT: checked as boolean })}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.type === 'debit' ? `${settings.currencySymbol}${transaction.amount.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.type === 'credit' ? `${settings.currencySymbol}${transaction.amount.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => confirmTransaction(transaction)}
                              className="gap-1"
                            >
                              <Check className="h-3 w-3" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(transaction.id)}
                              className="gap-1"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="reviewed" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No reviewed transactions yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    reviewedTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{transaction.reference}</TableCell>
                        <TableCell className="text-right">
                          {transaction.type === 'debit' ? `${settings.currencySymbol}${transaction.amount.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.type === 'credit' ? `${settings.currencySymbol}${transaction.amount.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {settings.currencySymbol}{transaction.balance.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(transaction.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
