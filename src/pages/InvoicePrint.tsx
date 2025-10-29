import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { loadInvoices } from '@/utils/invoiceStorage';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

export default function InvoicePrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeCompany } = useCompany();
  const [invoice, setInvoice] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!activeCompany?.id) {
        console.log('No active company');
        return;
      }
      
      // Load invoice
      const invoices = await loadInvoices();
      const found = invoices.find(inv => inv.id === id);
      setInvoice(found || null);
      
      // Load settings
      console.log('Loading settings for company:', activeCompany.id);
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', activeCompany.id)
        .maybeSingle();
      
      console.log('Company settings data:', data);
      console.log('Company settings error:', error);
      
      if (data && !error) {
        setSettings(data);
      }
    };
    
    loadData();
  }, [activeCompany?.id, id]);

  useEffect(() => {
    if (invoice && settings) {
      // Trigger print dialog after component mounts and settings are loaded
      window.print();
    }
  }, [invoice, settings]);

  if (!invoice || !settings) {
    return (
      <div className="p-8 text-center">
        <p>{!invoice ? 'Invoice not found' : 'Loading company settings...'}</p>
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
      <div className="p-8 pb-4 mb-4 border-b-2" style={{ borderColor: settings.primary_color || '#3b82f6' }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {settings.logo_url && (
              <img src={settings.logo_url} alt={settings.company_name} className="w-auto max-w-[200px] h-auto mb-2" style={{ width: 'fit-content' }} />
            )}
            <div className="text-xs space-y-0.5">
              <p className="font-semibold text-sm">{settings.company_name || activeCompany?.name || 'Company Name Not Set'}</p>
              {settings.address && <p>{settings.address}</p>}
              {settings.email && <p>{settings.email}</p>}
              {settings.phone && <p>{settings.phone}</p>}
              {settings.tax_number && <p>Tax No: {settings.tax_number}</p>}
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold mb-2" style={{ color: settings.primary_color || '#3b82f6' }}>
              Tax Invoice
            </h1>
            <div className="text-xs space-y-0.5">
              <p className="font-semibold">Number: {invoice.invoiceNumber}</p>
              <p>Date: {new Date(invoice.issueDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 mb-6">
        <h3 className="font-semibold text-sm mb-2">Bill To:</h3>
        <div className="border p-4 text-xs">
          <p className="font-medium">{invoice.projectDetails.clientName}</p>
          <p className="text-sm">{invoice.projectDetails.clientEmail}</p>
          <p className="text-sm">{invoice.projectDetails.clientPhone}</p>
        </div>
      </div>

      <div className="px-8 flex-grow">
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b-2" style={{ borderColor: settings.primary_color || '#3b82f6' }}>
              <th className="text-left py-2 text-sm font-semibold">Description</th>
              <th className="text-right py-2 text-sm font-semibold">Quantity</th>
              <th className="text-right py-2 text-sm font-semibold">Excl. Price</th>
              <th className="text-right py-2 text-sm font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-2 text-sm">{item.description}</td>
                <td className="text-right text-sm">{item.quantity}</td>
                <td className="text-right text-sm">{settings.currency_symbol || 'R'}{item.unitPrice.toFixed(2)}</td>
                <td className="text-right text-sm">{settings.currency_symbol || 'R'}{item.total.toFixed(2)}</td>
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

        <div className="border-t-2 pt-4" style={{ borderColor: settings.primary_color || '#3b82f6' }}>
          <div className="flex justify-between items-start">
            <div className="text-xs space-y-1">
              {settings.bank_name && (
                <>
                  <p className="font-semibold">Bank: {settings.bank_name}</p>
                  {settings.account_number && <p>Account: {settings.account_number}</p>}
                  {settings.branch_code && <p>Branch Code: {settings.branch_code}</p>}
                </>
              )}
            </div>
            
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between font-bold text-base mb-2">
                <span>Total Due:</span>
                <span>{settings.currency_symbol || 'R'}{invoice.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Total Exclusive:</span>
                <span>{settings.currency_symbol || 'R'}{invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Total VAT ({invoice.taxRate}%):</span>
                <span>{settings.currency_symbol || 'R'}{invoice.taxAmount.toFixed(2)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-xs">
                  <span>Total Discount:</span>
                  <span>-{settings.currency_symbol || 'R'}{invoice.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Sub Total:</span>
                <span>{settings.currency_symbol || 'R'}{invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Always at bottom */}
      <div className="px-8 pb-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-600">
        <p>BizManager Systems (Registered to {settings.company_name || activeCompany?.name || 'Company Name Not Set'})</p>
      </div>
    </div>
  );
}
