import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navigation } from '@/components/Navigation';
import { DollarSign, ArrowLeft } from 'lucide-react';
import { loadInvoices, saveInvoice } from '@/utils/invoiceStorage';
import { Invoice } from '@/types/invoice';
import { useToast } from '@/hooks/use-toast';
import { recordPaymentReceived } from '@/utils/doubleEntryManager';
import { loadSettings } from '@/utils/settingsStorage';

export default function InvoicePayment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const settings = loadSettings();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'bank' as 'cash' | 'bank',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentReference: '',
  });

  useEffect(() => {
    if (id) {
      const invoices = loadInvoices();
      const found = invoices.find(inv => inv.id === id);
      if (found) {
        setInvoice(found);
        setPaymentData(prev => ({
          ...prev,
          paymentReference: `PAY-${found.invoiceNumber}`,
        }));
      }
    }
  }, [id]);

  const handleRecordPayment = () => {
    if (!invoice) return;

    if (!paymentData.paymentDate || !paymentData.paymentReference) {
      toast({ title: 'Please fill in all payment details', variant: 'destructive' });
      return;
    }

    try {
      // Create double-entry journal entry for payment
      recordPaymentReceived(
        invoice,
        paymentData.paymentMethod,
        paymentData.paymentDate,
        paymentData.paymentReference
      );

      // Update invoice status to paid
      const updatedInvoice: Invoice = {
        ...invoice,
        status: 'paid',
        updatedAt: new Date().toISOString(),
      };

      saveInvoice(updatedInvoice);

      toast({ title: 'Payment recorded successfully with journal entry' });
      navigate('/invoices');
    } catch (error) {
      toast({
        title: 'Payment recording failed',
        description: error instanceof Error ? error.message : 'Transaction not balanced',
        variant: 'destructive',
      });
    }
  };

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p>Invoice not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/invoices')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Record Payment for Invoice {invoice.invoiceNumber}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client:</span>
                  <span className="font-semibold">{invoice.projectDetails.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project:</span>
                  <span className="font-semibold">{invoice.projectDetails.projectName}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-muted-foreground">Amount Due:</span>
                  <span className="font-bold text-primary">
                    {settings.currencySymbol}{invoice.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={paymentData.paymentMethod}
                  onValueChange={(value: 'cash' | 'bank') =>
                    setPaymentData({ ...paymentData, paymentMethod: value })
                  }
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This will credit {paymentData.paymentMethod === 'cash' ? 'Cash' : 'Bank Account'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentData.paymentDate}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, paymentDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentReference">Payment Reference</Label>
                <Input
                  id="paymentReference"
                  value={paymentData.paymentReference}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, paymentReference: e.target.value })
                  }
                  placeholder="e.g., PAY-001, Transaction ID, etc."
                />
              </div>

              <div className="bg-accent/50 p-4 rounded-lg space-y-2">
                <p className="font-semibold text-sm">Double-Entry Journal Entry:</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Debit: {paymentData.paymentMethod === 'cash' ? 'Cash' : 'Bank Account'}</span>
                    <span>{settings.currencySymbol}{invoice.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credit: Accounts Receivable</span>
                    <span>{settings.currencySymbol}{invoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => navigate('/invoices')} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleRecordPayment} className="flex-1 gap-2">
                  <DollarSign className="h-4 w-4" />
                  Record Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
