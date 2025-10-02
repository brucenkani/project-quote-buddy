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
    <div className="max-w-4xl mx-auto p-8 bg-white text-black">
      <style>{`
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          @page { margin: 1cm; }
        }
      `}</style>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">TAX INVOICE</h1>
        <p className="text-lg">Invoice #{invoice.invoiceNumber}</p>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="font-semibold mb-2">From:</h2>
          <p className="font-medium">{settings.companyName}</p>
          <p className="text-sm">{settings.address}</p>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Bill To:</h2>
          <p className="font-medium">{invoice.projectDetails.clientName}</p>
          <p className="text-sm">{invoice.projectDetails.clientEmail}</p>
          <p className="text-sm">{invoice.projectDetails.clientPhone}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8 pb-4 border-b-2 border-gray-300">
        <div>
          <p className="text-sm text-gray-600">Issue Date</p>
          <p className="font-medium">{new Date(invoice.issueDate).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Due Date</p>
          <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Project Reference</p>
          <p className="font-medium">{invoice.projectDetails.projectName || '-'}</p>
        </div>
      </div>

      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-2">Description</th>
            <th className="text-right py-2">Qty</th>
            <th className="text-right py-2">Rate</th>
            <th className="text-right py-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((item, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-2">{item.description}</td>
              <td className="text-right">{item.quantity}</td>
              <td className="text-right">{settings.currencySymbol}{item.unitPrice.toFixed(2)}</td>
              <td className="text-right">{settings.currencySymbol}{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2">
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
            <span>Tax ({invoice.taxRate}%):</span>
            <span>{settings.currencySymbol}{invoice.taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t-2 border-gray-300 pt-2">
            <span>TOTAL:</span>
            <span>{settings.currencySymbol}{invoice.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Notes:</h3>
          <p className="text-sm">{invoice.notes}</p>
        </div>
      )}

      {invoice.paymentTerms && (
        <div>
          <h3 className="font-semibold mb-2">Payment Terms:</h3>
          <p className="text-sm">{invoice.paymentTerms}</p>
        </div>
      )}
    </div>
  );
}
