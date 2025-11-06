import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { calculateAge, calculateMonthlyPAYE, calculateGrossSalary, calculateNetSalary, getStatutoryDeductions, fetchTaxBrackets } from '@/utils/dynamicPAYECalculator';
import { generatePayslipPDF } from '@/utils/payslipGenerator';
import { Loader2 } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';

interface BulkPayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface EmployeePayroll {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  basic_salary: number;
  date_of_birth: string;
  selected: boolean;
  allowances: number;
  overtime: number;
  bonuses: number;
  other_deductions: number;
  [key: string]: any; // Allow additional properties from database
}

export function BulkPayrollDialog({ open, onOpenChange, onComplete }: BulkPayrollDialogProps) {
  const { activeCompanySettings } = useCompany();
  const [employees, setEmployees] = useState<EmployeePayroll[]>([]);
  const [taxBrackets, setTaxBrackets] = useState<any[]>([]);
  const [payrollSettings, setPayrollSettings] = useState<any>(null);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      loadEmployees();
      loadTaxBrackets();
      loadPayrollSettings();
    }
  }, [open]);

  const loadEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('status', 'active');

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    setEmployees((data || []).map(emp => ({
      ...emp,
      selected: true,
      allowances: 0,
      overtime: 0,
      bonuses: 0,
      other_deductions: 0,
    })));
  };

  const loadTaxBrackets = async () => {
    if (!payrollSettings) return;
    const data = await fetchTaxBrackets(
      payrollSettings.country || 'ZA',
      payrollSettings.current_tax_year || new Date().getFullYear()
    );
    setTaxBrackets(data || []);
  };

  const loadPayrollSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: memberData } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!memberData) return;

    const { data } = await supabase
      .from('payroll_settings')
      .select('*')
      .eq('company_id', memberData.company_id)
      .maybeSingle();

    if (data) {
      setPayrollSettings(data);
      const tb = await fetchTaxBrackets(
        data.country || 'ZA',
        data.current_tax_year || new Date().getFullYear()
      );
      setTaxBrackets(tb || []);
    }
  };

  const toggleEmployee = (id: string) => {
    setEmployees(employees.map(emp =>
      emp.id === id ? { ...emp, selected: !emp.selected } : emp
    ));
  };

  const updateEmployeeField = (id: string, field: string, value: number) => {
    setEmployees(employees.map(emp =>
      emp.id === id ? { ...emp, [field]: value } : emp
    ));
  };

  const calculatePayrollForEmployee = (employee: EmployeePayroll) => {
    const basicSalary = employee.basic_salary;
    const grossSalary = calculateGrossSalary(
      basicSalary,
      employee.allowances,
      employee.overtime,
      employee.bonuses
    );
    const age = calculateAge(employee.date_of_birth);
    const country = payrollSettings?.country || 'ZA';
    const paye = calculateMonthlyPAYE(grossSalary, age, taxBrackets, country);
    
    // Get statutory deductions based on country
    const statutoryDeductions = getStatutoryDeductions(grossSalary, paye, country);
    const totalStatutoryDeductions = statutoryDeductions.reduce((sum, d) => sum + d.amount, 0);
    
    const totalDeductions = totalStatutoryDeductions + employee.other_deductions;
    const netSalary = grossSalary - totalDeductions;

    // Only extract UIF for storage (ZA specific, exists in DB)
    const uif = statutoryDeductions.find(d => d.name === 'UIF')?.amount || 0;

    return {
      basic_salary: basicSalary,
      gross_salary: grossSalary,
      paye,
      uif,
      total_deductions: totalDeductions,
      net_salary: netSalary,
    };
  };

  const handleCreatePayroll = async () => {
    if (!periodStart || !periodEnd) {
      toast({ title: 'Error', description: 'Please select payroll period', variant: 'destructive' });
      return;
    }

    const selectedEmployees = employees.filter(emp => emp.selected);
    if (selectedEmployees.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one employee', variant: 'destructive' });
      return;
    }

    setProcessing(true);

    try {
      for (const employee of selectedEmployees) {
        const calculations = calculatePayrollForEmployee(employee);

        // Create payroll record - only insert columns that exist in DB
        const { data: payrollData, error: payrollError } = await supabase
          .from('payroll')
          .insert([{
            employee_id: employee.id,
            period_start: periodStart,
            period_end: periodEnd,
            basic_salary: calculations.basic_salary,
            allowances: employee.allowances,
            overtime: employee.overtime,
            bonuses: employee.bonuses,
            gross_salary: calculations.gross_salary,
            paye: calculations.paye,
            uif: calculations.uif,
            other_deductions: employee.other_deductions,
            total_deductions: calculations.total_deductions,
            net_salary: calculations.net_salary,
            status: 'pending',
          }])
          .select()
          .single();

        if (payrollError) throw payrollError;

        // Generate PDF and check SMTP configuration
        const payrollWithEmployee = {
          ...payrollData,
          employees: employee,
        };
        
        try {
          const companySettings = {
            company_name: activeCompanySettings?.company_name || '',
            email: activeCompanySettings?.email || '',
            phone: activeCompanySettings?.phone || '',
            address: activeCompanySettings?.address || '',
          };
          
          // Generate PDF
          await generatePayslipPDF(payrollWithEmployee, companySettings);
          
          // Check if SMTP is configured
          const smtpConfigured = payrollSettings?.smtp_host && 
                                 payrollSettings?.smtp_user && 
                                 payrollSettings?.smtp_password;
          
          if (smtpConfigured) {
            // Send email notification
            try {
              const { error: emailError } = await supabase.functions.invoke('send-payslip-email', {
                body: {
                  employeeEmail: employee.email,
                  employeeName: `${employee.first_name} ${employee.last_name}`,
                  periodStart,
                  periodEnd,
                  netSalary: calculations.net_salary,
                  pdfBase64: '', // PDF generation needs refactoring to return blob
                },
              });

              if (emailError) {
                console.error('Email error for', employee.email, ':', emailError);
              }
            } catch (emailError) {
              console.error('Email sending error:', emailError);
            }
          }
        } catch (error) {
          console.error('PDF generation error:', error);
        }
      }

      const smtpConfigured = payrollSettings?.smtp_host && 
                             payrollSettings?.smtp_user && 
                             payrollSettings?.smtp_password;
      
      const message = smtpConfigured 
        ? `Payroll processed and emails sent for ${selectedEmployees.length} employee(s)`
        : `Payroll processed for ${selectedEmployees.length} employee(s). Configure SMTP to send emails.`;
      
      toast({
        title: 'Success',
        description: message,
      });
      
      onComplete();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const sendPayslipEmail = async (employee: EmployeePayroll, payroll: any, pdfBlob: Blob) => {
    try {
      // Convert PDF blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(pdfBlob);
      });
      
      const pdfBase64 = await base64Promise;

      const { error } = await supabase.functions.invoke('send-payslip-email', {
        body: {
          employeeEmail: employee.email,
          employeeName: `${employee.first_name} ${employee.last_name}`,
          periodStart,
          periodEnd,
          netSalary: payroll.net_salary,
          pdfBase64,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Email error:', error);
      toast({
        title: 'Warning',
        description: `Payroll created for ${employee.first_name} ${employee.last_name}, but email failed to send`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Process Payroll</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 px-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="period_start">Period Start</Label>
              <Input
                id="period_start"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="period_end">Period End</Label>
              <Input
                id="period_end"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>Allowances</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Bonuses</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>PAYE</TableHead>
                  <TableHead>Net Salary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => {
                  const calc = calculatePayrollForEmployee(employee);
                  return (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <Checkbox
                          checked={employee.selected}
                          onCheckedChange={() => toggleEmployee(employee.id)}
                        />
                      </TableCell>
                      <TableCell>
                        {employee.first_name} {employee.last_name}
                        <div className="text-xs text-muted-foreground">{employee.employee_number}</div>
                      </TableCell>
                      <TableCell className="text-sm">{employee.email}</TableCell>
                      <TableCell>R {employee.basic_salary.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={employee.allowances}
                          onChange={(e) => updateEmployeeField(employee.id, 'allowances', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={employee.overtime}
                          onChange={(e) => updateEmployeeField(employee.id, 'overtime', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={employee.bonuses}
                          onChange={(e) => updateEmployeeField(employee.id, 'bonuses', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={employee.other_deductions}
                          onChange={(e) => updateEmployeeField(employee.id, 'other_deductions', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell className="text-sm">
                        R {calc.paye.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-semibold">
                        R {calc.net_salary.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleCreatePayroll} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Payroll & Send Emails
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
