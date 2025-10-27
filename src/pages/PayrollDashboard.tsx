import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PayrollNavigation } from '@/components/PayrollNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, Calendar, FileText } from 'lucide-react';

export default function PayrollDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingPayroll: 0,
    pendingLeave: 0,
  });
  const [country, setCountry] = useState<string>('ZA');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      }
    };

    checkAuth();
    loadStats();
  }, [navigate]);

  const loadStats = async () => {
    const [employeesResult, payrollResult, leaveResult, settingsResult] = await Promise.all([
      supabase.from('employees').select('*', { count: 'exact' }),
      supabase.from('payroll').select('*', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('leave_requests').select('*', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('payroll_settings').select('country').maybeSingle(),
    ]);

    const activeEmployees = employeesResult.data?.filter(e => e.status === 'active').length || 0;
    setCountry(settingsResult.data?.country || 'ZA');

    setStats({
      totalEmployees: employeesResult.count || 0,
      activeEmployees,
      pendingPayroll: payrollResult.count || 0,
      pendingLeave: leaveResult.count || 0,
    });
  };

  const getTaxDeclarations = () => {
    switch (country) {
      case 'ZA':
        return {
          monthly: { code: 'EMP201', name: 'SARS Monthly Employer Declaration' },
          annual: { code: 'EMP501', name: 'SARS Annual Employer Reconciliation' },
        };
      case 'ZW':
        return {
          monthly: { code: 'IT14', name: 'ZIMRA Monthly PAYE Return' },
          annual: { code: 'IT19', name: 'ZIMRA Annual Return of Employees' },
        };
      case 'ZM':
        return {
          monthly: { code: 'PAYE Schedule', name: 'ZRA Monthly PAYE Schedule' },
          annual: { code: 'Annual PAYE', name: 'ZRA Annual PAYE Reconciliation' },
        };
      default:
        return {
          monthly: { code: 'EMP201', name: 'Monthly Employer Declaration' },
          annual: { code: 'EMP501', name: 'Annual Employer Reconciliation' },
        };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PayrollNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">HR & Payroll Dashboard</h1>
          <p className="text-muted-foreground">Manage employees, payroll, and leave</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/payroll/employees')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeEmployees} active
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/payroll/leave')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Leave</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingLeave}</div>
              <p className="text-xs text-muted-foreground">
                Requests to review
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/tax-declarations/emp201')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Tax Declaration</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTaxDeclarations().monthly.code}</div>
              <p className="text-xs text-muted-foreground">
                {getTaxDeclarations().monthly.name}
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/tax-declarations/emp501')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Tax Declaration</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTaxDeclarations().annual.code}</div>
              <p className="text-xs text-muted-foreground">
                {getTaxDeclarations().annual.name}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/payroll/employees')}>
            <CardHeader>
              <CardTitle>Employee Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and manage employee records, add new employees
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/payroll/payroll')}>
            <CardHeader>
              <CardTitle>Payroll Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Process payroll, generate payslips, SARS-compliant calculations
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/payroll/leave')}>
            <CardHeader>
              <CardTitle>Leave Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage leave requests, track balances, approve/reject requests
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
