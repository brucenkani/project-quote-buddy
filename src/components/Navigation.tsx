import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { FileText, DollarSign, Package, BookOpen, Receipt, Settings, BarChart3, LayoutDashboard, ArrowLeft, Users, ShoppingCart, Building2, ChevronDown, Menu, X, UserPlus } from 'lucide-react';
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
    { path: '/quotes', label: 'Quotes', icon: FileText },
    { path: '/invoices', label: 'Invoices', icon: DollarSign },
    { path: '/invoices/recurring', label: 'Recurring Invoices', icon: FileText },
    { path: '/invoices/statements', label: 'Statements', icon: FileText },
  ];

  const supplierMenuItems = [
    { path: '/purchase-orders', label: 'Purchase Orders', icon: FileText },
    { path: '/purchases', label: 'Purchases', icon: ShoppingCart },
  ];

  const bankingMenuItems = [
    { path: '/bank-accounts', label: 'Bank Accounts', icon: Building2 },
    { path: '/expenses', label: 'Expenses', icon: Receipt },
  ];

  // Business type dependent menu visibility
  const showInventory = activeCompanySettings?.company_type !== 'professional-services';
  const showSuppliers = activeCompanySettings?.company_type !== 'professional-services';

  const isCustomerMenuActive = customerMenuItems.some(item => location.pathname.startsWith(item.path));
  const isSupplierMenuActive = supplierMenuItems.some(item => location.pathname.startsWith(item.path));
  const isBankingMenuActive = bankingMenuItems.some(item => location.pathname.startsWith(item.path));

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-1 md:gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
            <div className="flex items-center gap-2 md:gap-3">
              {activeCompanySettings?.logo_url && (
                <img src={activeCompanySettings.logo_url} alt="Logo" className="h-6 md:h-8 w-auto object-contain" />
              )}
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
                Accounting
              </h1>
            </div>
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

            {/* Suppliers Dropdown */}
            {showSuppliers && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={isSupplierMenuActive ? 'secondary' : 'ghost'} size="sm" className="gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    <span>Suppliers</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {supplierMenuItems.map((item) => {
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
            )}

            {/* Banking Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={isBankingMenuActive ? 'secondary' : 'ghost'} size="sm" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Banking</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {bankingMenuItems.map((item) => {
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
                <DropdownMenuItem asChild>
                  <Link to="/bank-feeds" className="flex items-center gap-2 cursor-pointer">
                    <Building2 className="h-4 w-4" />
                    Bank Feeds
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Inventory Link */}
            {showInventory && (
              <Button variant={location.pathname === '/inventory' ? 'secondary' : 'ghost'} size="sm" asChild>
                <Link to="/inventory" className="gap-2">
                  <Package className="h-4 w-4" />
                  <span>Inventory</span>
                </Link>
              </Button>
            )}

            {/* Journal Link */}
            <Button variant={location.pathname === '/journal' ? 'secondary' : 'ghost'} size="sm" asChild>
              <Link to="/journal" className="gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Journals</span>
              </Link>
            </Button>

            {/* Reports Link */}
            <Button variant={location.pathname === '/reports' ? 'secondary' : 'ghost'} size="sm" asChild>
              <Link to="/reports" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>Reports</span>
              </Link>
            </Button>

            {/* Your Users Link - Admin Only */}
            {isAdmin && (
              <Button variant={location.pathname === '/invite' ? 'secondary' : 'ghost'} size="sm" asChild>
                <Link to="/invite" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Your Users</span>
                </Link>
              </Button>
            )}

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

                {showSuppliers && (
                  <div className="space-y-2">
                    <div className="px-3 py-2 text-sm font-semibold text-muted-foreground">Suppliers</div>
                    {supplierMenuItems.map((item) => {
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
                )}

                {showInventory && (
                  <Button
                    variant={location.pathname === '/inventory' ? 'default' : 'ghost'}
                    asChild
                    className="justify-start gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link to="/inventory">
                      <Package className="h-4 w-4" />
                      Inventory
                    </Link>
                  </Button>
                )}

                <div className="space-y-2">
                  <div className="px-3 py-2 text-sm font-semibold text-muted-foreground">Banking</div>
                  {bankingMenuItems.map((item) => {
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
                  <Button
                    variant={location.pathname === '/bank-feeds' ? 'secondary' : 'ghost'}
                    asChild
                    className="justify-start gap-2 w-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link to="/bank-feeds">
                      <Building2 className="h-4 w-4" />
                      Bank Feeds
                    </Link>
                  </Button>
                </div>

                <Button
                  variant={location.pathname === '/journal' ? 'default' : 'ghost'}
                  asChild
                  className="justify-start gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link to="/journal">
                    <BookOpen className="h-4 w-4" />
                    Journals
                  </Link>
                </Button>

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

                {/* Your Users - Admin Only */}
                {isAdmin && (
                  <Button
                    variant={location.pathname === '/invite' ? 'default' : 'ghost'}
                    asChild
                    className="justify-start gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link to="/invite">
                      <UserPlus className="h-4 w-4" />
                      Your Users
                    </Link>
                  </Button>
                )}

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
