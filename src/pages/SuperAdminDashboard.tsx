import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, Activity, TrendingUp, LogOut, Shield, BookOpen, Network } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CompanyManagementTable from '@/components/superadmin/CompanyManagementTable';
import UserManagementTable from '@/components/superadmin/UserManagementTable';

interface DashboardStats {
  totalCompanies: number;
  totalUsers: number;
  activeSubscriptions: number;
  recentActivity: number;
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    recentActivity: 0,
  });

  useEffect(() => {
    checkSuperAdminAccess();
    loadDashboardData();
  }, []);

  const checkSuperAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .maybeSingle();

    if (!roleData) {
      toast({
        title: 'Access Denied',
        description: 'You do not have super admin access',
        variant: 'destructive',
      });
      navigate('/landing');
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get total companies
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      // Get total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active subscriptions
      const { count: subscriptionsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'trial']);

      setStats({
        totalCompanies: companiesCount || 0,
        totalUsers: usersCount || 0,
        activeSubscriptions: subscriptionsCount || 0,
        recentActivity: 0,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">System-wide management & analytics</p>
              </div>
            </div>
            <Button onClick={handleSignOut} variant="outline" className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCompanies}</div>
              <p className="text-xs text-muted-foreground">
                Active organizations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registered accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground">
                Trial & paid plans
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Healthy</div>
              <p className="text-xs text-muted-foreground">
                All systems operational
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/knowledge-admin')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Knowledge Centre</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Manage educational content and articles</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Manage Articles
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/business-community')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Network className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Business Community</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Manage community directory and listings</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Manage Directory
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Management Tables */}
        <div className="space-y-6">
          <CompanyManagementTable />
          <UserManagementTable />
        </div>
      </main>
    </div>
  );
}
