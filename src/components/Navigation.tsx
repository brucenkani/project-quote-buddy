import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileText, DollarSign, Package, BookOpen, Receipt, Settings, BarChart3 } from 'lucide-react';
import { loadSettings } from '@/utils/settingsStorage';

export const Navigation = () => {
  const location = useLocation();
  const settings = loadSettings();
  
  const navItems = [
    { path: '/', label: 'Quotes', icon: FileText },
    { path: '/invoices', label: 'Invoices', icon: DollarSign },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/journal', label: 'Journal', icon: BookOpen },
    { path: '/expenses', label: 'Expenses', icon: Receipt },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {settings.logoUrl && (
              <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
            )}
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              {settings.companyName}
            </h1>
          </div>
          
          <nav className="flex gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Button
                  key={item.path}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  asChild
                  className="gap-2"
                >
                  <Link to={item.path}>
                    <Icon className="h-4 w-4" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};
