import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, ArrowLeft, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { generateEMP201PDF } from '@/utils/emp201Generator';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function EMP201() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));

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
        .select('id, first_name, last_name, employee_number, tax_number')
        .eq('company_id', memberData.company_id);

      const employeeIds = (employeesList || []).map(e => e.id);
      if (employeeIds.length === 0) {
        setPayrollData([]);
        return;
      }

      // Fetch payroll for those employees within period
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
      const month = startDate.getMonth();
      const year = startDate.getFullYear();
      await generateEMP201PDF(payrollData, companySettings, month, year);
      toast.success('EMP201 downloaded successfully');
    } catch (error) {
      console.error('Error generating EMP201:', error);
      toast.error('Failed to generate EMP201');
    }
  };

  const totals = payrollData.reduce((acc, record) => ({
    paye: acc.paye + Number(record.paye || 0),
    uif: acc.uif + Number(record.uif || 0),
    grossSalary: acc.grossSalary + Number(record.gross_salary || 0),
  }), { paye: 0, uif: 0, grossSalary: 0 });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/payroll')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Payroll
            </Button>
            <h1 className="text-3xl font-bold">EMP201 - Monthly Employer Declaration</h1>
          </div>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>

        <div className="mb-6 flex gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'PPP') : <span>Start date</span>}
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
              <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'PPP') : <span>End date</span>}
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

        <Card>
          <CardHeader>
            <CardTitle>Tax Period: {format(startDate, 'MMMM yyyy')} to {format(endDate, 'MMMM yyyy')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Employer Details</h3>
                <p className="text-sm text-muted-foreground">Name: {companySettings?.company_name || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">Tax Reference: {companySettings?.tax_number || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">Address: {companySettings?.address || 'N/A'}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Declaration Summary</h3>
                <p className="text-sm text-muted-foreground">Total Employees: {payrollData.length}</p>
                <p className="text-sm text-muted-foreground">Total Gross Remuneration: R{totals.grossSalary.toFixed(2)}</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Tax Liability</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>PAYE (Employees' Tax)</span>
                  <span className="font-semibold">R{totals.paye.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>UIF (Unemployment Insurance Fund)</span>
                  <span className="font-semibold">R{(totals.uif * 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                  <span>Total Amount Due</span>
                  <span>R{(totals.paye + (totals.uif * 2)).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Payment Details</h3>
              <p className="text-sm text-muted-foreground">Payment Reference: PAYE {format(startDate, 'yyyyMM')}</p>
              <p className="text-sm text-muted-foreground">Due Date: 7th of following month</p>
              <p className="text-sm text-muted-foreground">SARS Bank Details: Available on eFiling portal</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
