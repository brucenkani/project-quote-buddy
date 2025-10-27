import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Navigation } from '@/components/Navigation';
import { Plus, X, Save, FileText } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { saveInvoice } from '@/utils/invoiceStorage';
import { Invoice } from '@/types/invoice';
import { useToast } from '@/hooks/use-toast';
import { ContactSelector } from '@/components/ContactSelector';
import { Contact } from '@/types/contacts';
import { recordInvoice } from '@/utils/doubleEntryManager';
import { generateNextInvoiceNumber, loadInvoices } from '@/utils/invoiceStorage';

const invoiceFormSchema = z.object({
  invoiceNumber: z.string(),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().optional(),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  issueDate: z.string(),
  dueDate: z.string(),
  paymentTerms: z.string(),
  notes: z.string().optional(),
});

export default function InvoiceBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useSettings();
  const { id } = useParams();
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Generate invoice number on mount
  useEffect(() => {
    if (!id) {
      generateNextInvoiceNumber().then(num => setInvoiceNumber(num));
    }
  }, [id]);

  const form = useForm<z.infer<typeof invoiceFormSchema>>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: invoiceNumber,
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      clientAddress: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentTerms: 'Net 30',
      notes: '',
    },
  });

  const [lineItems, setLineItems] = useState([
    { description: '', quantity: 1, unit: 'item', unitPrice: 0, total: 0 },
  ]);
  const [lineItemErrors, setLineItemErrors] = useState<string[]>([]);

  const [discount, setDiscount] = useState(0);
  const [existingInvoice, setExistingInvoice] = useState<Invoice | null>(null);

  // Load existing invoice when editing
  useEffect(() => {
    const loadInvoice = async () => {
      if (id) {
        const invoices = await loadInvoices();
        const invoice = invoices.find(inv => inv.id === id);
      
      if (invoice) {
        setExistingInvoice(invoice);
        form.reset({
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.projectDetails.clientName,
          clientEmail: invoice.projectDetails.clientEmail || '',
          clientPhone: invoice.projectDetails.clientPhone || '',
          clientAddress: invoice.projectDetails.projectAddress || '',
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          paymentTerms: invoice.paymentTerms,
          notes: invoice.notes || '',
        });
        
        setLineItems(invoice.lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          total: item.total,
        })));
        
        setDiscount(invoice.discount);
      } else {
        toast({ 
          title: 'Invoice not found', 
          variant: 'destructive' 
        });
          navigate('/invoices');
        }
      }
    };
    loadInvoice();
  }, [id, navigate, toast, form]);

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit: 'item', unitPrice: 0, total: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].total = updated[index].quantity * updated[index].unitPrice;
    }
    setLineItems(updated);
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = (subtotal - discount) * settings.taxRate;
  const total = subtotal - discount + taxAmount;

  const handleSave = form.handleSubmit((data) => {
    // Validate line items
    const errors = lineItems.map(item => item.description ? '' : 'Description is required');
    setLineItemErrors(errors);
    
    if (errors.some(error => error !== '')) {
      toast({ 
        title: 'Validation Error', 
        description: 'Please fill in all line item descriptions',
        variant: 'destructive' 
      });
      return;
    }

    const invoice: Invoice = {
      id: id || crypto.randomUUID(),
      invoiceNumber: data.invoiceNumber,
      type: existingInvoice?.type || 'invoice',
      projectDetails: {
        clientName: data.clientName,
        clientEmail: data.clientEmail || '',
        clientPhone: data.clientPhone || '',
        projectName: '',
        projectAddress: data.clientAddress || '',
      },
      lineItems: lineItems.map((item) => ({
        id: crypto.randomUUID(),
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        taxRate: settings.taxRate,
        amount: item.total / (1 + settings.taxRate / 100),
        total: item.total,
      })),
      subtotal,
      taxRate: settings.taxRate,
      taxAmount,
      discount,
      total,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      status: existingInvoice?.status || 'unpaid',
      paymentTerms: data.paymentTerms,
      notes: data.notes || '',
      payments: existingInvoice?.payments || [],
      creditNotes: existingInvoice?.creditNotes || [],
      createdAt: existingInvoice?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveInvoice(invoice);
    
    if (!id && invoice.status === 'unpaid') {
      try {
        recordInvoice(invoice);
        toast({ title: 'Invoice and journal entry created successfully' });
      } catch (error) {
        toast({ 
          title: 'Warning: Invoice saved but journal entry failed', 
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive' 
        });
      }
    } else {
      toast({ title: 'Invoice saved successfully' });
    }
    
    navigate('/invoices');
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              {id ? (existingInvoice?.type === 'credit-note' ? 'Edit Credit Note' : 'Edit Invoice') : 'New Invoice'}
            </h1>
            <p className="text-muted-foreground">
              {existingInvoice?.type === 'credit-note' ? 'Edit credit note details' : 'Create a professional invoice for your client'}
            </p>
          </div>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Invoice
          </Button>
        </div>

        <Form {...form}>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Number</FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="bg-muted" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                          <SelectItem value="Net 15">Net 15</SelectItem>
                          <SelectItem value="Net 30">Net 30</SelectItem>
                          <SelectItem value="Net 60">Net 60</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name *</FormLabel>
                        <FormControl>
                          <ContactSelector
                            type="client"
                            value={field.value}
                            onSelect={(contact: Contact) => {
                              form.setValue('clientName', contact.name);
                              form.setValue('clientEmail', contact.email);
                              form.setValue('clientPhone', contact.phone);
                              form.setValue('clientAddress', contact.address);
                            }}
                            placeholder="Select or add client"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientAddress"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Line Items</CardTitle>
                <Button variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Label className="text-xs">Description *</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => {
                        updateLineItem(index, 'description', e.target.value);
                        setLineItemErrors(prev => {
                          const newErrors = [...prev];
                          newErrors[index] = '';
                          return newErrors;
                        });
                      }}
                      placeholder="Item description"
                      className={lineItemErrors[index] ? 'border-destructive' : ''}
                    />
                    {lineItemErrors[index] && (
                      <p className="text-sm text-destructive mt-1">{lineItemErrors[index]}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Label className="text-xs">Unit</Label>
                    <Input
                      value={item.unit}
                      onChange={(e) => updateLineItem(index, 'unit', e.target.value)}
                      placeholder="item"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Unit Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Total</Label>
                    <Input
                      value={settings.currencySymbol + item.total.toFixed(2)}
                      disabled
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{settings.currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Discount:</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-32 h-8"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax ({(settings.taxRate * 100).toFixed(1)}%):</span>
                  <span className="font-semibold">{settings.currencySymbol}{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-primary">{settings.currencySymbol}{total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Any additional notes or payment instructions..."
                          rows={4}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => navigate('/invoices')}>Cancel</Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save Invoice
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
