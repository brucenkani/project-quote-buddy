import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Calendar } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { loadInvoices, deleteInvoice } from '@/utils/invoiceStorage';
import { Invoice } from '@/types/invoice';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsContext';
import { calculateAmountDue } from '@/utils/invoiceStatusCalculator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

export default function Invoices() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useSettings();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState<'invoices' | 'credit-notes' | 'statements'>('invoices');

  useEffect(() => {
    const loadData = async () => {
      const loadedInvoices = await loadInvoices();
      console.log('Loaded invoices:', loadedInvoices);
      setInvoices(loadedInvoices);
    };
    loadData();
  }, [activeTab]); // Reload when tab changes

  const handleDelete = async (id: string, isCreditNote: boolean = false) => {
    const message = isCreditNote 
      ? 'Are you sure you want to delete this credit note? This will remove it from the original invoice.'
      : 'Are you sure you want to delete this invoice?';
    
    if (confirm(message)) {
      if (isCreditNote) {
        // Find the credit note to get its parent invoice number
        const creditNote = invoices.find(inv => inv.id === id);
        if (creditNote) {
          // Find and update the parent invoice to remove this credit note reference
          const parentInvoiceNumber = creditNote.invoiceNumber.replace('CN-', '');
          const parentInvoice = invoices.find(inv => 
            inv.invoiceNumber === parentInvoiceNumber && inv.type === 'invoice'
          );
          
          if (parentInvoice && parentInvoice.creditNotes) {
            const updatedParentInvoice = {
              ...parentInvoice,
              creditNotes: parentInvoice.creditNotes.filter(cnId => cnId !== id)
            };
            // Save the updated parent invoice first
            const { saveInvoice } = require('@/utils/invoiceStorage');
            await saveInvoice(updatedParentInvoice);
          }
        }
      }
      
      await deleteInvoice(id);
      const updated = await loadInvoices();
      setInvoices(updated);
      toast({ 
        title: isCreditNote ? 'Credit note deleted successfully' : 'Invoice deleted successfully' 
      });
    }
  };

  const handleCopyInvoice = (invoice: Invoice) => {
    navigate('/invoices/new', { state: { copyFrom: invoice } });
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'partly-paid':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'overdue':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default:
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
    }
  };

  const getStatusLabel = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'partly-paid':
        return 'Partly Paid';
      case 'overdue':
        return 'Overdue';
      default:
        return 'Unpaid';
    }
  };

  const displayInvoices = invoices.filter(inv => {
    if (activeTab === 'statements') return false; // Don't show invoices in statements tab
    const isInvoice = inv.type === 'invoice' || !inv.type;
    const isCreditNote = inv.type === 'credit-note';
    console.log(`Invoice ${inv.invoiceNumber} - type: ${inv.type}, isInvoice: ${isInvoice}, isCreditNote: ${isCreditNote}`);
    return activeTab === 'invoices' ? isInvoice : isCreditNote;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              {activeTab === 'credit-notes' ? 'Credit Notes' : 'Invoices'}
            </h1>
            <p className="text-muted-foreground">
              {activeTab === 'credit-notes' 
                ? 'Manage customer credit notes' 
                : 'Manage customer tax invoices and credit notes'}
            </p>
          </div>
          <div className="flex gap-2">
            {activeTab !== 'credit-notes' && (
              <Button variant="outline" className="gap-2" onClick={() => navigate('/invoices/recurring')}>
                <Calendar className="h-4 w-4" />
                Recurring Invoices
              </Button>
            )}
            {activeTab === 'credit-notes' ? (
              <Button className="gap-2" onClick={() => navigate('/invoices/new', { state: { createCreditNote: true } })}>
                <Plus className="h-4 w-4" />
                New Credit Note
              </Button>
            ) : (
              <Button className="gap-2" onClick={() => navigate('/invoices/new')}>
                <Plus className="h-4 w-4" />
                New Invoice
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'invoices' | 'credit-notes' | 'statements')} className="mb-6">
          <TabsList className="grid w-[600px] grid-cols-3">
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="credit-notes">Credit Notes</TabsTrigger>
            <TabsTrigger value="statements">Statements</TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === 'statements' ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Client Statements</h3>
                <p className="text-muted-foreground">Generate statements for your clients showing their account activity, invoices, payments, and outstanding balances.</p>
                <Button onClick={() => navigate('/invoices/statements')}>
                  Generate Statement
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : displayInvoices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {activeTab === 'invoices' ? 'No invoices yet' : 'No credit notes yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {activeTab === 'invoices' 
                  ? 'Create your first invoice to get started'
                  : 'Credit notes will appear here when created from invoices'}
              </p>
              {activeTab === 'invoices' && (
                <Button onClick={() => navigate('/invoices/new')}>Create Invoice</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]">
                      <Checkbox />
                    </TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Doc. No.</TableHead>
                    <TableHead>Cust. Ref.</TableHead>
                    <TableHead>Date</TableHead>
                    {activeTab !== 'credit-notes' && <TableHead>Due Date</TableHead>}
                    <TableHead className="text-right">Total</TableHead>
                    {activeTab !== 'credit-notes' && <TableHead className="text-right">Amount Due</TableHead>}
                    <TableHead className="text-center">Printed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayInvoices.map((invoice) => {
                    const isCreditNote = invoice.type === 'credit-note';
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell className="font-medium">
                          {invoice.projectDetails.clientName}
                        </TableCell>
                        <TableCell>{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.projectDetails.projectName || '-'}</TableCell>
                        <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                        {activeTab !== 'credit-notes' && (
                          <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                        )}
                        <TableCell className="text-right">
                          {settings.currencySymbol}{invoice.total.toFixed(2)}
                        </TableCell>
                        {activeTab !== 'credit-notes' && (
                          <TableCell className="text-right">
                            {settings.currencySymbol}{invoice.total.toFixed(2)}
                          </TableCell>
                        )}
                        <TableCell className="text-center">
                          <Checkbox checked={false} disabled />
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invoice.status)}>
                            {getStatusLabel(invoice.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="gap-1">
                                Actions
                                <span className="ml-1">▼</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}/preview`)}>
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}/print`)}>
                                Print
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}/email`)}>
                                Email
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}`)}>
                                Edit
                              </DropdownMenuItem>
                              {!isCreditNote && (
                                <>
                                  <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}/receipt`)}>
                                    Create Receipt
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}/credit-note`)}>
                                    Create Credit Note
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCopyInvoice(invoice)}>
                                    Copy Invoice
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}/delivery-note`)}>
                                    Print Delivery Note
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}/history`)}>
                                    View History
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleDelete(invoice.id, isCreditNote)}
                                className="text-destructive"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
