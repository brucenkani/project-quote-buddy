import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Eye, Trash2 } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { loadInvoices, deleteInvoice } from '@/utils/invoiceStorage';
import { Invoice } from '@/types/invoice';
import { useToast } from '@/hooks/use-toast';
import { loadSettings } from '@/utils/settingsStorage';

export default function Invoices() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const settings = loadSettings();
  const [invoices, setInvoices] = useState<Invoice[]>(loadInvoices());

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoice(id);
      setInvoices(loadInvoices());
      toast({ title: 'Invoice deleted successfully' });
    }
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'sent': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'overdue': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'cancelled': return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
      default: return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              Invoices
            </h1>
            <p className="text-muted-foreground">Manage and track your invoices</p>
          </div>
          <Button onClick={() => navigate('/invoices/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>

        {invoices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
              <p className="text-muted-foreground mb-4">Create your first invoice to get started</p>
              <Button onClick={() => navigate('/invoices/new')}>Create Invoice</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="shadow-[var(--shadow-elegant)] border-border/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">Invoice #{invoice.invoiceNumber}</CardTitle>
                        <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p><strong>Client:</strong> {invoice.projectDetails.clientName}</p>
                        <p><strong>Project:</strong> {invoice.projectDetails.projectName}</p>
                        <p><strong>Issue Date:</strong> {new Date(invoice.issueDate).toLocaleDateString()}</p>
                        <p><strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {settings.currencySymbol}{invoice.total.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">{invoice.lineItems.length} items</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex gap-2 border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(invoice.id)}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
