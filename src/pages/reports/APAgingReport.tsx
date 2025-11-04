import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FileDown, FileSpreadsheet, CalendarIcon, X } from 'lucide-react';
import { loadExpenses } from '@/utils/accountingStorage';
import { useSettings } from '@/contexts/SettingsContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useToast } from '@/hooks/use-toast';
import { Expense } from '@/types/accounting';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AgingBucket {
  contactName: string;
  contactGroup?: string;
  current: number;
  days30: number;
  days60: number;
  days90: number;
  days120Plus: number;
  total: number;
  isGroupHeader?: boolean;
  groupMembers?: AgingBucket[];
}

export default function APAgingReport() {
  const { toast } = useToast();
  const { settings } = useSettings();
  const { activeCompany } = useCompany();
  const [agingData, setAgingData] = useState<AgingBucket[]>([]);
  const [allAgingData, setAllAgingData] = useState<AgingBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [asAtDate, setAsAtDate] = useState<Date>(new Date());
  const [showByGroup, setShowByGroup] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [availableSuppliers, setAvailableSuppliers] = useState<string[]>([]);
  const [showSupplierSelect, setShowSupplierSelect] = useState(false);
  const [totals, setTotals] = useState({
    current: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    days120Plus: 0,
    total: 0,
  });

  useEffect(() => {
    if (!activeCompany) return;
    loadAgingData();
  }, [activeCompany?.id, asAtDate]);

  useEffect(() => {
    filterAndDisplayData();
  }, [allAgingData, showByGroup, selectedSuppliers]);

  const loadAgingData = async () => {
    setLoading(true);
    if (!activeCompany) {
      setAllAgingData([]);
      setAvailableSuppliers([]);
      setLoading(false);
      return;
    }
    try {
      const expenses = await loadExpenses();
      const outstandingExpenses = expenses.filter(
        (exp) => exp.status === 'pending' || exp.status === 'approved' || exp.status === 'partly-paid' || exp.status === 'overdue'
      );

      const bucketMap = new Map<string, AgingBucket>();

      // Fetch contacts to get group information
      const { data: contacts } = await supabase
        .from('contacts')
        .select('name, contact_group')
        .eq('company_id', activeCompany.id)
        .in('type', ['supplier', 'both']);

      const contactGroupMap = new Map(contacts?.map(c => [c.name, c.contact_group]) || []);

      outstandingExpenses.forEach((expense) => {
        const outstanding = calculateOutstanding(expense);
        if (outstanding <= 0) return;

        const expenseDate = new Date(expense.date);
        const daysOld = Math.floor((asAtDate.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24));

        const contactName = expense.vendor;
        const contactGroup = contactGroupMap.get(contactName);
        
        if (!bucketMap.has(contactName)) {
          bucketMap.set(contactName, {
            contactName,
            contactGroup,
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

      const data = Array.from(bucketMap.values()).sort((a, b) => {
        // Sort by group first, then by name
        if (a.contactGroup && b.contactGroup && a.contactGroup !== b.contactGroup) {
          return a.contactGroup.localeCompare(b.contactGroup);
        }
        return a.contactName.localeCompare(b.contactName);
      });

      setAllAgingData(data);
      setAvailableSuppliers(data.map(d => d.contactName));
    } catch (error) {
      console.error('Failed to load aging data:', error);
      toast({ title: 'Failed to load aging data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filterAndDisplayData = () => {
    let filteredData = allAgingData;

    // Filter by selected suppliers
    if (selectedSuppliers.length > 0) {
      filteredData = filteredData.filter(d => selectedSuppliers.includes(d.contactName));
    }

    // Group by contact group if enabled
    if (showByGroup) {
      const groupMap = new Map<string, { header: AgingBucket, members: AgingBucket[] }>();
      
      filteredData.forEach((item) => {
        const groupKey = item.contactGroup || 'Ungrouped';
        
        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, {
            header: {
              contactName: groupKey,
              contactGroup: groupKey,
              current: 0,
              days30: 0,
              days60: 0,
              days90: 0,
              days120Plus: 0,
              total: 0,
              isGroupHeader: true,
              groupMembers: [],
            },
            members: [],
          });
        }

        const group = groupMap.get(groupKey)!;
        group.header.current += item.current;
        group.header.days30 += item.days30;
        group.header.days60 += item.days60;
        group.header.days90 += item.days90;
        group.header.days120Plus += item.days120Plus;
        group.header.total += item.total;
        group.members.push(item);
      });

      // Flatten to array with group headers followed by members
      filteredData = [];
      Array.from(groupMap.values())
        .sort((a, b) => a.header.contactName.localeCompare(b.header.contactName))
        .forEach(({ header, members }) => {
          filteredData.push(header);
          members.sort((a, b) => a.contactName.localeCompare(b.contactName))
            .forEach(member => filteredData.push(member));
        });
    }

    setAgingData(filteredData);

    // Calculate totals
    const newTotals = filteredData.reduce(
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
    doc.text(`As at: ${format(asAtDate, 'dd MMM yyyy')}`, 14, 34);
    
    if (selectedSuppliers.length > 0) {
      doc.text(`Filtered Suppliers: ${selectedSuppliers.join(', ')}`, 14, 40);
    }
    if (showByGroup) {
      doc.text('Grouped by Contact Group', 14, selectedSuppliers.length > 0 ? 46 : 40);
    }

    const tableData = agingData.map((row) => [
      showByGroup 
        ? row.contactName 
        : (row.contactGroup ? `[${row.contactGroup}] ${row.contactName}` : row.contactName),
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

    const startY = 40 + (selectedSuppliers.length > 0 ? 6 : 0) + (showByGroup ? 6 : 0);

    autoTable(doc, {
      startY,
      head: [[showByGroup ? 'Group' : 'Supplier', 'Current', '31-60 Days', '61-90 Days', '91-120 Days', '120+ Days', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [66, 66, 66] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    });

    doc.save('AP-Aging-Report.pdf');
    toast({ title: 'PDF exported successfully' });
  };

  const handleExportExcel = () => {
    const data = agingData.map((row) => {
      if (showByGroup) {
        return {
          Group: row.contactName,
          Current: row.current,
          '31-60 Days': row.days30,
          '61-90 Days': row.days60,
          '91-120 Days': row.days90,
          '120+ Days': row.days120Plus,
          Total: row.total,
        };
      }
      return {
        Group: row.contactGroup || '',
        Supplier: row.contactName,
        Current: row.current,
        '31-60 Days': row.days30,
        '61-90 Days': row.days60,
        '91-120 Days': row.days90,
        '120+ Days': row.days120Plus,
        Total: row.total,
      };
    });

    if (showByGroup) {
      data.push({
        Group: 'TOTAL',
        Current: totals.current,
        '31-60 Days': totals.days30,
        '61-90 Days': totals.days60,
        '91-120 Days': totals.days90,
        '120+ Days': totals.days120Plus,
        Total: totals.total,
      });
    } else {
      data.push({
        Group: '',
        Supplier: 'TOTAL',
        Current: totals.current,
        '31-60 Days': totals.days30,
        '61-90 Days': totals.days60,
        '91-120 Days': totals.days90,
        '120+ Days': totals.days120Plus,
        Total: totals.total,
      });
    }

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
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
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

          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>As at Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !asAtDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {asAtDate ? format(asAtDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={asAtDate}
                      onSelect={(date) => date && setAsAtDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Filter by Suppliers</Label>
                <Popover open={showSupplierSelect} onOpenChange={setShowSupplierSelect}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      {selectedSuppliers.length === 0 
                        ? "All Suppliers" 
                        : `${selectedSuppliers.length} selected`}
                      <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search suppliers..." />
                      <CommandList>
                        <CommandEmpty>No suppliers found.</CommandEmpty>
                        <CommandGroup>
                          {availableSuppliers.map((supplier) => (
                            <CommandItem
                              key={supplier}
                              onSelect={() => {
                                setSelectedSuppliers(prev =>
                                  prev.includes(supplier)
                                    ? prev.filter(c => c !== supplier)
                                    : [...prev, supplier]
                                );
                              }}
                            >
                              <Checkbox
                                checked={selectedSuppliers.includes(supplier)}
                                className="mr-2"
                              />
                              {supplier}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                    {selectedSuppliers.length > 0 && (
                      <div className="flex items-center gap-2 p-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSuppliers([])}
                          className="h-8 text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Display Options</Label>
                <div className="flex items-center space-x-2 h-10">
                  <Checkbox
                    id="showByGroup"
                    checked={showByGroup}
                    onCheckedChange={(checked) => setShowByGroup(checked as boolean)}
                  />
                  <label
                    htmlFor="showByGroup"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Group by Contact Group
                  </label>
                </div>
              </div>
            </div>
          </Card>
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
                      <th className="text-left p-2 font-semibold">{showByGroup ? 'Group' : 'Supplier'}</th>
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
                      <tr 
                        key={idx} 
                        className={cn(
                          "border-b",
                          row.isGroupHeader 
                            ? "bg-muted/30 font-semibold" 
                            : "hover:bg-muted/50",
                          !row.isGroupHeader && showByGroup && "pl-4"
                        )}
                      >
                        <td className={cn("p-2", !row.isGroupHeader && showByGroup && "pl-8")}>
                          {!showByGroup && row.contactGroup && (
                            <span className="text-muted-foreground text-sm mr-2">[{row.contactGroup}]</span>
                          )}
                          {row.contactName}
                        </td>
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
