import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileText, DollarSign, Package, BookOpen, Receipt, Settings, BarChart3, LayoutDashboard, ArrowLeft, Users, ShoppingCart, Building2, ChevronDown } from 'lucide-react';
import { loadSettings } from '@/utils/settingsStorage';
import { supabase } from '@/integrations/supabase/client';

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const settings = loadSettings();
  
  const customerMenuItems = [
    { path: '/quotes', label: 'Quotes', icon: FileText },
    { path: '/invoices', label: 'Invoices', icon: DollarSign },
    { path: '/invoices/recurring', label: 'Recurring Invoices', icon: FileText },
    { path: '/invoices/statements', label: 'Statements', icon: FileText },
  ];

  const bankingMenuItems = [
    { path: '/expenses', label: 'Expenses', icon: Receipt },
  ];

  const isCustomerMenuActive = customerMenuItems.some(item => location.pathname.startsWith(item.path));
  const isBankingMenuActive = bankingMenuItems.some(item => location.pathname.startsWith(item.path));

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/landing')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              {settings.logoUrl && (
                <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
              )}
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
                Accounting
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <nav className="flex gap-2">
              <Button
                variant={location.pathname === '/accounting' ? 'default' : 'ghost'}
                size="sm"
                asChild
                className="gap-2"
              >
                <Link to="/accounting">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden md:inline">Dashboard</span>
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isCustomerMenuActive ? 'default' : 'ghost'}
                    size="sm"
                    className="gap-1"
                  >
                    <Users className="h-4 w-4" />
                    <span className="hidden md:inline">Customers</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span className="hidden md:inline">Suppliers</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem disabled>
                    <FileText className="h-4 w-4 mr-2" />
                    Purchase Orders (Coming Soon)
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Receipt className="h-4 w-4 mr-2" />
                    Purchases (Coming Soon)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant={location.pathname === '/inventory' ? 'default' : 'ghost'}
                size="sm"
                asChild
                className="gap-2"
              >
                <Link to="/inventory">
                  <Package className="h-4 w-4" />
                  <span className="hidden md:inline">Inventory</span>
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isBankingMenuActive ? 'default' : 'ghost'}
                    size="sm"
                    className="gap-1"
                  >
                    <Building2 className="h-4 w-4" />
                    <span className="hidden md:inline">Banking</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
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
                  <DropdownMenuItem disabled>
                    <Building2 className="h-4 w-4 mr-2" />
                    Bank Feeds (Coming Soon)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant={location.pathname === '/journal' ? 'default' : 'ghost'}
                size="sm"
                asChild
                className="gap-2"
              >
                <Link to="/journal">
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden md:inline">Journals</span>
                </Link>
              </Button>

              <Button
                variant={location.pathname === '/reports' ? 'default' : 'ghost'}
                size="sm"
                asChild
                className="gap-2"
              >
                <Link to="/reports">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden md:inline">Reports</span>
                </Link>
              </Button>

              <Button
                variant={location.pathname === '/settings' ? 'default' : 'ghost'}
                size="sm"
                asChild
                className="gap-2"
              >
                <Link to="/settings">
                  <Settings className="h-4 w-4" />
                  <span className="hidden md:inline">Settings</span>
                </Link>
              </Button>
            </nav>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
