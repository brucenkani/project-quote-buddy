import { Invoice } from '@/types/invoice';

const STORAGE_KEY = 'quotebuilder-invoices';

export const loadInvoices = (): Invoice[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
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
