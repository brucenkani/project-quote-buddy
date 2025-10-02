import { Invoice } from '@/types/invoice';
import { calculateInvoiceStatus } from './invoiceStatusCalculator';

const STORAGE_KEY = 'quotebuilder-invoices';

export const loadInvoices = (): Invoice[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const invoices = JSON.parse(stored);
      // Ensure all invoices have a type field for backward compatibility
      const processedInvoices = invoices.map((inv: any) => ({
        ...inv,
        type: inv.type || (inv.invoiceNumber?.startsWith('CN-') ? 'credit-note' : 'invoice'),
        payments: inv.payments || [],
        creditNotes: inv.creditNotes || [],
      }));
      
      // Auto-link credit notes to their parent invoices if not already linked
      const creditNotes = processedInvoices.filter((inv: Invoice) => inv.type === 'credit-note');
      creditNotes.forEach((cn: Invoice) => {
        // Extract parent invoice number from credit note number (e.g., CN-INV-0001 -> INV-0001)
        const parentInvoiceNumber = cn.invoiceNumber.replace('CN-', '');
        const parentInvoice = processedInvoices.find((inv: Invoice) => 
          inv.invoiceNumber === parentInvoiceNumber && inv.type === 'invoice'
        );
        
        if (parentInvoice && !parentInvoice.creditNotes.includes(cn.id)) {
          parentInvoice.creditNotes.push(cn.id);
        }
      });
      
      // Recalculate status dynamically for each invoice
      return processedInvoices.map((inv: Invoice) => ({
        ...inv,
        status: calculateInvoiceStatus(inv, processedInvoices),
      }));
    }
  } catch (error) {
    console.error('Failed to load invoices:', error);
  }
  return [];
};

export const saveInvoices = (invoices: Invoice[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch (error) {
    console.error('Failed to save invoices:', error);
  }
};

export const saveInvoice = (invoice: Invoice): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const rawInvoices = stored ? JSON.parse(stored) : [];
    const index = rawInvoices.findIndex((i: Invoice) => i.id === invoice.id);
    
    if (index >= 0) {
      rawInvoices[index] = invoice;
    } else {
      rawInvoices.push(invoice);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rawInvoices));
  } catch (error) {
    console.error('Failed to save invoice:', error);
  }
};

export const deleteInvoice = (id: string): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const rawInvoices = stored ? JSON.parse(stored) : [];
    const filtered = rawInvoices.filter((i: Invoice) => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete invoice:', error);
  }
};

export const generateNextInvoiceNumber = (): string => {
  const invoices = loadInvoices();
  if (invoices.length === 0) {
    return 'INV-0001';
  }
  
  // Extract numbers from existing invoice numbers
  const numbers = invoices
    .map(inv => {
      const match = inv.invoiceNumber.match(/INV-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => n > 0);
  
  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
  const nextNumber = maxNumber + 1;
  
  return `INV-${String(nextNumber).padStart(4, '0')}`;
};
