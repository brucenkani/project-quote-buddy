import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navigation } from '@/components/Navigation';
import { FileDown, Calendar } from 'lucide-react';
import { loadChartOfAccounts } from '@/utils/chartOfAccountsStorage';
import { loadJournalEntries, loadExpenses } from '@/utils/accountingStorage';
import { loadSettings } from '@/utils/settingsStorage';
import { useToast } from '@/hooks/use-toast';
import { KPIDashboard } from '@/components/reports/KPIDashboard';
import { calculateEnhancedKPIs } from '@/utils/financialStatements';
import { generateDashboardPDF } from '@/utils/dashboardPDFGenerator';

export default function Dashboard() {
  const { toast } = useToast();
  const settings = loadSettings();
  const chartOfAccounts = loadChartOfAccounts();
  
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const [priorDateRange, setPriorDateRange] = useState({
    startDate: new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear() - 1, 11, 31).toISOString().split('T')[0],
  });

  const calculateFinancialYearDates = () => {
    const today = new Date();
    const yearEndMonth = settings.financialYearEndMonth || 12; // 1-12 format
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
    // e.g., if year ends in Feb (month 2), year starts on Mar 1
    // Month is 0-indexed in JS Date, so yearEndMonth gives us the month after
    const fyStart = new Date(fyStartYear, yearEndMonth, 1);
    
    // Year ends on last day of the year-end month
    // Day 0 of next month = last day of this month
    const fyEnd = new Date(fyEndYear, yearEndMonth, 0);

    // Prior financial year
    const priorFyStart = new Date(fyStartYear - 1, yearEndMonth, 1);
    const priorFyEnd = new Date(fyEndYear - 1, yearEndMonth, 0);

    setDateRange({
      startDate: fyStart.toISOString().split('T')[0],
      endDate: fyEnd.toISOString().split('T')[0],
    });
    setPriorDateRange({
      startDate: priorFyStart.toISOString().split('T')[0],
      endDate: priorFyEnd.toISOString().split('T')[0],
    });
  };

  const getPeriodData = (startDate: string, endDate: string) => {
    const journalEntries = loadJournalEntries().filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    });

    const expenses = loadExpenses().filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
    });

    return { startDate, endDate, journalEntries, expenses };
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <Navigation />
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

        <KPIDashboard kpis={kpis} currencySymbol={settings.currencySymbol} companyType={settings.companyType} />
      </div>
    </div>
  );
}
