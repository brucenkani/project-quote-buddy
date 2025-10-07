import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Calculator, Users, Settings, Shield, Home } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session) {
        navigate('/auth');
      } else if (session && window.location.pathname === '/') {
        navigate('/dashboard');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session) {
        navigate('/auth');
      } else if (session && window.location.pathname === '/') {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">BizCounting</h1>
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/')} variant="ghost" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
            <Button onClick={() => navigate('/invite')} variant="ghost" size="sm" className="gap-2">
              <Users className="h-4 w-4" />
              Invite Users
            </Button>
            <Button onClick={() => navigate('/permissions')} variant="ghost" size="sm" className="gap-2">
              <Shield className="h-4 w-4" />
              Permissions
            </Button>
            <Button onClick={() => navigate('/company-settings')} variant="ghost" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Company Settings
            </Button>
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Welcome to BizCounting</h2>
          <p className="text-xl text-muted-foreground">
            Complete business management solution for accounting and HR
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/accounting')}>
            <CardHeader>
              <Calculator className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Accounting System</CardTitle>
              <CardDescription>
                Manage invoices, expenses, inventory, and financial reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Invoice & Quote Management</li>
                <li>• Expense Tracking</li>
                <li>• Inventory Control</li>
                <li>• Financial Reporting</li>
                <li>• Journal Entries</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/payroll')}>
            <CardHeader>
              <Users className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Payroll & HR System</CardTitle>
              <CardDescription>
                Employee management, payroll processing, and leave tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Employee Records</li>
                <li>• Payroll Processing (SARS Compliant)</li>
                <li>• Leave Management</li>
                <li>• Payslip Generation</li>
                <li>• HR Dashboard</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
