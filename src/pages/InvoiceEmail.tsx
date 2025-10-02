import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Navigation } from '@/components/Navigation';
import { loadInvoices } from '@/utils/invoiceStorage';
import { loadSettings } from '@/utils/settingsStorage';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send } from 'lucide-react';

export default function InvoiceEmail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const settings = loadSettings();
  const invoice = loadInvoices().find(inv => inv.id === id);

  const [emailData, setEmailData] = useState({
    to: invoice?.projectDetails.clientEmail || '',
    subject: `Invoice ${invoice?.invoiceNumber} from ${settings.companyName}`,
    message: `Dear ${invoice?.projectDetails.clientName},\n\nPlease find attached invoice ${invoice?.invoiceNumber}.\n\nTotal Amount: ${settings.currencySymbol}${invoice?.total.toFixed(2)}\nDue Date: ${invoice ? new Date(invoice.dueDate).toLocaleDateString() : ''}\n\nThank you for your business.\n\nBest regards,\n${settings.companyName}`,
  });

  const handleSend = () => {
    // In a real application, this would send the email via an API
    toast({
      title: 'Email sent successfully',
      description: `Invoice emailed to ${emailData.to}`,
    });
    navigate('/invoices');
  };

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
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate('/invoices')} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Invoices
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Email Invoice #{invoice.invoiceNumber}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="email"
                value={emailData.to}
                onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                rows={10}
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
              />
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Attachment:</strong> Invoice-{invoice.invoiceNumber}.pdf
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Amount:</strong> {settings.currencySymbol}{invoice.total.toFixed(2)}
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => navigate('/invoices')}>
                Cancel
              </Button>
              <Button onClick={handleSend} className="gap-2">
                <Send className="h-4 w-4" />
                Send Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
