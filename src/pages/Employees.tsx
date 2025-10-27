import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PayrollNavigation } from '@/components/PayrollNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [canManage, setCanManage] = useState(false);
  const [formData, setFormData] = useState({
    employee_number: '',
    first_name: '',
    last_name: '',
    id_number: '',
    date_of_birth: '',
    email: '',
    phone: '',
    address: '',
    position: '',
    department: '',
    start_date: '',
    basic_salary: '',
    bank_name: '',
    account_number: '',
    account_type: '',
    tax_number: '',
    uif_number: '',
    status: 'active',
    annual_leave_days: '21',
    sick_leave_days: '30',
    family_responsibility_leave_days: '3',
    maternity_leave_days: '0',
    study_leave_days: '0',
  });

  useEffect(() => {
    checkAuth();
    loadEmployees();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    await fetchRoles(session.user.id);
  };

  const fetchRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    if (!error) {
      setCanManage((data || []).some((r: any) => r.role === 'owner' || r.role === 'accountant'));
    } else {
      setCanManage(false);
    }
  };

  const generateNextEmployeeNumber = async (companyId: string): Promise<string> => {
    // Get the highest employee number for this company
    const { data, error } = await supabase
      .from('employees')
      .select('employee_number')
      .eq('company_id', companyId)
      .order('employee_number', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return '0001';
    }

    // Extract numeric part and increment
    const lastNumber = data[0].employee_number;
    const numericPart = parseInt(lastNumber.replace(/\D/g, '')) || 0;
    const nextNumber = numericPart + 1;
    
    // Format with leading zeros
    return nextNumber.toString().padStart(4, '0');
  };

  const loadEmployees = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Check if user is owner or accountant
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);
    
    const isPrivileged = (roles || []).some((r: any) => r.role === 'owner' || r.role === 'accountant');

    if (isPrivileged) {
      // Owners and accountants can see all employee data including sensitive info
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        setEmployees(data || []);
      }
    } else {
      // Regular employees only see their limited profile via secure view
      const { data, error } = await supabase
        .rpc('get_employee_safe_profile', { employee_user_id: session.user.id });

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        setEmployees(data || []);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user's active company
      const { data: companyMembers } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!companyMembers) throw new Error('No company found for user');

      let employeeNumber = formData.employee_number;
      
      // Auto-generate employee number for new employees if not provided
      if (!editingEmployee && !employeeNumber) {
        employeeNumber = await generateNextEmployeeNumber(companyMembers.company_id);
      }

      const dataToSubmit = {
        ...formData,
        employee_number: employeeNumber,
        user_id: user.id,
        company_id: companyMembers.company_id,
        basic_salary: parseFloat(formData.basic_salary),
        annual_leave_days: parseFloat(formData.annual_leave_days),
        sick_leave_days: parseFloat(formData.sick_leave_days),
        family_responsibility_leave_days: parseFloat(formData.family_responsibility_leave_days),
        maternity_leave_days: parseFloat(formData.maternity_leave_days),
        study_leave_days: parseFloat(formData.study_leave_days),
      };

      if (editingEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(dataToSubmit)
          .eq('id', editingEmployee.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Employee updated successfully' });
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([dataToSubmit]);

        if (error) throw error;
        toast({ title: 'Success', description: 'Employee created successfully' });
      }

      setShowDialog(false);
      setEditingEmployee(null);
      resetForm();
      loadEmployees();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleEdit = (employee: any) => {
    setEditingEmployee(employee);
    setFormData({
      employee_number: employee.employee_number,
      first_name: employee.first_name,
      last_name: employee.last_name,
      id_number: employee.id_number,
      date_of_birth: employee.date_of_birth,
      email: employee.email,
      phone: employee.phone || '',
      address: employee.address || '',
      position: employee.position,
      department: employee.department || '',
      start_date: employee.start_date,
      basic_salary: employee.basic_salary,
      bank_name: employee.bank_name || '',
      account_number: employee.account_number || '',
      account_type: employee.account_type || '',
      tax_number: employee.tax_number || '',
      uif_number: employee.uif_number || '',
      status: employee.status,
      annual_leave_days: employee.annual_leave_days || '21',
      sick_leave_days: employee.sick_leave_days || '30',
      family_responsibility_leave_days: employee.family_responsibility_leave_days || '3',
      maternity_leave_days: employee.maternity_leave_days || '0',
      study_leave_days: employee.study_leave_days || '0',
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Employee deleted successfully' });
      loadEmployees();
    }
  };

  const resetForm = () => {
    setFormData({
      employee_number: '',
      first_name: '',
      last_name: '',
      id_number: '',
      date_of_birth: '',
      email: '',
      phone: '',
      address: '',
      position: '',
      department: '',
      start_date: '',
      basic_salary: '',
      bank_name: '',
      account_number: '',
      account_type: '',
      tax_number: '',
      uif_number: '',
      status: 'active',
      annual_leave_days: '21',
      sick_leave_days: '30',
      family_responsibility_leave_days: '3',
      maternity_leave_days: '0',
      study_leave_days: '0',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <PayrollNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Employee Management</h1>
            <p className="text-muted-foreground">Manage your workforce</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingEmployee(null); }} disabled={!canManage} title={!canManage ? 'You do not have permission to add employees' : undefined}>
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
                <DialogDescription>Enter employee details</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee_number">Employee Number</Label>
                    <Input
                      id="employee_number"
                      value={formData.employee_number}
                      onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                      placeholder={editingEmployee ? '' : 'Auto-generated if left blank'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id_number">ID Number</Label>
                    <Input
                      id="id_number"
                      value={formData.id_number}
                      onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="basic_salary">Basic Salary</Label>
                    <Input
                      id="basic_salary"
                      type="number"
                      step="0.01"
                      value={formData.basic_salary}
                      onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input
                      id="bank_name"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input
                      id="account_number"
                      value={formData.account_number}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_type">Account Type</Label>
                    <Input
                      id="account_type"
                      value={formData.account_type}
                      onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax_number">Tax Number</Label>
                    <Input
                      id="tax_number"
                      value={formData.tax_number}
                      onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uif_number">UIF Number</Label>
                    <Input
                      id="uif_number"
                      value={formData.uif_number}
                      onChange={(e) => setFormData({ ...formData, uif_number: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Annual Leave Allocations (Days)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="annual_leave_days">Annual Leave</Label>
                      <Input
                        id="annual_leave_days"
                        type="number"
                        step="0.5"
                        value={formData.annual_leave_days}
                        onChange={(e) => setFormData({ ...formData, annual_leave_days: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sick_leave_days">Sick Leave</Label>
                      <Input
                        id="sick_leave_days"
                        type="number"
                        step="0.5"
                        value={formData.sick_leave_days}
                        onChange={(e) => setFormData({ ...formData, sick_leave_days: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="family_responsibility_leave_days">Family Responsibility Leave</Label>
                      <Input
                        id="family_responsibility_leave_days"
                        type="number"
                        step="0.5"
                        value={formData.family_responsibility_leave_days}
                        onChange={(e) => setFormData({ ...formData, family_responsibility_leave_days: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maternity_leave_days">Maternity Leave</Label>
                      <Input
                        id="maternity_leave_days"
                        type="number"
                        step="0.5"
                        value={formData.maternity_leave_days}
                        onChange={(e) => setFormData({ ...formData, maternity_leave_days: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="study_leave_days">Study Leave</Label>
                      <Input
                        id="study_leave_days"
                        type="number"
                        step="0.5"
                        value={formData.study_leave_days}
                        onChange={(e) => setFormData({ ...formData, study_leave_days: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingEmployee ? 'Update' : 'Create'} Employee
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.employee_number}</TableCell>
                    <TableCell>{employee.first_name} {employee.last_name}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.department || '-'}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>R {parseFloat(employee.basic_salary).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {canManage ? (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(employee)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(employee.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ) : null}
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
