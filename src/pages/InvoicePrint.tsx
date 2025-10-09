import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { loadInvoices } from '@/utils/invoiceStorage';
import { loadSettings } from '@/utils/settingsStorage';

export default function InvoicePrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const settings = loadSettings();
  const invoice = loadInvoices().find(inv => inv.id === id);

  useEffect(() => {
    if (invoice) {
      // Trigger print dialog after component mounts
      window.print();
    }
  }, [invoice]);

  if (!invoice) {
    return (
      <div className="p-8 text-center">
        <p>Invoice not found</p>
        <button onClick={() => navigate('/invoices')} className="mt-4 px-4 py-2 bg-primary text-white rounded">
          Back to Invoices
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[21cm] mx-auto bg-white text-black min-h-screen flex flex-col">
      <style>{`
        @media print {
          html, body { 
            margin: 0;
            padding: 0;
            print-color-adjust: exact; 
            -webkit-print-color-adjust: exact; 
          }
          @page { 
            size: A4 portrait;
            margin: 1.5cm;
          }
          .no-print { display: none; }
        }
      `}</style>
      
      {/* Header with Company Branding */}
      <div className="p-8 pb-4 mb-4 border-b-2" style={{ borderColor: settings.primaryColor }}>
        {settings.logoUrl && (
          <img src={settings.logoUrl} alt={settings.companyName} className="h-12 mb-3" />
        )}
        <h1 className="text-2xl font-bold mb-2" style={{ color: settings.primaryColor }}>
          TAX INVOICE
        </h1>
        <div className="text-xs">
          <p className="font-semibold">{settings.companyName}</p>
          {settings.address && <p>{settings.address}</p>}
          {settings.phone && <p>Phone: {settings.phone}</p>}
          {settings.email && <p>Email: {settings.email}</p>}
        </div>
      </div>

      <div className="px-8 mb-4">
        <p className="text-lg font-semibold">Invoice #{invoice.invoiceNumber}</p>
      </div>

      <div className="px-8 grid grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="font-semibold mb-2">Bill To:</h2>
          <p className="font-medium">{invoice.projectDetails.clientName}</p>
          <p className="text-sm">{invoice.projectDetails.clientEmail}</p>
          <p className="text-sm">{invoice.projectDetails.clientPhone}</p>
        </div>
        <div>
          <div className="mb-2">
            <p className="text-sm text-gray-600">Issue Date</p>
            <p className="font-medium">{new Date(invoice.issueDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Due Date</p>
            <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="px-8 flex-grow">
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b-2" style={{ borderColor: settings.primaryColor }}>
              <th className="text-left py-2 text-sm">Description</th>
              <th className="text-right py-2 text-sm">Qty</th>
              <th className="text-right py-2 text-sm">Rate</th>
              <th className="text-right py-2 text-sm">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-2 text-sm">{item.description}</td>
                <td className="text-right text-sm">{item.quantity}</td>
                <td className="text-right text-sm">{settings.currencySymbol}{item.unitPrice.toFixed(2)}</td>
                <td className="text-right text-sm">{settings.currencySymbol}{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-6">
          <div className="w-56 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{settings.currencySymbol}{invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-{settings.currencySymbol}{invoice.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax ({(invoice.taxRate * 100).toFixed(0)}%):</span>
              <span>{settings.currencySymbol}{invoice.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t-2 pt-1 mt-1" style={{ borderColor: settings.primaryColor }}>
              <span>TOTAL:</span>
              <span>{settings.currencySymbol}{invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mb-4">
            <h3 className="font-semibold mb-1 text-sm">Notes:</h3>
            <p className="text-xs">{invoice.notes}</p>
          </div>
        )}

        {invoice.paymentTerms && (
          <div className="mb-6">
            <h3 className="font-semibold mb-1 text-sm">Payment Terms:</h3>
            <p className="text-xs">{invoice.paymentTerms}</p>
          </div>
        )}
      </div>

      {/* Footer - Always at bottom */}
      <div className="px-8 pb-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-600 mt-auto">
        <p>BizCounting Systems (Registered to {settings.companyName})</p>
      </div>
    </div>
  );
}
