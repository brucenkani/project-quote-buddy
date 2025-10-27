import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PayrollNavigation } from '@/components/PayrollNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, Eye, Users, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  calculateAge, 
  calculateMonthlyPAYE, 
  calculateGrossSalary, 
  calculateNetSalary,
  fetchTaxBrackets,
  getStatutoryDeductions
} from '@/utils/dynamicPAYECalculator';
import { generatePayslipPDF } from '@/utils/payslipGenerator';
import { format } from 'date-fns';
import { BulkPayrollDialog } from '@/components/payroll/BulkPayrollDialog';
import { useCompany } from '@/contexts/CompanyContext';

export default function Payroll() {
  const navigate = useNavigate();
  const { activeCompany, activeCompanySettings } = useCompany();
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [taxBrackets, setTaxBrackets] = useState<any[]>([]);
  const [payrollSettings, setPayrollSettings] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('all');
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');
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
  const [customIncome, setCustomIncome] = useState<{ description: string; amount: string }[]>([]);
  const [customDeductions, setCustomDeductions] = useState<{ description: string; amount: string }[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [selectedEmployeeFilter, dateRangeStart, dateRangeEnd, payrollRecords]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const loadData = async () => {
    // First load payroll settings to get country
    const settingsResult = await supabase
      .from('payroll_settings')
      .select('*')
      .maybeSingle();

    const settings = settingsResult.data;
    setPayrollSettings(settings);

    const country = settings?.country || 'ZA';
    const taxYear = settings?.current_tax_year || new Date().getFullYear();

    // Load tax brackets for the specific country and year
    const taxBrackets = await fetchTaxBrackets(country, taxYear);
    setTaxBrackets(taxBrackets);

    const [payrollResult, employeesResult] = await Promise.all([
      supabase.from('payroll').select('*, employees(*)').order('created_at', { ascending: false }),
      supabase.from('employees').select('*').eq('status', 'active'),
    ]);

    if (payrollResult.error) {
      toast({ title: 'Error', description: payrollResult.error.message, variant: 'destructive' });
    } else {
      setPayrollRecords(payrollResult.data || []);
    }

    if (!employeesResult.error) {
      setEmployees(employeesResult.data || []);
    }
  };

  const filterRecords = () => {
    let filtered = [...payrollRecords];

    // Filter by employee
    if (selectedEmployeeFilter !== 'all') {
      filtered = filtered.filter(record => record.employee_id === selectedEmployeeFilter);
    }

    // Filter by date range
    if (dateRangeStart) {
      filtered = filtered.filter(record => new Date(record.period_start) >= new Date(dateRangeStart));
    }
    if (dateRangeEnd) {
      filtered = filtered.filter(record => new Date(record.period_end) <= new Date(dateRangeEnd));
    }

    setFilteredRecords(filtered);
  };

  const calculatePayroll = () => {
    const employee = employees.find(e => e.id === formData.employee_id);
    if (!employee) return null;

    const basicSalary = parseFloat(employee.basic_salary);
    const allowances = parseFloat(formData.allowances);
    const overtime = parseFloat(formData.overtime);
    const bonuses = parseFloat(formData.bonuses);
    const otherDeductions = parseFloat(formData.other_deductions);

    // Add custom income to gross salary
    const customIncomeTotal = customIncome.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const grossSalary = calculateGrossSalary(basicSalary, allowances, overtime, bonuses) + customIncomeTotal;
    
    const age = calculateAge(employee.date_of_birth);
    const country = payrollSettings?.country || 'ZA';
    const paye = calculateMonthlyPAYE(grossSalary, age, taxBrackets, country);
    
    // Get statutory deductions based on country (EXCLUDING PAYE to avoid double counting)
    const statutoryDeductions = getStatutoryDeductions(grossSalary, paye, country);
    // Filter out PAYE from statutory deductions since we're adding it separately
    const nonPAYEDeductions = statutoryDeductions.filter(d => d.name !== 'PAYE');
    const totalNonPAYEStatutory = nonPAYEDeductions.reduce((sum, d) => sum + d.amount, 0);
    
    // Add custom deductions to total deductions
    const customDeductionsTotal = customDeductions.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const totalDeductions = paye + totalNonPAYEStatutory + otherDeductions + customDeductionsTotal;
    const netSalary = grossSalary - totalDeductions;

    return {
      basic_salary: basicSalary,
      gross_salary: grossSalary,
      paye,
      uif: statutoryDeductions.find(d => d.name === 'UIF')?.amount || 0,
      total_deductions: totalDeductions,
      net_salary: netSalary,
      statutory_deductions: statutoryDeductions,
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
      const { data: payrollData, error: payrollError } = await supabase.from('payroll').insert([{
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
      }]).select();

      if (payrollError) throw payrollError;

      // Insert custom income items
      if (customIncome.length > 0 && payrollData && payrollData[0]) {
        const customIncomeItems = customIncome
          .filter(item => item.description && parseFloat(item.amount) > 0)
          .map(item => ({
            payroll_id: payrollData[0].id,
            item_type: 'income',
            description: item.description,
            amount: parseFloat(item.amount),
          }));
        
        if (customIncomeItems.length > 0) {
          const { error: incomeError } = await supabase.from('custom_payroll_items').insert(customIncomeItems);
          if (incomeError) console.error('Error saving custom income:', incomeError);
        }
      }

      // Insert custom deduction items
      if (customDeductions.length > 0 && payrollData && payrollData[0]) {
        const customDeductionItems = customDeductions
          .filter(item => item.description && parseFloat(item.amount) > 0)
          .map(item => ({
            payroll_id: payrollData[0].id,
            item_type: 'deduction',
            description: item.description,
            amount: parseFloat(item.amount),
          }));
        
        if (customDeductionItems.length > 0) {
          const { error: deductionError } = await supabase.from('custom_payroll_items').insert(customDeductionItems);
          if (deductionError) console.error('Error saving custom deductions:', deductionError);
        }
      }

      toast({ title: 'Success', description: 'Payroll record created successfully' });
      
      // Optionally send payslip email if SMTP configured
      if (payrollData && payrollData[0] && payrollSettings?.smtp_host) {
        try {
          const payrollWithEmployee = {
            ...payrollData[0],
            employees: selectedEmployee,
            currency_symbol: payrollSettings.currency_symbol || 'R',
          };
          const companySettings = {
            ...activeCompanySettings,
            company_name: activeCompany?.name || '',
          };
          await generatePayslipPDF(payrollWithEmployee, companySettings);
          // Note: Email sending would require implementation of the send-payslip-email edge function
        } catch (error) {
          console.error('Error generating payslip:', error);
        }
      }
      
      setShowDialog(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDownloadPayslip = async (record: any) => {
    try {
      const companySettings = {
        ...activeCompanySettings,
        company_name: activeCompany?.name || '',
      };
      await generatePayslipPDF(record, companySettings);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeletePayroll = async (id: string) => {
    try {
      const { error } = await supabase.from('payroll').delete().eq('id', id);
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Payroll record deleted' });
      loadData();
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
    setCustomIncome([]);
    setCustomDeductions([]);
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
          <div className="flex gap-2">
            <Button onClick={() => setShowBulkDialog(true)}>
              <Users className="mr-2 h-4 w-4" />
              Bulk Process Payroll
            </Button>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => resetForm()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Single Payroll
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

                {/* Custom Income Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Custom Income Items</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCustomIncome([...customIncome, { description: '', amount: '0' }])}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Income
                    </Button>
                  </div>
                  {customIncome.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...customIncome];
                          newItems[index].description = e.target.value;
                          setCustomIncome(newItems);
                        }}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        value={item.amount}
                        onChange={(e) => {
                          const newItems = [...customIncome];
                          newItems[index].amount = e.target.value;
                          setCustomIncome(newItems);
                        }}
                        className="w-32"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCustomIncome(customIncome.filter((_, i) => i !== index))}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Custom Deductions Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Custom Deductions</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCustomDeductions([...customDeductions, { description: '', amount: '0' }])}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Deduction
                    </Button>
                  </div>
                  {customDeductions.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...customDeductions];
                          newItems[index].description = e.target.value;
                          setCustomDeductions(newItems);
                        }}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        value={item.amount}
                        onChange={(e) => {
                          const newItems = [...customDeductions];
                          newItems[index].amount = e.target.value;
                          setCustomDeductions(newItems);
                        }}
                        className="w-32"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCustomDeductions(customDeductions.filter((_, i) => i !== index))}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payroll Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="employee-filter">Filter by Employee</Label>
                <Select value={selectedEmployeeFilter} onValueChange={setSelectedEmployeeFilter}>
                  <SelectTrigger id="employee-filter">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-start">Date From</Label>
                <Input
                  id="date-start"
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-end">Date To</Label>
                <Input
                  id="date-end"
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Gross Salary</TableHead>
                  <TableHead>PAYE</TableHead>
                  <TableHead>UIF</TableHead>
                  <TableHead>Total Deductions</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
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
                    <TableCell>R {parseFloat(record.total_deductions).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>R {parseFloat(record.net_salary).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPayslip(record)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Payslip
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Payroll Record</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this payroll record for {record.employees.first_name} {record.employees.last_name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePayroll(record.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <BulkPayrollDialog
        open={showBulkDialog}
        onOpenChange={setShowBulkDialog}
        onComplete={loadData}
      />
    </div>
  );
}
