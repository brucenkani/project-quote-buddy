import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation } from '@/components/Navigation';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { loadChartOfAccounts } from '@/utils/chartOfAccountsStorage';
import { loadJournalEntries, loadExpenses } from '@/utils/accountingStorage';
import { generateTrialBalancePDF, generateTrialBalanceExcel, generateLedgerPDF, generateLedgerExcel } from '@/utils/reportGenerator';
import { loadSettings } from '@/utils/settingsStorage';
import { useToast } from '@/hooks/use-toast';

export default function Reports() {
  const { toast } = useToast();
  const settings = loadSettings();
  const chartOfAccounts = loadChartOfAccounts();
  
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const [selectedAccount, setSelectedAccount] = useState<string>('');

  const handleGenerateTrialBalance = (format: 'pdf' | 'excel') => {
    const journalEntries = loadJournalEntries().filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= new Date(dateRange.startDate) && entryDate <= new Date(dateRange.endDate);
    });

    const expenses = loadExpenses().filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= new Date(dateRange.startDate) && expenseDate <= new Date(dateRange.endDate);
    });

    if (format === 'pdf') {
      generateTrialBalancePDF(chartOfAccounts, journalEntries, expenses, dateRange, settings);
    } else {
      generateTrialBalanceExcel(chartOfAccounts, journalEntries, expenses, dateRange, settings);
    }

    toast({ title: `Trial Balance ${format.toUpperCase()} generated successfully` });
  };

  const handleGenerateLedger = (format: 'pdf' | 'excel') => {
    if (!selectedAccount) {
      toast({ title: 'Please select an account', variant: 'destructive' });
      return;
    }

    const account = chartOfAccounts.find(a => a.id === selectedAccount);
    if (!account) return;

    const journalEntries = loadJournalEntries().filter(entry => {
      const entryDate = new Date(entry.date);
      const hasAccount = entry.entries.some(line => line.account === account.accountName);
      return hasAccount && entryDate >= new Date(dateRange.startDate) && entryDate <= new Date(dateRange.endDate);
    });

    const expenses = loadExpenses().filter(expense => {
      const expenseDate = new Date(expense.date);
      return expense.category === account.accountName && 
             expenseDate >= new Date(dateRange.startDate) && 
             expenseDate <= new Date(dateRange.endDate);
    });

    if (format === 'pdf') {
      generateLedgerPDF(account, journalEntries, expenses, dateRange, settings);
    } else {
      generateLedgerExcel(account, journalEntries, expenses, dateRange, settings);
    }

    toast({ title: `Ledger Report ${format.toUpperCase()} generated successfully` });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
            Financial Reports
          </h1>
          <p className="text-muted-foreground">Generate and export comprehensive financial reports</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="trial-balance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
            <TabsTrigger value="ledger">Ledger Report</TabsTrigger>
          </TabsList>

          <TabsContent value="trial-balance">
            <Card>
              <CardHeader>
                <CardTitle>Trial Balance Report</CardTitle>
                <p className="text-sm text-muted-foreground">
                  View all account balances for the selected period
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={() => handleGenerateTrialBalance('pdf')} className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Export to PDF
                  </Button>
                  <Button onClick={() => handleGenerateTrialBalance('excel')} variant="outline" className="gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Export to Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ledger">
            <Card>
              <CardHeader>
                <CardTitle>Account Ledger Report</CardTitle>
                <p className="text-sm text-muted-foreground">
                  View all transactions for a specific account
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="account">Select Account</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger id="account">
                      <SelectValue placeholder="Choose an account..." />
                    </SelectTrigger>
                    <SelectContent>
                      {chartOfAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountNumber} - {account.accountName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleGenerateLedger('pdf')} className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Export to PDF
                  </Button>
                  <Button onClick={() => handleGenerateLedger('excel')} variant="outline" className="gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Export to Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
