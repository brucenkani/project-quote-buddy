import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Navigation } from '@/components/Navigation';
import { loadInvoices } from '@/utils/invoiceStorage';
import { saveRecurringInvoice, calculateNextGenerationDate } from '@/utils/recurringInvoiceStorage';
import { RecurringInvoice, Invoice } from '@/types/invoice';
import { useToast } from '@/hooks/use-toast';

export default function RecurringInvoiceBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const templateId = searchParams.get('templateId');
  
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [formData, setFormData] = useState({
    frequency: 'monthly' as RecurringInvoice['frequency'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true,
  });

  useEffect(() => {
    const load = async () => {
      const allInvoices = (await loadInvoices()).filter(inv => inv.type === 'invoice');
      setInvoices(allInvoices);
      
      if (templateId) {
        const template = allInvoices.find(inv => inv.id === templateId);
        if (template) {
          setSelectedInvoice(template);
        }
      }
    };
    load();
  }, [templateId]);

  const handleSubmit = () => {
    if (!selectedInvoice) {
      toast({ title: 'Please select an invoice template', variant: 'destructive' });
      return;
    }

    const { id, invoiceNumber, createdAt, updatedAt, payments, creditNotes, ...template } = selectedInvoice;
    
    const recurring: RecurringInvoice = {
      id: crypto.randomUUID(),
      invoiceTemplate: template,
      frequency: formData.frequency,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      nextGenerationDate: calculateNextGenerationDate(formData.startDate, formData.frequency),
      isActive: formData.isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveRecurringInvoice(recurring);
    toast({ title: 'Recurring invoice created successfully' });
    navigate('/invoices/recurring');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Create Recurring Invoice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="template">Invoice Template *</Label>
              <Select
                value={selectedInvoice?.id || ''}
                onValueChange={(value) => {
                  const invoice = invoices.find(inv => inv.id === value);
                  setSelectedInvoice(invoice || null);
                }}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder="Select an invoice as template" />
                </SelectTrigger>
                <SelectContent>
                  {invoices.map((invoice) => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNumber} - {invoice.projectDetails.clientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency *</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: RecurringInvoice['frequency']) =>
                  setFormData({ ...formData, frequency: value })
                }
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="active">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Start generating invoices automatically
                </p>
              </div>
              <Switch
                id="active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate('/invoices/recurring')}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Create Recurring Invoice</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
