import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, ArrowLeft, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { generateEMP501PDF } from '@/utils/emp501Generator';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function EMP501() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [companySettings, setCompanySettings] = useState<any>(null);
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState<Date>(new Date(currentYear - 1, 2, 1)); // March 1st previous year
  const [endDate, setEndDate] = useState<Date>(new Date(currentYear, 1, 28)); // Feb 28th current year

  useEffect(() => {
    checkAuth();
    loadData();
  }, [startDate, endDate]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get active company
      const { data: memberData } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!memberData) return;

      // Get company settings
      const { data: settings } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', memberData.company_id)
        .single();

      setCompanySettings(settings);

      // Use selected date range
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      // Fetch employees for this company
      const { data: employeesList } = await supabase
        .from('employees')
        .select('id, first_name, last_name, employee_number, tax_number, id_number')
        .eq('company_id', memberData.company_id);

      const employeeIds = (employeesList || []).map(e => e.id);
      if (employeeIds.length === 0) {
        setPayrollData([]);
        return;
      }

      // Fetch payroll for those employees within tax year
      const { data: payroll } = await supabase
        .from('payroll')
        .select('*')
        .in('employee_id', employeeIds)
        .gte('period_start', startDateStr)
        .lte('period_end', endDateStr);

      // Attach employee details
      const employeesById = Object.fromEntries((employeesList || []).map(e => [e.id, e]));
      const payrollWithEmployees = (payroll || []).map(p => ({ ...p, employees: employeesById[p.employee_id] }));

      setPayrollData(payrollWithEmployees);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const year = endDate.getFullYear();
      await generateEMP501PDF(payrollData, companySettings, year);
      toast.success('EMP501 downloaded successfully');
    } catch (error) {
      console.error('Error generating EMP501:', error);
      toast.error('Failed to generate EMP501');
    }
  };

  // Group by employee
  const employeeSummary = payrollData.reduce((acc, record) => {
    const empId = record.employee_id;
    if (!acc[empId]) {
      acc[empId] = {
        employee: record.employees,
        totalGross: 0,
        totalPaye: 0,
        totalUif: 0,
        records: []
      };
    }
    acc[empId].totalGross += Number(record.gross_salary || 0);
    acc[empId].totalPaye += Number(record.paye || 0);
    acc[empId].totalUif += Number(record.uif || 0);
    acc[empId].records.push(record);
    return acc;
  }, {} as any);

  const totals = Object.values(employeeSummary).reduce((acc: { gross: number; paye: number; uif: number }, emp: any) => ({
    gross: acc.gross + emp.totalGross,
    paye: acc.paye + emp.totalPaye,
    uif: acc.uif + emp.totalUif,
  }), { gross: 0, paye: 0, uif: 0 });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/payroll')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Payroll
            </Button>
            <h1 className="text-3xl font-bold">EMP501 - Annual Employer Reconciliation</h1>
          </div>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>

        <div className="mb-6 flex gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[280px] justify-start text-left font-normal")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'PPP') : <span>Tax year start</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => date && setStartDate(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[280px] justify-start text-left font-normal")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'PPP') : <span>Tax year end</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => date && setEndDate(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tax Year: {format(startDate, 'dd MMMM yyyy')} to {format(endDate, 'dd MMMM yyyy')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Employer Details</h3>
                <p className="text-sm text-muted-foreground">Name: {companySettings?.company_name || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">Tax Reference: {companySettings?.tax_number || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">PAYE Reference: {companySettings?.paye_reference || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">Address: {companySettings?.address || 'N/A'}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Reconciliation Summary</h3>
                <p className="text-sm text-muted-foreground">Total Employees: {Object.keys(employeeSummary).length}</p>
                <p className="text-sm text-muted-foreground">Total Payroll Runs: {payrollData.length}</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Annual Tax Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Gross Remuneration</span>
                  <span className="font-semibold">R{(totals as any).gross.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total PAYE Deducted</span>
                  <span className="font-semibold">R{(totals as any).paye.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total UIF (Employee + Employer)</span>
                  <span className="font-semibold">R{((totals as any).uif * 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                  <span>Total Tax Liability</span>
                  <span>R{((totals as any).paye + ((totals as any).uif * 2)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-2">Employee Number</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">ID Number</th>
                    <th className="text-right p-2">Gross Income</th>
                    <th className="text-right p-2">PAYE</th>
                    <th className="text-right p-2">UIF</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(employeeSummary).map((emp: any, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{emp.employee?.employee_number}</td>
                      <td className="p-2">{emp.employee?.first_name} {emp.employee?.last_name}</td>
                      <td className="p-2">{emp.employee?.id_number}</td>
                      <td className="text-right p-2">R{emp.totalGross.toFixed(2)}</td>
                      <td className="text-right p-2">R{emp.totalPaye.toFixed(2)}</td>
                      <td className="text-right p-2">R{(emp.totalUif * 2).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
