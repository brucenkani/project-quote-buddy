import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { loadInvoices } from '@/utils/invoiceStorage';
import { useSettings } from '@/contexts/SettingsContext';
import { ArrowLeft, Printer, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Invoice } from '@/types/invoice';

export default function InvoicePreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const invoices = await loadInvoices();
      const found = invoices.find(inv => inv.id === id);
      if (found) setInvoice(found);
    };
    loadData();
  }, [id]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/invoices')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Invoices
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/invoices/${id}/print`)} className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={() => navigate(`/invoices/${id}/email`)} className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Button>
            <Button onClick={() => navigate(`/invoices/${id}`)}>
              Edit Invoice
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl mb-2">Tax Invoice</CardTitle>
                <p className="text-sm text-muted-foreground">Invoice #{invoice.invoiceNumber}</p>
              </div>
              <Badge className={invoice.status === 'paid' ? 'bg-green-500/10 text-green-700' : 'bg-orange-500/10 text-orange-700'}>
                {invoice.status === 'paid' ? 'Paid' : 'Unpaid'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Business Details */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">From:</h3>
                <p className="font-medium">{settings.companyName}</p>
                <p className="text-sm text-muted-foreground">{settings.address}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Bill To:</h3>
                <p className="font-medium">{invoice.projectDetails.clientName}</p>
                <p className="text-sm text-muted-foreground">{invoice.projectDetails.clientEmail}</p>
                <p className="text-sm text-muted-foreground">{invoice.projectDetails.clientPhone}</p>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-3 gap-4 py-4 border-y">
              <div>
                <p className="text-sm text-muted-foreground">Issue Date</p>
                <p className="font-medium">{new Date(invoice.issueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Project</p>
                <p className="font-medium">{invoice.projectDetails.projectName || '-'}</p>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Quantity</th>
                    <th className="text-right py-2">Rate</th>
                    <th className="text-right py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{item.description}</td>
                      <td className="text-right">{item.quantity}</td>
                      <td className="text-right">{settings.currencySymbol}{item.unitPrice.toFixed(2)}</td>
                      <td className="text-right">{settings.currencySymbol}{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{settings.currencySymbol}{invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount:</span>
                    <span>-{settings.currencySymbol}{invoice.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({invoice.taxRate}%):</span>
                  <span>{settings.currencySymbol}{invoice.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{settings.currencySymbol}{invoice.total.toFixed(2)}</span>
                </div>
                {invoice.status === 'unpaid' && (
                  <div className="flex justify-between font-bold text-primary">
                    <span>Amount Due:</span>
                    <span>{settings.currencySymbol}{invoice.total.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Notes:</h3>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </div>
            )}

            {/* Payment Terms */}
            {invoice.paymentTerms && (
              <div>
                <h3 className="font-semibold mb-2">Payment Terms:</h3>
                <p className="text-sm text-muted-foreground">{invoice.paymentTerms}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
