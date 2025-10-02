import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { loadInvoices } from '@/utils/invoiceStorage';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function InvoiceHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoice = loadInvoices().find(inv => inv.id === id);

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Invoice not found</p>
              <Button onClick={() => navigate('/invoices')} className="mt-4">
                Back to Invoices
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Mock history data - in a real app, this would be stored with the invoice
  const history = [
    {
      date: invoice.createdAt,
      action: 'Invoice created',
      user: 'System',
      details: `Invoice ${invoice.invoiceNumber} created`,
    },
    {
      date: invoice.updatedAt,
      action: 'Last updated',
      user: 'System',
      details: 'Invoice details modified',
    },
  ];

  if (invoice.status === 'paid') {
    history.push({
      date: invoice.updatedAt,
      action: 'Payment received',
      user: 'System',
      details: `Payment recorded for ${invoice.total}`,
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/invoices')} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Invoices
        </Button>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Invoice History</CardTitle>
                <p className="text-muted-foreground mt-1">Invoice #{invoice.invoiceNumber}</p>
              </div>
              <Badge className={invoice.status === 'paid' ? 'bg-green-500/10 text-green-700' : 'bg-orange-500/10 text-orange-700'}>
                {invoice.status === 'paid' ? 'Paid' : 'Unpaid'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                  <div className="flex-shrink-0 w-32 text-sm text-muted-foreground">
                    {new Date(entry.date).toLocaleString()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{entry.action}</p>
                    <p className="text-sm text-muted-foreground">{entry.details}</p>
                    <p className="text-xs text-muted-foreground mt-1">by {entry.user}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
