import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileDown, Calendar, FileSpreadsheet } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import { KPIDashboard } from '@/components/reports/KPIDashboard';
import { calculateEnhancedKPIs } from '@/utils/financialStatements';
import { generateDashboardPDF } from '@/utils/dashboardPDFGenerator';
import { formatLocalISO } from '@/utils/date';
import { generateKPIBreakdownPDF, generateKPIBreakdownExcel } from '@/utils/kpiBreakdownGenerator';
import { supabase } from '@/integrations/supabase/client';
import type { ChartAccount } from '@/types/chartOfAccounts';
import type { Expense } from '@/types/accounting';
import { loadJournalEntriesFromDB, loadJournalEntries, loadExpenses } from '@/utils/accountingStorage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Dashboard() {
  const { toast } = useToast();
  const { settings } = useSettings();
  
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartAccount[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [dateRange, setDateRange] = useState({
    startDate: formatLocalISO(new Date(new Date().getFullYear(), 0, 1)),
    endDate: formatLocalISO(new Date()),
  });

  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
  const [showKPIDialog, setShowKPIDialog] = useState(false);

  const [priorDateRange, setPriorDateRange] = useState({
    startDate: formatLocalISO(new Date(new Date().getFullYear() - 1, 0, 1)),
    endDate: formatLocalISO(new Date(new Date().getFullYear() - 1, 11, 31)),
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const activeCompanyId = localStorage.getItem('activeCompanyId');
      if (!activeCompanyId) {
        console.error('No active company');
        return;
      }

    // Load Chart of Accounts
    const { data: coaData } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('company_id', activeCompanyId)
      .order('account_number');

    if (coaData && coaData.length > 0) {
      setChartOfAccounts(coaData.map(row => ({
        id: row.id,
        accountNumber: row.account_number,
        accountName: row.account_name,
        accountType: row.account_type as any,
        isDefault: false,
        openingBalance: Number(row.opening_balance),
        createdAt: row.created_at || new Date().toISOString(),
      })));
    } else {
      // Fallback: empty -> KPIs will still compute from journal entries
      setChartOfAccounts([]);
    }

    // Load Journal Entries (DB first, fallback to local)
    const entries = await loadJournalEntriesFromDB();
    if (entries && entries.length > 0) {
      setJournalEntries(entries);
    } else {
      setJournalEntries(loadJournalEntries());
    }

    // Load Expenses (DB first, fallback to local)
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('*')
      .eq('company_id', activeCompanyId)
      .order('date', { ascending: false });

    if (expensesData && expensesData.length > 0) {
      setExpenses(expensesData.map(exp => ({
        id: exp.id,
        date: exp.date,
        vendor: exp.supplier_id,
        category: 'General Expense',
        description: exp.notes || '',
        amount: Number(exp.total),
        paymentMethod: 'unpaid',
        status: exp.status as any,
        dueDate: exp.due_date,
        payments: [],
        createdAt: exp.created_at,
        updatedAt: exp.updated_at,
      })));
    } else {
      setExpenses(loadExpenses());
    }

    setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

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

    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
    });

    return { startDate, endDate, journalEntries: filteredJournalEntries, expenses: filteredExpenses };
  };

  const kpis = calculateEnhancedKPIs(
    chartOfAccounts,
    getPeriodData(dateRange.startDate, dateRange.endDate),
    getPeriodData(priorDateRange.startDate, priorDateRange.endDate),
    settings.companyType
  );

  const handleExportPDF = () => {
    generateDashboardPDF(kpis, dateRange, priorDateRange, settings);
    toast({ title: 'Dashboard exported to PDF successfully' });
  };

  const handleKPIClick = (kpiType: string) => {
    setSelectedKPI(kpiType);
    setShowKPIDialog(true);
  };

  const handleKPIExportPDF = () => {
    if (!selectedKPI) return;
    generateKPIBreakdownPDF(
      selectedKPI as any,
      chartOfAccounts,
      getPeriodData(dateRange.startDate, dateRange.endDate),
      settings
    );
    toast({ title: `${selectedKPI} breakdown exported to PDF` });
    setShowKPIDialog(false);
  };

  const handleKPIExportExcel = () => {
    if (!selectedKPI) return;
    generateKPIBreakdownExcel(
      selectedKPI as any,
      chartOfAccounts,
      getPeriodData(dateRange.startDate, dateRange.endDate),
      settings
    );
    toast({ title: `${selectedKPI} breakdown exported to Excel` });
    setShowKPIDialog(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
            Financial Dashboard
          </h1>
          <p className="text-muted-foreground">Key performance indicators and financial metrics</p>
        </div>

        <div className="grid gap-6 mb-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Period</CardTitle>
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

          <Card>
            <CardHeader>
              <CardTitle>Prior Period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priorStartDate">Start Date</Label>
                  <Input
                    id="priorStartDate"
                    type="date"
                    value={priorDateRange.startDate}
                    onChange={(e) => setPriorDateRange({ ...priorDateRange, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priorEndDate">End Date</Label>
                  <Input
                    id="priorEndDate"
                    type="date"
                    value={priorDateRange.endDate}
                    onChange={(e) => setPriorDateRange({ ...priorDateRange, endDate: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Button
                onClick={calculateFinancialYearDates}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                Set to Current Financial Year
              </Button>
              <Button
                onClick={handleExportPDF}
                variant="outline"
                className="gap-2"
              >
                <FileDown className="h-4 w-4" />
                Export to PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <KPIDashboard 
          kpis={kpis} 
          currencySymbol={settings.currencySymbol} 
          companyType={settings.companyType}
          onKPIClick={handleKPIClick}
        />
      </div>

      <Dialog open={showKPIDialog} onOpenChange={setShowKPIDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export KPI Breakdown</DialogTitle>
            <DialogDescription>
              Choose the format to export the detailed breakdown for {selectedKPI}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 pt-4">
            <Button onClick={handleKPIExportPDF} className="flex-1 gap-2">
              <FileDown className="h-4 w-4" />
              Export as PDF
            </Button>
            <Button onClick={handleKPIExportExcel} variant="outline" className="flex-1 gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Export as Excel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
