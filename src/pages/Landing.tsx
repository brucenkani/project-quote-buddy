import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Calculator, Users, Settings, Home, Phone, Mail, MessageCircle, ArrowRight } from 'lucide-react';
import { CompanySelector } from '@/components/CompanySelector';
import { useCompany } from '@/contexts/CompanyContext';
import bruceProfile from '@/assets/bruce-profile.png';

export default function Landing() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { activeCompany } = useCompany();

  useEffect(() => {
    const checkAdminRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'owner')
          .maybeSingle();

        setIsAdmin(!!roleData);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session) {
        navigate('/auth');
      } else if (session && window.location.pathname === '/') {
        navigate('/dashboard');
      }
      if (session) {
        checkAdminRole();
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
      if (session) {
        checkAdminRole();
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl font-bold">BizManager</h1>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
              <Button onClick={() => navigate('/')} variant="ghost" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
              {isAdmin && (
                <Button onClick={() => navigate('/invite')} variant="ghost" size="sm" className="gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Your Users</span>
                </Button>
              )}
              <Button onClick={() => navigate('/landing-settings')} variant="ghost" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <span className="text-sm text-muted-foreground hidden md:inline">{user?.email}</span>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Welcome to BizManager</h2>
          <p className="text-lg sm:text-xl text-muted-foreground px-4">
            Complete business management solution for accounting and HR
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <CompanySelector />
        </div>

        {activeCompany && (
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground">
              Currently working on: <span className="font-semibold text-foreground">{activeCompany.name}</span>
            </p>
          </div>
        )}

        <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
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

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/crm-customer-support')}>
            <CardHeader>
              <Users className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>CRM & Customer Support</CardTitle>
              <CardDescription>
                Complete customer management & support system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Contact & lead management</li>
                <li>• Sales pipeline tracking</li>
                <li>• Ticket management system</li>
                <li>• Customer support tools</li>
                <li>• Performance reports</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Need an Accountant Section */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="bg-primary text-primary-foreground rounded-2xl px-8 py-6 text-center">
                    <h3 className="text-2xl font-bold">Need an Accountant?</h3>
                    <ArrowRight className="h-6 w-6 mx-auto mt-2" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Button variant="outline" className="gap-2" asChild>
                        <a href="tel:+27659672215">
                          <Phone className="h-4 w-4" />
                          Call
                        </a>
                      </Button>
                      <Button variant="outline" className="gap-2" asChild>
                        <a href="https://wa.me/27659672215" target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </a>
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">+27 65 967 2215</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <Button className="gap-2 mb-2" asChild>
                      <a href="mailto:bruce@nkani.co.za">
                        <Mail className="h-4 w-4" />
                        Email Us
                      </a>
                    </Button>
                    <p className="text-sm text-muted-foreground">bruce@nkani.co.za</p>
                  </div>
                  
                  <img 
                    src={bruceProfile} 
                    alt="Bruce - Professional Accountant" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
