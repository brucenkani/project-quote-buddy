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
          /* Hide browser's default header/footer */
          @page {
            margin-top: 1.5cm;
            margin-bottom: 1.5cm;
          }
        }
      `}</style>
      
      {/* Header with Company Branding */}
      <div className="p-8 pb-4 mb-4 border-b-2" style={{ borderColor: settings.primaryColor }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-6">
            {settings.logoUrl && (
              <img src={settings.logoUrl} alt={settings.companyName} className="w-auto max-w-[200px] h-auto" style={{ width: 'fit-content' }} />
            )}
            <h1 className="text-2xl font-bold" style={{ color: settings.primaryColor }}>
              Tax Invoice
            </h1>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 text-xs">
          <div>
            <p className="font-semibold">{settings.companyName}</p>
            {settings.address && <p>{settings.address}</p>}
            {settings.vatNumber && <p>VAT No: {settings.vatNumber}</p>}
          </div>
          <div className="text-right">
            <p className="font-semibold">Number: {invoice.invoiceNumber}</p>
            <p>Date: {new Date(invoice.issueDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="px-8 mb-6">
        <div className="border p-4 text-xs">
          <p className="font-medium">{invoice.projectDetails.clientName}</p>
          <p className="text-sm">{invoice.projectDetails.clientEmail}</p>
          <p className="text-sm">{invoice.projectDetails.clientPhone}</p>
        </div>
      </div>

      <div className="px-8 flex-grow">
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b-2" style={{ borderColor: settings.primaryColor }}>
              <th className="text-left py-2 text-sm font-semibold">Description</th>
              <th className="text-right py-2 text-sm font-semibold">Quantity</th>
              <th className="text-right py-2 text-sm font-semibold">Incl. Price</th>
              <th className="text-right py-2 text-sm font-semibold">Total</th>
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
      </div>

      {/* Notes and Totals - Pushed to bottom */}
      <div className="px-8 pb-4 mt-auto">
        {invoice.notes && (
          <div className="mb-6">
            <h3 className="font-semibold mb-1 text-sm">Notes:</h3>
            <p className="text-xs">{invoice.notes}</p>
          </div>
        )}

        <div className="border-t-2 pt-4" style={{ borderColor: settings.primaryColor }}>
          <div className="flex justify-between items-start">
            <div className="text-xs space-y-1">
              {settings.bankName && (
                <>
                  <p className="font-semibold">Bank: {settings.bankName}</p>
                  {settings.accountNumber && <p>Account: {settings.accountNumber}</p>}
                  {settings.branchCode && <p>Branch Code: {settings.branchCode}</p>}
                </>
              )}
            </div>
            
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between font-bold text-base mb-2">
                <span>Total Due:</span>
                <span>{settings.currencySymbol}{invoice.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Total Exclusive:</span>
                <span>{settings.currencySymbol}{invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Total VAT ({(invoice.taxRate * 100).toFixed(0)}%):</span>
                <span>{settings.currencySymbol}{invoice.taxAmount.toFixed(2)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-xs">
                  <span>Total Discount:</span>
                  <span>-{settings.currencySymbol}{invoice.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Sub Total:</span>
                <span>{settings.currencySymbol}{invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Always at bottom */}
      <div className="px-8 pb-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-600">
        <p>BizCounting Systems (Registered to {settings.companyName})</p>
      </div>
    </div>
  );
}
