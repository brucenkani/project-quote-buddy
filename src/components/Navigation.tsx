import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { FileText, DollarSign, Package, BookOpen, Receipt, Settings, BarChart3, LayoutDashboard, ArrowLeft, Users, ShoppingCart, Building2, ChevronDown, Menu, X, UserPlus, ArrowLeftRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeCompanySettings } = useCompany();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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

    checkAdminRole();
  }, []);
  
  const customerMenuItems = [
    { path: '/invoices', label: 'Invoices', icon: DollarSign },
    { path: '/invoices/recurring', label: 'Recurring Invoices', icon: FileText },
    { path: '/invoices/statements', label: 'Statements', icon: FileText },
  ];

  const suppliersInventoryMenuItems = [
    { path: '/purchase-orders', label: 'Purchase Orders', icon: FileText },
    { path: '/purchases', label: 'Purchases', icon: ShoppingCart },
    { path: '/inventory', label: 'Inventory', icon: Package },
  ];

  const transactionsMenuItems = [
    { path: '/bank-accounts', label: 'Bank Accounts', icon: Building2 },
    { path: '/expenses', label: 'Expenses', icon: Receipt },
    { path: '/bank-feeds', label: 'Bank Feeds', icon: Building2 },
    { path: '/journal', label: 'Journals', icon: BookOpen },
  ];

  const isCustomerMenuActive = customerMenuItems.some(item => location.pathname.startsWith(item.path));
  const isSuppliersInventoryMenuActive = suppliersInventoryMenuItems.some(item => location.pathname.startsWith(item.path));
  const isTransactionsMenuActive = transactionsMenuItems.some(item => location.pathname.startsWith(item.path));

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 md:gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(location.pathname === '/accounting' ? '/dashboard' : '/accounting')} 
              className="gap-1 md:gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">
                {location.pathname === '/accounting' ? 'Home' : 'Dashboard'}
              </span>
            </Button>
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              Accounting
            </h1>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {/* Customers Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={isCustomerMenuActive ? 'secondary' : 'ghost'} size="sm" className="gap-2">
                  <Users className="h-4 w-4" />
                  <span>Customers</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {customerMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link to={item.path} className="flex items-center gap-2 cursor-pointer">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Suppliers & Inventory Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={isSuppliersInventoryMenuActive ? 'secondary' : 'ghost'} size="sm" className="gap-2">
                  <Package className="h-4 w-4" />
                  <span>Suppliers & Inventory</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {suppliersInventoryMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link to={item.path} className="flex items-center gap-2 cursor-pointer">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Transactions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={isTransactionsMenuActive ? 'secondary' : 'ghost'} size="sm" className="gap-2">
                  <ArrowLeftRight className="h-4 w-4" />
                  <span>Transactions</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {transactionsMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link to={item.path} className="flex items-center gap-2 cursor-pointer">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Reports Link */}
            <Button variant={location.pathname === '/reports' ? 'secondary' : 'ghost'} size="sm" asChild>
              <Link to="/reports" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>Reports</span>
              </Link>
            </Button>


            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <nav className="flex flex-col gap-4 mt-8">
                <Button
                  variant={location.pathname === '/accounting' ? 'default' : 'ghost'}
                  asChild
                  className="justify-start gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link to="/accounting">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>

                <div className="space-y-2">
                  <div className="px-3 py-2 text-sm font-semibold text-muted-foreground">Customers</div>
                  {customerMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.path}
                        variant={location.pathname.startsWith(item.path) ? 'secondary' : 'ghost'}
                        asChild
                        className="justify-start gap-2 w-full"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link to={item.path}>
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </Button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <div className="px-3 py-2 text-sm font-semibold text-muted-foreground">Suppliers & Inventory</div>
                  {suppliersInventoryMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.path}
                        variant={location.pathname.startsWith(item.path) ? 'secondary' : 'ghost'}
                        asChild
                        className="justify-start gap-2 w-full"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link to={item.path}>
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </Button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <div className="px-3 py-2 text-sm font-semibold text-muted-foreground">Transactions</div>
                  {transactionsMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.path}
                        variant={location.pathname.startsWith(item.path) ? 'secondary' : 'ghost'}
                        asChild
                        className="justify-start gap-2 w-full"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link to={item.path}>
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant={location.pathname === '/reports' ? 'default' : 'ghost'}
                  asChild
                  className="justify-start gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link to="/reports">
                    <BarChart3 className="h-4 w-4" />
                    Reports
                  </Link>
                </Button>


                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Sign Out
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};
