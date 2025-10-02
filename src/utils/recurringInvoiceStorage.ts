import { RecurringInvoice, Invoice } from '@/types/invoice';
import { saveInvoice, generateNextInvoiceNumber } from './invoiceStorage';

const STORAGE_KEY = 'quotebuilder-recurring-invoices';

export const loadRecurringInvoices = (): RecurringInvoice[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load recurring invoices:', error);
  }
  return [];
};

export const saveRecurringInvoices = (invoices: RecurringInvoice[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch (error) {
    console.error('Failed to save recurring invoices:', error);
  }
};

export const saveRecurringInvoice = (invoice: RecurringInvoice): void => {
  const invoices = loadRecurringInvoices();
  const index = invoices.findIndex(i => i.id === invoice.id);
  if (index >= 0) {
    invoices[index] = invoice;
  } else {
    invoices.push(invoice);
  }
  saveRecurringInvoices(invoices);
};

export const deleteRecurringInvoice = (id: string): void => {
  const invoices = loadRecurringInvoices().filter(i => i.id !== id);
  saveRecurringInvoices(invoices);
};

export const calculateNextGenerationDate = (startDate: string, frequency: RecurringInvoice['frequency']): string => {
  const date = new Date(startDate);
  
  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  
  return date.toISOString().split('T')[0];
};

export const generateInvoicesFromRecurring = (): number => {
  const recurringInvoices = loadRecurringInvoices();
  const today = new Date().toISOString().split('T')[0];
  let generatedCount = 0;

  recurringInvoices.forEach(recurring => {
    if (!recurring.isActive) return;
    
    // Check if it's time to generate
    if (recurring.nextGenerationDate <= today) {
      // Check if we haven't passed the end date
      if (recurring.endDate && recurring.nextGenerationDate > recurring.endDate) {
        return;
      }

      // Generate the invoice
      const newInvoice: Invoice = {
        ...recurring.invoiceTemplate,
        id: crypto.randomUUID(),
        invoiceNumber: generateNextInvoiceNumber(),
        issueDate: today,
        type: 'invoice',
        payments: [],
        creditNotes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveInvoice(newInvoice);
      generatedCount++;

      // Update the recurring invoice
      const nextDate = calculateNextGenerationDate(recurring.nextGenerationDate, recurring.frequency);
      recurring.lastGeneratedDate = today;
      recurring.nextGenerationDate = nextDate;
      saveRecurringInvoice(recurring);
    }
  });

  return generatedCount;
};
