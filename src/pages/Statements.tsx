import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Navigation } from '@/components/Navigation';
import { ContactSelector } from '@/components/ContactSelector';
import { Contact } from '@/types/contacts';
import { loadInvoices } from '@/utils/invoiceStorage';
import { loadSettings } from '@/utils/settingsStorage';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Invoice } from '@/types/invoice';

export default function Statements() {
  const navigate = useNavigate();
  const settings = loadSettings();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setSelectedContactId(contact.id);
  };

  const generateStatement = () => {
    if (!selectedContact) return;

    const clientInvoices = invoices.filter(
      inv => inv.projectDetails.clientName === selectedContact.name &&
      new Date(inv.issueDate) >= new Date(dateRange.startDate) &&
      new Date(inv.issueDate) <= new Date(dateRange.endDate)
    );

    // Calculate totals
    const totalInvoiced = clientInvoices
      .filter(inv => inv.type === 'invoice' || !inv.type)
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const totalCreditNotes = clientInvoices
      .filter(inv => inv.type === 'credit-note')
      .reduce((sum, inv) => sum + Math.abs(inv.total), 0);
    
    const totalPaid = clientInvoices
      .filter(inv => inv.type === 'invoice' || !inv.type)
      .reduce((sum, inv) => {
        const payments = inv.payments || [];
        return sum + payments.reduce((pSum, p) => pSum + p.amount, 0);
      }, 0);

    const calculateAmountDue = (inv: any) => {
      let amountDue = inv.total;
      
      if (inv.payments && inv.payments.length > 0) {
        const totalPaid = inv.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
        amountDue -= totalPaid;
      }
      
      if (inv.creditNotes && inv.creditNotes.length > 0) {
        const creditNoteInvoices = invoices.filter(i => 
          inv.creditNotes?.includes(i.id) && i.type === 'credit-note'
        );
        const totalCredit = creditNoteInvoices.reduce((sum, cn) => sum + Math.abs(cn.total), 0);
        amountDue -= totalCredit;
      }
      
      return Math.max(0, amountDue);
    };

    const totalOutstanding = totalInvoiced - totalPaid - totalCreditNotes;

    return (
      <div className="space-y-6">
        {/* Statement Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border">
          <div className="flex justify-between items-start">
            <div>
              {settings.logoUrl && (
                <img src={settings.logoUrl} alt="Company Logo" className="h-16 mb-4" />
              )}
              <h2 className="text-2xl font-bold">{settings.companyName}</h2>
              <p className="text-sm text-muted-foreground">{settings.address}</p>
              <p className="text-sm text-muted-foreground">{settings.email}</p>
              <p className="text-sm text-muted-foreground">{settings.phone}</p>
            </div>
            <div className="text-right">
              <h3 className="text-xl font-bold">CLIENT STATEMENT</h3>
              <p className="text-sm text-muted-foreground">
                Period: {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Client Details */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-semibold text-lg">{selectedContact.name}</p>
              <p className="text-sm text-muted-foreground">{selectedContact.email}</p>
              <p className="text-sm text-muted-foreground">{selectedContact.phone}</p>
              {selectedContact.address && (
                <p className="text-sm text-muted-foreground">{selectedContact.address}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Account Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Total Invoiced</span>
                <span className="font-semibold">{settings.currencySymbol}{totalInvoiced.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Total Payments Received</span>
                <span className="font-semibold text-green-600">-{settings.currencySymbol}{totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Total Credit Notes</span>
                <span className="font-semibold text-green-600">-{settings.currencySymbol}{totalCreditNotes.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 text-lg font-bold border-t-2">
                <span>Amount Outstanding</span>
                <span className={totalOutstanding > 0 ? 'text-destructive' : 'text-green-600'}>
                  {settings.currencySymbol}{totalOutstanding.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-4 font-semibold text-sm border-b pb-2">
                <span>Date</span>
                <span>Document</span>
                <span>Description</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Balance</span>
              </div>
              {clientInvoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions found for this period</p>
              ) : (
                (() => {
                  let runningBalance = 0;
                  const transactions: any[] = [];
                  
                  // Build a flat list of all transactions (invoices, payments, credit notes)
                  clientInvoices.forEach((inv) => {
                    const isInvoice = inv.type === 'invoice' || !inv.type;
                    const isCreditNote = inv.type === 'credit-note';
                    
                    // Add invoice or credit note
                    transactions.push({
                      date: inv.issueDate,
                      type: isCreditNote ? 'credit-note' : 'invoice',
                      document: inv.invoiceNumber,
                      description: inv.projectDetails.projectName,
                      amount: inv.total,
                      invoiceId: inv.id,
                    });
                    
                    // Add payments for this invoice
                    if (isInvoice && inv.payments && inv.payments.length > 0) {
                      inv.payments.forEach((payment) => {
                        transactions.push({
                          date: payment.date,
                          type: 'payment',
                          document: payment.reference || `Payment ${payment.id.slice(0, 8)}`,
                          description: `Payment - ${inv.invoiceNumber}`,
                          amount: payment.amount,
                          invoiceId: inv.id,
                        });
                      });
                    }
                  });
                  
                  // Sort transactions by date
                  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                  
                  // Render transactions with running balance
                  return transactions.map((txn, index) => {
                    // Update running balance
                    if (txn.type === 'invoice') {
                      runningBalance += txn.amount;
                    } else if (txn.type === 'credit-note') {
                      runningBalance -= Math.abs(txn.amount);
                    } else if (txn.type === 'payment') {
                      runningBalance -= txn.amount;
                    }
                    
                    return (
                      <div key={`${txn.type}-${txn.invoiceId}-${index}`} className="grid grid-cols-5 gap-4 text-sm py-3 border-b">
                        <span>{new Date(txn.date).toLocaleDateString()}</span>
                        <span className="font-medium">{txn.document}</span>
                        <span className="truncate">{txn.description}</span>
                        <span className={`text-right font-semibold ${
                          txn.type === 'invoice' ? 'text-destructive' : 'text-green-600'
                        }`}>
                          {txn.type === 'invoice' ? '' : '-'}{settings.currencySymbol}{Math.abs(txn.amount).toFixed(2)}
                        </span>
                        <span className={`text-right font-semibold ${
                          runningBalance > 0 ? 'text-destructive' : runningBalance < 0 ? 'text-green-600' : ''
                        }`}>
                          {settings.currencySymbol}{Math.abs(runningBalance).toFixed(2)}
                        </span>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2 justify-end print:hidden">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print Statement
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/invoices')}
          className="mb-4 print:hidden"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>

        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent mb-6">
          Generate Client Statement
        </h1>

        {!selectedContact ? (
          <Card>
            <CardHeader>
              <CardTitle>Select Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <ContactSelector 
                  type="client"
                  value={selectedContactId}
                  onSelect={handleContactSelect}
                  placeholder="Select a client to generate statement..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 print:hidden">
              <Button variant="outline" onClick={() => {
                setSelectedContact(null);
                setSelectedContactId('');
              }}>
                Change Client
              </Button>
            </div>
            {generateStatement()}
          </>
        )}
      </div>

      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
