import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { FileText, DollarSign, Package, BookOpen, Receipt, Settings, BarChart3, LayoutDashboard, ArrowLeft, Users, ShoppingCart, Building2, ChevronDown, Menu, X } from 'lucide-react';
import { loadSettings } from '@/utils/settingsStorage';
import { supabase } from '@/integrations/supabase/client';
import { CompanySelector } from './CompanySelector';

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const settings = loadSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
  const showInventory = settings.companyType !== 'professional-services';
  const showSuppliers = settings.companyType !== 'professional-services';

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
            <Button variant="ghost" size="sm" onClick={() => navigate('/landing')} className="gap-1 md:gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex items-center gap-2 md:gap-3">
              {settings.logoUrl && (
                <img src={settings.logoUrl} alt="Logo" className="h-6 md:h-8 w-auto object-contain" />
              )}
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
                Accounting
              </h1>
            </div>
            <CompanySelector />
          </div>
          
          {/* Desktop Navigation - Consolidated Menu */}
          <div className="hidden md:flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Menu className="h-4 w-4" />
                  <span>Menu</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/accounting" className="flex items-center gap-2 cursor-pointer">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Customers</div>
                {customerMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link to={item.path} className="flex items-center gap-2 cursor-pointer pl-6">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}

                {showSuppliers && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Suppliers</div>
                    {supplierMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <DropdownMenuItem key={item.path} asChild>
                          <Link to={item.path} className="flex items-center gap-2 cursor-pointer pl-6">
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </>
                )}

                {showInventory && (
                  <DropdownMenuItem asChild>
                    <Link to="/inventory" className="flex items-center gap-2 cursor-pointer">
                      <Package className="h-4 w-4" />
                      Inventory
                    </Link>
                  </DropdownMenuItem>
                )}

                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Banking</div>
                {bankingMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link to={item.path} className="flex items-center gap-2 cursor-pointer pl-6">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuItem asChild>
                  <Link to="/bank-feeds" className="flex items-center gap-2 cursor-pointer pl-6">
                    <Building2 className="h-4 w-4" />
                    Bank Feeds
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link to="/journal" className="flex items-center gap-2 cursor-pointer">
                    <BookOpen className="h-4 w-4" />
                    Journals
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link to="/reports" className="flex items-center gap-2 cursor-pointer">
                    <BarChart3 className="h-4 w-4" />
                    Reports
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

                <Button
                  variant={location.pathname === '/settings' ? 'default' : 'ghost'}
                  asChild
                  className="justify-start gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link to="/settings">
                    <Settings className="h-4 w-4" />
                    Settings
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
