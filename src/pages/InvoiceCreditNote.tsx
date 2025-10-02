import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Navigation } from '@/components/Navigation';
import { loadInvoices, saveInvoice } from '@/utils/invoiceStorage';
import { loadSettings } from '@/utils/settingsStorage';
import { useToast } from '@/hooks/use-toast';
import { Invoice } from '@/types/invoice';

export default function InvoiceCreditNote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const settings = loadSettings();
  const invoice = loadInvoices().find(inv => inv.id === id);
  
  const [creditNoteReason, setCreditNoteReason] = useState('');
  const [creditAmount, setCreditAmount] = useState(invoice?.total || 0);

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

  const handleCreateCreditNote = () => {
    if (!creditNoteReason.trim() || creditAmount <= 0) {
      toast({ title: 'Please provide a reason and valid amount', variant: 'destructive' });
      return;
    }

    const creditNoteId = `CN-${Date.now()}`;
    
    const creditNote: Invoice = {
      ...invoice,
      id: creditNoteId,
      invoiceNumber: `CN-${invoice.invoiceNumber}`,
      type: 'credit-note',
      total: -Math.abs(creditAmount),
      subtotal: -Math.abs(creditAmount / (1 + invoice.taxRate)),
      taxAmount: -Math.abs((creditAmount / (1 + invoice.taxRate)) * invoice.taxRate),
      notes: `Credit Note for Invoice ${invoice.invoiceNumber}\nReason: ${creditNoteReason}`,
      issueDate: new Date().toISOString().split('T')[0],
      payments: [],
      creditNotes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'paid', // Credit notes are always marked as paid
    };

    // Link credit note to original invoice
    const updatedInvoice = {
      ...invoice,
      creditNotes: [...(invoice.creditNotes || []), creditNoteId],
      updatedAt: new Date().toISOString(),
    };

    // Save both invoices
    saveInvoice(creditNote);
    saveInvoice(updatedInvoice);
    
    toast({ title: 'Credit Note created successfully' });
    navigate('/invoices');
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
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{invoice.status}</p>
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
              />
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
