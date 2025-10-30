import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { loadExpenses } from '@/utils/accountingStorage';
import { useSettings } from '@/contexts/SettingsContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useToast } from '@/hooks/use-toast';
import { Expense } from '@/types/accounting';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface AgingBucket {
  contactName: string;
  current: number;
  days30: number;
  days60: number;
  days90: number;
  days120Plus: number;
  total: number;
}

export default function APAgingReport() {
  const { toast } = useToast();
  const { settings } = useSettings();
  const { activeCompany } = useCompany();
  const [agingData, setAgingData] = useState<AgingBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    current: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    days120Plus: 0,
    total: 0,
  });

  useEffect(() => {
    loadAgingData();
  }, []);

  const loadAgingData = () => {
    setLoading(true);
    try {
      const expenses = loadExpenses();
      const outstandingExpenses = expenses.filter(
        (exp) => exp.status === 'pending' || exp.status === 'approved' || exp.status === 'partly-paid' || exp.status === 'overdue'
      );

      const today = new Date();
      const bucketMap = new Map<string, AgingBucket>();

      outstandingExpenses.forEach((expense) => {
        const outstanding = calculateOutstanding(expense);
        if (outstanding <= 0) return;

        const expenseDate = new Date(expense.date);
        const daysOld = Math.floor((today.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24));

        const contactName = expense.vendor;
        
        if (!bucketMap.has(contactName)) {
          bucketMap.set(contactName, {
            contactName,
            current: 0,
            days30: 0,
            days60: 0,
            days90: 0,
            days120Plus: 0,
            total: 0,
          });
        }

        const bucket = bucketMap.get(contactName)!;

        if (daysOld <= 30) {
          bucket.current += outstanding;
        } else if (daysOld <= 60) {
          bucket.days30 += outstanding;
        } else if (daysOld <= 90) {
          bucket.days60 += outstanding;
        } else if (daysOld <= 120) {
          bucket.days90 += outstanding;
        } else {
          bucket.days120Plus += outstanding;
        }

        bucket.total += outstanding;
      });

      const data = Array.from(bucketMap.values()).sort((a, b) => 
        a.contactName.localeCompare(b.contactName)
      );

      setAgingData(data);

      // Calculate totals
      const newTotals = data.reduce(
        (acc, row) => ({
          current: acc.current + row.current,
          days30: acc.days30 + row.days30,
          days60: acc.days60 + row.days60,
          days90: acc.days90 + row.days90,
          days120Plus: acc.days120Plus + row.days120Plus,
          total: acc.total + row.total,
        }),
        { current: 0, days30: 0, days60: 0, days90: 0, days120Plus: 0, total: 0 }
      );

      setTotals(newTotals);
    } catch (error) {
      console.error('Failed to load aging data:', error);
      toast({ title: 'Failed to load aging data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const calculateOutstanding = (expense: Expense): number => {
    const totalPaid = expense.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    return expense.amount - totalPaid;
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const companyName = activeCompany?.name || settings.companyName;

    doc.setFontSize(18);
    doc.text(companyName, 14, 20);
    doc.setFontSize(14);
    doc.text('Accounts Payable Age Analysis', 14, 28);
    doc.setFontSize(10);
    doc.text(`As at ${new Date().toLocaleDateString()}`, 14, 34);

    const tableData = agingData.map((row) => [
      row.contactName,
      settings.currencySymbol + row.current.toFixed(2),
      settings.currencySymbol + row.days30.toFixed(2),
      settings.currencySymbol + row.days60.toFixed(2),
      settings.currencySymbol + row.days90.toFixed(2),
      settings.currencySymbol + row.days120Plus.toFixed(2),
      settings.currencySymbol + row.total.toFixed(2),
    ]);

    tableData.push([
      'TOTAL',
      settings.currencySymbol + totals.current.toFixed(2),
      settings.currencySymbol + totals.days30.toFixed(2),
      settings.currencySymbol + totals.days60.toFixed(2),
      settings.currencySymbol + totals.days90.toFixed(2),
      settings.currencySymbol + totals.days120Plus.toFixed(2),
      settings.currencySymbol + totals.total.toFixed(2),
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Supplier', 'Current', '31-60 Days', '61-90 Days', '91-120 Days', '120+ Days', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [66, 66, 66] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    });

    doc.save('AP-Aging-Report.pdf');
    toast({ title: 'PDF exported successfully' });
  };

  const handleExportExcel = () => {
    const data = agingData.map((row) => ({
      Supplier: row.contactName,
      Current: row.current,
      '31-60 Days': row.days30,
      '61-90 Days': row.days60,
      '91-120 Days': row.days90,
      '120+ Days': row.days120Plus,
      Total: row.total,
    }));

    data.push({
      Supplier: 'TOTAL',
      Current: totals.current,
      '31-60 Days': totals.days30,
      '61-90 Days': totals.days60,
      '91-120 Days': totals.days90,
      '120+ Days': totals.days120Plus,
      Total: totals.total,
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'AP Aging');
    XLSX.writeFile(wb, 'AP-Aging-Report.xlsx');
    toast({ title: 'Excel exported successfully' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">AP Age Analysis</h1>
            <p className="text-muted-foreground">Accounts Payable aging by supplier</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportPDF} variant="outline" className="gap-2">
              <FileDown className="h-4 w-4" />
              Export PDF
            </Button>
            <Button onClick={handleExportExcel} variant="outline" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Outstanding Payables by Age</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8">Loading...</p>
            ) : agingData.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No outstanding payables</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Supplier</th>
                      <th className="text-right p-2 font-semibold">Current</th>
                      <th className="text-right p-2 font-semibold">31-60 Days</th>
                      <th className="text-right p-2 font-semibold">61-90 Days</th>
                      <th className="text-right p-2 font-semibold">91-120 Days</th>
                      <th className="text-right p-2 font-semibold">120+ Days</th>
                      <th className="text-right p-2 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agingData.map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="p-2">{row.contactName}</td>
                        <td className="text-right p-2">{settings.currencySymbol}{row.current.toFixed(2)}</td>
                        <td className="text-right p-2">{settings.currencySymbol}{row.days30.toFixed(2)}</td>
                        <td className="text-right p-2">{settings.currencySymbol}{row.days60.toFixed(2)}</td>
                        <td className="text-right p-2">{settings.currencySymbol}{row.days90.toFixed(2)}</td>
                        <td className="text-right p-2">{settings.currencySymbol}{row.days120Plus.toFixed(2)}</td>
                        <td className="text-right p-2 font-semibold">{settings.currencySymbol}{row.total.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted font-bold">
                      <td className="p-2">TOTAL</td>
                      <td className="text-right p-2">{settings.currencySymbol}{totals.current.toFixed(2)}</td>
                      <td className="text-right p-2">{settings.currencySymbol}{totals.days30.toFixed(2)}</td>
                      <td className="text-right p-2">{settings.currencySymbol}{totals.days60.toFixed(2)}</td>
                      <td className="text-right p-2">{settings.currencySymbol}{totals.days90.toFixed(2)}</td>
                      <td className="text-right p-2">{settings.currencySymbol}{totals.days120Plus.toFixed(2)}</td>
                      <td className="text-right p-2">{settings.currencySymbol}{totals.total.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
