import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Navigation } from '@/components/Navigation';
import { loadInvoices, saveInvoice } from '@/utils/invoiceStorage';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import { Invoice } from '@/types/invoice';

export default function InvoiceCreditNote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useSettings();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  
  useEffect(() => {
    if (id) {
      loadInvoices().then(invoices => {
        const found = invoices.find(inv => inv.id === id);
        setInvoice(found || null);
      });
    }
  }, [id]);
  
  const [creditNoteReason, setCreditNoteReason] = useState('');
  const [creditAmount, setCreditAmount] = useState(0);
  const [amountDue, setAmountDue] = useState(0);

  // Calculate amount due when invoice loads
  useEffect(() => {
    if (invoice) {
      const paid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const creditNotes = invoice.creditNotes?.length || 0;
      const due = invoice.total - paid;
      setAmountDue(due);
      setCreditAmount(due); // Default to full amount due
    }
  }, [invoice]);

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Invoice not found</p>
          <Button onClick={() => navigate('/invoices')} className="mt-4">
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  const handleCreateCreditNote = async () => {
    if (!creditNoteReason.trim() || creditAmount <= 0) {
      toast({ title: 'Please provide a reason and valid amount', variant: 'destructive' });
      return;
    }

    try {
      const creditNoteId = crypto.randomUUID();
      // Credit amount is VAT exclusive
      const creditSubtotal = Math.abs(creditAmount);
      const creditTax = Math.abs(creditSubtotal * (invoice.taxRate / 100));
      const creditTotal = creditSubtotal + creditTax;
      
      const creditNote: Invoice = {
        ...invoice,
        id: creditNoteId,
        invoiceNumber: `CN-${invoice.invoiceNumber}`,
        type: 'credit-note',
        total: -creditTotal,
        subtotal: -creditSubtotal,
        taxAmount: -creditTax,
        notes: `Credit Note for Invoice ${invoice.invoiceNumber}\nReason: ${creditNoteReason}`,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0], // Same as issue date for credit notes
        payments: [],
        creditNotes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'paid', // Credit notes are always marked as paid
        lineItems: invoice.lineItems.map(item => ({
          ...item,
          id: crypto.randomUUID(),
          quantity: -Math.abs(item.quantity * (creditSubtotal / invoice.subtotal)),
          amount: -Math.abs(item.amount * (creditSubtotal / invoice.subtotal)),
          total: -Math.abs(item.total * (creditSubtotal / invoice.subtotal)),
        })),
      };

      // Save credit note only - linking happens automatically via invoice number pattern
      await saveInvoice(creditNote);
      
      toast({ title: 'Credit Note created successfully' });
      navigate('/invoices');
    } catch (error) {
      console.error('Failed to create credit note:', error);
      toast({ title: 'Failed to create credit note', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Create Credit Note</CardTitle>
            <p className="text-sm text-muted-foreground">
              Creating credit note for Invoice {invoice.invoiceNumber}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Original Invoice</p>
                <p className="font-medium">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Original Amount</p>
                <p className="font-medium">{settings.currencySymbol}{invoice.total.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{invoice.projectDetails.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount Due</p>
                <p className="font-medium text-primary">{settings.currencySymbol}{amountDue.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="creditAmount">Credit Amount</Label>
              <Input
                id="creditAmount"
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(parseFloat(e.target.value) || 0)}
                step="0.01"
                max={amountDue}
              />
              <p className="text-xs text-muted-foreground">
                Maximum credit: {settings.currencySymbol}{amountDue.toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Credit Note</Label>
              <Textarea
                id="reason"
                value={creditNoteReason}
                onChange={(e) => setCreditNoteReason(e.target.value)}
                placeholder="Enter the reason for issuing this credit note..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate('/invoices')}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCreditNote}
                disabled={!creditNoteReason.trim() || creditAmount <= 0}
              >
                Create Credit Note
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
