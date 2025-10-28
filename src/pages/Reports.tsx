import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation } from '@/components/Navigation';
import { FileDown, FileSpreadsheet, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ChartAccount } from '@/types/chartOfAccounts';
import { loadJournalEntriesFromDB, loadExpenses } from '@/utils/accountingStorage';
import { loadInvoices } from '@/utils/invoiceStorage';
import { generateTrialBalancePDF, generateTrialBalanceExcel, generateLedgerPDF, generateLedgerExcel } from '@/utils/reportGenerator';
import { 
  generateIncomeStatementPDF, 
  generateIncomeStatementExcel,
  generateBalanceSheetPDF,
  generateBalanceSheetExcel,
  generateCashFlowPDF,
  generateCashFlowExcel,
  generateEquityStatementPDF,
  generateEquityStatementExcel
} from '@/utils/managementReportGenerator';
import { generateVATReportPDF, generateVATReportExcel } from '@/utils/vatReportGenerator';
import { useSettings } from '@/contexts/SettingsContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useToast } from '@/hooks/use-toast';
import { formatLocalISO } from '@/utils/date';

export default function Reports() {
  const { toast } = useToast();
  const { settings } = useSettings();
  const { activeCompany } = useCompany();
  
  const [dateRange, setDateRange] = useState({
    startDate: formatLocalISO(new Date(new Date().getFullYear(), 0, 1)),
    endDate: formatLocalISO(new Date()),
  });

  const [priorDateRange, setPriorDateRange] = useState({
    startDate: formatLocalISO(new Date(new Date().getFullYear() - 1, 0, 1)),
    endDate: formatLocalISO(new Date(new Date().getFullYear() - 1, 11, 31)),
  });

  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const entries = await loadJournalEntriesFromDB();
      setJournalEntries(entries);
      setLoading(false);
    };
    loadData();
  }, []);

  // Calculate financial year dates based on year-end month
  const calculateFinancialYearDates = () => {
    const today = new Date();
    const yearEndMonth = settings.financialYearEndMonth || 12; // 1-12 format (June = 6, Dec = 12)
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // Convert to 1-12 format

    let fyStartYear, fyEndYear;
    
    if (currentMonth > yearEndMonth) {
      fyStartYear = currentYear;
      fyEndYear = currentYear + 1;
    } else {
      fyStartYear = currentYear - 1;
      fyEndYear = currentYear;
    }

    // Financial year starts on the day after year end
    // e.g., if year ends June 30 (month 6), year starts July 1
    // Convert 1-12 month to 0-11 for JavaScript Date
    const jsYearEndMonth = yearEndMonth - 1; // June (6) becomes 5 in JS
    
    // Start = First day of month AFTER year end month
    const fyStart = new Date(fyStartYear, jsYearEndMonth + 1, 1);
    
    // End = Last day of year end month (use day 0 of next month)
    const fyEnd = new Date(fyEndYear, jsYearEndMonth + 1, 0);

    // Prior financial year
    const priorFyStart = new Date(fyStartYear - 1, jsYearEndMonth + 1, 1);
    const priorFyEnd = new Date(fyEndYear - 1, jsYearEndMonth + 1, 0);

    setDateRange({
      startDate: formatLocalISO(fyStart),
      endDate: formatLocalISO(fyEnd),
    });
    setPriorDateRange({
      startDate: formatLocalISO(priorFyStart),
      endDate: formatLocalISO(priorFyEnd),
    });
  };

  const getPeriodData = (startDate: string, endDate: string) => {
    const filteredJournalEntries = journalEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    });

    const expenses = loadExpenses().filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
    });

    return { startDate, endDate, journalEntries: filteredJournalEntries, expenses };
  };

  const handleGenerateTrialBalance = (format: 'pdf' | 'excel') => {
    const filteredJournalEntries = journalEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= new Date(dateRange.startDate) && entryDate <= new Date(dateRange.endDate);
    });

    const expenses = loadExpenses().filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= new Date(dateRange.startDate) && expenseDate <= new Date(dateRange.endDate);
    });

    if (format === 'pdf') {
      generateTrialBalancePDF(loadChartOfAccounts(), filteredJournalEntries, expenses, dateRange, settings);
    } else {
      generateTrialBalanceExcel(loadChartOfAccounts(), filteredJournalEntries, expenses, dateRange, settings);
    }

    toast({ title: `Trial Balance ${format.toUpperCase()} generated successfully` });
  };

  const handleGenerateIncomeStatement = (format: 'pdf' | 'excel') => {
    const currentPeriod = getPeriodData(dateRange.startDate, dateRange.endDate);
    const priorPeriod = getPeriodData(priorDateRange.startDate, priorDateRange.endDate);

    if (format === 'pdf') {
      generateIncomeStatementPDF(loadChartOfAccounts(), currentPeriod, priorPeriod, settings);
    } else {
      generateIncomeStatementExcel(loadChartOfAccounts(), currentPeriod, priorPeriod, settings);
    }

    toast({ title: `Income Statement ${format.toUpperCase()} generated successfully` });
  };

  const handleGenerateBalanceSheet = (format: 'pdf' | 'excel') => {
    const currentPeriod = getPeriodData(dateRange.startDate, dateRange.endDate);
    const priorPeriod = getPeriodData(priorDateRange.startDate, priorDateRange.endDate);

    if (format === 'pdf') {
      generateBalanceSheetPDF(loadChartOfAccounts(), currentPeriod, priorPeriod, settings);
    } else {
      generateBalanceSheetExcel(loadChartOfAccounts(), currentPeriod, priorPeriod, settings);
    }

    toast({ title: `Balance Sheet ${format.toUpperCase()} generated successfully` });
  };

  const handleGenerateCashFlow = (format: 'pdf' | 'excel') => {
    const currentPeriod = getPeriodData(dateRange.startDate, dateRange.endDate);
    const priorPeriod = getPeriodData(priorDateRange.startDate, priorDateRange.endDate);

    if (format === 'pdf') {
      generateCashFlowPDF(loadChartOfAccounts(), currentPeriod, priorPeriod, settings);
    } else {
      generateCashFlowExcel(loadChartOfAccounts(), currentPeriod, settings);
    }

    toast({ title: `Cash Flow Statement ${format.toUpperCase()} generated successfully` });
  };

  const handleGenerateEquityStatement = (format: 'pdf' | 'excel') => {
    const currentPeriod = getPeriodData(dateRange.startDate, dateRange.endDate);
    const priorPeriod = getPeriodData(priorDateRange.startDate, priorDateRange.endDate);

    if (format === 'pdf') {
      generateEquityStatementPDF(chartOfAccounts, currentPeriod, priorPeriod, settings);
    } else {
      generateEquityStatementExcel(chartOfAccounts, currentPeriod, priorPeriod, settings);
    }

    toast({ title: `Equity Statement ${format.toUpperCase()} generated successfully` });
  };

  const handleGenerateLedger = (format: 'pdf' | 'excel') => {
    if (!selectedAccount) {
      toast({ title: 'Please select an account', variant: 'destructive' });
      return;
    }

    const account = chartOfAccounts.find(a => a.id === selectedAccount);
    if (!account) return;

    const filteredJournalEntries = journalEntries.filter(entry => {
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
      generateLedgerPDF(account, filteredJournalEntries, expenses, dateRange, settings);
    } else {
      generateLedgerExcel(account, filteredJournalEntries, expenses, dateRange, settings);
    }

    toast({ title: `Ledger Report ${format.toUpperCase()} generated successfully` });
  };

  const handleGenerateVATReport = async (format: 'pdf' | 'excel') => {
    const invoices = (await loadInvoices()).filter(inv => {
      const invDate = new Date(inv.issueDate);
      return invDate >= new Date(dateRange.startDate) && invDate <= new Date(dateRange.endDate);
    });

    const expenses = loadExpenses().filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= new Date(dateRange.startDate) && expenseDate <= new Date(dateRange.endDate);
    });

    if (format === 'pdf') {
      generateVATReportPDF(invoices, expenses, dateRange, settings);
    } else {
      generateVATReportExcel(invoices, expenses, dateRange, settings);
    }

    toast({ title: `VAT Report ${format.toUpperCase()} generated successfully` });
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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Financial Year Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={calculateFinancialYearDates}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                Set to Current Financial Year
              </Button>
              <div className="text-sm text-muted-foreground">
                <div>Current Year: {dateRange.startDate} to {dateRange.endDate}</div>
                <div>Prior Year: {priorDateRange.startDate} to {priorDateRange.endDate}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="income" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="balance">Balance</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            <TabsTrigger value="equity">Equity</TabsTrigger>
            <TabsTrigger value="vat">VAT</TabsTrigger>
            <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
            <TabsTrigger value="ledger">Ledger</TabsTrigger>
          </TabsList>

          <TabsContent value="income">
            <Card>
              <CardHeader>
                <CardTitle>Income Statement</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Revenue and expenses for the selected period vs prior year
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={() => handleGenerateIncomeStatement('pdf')} className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Export to PDF
                  </Button>
                  <Button onClick={() => handleGenerateIncomeStatement('excel')} variant="outline" className="gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Export to Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance">
            <Card>
              <CardHeader>
                <CardTitle>Balance Sheet</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Assets, liabilities, and equity as of period end vs prior year
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={() => handleGenerateBalanceSheet('pdf')} className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Export to PDF
                  </Button>
                  <Button onClick={() => handleGenerateBalanceSheet('excel')} variant="outline" className="gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Export to Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cashflow">
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Statement</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Operating, investing, and financing activities
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={() => handleGenerateCashFlow('pdf')} className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Export to PDF
                  </Button>
                  <Button onClick={() => handleGenerateCashFlow('excel')} variant="outline" className="gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Export to Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equity">
            <Card>
              <CardHeader>
                <CardTitle>Statement of Changes in Equity</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Opening balance, net income, drawings, and closing balance
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={() => handleGenerateEquityStatement('pdf')} className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Export to PDF
                  </Button>
                  <Button onClick={() => handleGenerateEquityStatement('excel')} variant="outline" className="gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Export to Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vat">
            <Card>
              <CardHeader>
                <CardTitle>VAT/Tax Report</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Output VAT (collected on sales) vs Input VAT (paid on purchases) with net amount payable/refundable
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={() => handleGenerateVATReport('pdf')} className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Export to PDF
                  </Button>
                  <Button onClick={() => handleGenerateVATReport('excel')} variant="outline" className="gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Export to Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
