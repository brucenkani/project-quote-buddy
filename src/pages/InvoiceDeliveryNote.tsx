import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { loadInvoices } from '@/utils/invoiceStorage';
import { loadSettings } from '@/utils/settingsStorage';

export default function InvoiceDeliveryNote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const settings = loadSettings();
  const invoice = loadInvoices().find(inv => inv.id === id);

  useEffect(() => {
    if (invoice) {
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
    <div className="max-w-[21cm] mx-auto p-8 bg-white text-black" style={{ minHeight: '29.7cm' }}>
      <style>{`
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          @page { 
            size: A4 portrait;
            margin: 2cm;
          }
        }
      `}</style>
      
      {/* Header with Company Branding */}
      <div className="mb-8 pb-4 border-b-2" style={{ borderColor: settings.primaryColor }}>
        {settings.logoUrl && (
          <img src={settings.logoUrl} alt={settings.companyName} className="h-16 mb-4" />
        )}
        <h1 className="text-3xl font-bold mb-2" style={{ color: settings.primaryColor }}>
          DELIVERY NOTE
        </h1>
        <div className="text-sm">
          <p className="font-semibold">{settings.companyName}</p>
          {settings.address && <p>{settings.address}</p>}
          {settings.phone && <p>Phone: {settings.phone}</p>}
          {settings.email && <p>Email: {settings.email}</p>}
          {settings.website && <p>Website: {settings.website}</p>}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-lg font-semibold">Delivery Note #{invoice.invoiceNumber}</p>
        <p className="text-sm">Date: {new Date(invoice.issueDate).toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="font-semibold mb-2">Deliver To:</h2>
          <p className="font-medium">{invoice.projectDetails.clientName}</p>
          <p className="text-sm">{invoice.projectDetails.clientEmail}</p>
          <p className="text-sm">{invoice.projectDetails.clientPhone}</p>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Reference:</h2>
          <p className="text-sm">Invoice: {invoice.invoiceNumber}</p>
          <p className="text-sm">Project: {invoice.projectDetails.projectName || '-'}</p>
        </div>
      </div>

      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2" style={{ borderColor: settings.primaryColor }}>
            <th className="text-left py-2">Item Description</th>
            <th className="text-right py-2">Quantity</th>
            <th className="text-left py-2">Unit</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((item, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-3">{item.description}</td>
              <td className="text-right">{item.quantity}</td>
              <td className="text-left">{item.unit || 'pcs'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-12 pt-8 border-t border-gray-300">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm font-semibold mb-4">Delivered By:</p>
            <div className="border-b border-gray-400 mb-2" style={{ width: '200px' }}></div>
            <p className="text-xs text-gray-600">Signature & Date</p>
          </div>
          <div>
            <p className="text-sm font-semibold mb-4">Received By:</p>
            <div className="border-b border-gray-400 mb-2" style={{ width: '200px' }}></div>
            <p className="text-xs text-gray-600">Signature & Date</p>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="mt-8">
          <h3 className="font-semibold mb-2">Notes:</h3>
          <p className="text-sm">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}
