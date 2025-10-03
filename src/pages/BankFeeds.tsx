import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, DollarSign, Check, X, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parse, isValid } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BankTransaction } from '@/types/bankTransaction';
import { loadBankTransactions, saveBankTransaction, deleteBankTransaction } from '@/utils/bankTransactionStorage';
import { loadInvoices, saveInvoice } from '@/utils/invoiceStorage';
import { loadPurchases, savePurchase } from '@/utils/purchaseStorage';
import { loadExpenses, saveExpense } from '@/utils/accountingStorage';
import { savePurchasePayment } from '@/utils/purchasePaymentStorage';
import { saveExpensePayment } from '@/utils/expensePaymentStorage';
import { loadSettings } from '@/utils/settingsStorage';
import { loadContacts, saveContact } from '@/utils/contactsStorage';
import { loadChartOfAccounts, saveChartOfAccounts } from '@/utils/chartOfAccountsStorage';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

type TransactionType = 'account' | 'supplier' | 'customer';

interface TransactionRow extends BankTransaction {
  transactionType?: TransactionType;
  selectionId?: string;
  includesVAT?: boolean;
}

const calculateVATFromInclusive = (amount: number, vatRate: number = 0.15) => {
  const vatAmount = amount * (vatRate / (1 + vatRate));
  const netAmount = amount - vatAmount;
  return { vatAmount, netAmount };
};

export default function BankFeeds() {
  const [transactions, setTransactions] = useState<TransactionRow[]>(loadBankTransactions());
  const [contacts, setContacts] = useState(loadContacts());
  const [chartOfAccounts, setChartOfAccounts] = useState(loadChartOfAccounts());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDialogType, setCreateDialogType] = useState<TransactionType | null>(null);
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);
  const [newItemData, setNewItemData] = useState({
    name: '',
    email: '',
    accountNumber: '',
    accountName: '',
  });
  const { toast } = useToast();
  const settings = loadSettings();

  const downloadTemplate = () => {
    const template = [
      ['Date (YYYY-MM-DD)', 'Description', 'Amount'],
      ['2024-01-15', 'Payment from ABC Corp', '5000'],
      ['2024-01-16', 'Payment to XYZ Suppliers', '-2000'],
      ['2024-01-17', 'Monthly rental income', '3500'],
      ['2024-01-18', 'Utility bill payment', '-450'],
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
      let runningBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance : 0;
      
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row[0] || row[2] === undefined || row[2] === '') continue;

        // Parse date properly - Excel stores dates as serial numbers
        let dateValue: string;
        if (typeof row[0] === 'number') {
          // Excel serial date - convert to JavaScript date
          const excelDate = new Date((row[0] - 25569) * 86400 * 1000);
          dateValue = format(excelDate, 'yyyy-MM-dd');
        } else if (typeof row[0] === 'string') {
          // Try to parse string date in various formats
          const parsedDate = parse(row[0], 'yyyy-MM-dd', new Date());
          if (isValid(parsedDate)) {
            dateValue = format(parsedDate, 'yyyy-MM-dd');
          } else {
            // Try other common formats
            const altDate = new Date(row[0]);
            dateValue = isValid(altDate) ? format(altDate, 'yyyy-MM-dd') : row[0];
          }
        } else {
          dateValue = String(row[0]);
        }

        const amount = parseFloat(row[2]) || 0;
        const absAmount = Math.abs(amount);
        runningBalance += amount;

        const transaction: BankTransaction = {
          id: `BT-${Date.now()}-${i}`,
          date: dateValue,
          description: row[1] || '',
          reference: `BT-${Date.now()}-${i}`,
          type: amount >= 0 ? 'credit' : 'debit',
          amount: absAmount,
          balance: runningBalance,
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

  const isValidDate = (dateValue: any): boolean => {
    if (!dateValue) return false;
    
    // Convert to string if it's not already
    const dateString = String(dateValue);
    
    try {
      const parsed = parse(dateString, 'yyyy-MM-dd', new Date());
      return isValid(parsed);
    } catch {
      return false;
    }
  };

  const formatDateForDisplay = (dateValue: any): string => {
    if (!dateValue) return 'Invalid Date';
    
    // Convert to string if it's not already
    const dateString = String(dateValue);
    
    try {
      const parsed = parse(dateString, 'yyyy-MM-dd', new Date());
      if (isValid(parsed)) {
        return format(parsed, 'dd/MM/yyyy');
      }
      return 'Invalid Date';
    } catch {
      return 'Invalid Date';
    }
  };

  const confirmTransaction = (transaction: TransactionRow) => {
    // Validate all required fields
    if (!isValidDate(transaction.date)) {
      toast({
        title: "Error",
        description: "Please correct the date before confirming",
        variant: "destructive",
      });
      return;
    }

    if (!transaction.transactionType || !transaction.selectionId) {
      toast({
        title: "Error",
        description: "Please select Type and Selection",
        variant: "destructive",
      });
      return;
    }

    if (transaction.selectionId === 'CREATE_NEW') {
      toast({
        title: "Error",
        description: "Please complete creating the new item before confirming",
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

        const { vatAmount, netAmount } = transaction.includesVAT 
          ? calculateVATFromInclusive(amount)
          : { vatAmount: 0, netAmount: amount };

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
          vatAmount,
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

  const handleCreateNew = (transactionId: string, type: TransactionType) => {
    setCurrentTransactionId(transactionId);
    setCreateDialogType(type);
    setCreateDialogOpen(true);
    setNewItemData({ name: '', email: '', accountNumber: '', accountName: '' });
  };

  const handleCreateSubmit = () => {
    if (!createDialogType || !currentTransactionId) return;

    try {
      if (createDialogType === 'customer' || createDialogType === 'supplier') {
        if (!newItemData.name) {
          toast({
            title: "Error",
            description: "Name is required",
            variant: "destructive",
          });
          return;
        }

        const contactType = createDialogType === 'customer' ? 'client' : 'supplier';
        const newContact = {
          id: `CNT-${Date.now()}`,
          name: newItemData.name,
          email: newItemData.email || '',
          phone: '',
          address: '',
          type: contactType as 'client' | 'supplier',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        saveContact(newContact);
        const updatedContacts = [...contacts, newContact];
        setContacts(updatedContacts);
        updateTransaction(currentTransactionId, { selectionId: newContact.id });

        toast({
          title: "Success",
          description: `${createDialogType === 'customer' ? 'Customer' : 'Supplier'} created successfully`,
        });
      } else if (createDialogType === 'account') {
        if (!newItemData.accountNumber || !newItemData.accountName) {
          toast({
            title: "Error",
            description: "Account number and name are required",
            variant: "destructive",
          });
          return;
        }

        const newAccount = {
          id: `ACC-${Date.now()}`,
          accountNumber: newItemData.accountNumber,
          accountName: newItemData.accountName,
          accountType: 'expense' as const,
          isDefault: false,
          createdAt: new Date().toISOString(),
        };

        const updatedAccounts = [...chartOfAccounts, newAccount];
        saveChartOfAccounts(updatedAccounts);
        setChartOfAccounts(updatedAccounts);
        updateTransaction(currentTransactionId, { selectionId: newAccount.id });

        toast({
          title: "Success",
          description: "Account created successfully",
        });
      }

      setCreateDialogOpen(false);
      setCreateDialogType(null);
      setCurrentTransactionId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create item",
        variant: "destructive",
      });
    }
  };

  const getSelectionOptions = (type: TransactionType | undefined) => {
    const createNewOption = { value: 'CREATE_NEW', label: '+ Create New...' };

    if (type === 'customer') {
      const invoices = loadInvoices();
      const options = invoices.map(inv => ({
        value: inv.id,
        label: `${inv.invoiceNumber} - ${settings.currencySymbol}${inv.total.toFixed(2)}`,
      }));
      return [...options, createNewOption];
    } else if (type === 'supplier') {
      const purchases = loadPurchases();
      const options = purchases.map(p => ({
        value: p.id,
        label: `${p.purchaseNumber} - ${p.vendor} - ${settings.currencySymbol}${p.total.toFixed(2)}`,
      }));
      return [...options, createNewOption];
    } else if (type === 'account') {
      const options = chartOfAccounts.map(acc => ({
        value: acc.id,
        label: `${acc.accountNumber} - ${acc.accountName}`,
      }));
      return [...options, createNewOption];
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
                    newTransactions.map((transaction) => {
                      const dateIsValid = isValidDate(transaction.date);
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={cn(
                                    "justify-start text-left font-normal w-[140px]",
                                    !dateIsValid && "text-destructive border-destructive"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {formatDateForDisplay(transaction.date)}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                                <Calendar
                                  mode="single"
                                  selected={dateIsValid ? parse(String(transaction.date), 'yyyy-MM-dd', new Date()) : undefined}
                                  onSelect={(date) => {
                                    if (date) {
                                      updateTransaction(transaction.id, { date: format(date, 'yyyy-MM-dd') });
                                    }
                                  }}
                                  initialFocus
                                  className={cn("p-3 pointer-events-auto")}
                                />
                              </PopoverContent>
                            </Popover>
                          </TableCell>
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
                            onValueChange={(value) => {
                              if (value === 'CREATE_NEW') {
                                handleCreateNew(transaction.id, transaction.transactionType!);
                              } else {
                                updateTransaction(transaction.id, { selectionId: value });
                              }
                            }}
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
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={transaction.includesVAT || false}
                              onCheckedChange={(checked) => updateTransaction(transaction.id, { includesVAT: checked as boolean })}
                            />
                            {transaction.includesVAT && (
                              <span className="text-xs text-muted-foreground">
                                VAT: {settings.currencySymbol}{calculateVATFromInclusive(transaction.amount).vatAmount.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.type === 'debit' ? (
                            <div>
                              <div className="font-medium">{settings.currencySymbol}{transaction.amount.toFixed(2)}</div>
                              {transaction.includesVAT && (
                                <div className="text-xs text-muted-foreground">
                                  Net: {settings.currencySymbol}{calculateVATFromInclusive(transaction.amount).netAmount.toFixed(2)}
                                </div>
                              )}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.type === 'credit' ? (
                            <div>
                              <div className="font-medium">{settings.currencySymbol}{transaction.amount.toFixed(2)}</div>
                              {transaction.includesVAT && (
                                <div className="text-xs text-muted-foreground">
                                  Net: {settings.currencySymbol}{calculateVATFromInclusive(transaction.amount).netAmount.toFixed(2)}
                                </div>
                              )}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => confirmTransaction(transaction)}
                              className="gap-1"
                              disabled={!isValidDate(transaction.date) || !transaction.transactionType || !transaction.selectionId}
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
                      );
                    })
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
                    reviewedTransactions.map((transaction) => {
                      const dateIsValid = isValidDate(transaction.date);
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatDateForDisplay(transaction.date)}</TableCell>
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
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Create New {createDialogType === 'customer' ? 'Customer' : createDialogType === 'supplier' ? 'Supplier' : 'Account'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {(createDialogType === 'customer' || createDialogType === 'supplier') ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={newItemData.name}
                      onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                      placeholder="Enter name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newItemData.email}
                      onChange={(e) => setNewItemData({ ...newItemData, email: e.target.value })}
                      placeholder="Enter email"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input
                      id="accountNumber"
                      value={newItemData.accountNumber}
                      onChange={(e) => setNewItemData({ ...newItemData, accountNumber: e.target.value })}
                      placeholder="Enter account number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name *</Label>
                    <Input
                      id="accountName"
                      value={newItemData.accountName}
                      onChange={(e) => setNewItemData({ ...newItemData, accountName: e.target.value })}
                      placeholder="Enter account name"
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSubmit}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
