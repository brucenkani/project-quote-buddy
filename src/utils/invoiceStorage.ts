import { Invoice } from '@/types/invoice';

const STORAGE_KEY = 'quotebuilder-invoices';

export const loadInvoices = (): Invoice[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const invoices = JSON.parse(stored);
      // Ensure all invoices have a type field for backward compatibility
      return invoices.map((inv: any) => ({
        ...inv,
        type: inv.type || (inv.invoiceNumber?.startsWith('CN-') ? 'credit-note' : 'invoice'),
        payments: inv.payments || [],
        creditNotes: inv.creditNotes || [],
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
  const invoices = loadInvoices();
  const index = invoices.findIndex(i => i.id === invoice.id);
  if (index >= 0) {
    invoices[index] = invoice;
  } else {
    invoices.push(invoice);
  }
  saveInvoices(invoices);
};

export const deleteInvoice = (id: string): void => {
  const invoices = loadInvoices().filter(i => i.id !== id);
  saveInvoices(invoices);
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
