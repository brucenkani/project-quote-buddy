import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PayrollNavigation } from '@/components/PayrollNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { calculateAge, calculateMonthlyPAYE, calculateUIF, calculateGrossSalary, calculateNetSalary } from '@/utils/sarsCalculator';
import { generatePayslipPDF } from '@/utils/payslipGenerator';
import { format } from 'date-fns';

export default function Payroll() {
  const navigate = useNavigate();
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [taxBrackets, setTaxBrackets] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    period_start: '',
    period_end: '',
    allowances: '0',
    overtime: '0',
    bonuses: '0',
    other_deductions: '0',
    notes: '',
  });

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const loadData = async () => {
    const [payrollResult, employeesResult, taxResult] = await Promise.all([
      supabase.from('payroll').select('*, employees(*)').order('created_at', { ascending: false }),
      supabase.from('employees').select('*').eq('status', 'active'),
      supabase.from('tax_brackets').select('*'),
    ]);

    if (payrollResult.error) {
      toast({ title: 'Error', description: payrollResult.error.message, variant: 'destructive' });
    } else {
      setPayrollRecords(payrollResult.data || []);
    }

    if (!employeesResult.error) {
      setEmployees(employeesResult.data || []);
    }

    if (!taxResult.error) {
      setTaxBrackets(taxResult.data || []);
    }
  };

  const calculatePayroll = () => {
    const employee = employees.find(e => e.id === formData.employee_id);
    if (!employee) return null;

    const basicSalary = parseFloat(employee.basic_salary);
    const allowances = parseFloat(formData.allowances);
    const overtime = parseFloat(formData.overtime);
    const bonuses = parseFloat(formData.bonuses);
    const otherDeductions = parseFloat(formData.other_deductions);

    const grossSalary = calculateGrossSalary(basicSalary, allowances, overtime, bonuses);
    const age = calculateAge(employee.date_of_birth);
    const paye = calculateMonthlyPAYE(grossSalary, age, taxBrackets);
    const uif = calculateUIF(grossSalary);
    const totalDeductions = paye + uif + otherDeductions;
    const netSalary = calculateNetSalary(grossSalary, paye, uif, otherDeductions);

    return {
      basic_salary: basicSalary,
      gross_salary: grossSalary,
      paye,
      uif,
      total_deductions: totalDeductions,
      net_salary: netSalary,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const calculations = calculatePayroll();
    if (!calculations) {
      toast({ title: 'Error', description: 'Please select an employee', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.from('payroll').insert([{
        employee_id: formData.employee_id,
        period_start: formData.period_start,
        period_end: formData.period_end,
        basic_salary: calculations.basic_salary,
        allowances: parseFloat(formData.allowances),
        overtime: parseFloat(formData.overtime),
        bonuses: parseFloat(formData.bonuses),
        gross_salary: calculations.gross_salary,
        paye: calculations.paye,
        uif: calculations.uif,
        other_deductions: parseFloat(formData.other_deductions),
        total_deductions: calculations.total_deductions,
        net_salary: calculations.net_salary,
        status: 'pending',
        notes: formData.notes,
      }]);

      if (error) throw error;

      toast({ title: 'Success', description: 'Payroll record created successfully' });
      setShowDialog(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    const { error } = await supabase
      .from('payroll')
      .update({ 
        status,
        payment_date: status === 'paid' ? new Date().toISOString().split('T')[0] : null
      })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Payroll ${status}` });
      loadData();
    }
  };

  const handleDownloadPayslip = async (record: any) => {
    try {
      await generatePayslipPDF(record);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      period_start: '',
      period_end: '',
      allowances: '0',
      overtime: '0',
      bonuses: '0',
      other_deductions: '0',
      notes: '',
    });
  };

  const selectedEmployee = employees.find(e => e.id === formData.employee_id);
  const previewCalculations = selectedEmployee ? calculatePayroll() : null;

  return (
    <div className="min-h-screen bg-background">
      <PayrollNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Payroll Management</h1>
            <p className="text-muted-foreground">Process employee payroll with SARS compliance</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Process Payroll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Process Payroll</DialogTitle>
                <DialogDescription>Calculate and create payroll for an employee</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_id">Employee</Label>
                  <Select value={formData.employee_id} onValueChange={(value) => setFormData({ ...formData, employee_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name} - {emp.employee_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="period_start">Period Start</Label>
                    <Input
                      id="period_start"
                      type="date"
                      value={formData.period_start}
                      onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="period_end">Period End</Label>
                    <Input
                      id="period_end"
                      type="date"
                      value={formData.period_end}
                      onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {selectedEmployee && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="font-semibold">Employee Details</p>
                    <p className="text-sm">Basic Salary: R {parseFloat(selectedEmployee.basic_salary).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                    <p className="text-sm">Position: {selectedEmployee.position}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="allowances">Allowances</Label>
                    <Input
                      id="allowances"
                      type="number"
                      step="0.01"
                      value={formData.allowances}
                      onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overtime">Overtime</Label>
                    <Input
                      id="overtime"
                      type="number"
                      step="0.01"
                      value={formData.overtime}
                      onChange={(e) => setFormData({ ...formData, overtime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bonuses">Bonuses</Label>
                    <Input
                      id="bonuses"
                      type="number"
                      step="0.01"
                      value={formData.bonuses}
                      onChange={(e) => setFormData({ ...formData, bonuses: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="other_deductions">Other Deductions</Label>
                    <Input
                      id="other_deductions"
                      type="number"
                      step="0.01"
                      value={formData.other_deductions}
                      onChange={(e) => setFormData({ ...formData, other_deductions: e.target.value })}
                    />
                  </div>
                </div>

                {previewCalculations && (
                  <div className="p-4 bg-primary/10 rounded-lg space-y-2">
                    <p className="font-semibold">Calculation Preview</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p>Gross Salary:</p>
                      <p className="text-right">R {previewCalculations.gross_salary.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                      <p>PAYE:</p>
                      <p className="text-right">R {previewCalculations.paye.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                      <p>UIF:</p>
                      <p className="text-right">R {previewCalculations.uif.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                      <p>Total Deductions:</p>
                      <p className="text-right">R {previewCalculations.total_deductions.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                      <p className="font-bold">Net Salary:</p>
                      <p className="text-right font-bold">R {previewCalculations.net_salary.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Payroll</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payroll Records</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Gross Salary</TableHead>
                  <TableHead>PAYE</TableHead>
                  <TableHead>UIF</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {record.employees.first_name} {record.employees.last_name}
                    </TableCell>
                    <TableCell>
                      {format(new Date(record.period_start), 'dd/MM/yyyy')} - {format(new Date(record.period_end), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>R {parseFloat(record.gross_salary).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>R {parseFloat(record.paye).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>R {parseFloat(record.uif).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>R {parseFloat(record.net_salary).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <Select
                        value={record.status}
                        onValueChange={(value) => handleStatusUpdate(record.id, value)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadPayslip(record)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Payslip
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
