import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '@/contexts/CompanyContext';
import { 
  LayoutDashboard, FileText, Receipt, CreditCard, ShoppingCart, 
  DollarSign, Upload, Wallet, Send, TrendingUp, Scale, 
  FileCheck, Settings, Landmark
} from 'lucide-react';

export default function AccountingDashboard() {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();

  const shortcuts = [
    {
      title: 'Create an Invoice',
      description: 'Sell items or services to your customer.',
      icon: FileText,
      path: '/invoices/new',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100'
    },
    {
      title: 'Customer Receipts',
      description: 'Receive money from your customer.',
      icon: Receipt,
      path: '/invoices',
      iconColor: 'text-cyan-600',
      iconBg: 'bg-cyan-100'
    },
    {
      title: 'Create a Credit Note',
      description: 'Credit your customer for goods returned.',
      icon: CreditCard,
      path: '/invoices/credit-note',
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100'
    },
    {
      title: 'Create a Supplier Invoice',
      description: 'Purchase items from a supplier.',
      icon: ShoppingCart,
      path: '/purchases',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100'
    },
    {
      title: 'Supplier Payments',
      description: 'Pay your supplier.',
      icon: DollarSign,
      path: '/purchases',
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100'
    },
    {
      title: 'Import Bank Statements',
      description: 'Import and view bank statement transactions.',
      icon: Upload,
      path: '/bank-feeds',
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-100'
    },
    {
      title: 'Record Expenses',
      description: 'Manually capture expenses into your bank.',
      icon: Wallet,
      path: '/expenses',
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-100'
    },
    {
      title: 'View Bank Transactions',
      description: 'View payments, receipts and bank transfers.',
      icon: Landmark,
      path: '/bank-accounts',
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-100'
    },
    {
      title: 'Send Customer Statements',
      description: 'Email (or print) statements to all your customers.',
      icon: Send,
      path: '/invoices/statements',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100'
    },
    {
      title: 'Reports',
      description: 'View Profit and Loss, Balance Sheet, VAT returns and more.',
      icon: FileCheck,
      path: '/reports',
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-100'
    },
    {
      title: 'Accounting Settings',
      description: 'Manage branding, financial years, VAT and so on.',
      icon: Settings,
      path: '/landing-settings',
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            {activeCompany?.name || 'Company'} Workspace
          </h1>
          <p className="text-lg text-muted-foreground">What do you need to do today?</p>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {shortcuts.map((shortcut) => (
            <Card 
              key={shortcut.path}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(shortcut.path)}
            >
              <CardHeader className="space-y-4">
                <div className={`w-16 h-16 rounded-lg ${shortcut.iconBg} flex items-center justify-center mx-auto`}>
                  <shortcut.icon className={`h-8 w-8 ${shortcut.iconColor}`} />
                </div>
                <CardTitle className="text-center text-base">{shortcut.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-sm">
                  {shortcut.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
