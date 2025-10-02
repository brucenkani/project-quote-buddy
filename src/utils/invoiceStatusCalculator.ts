import { Invoice } from '@/types/invoice';

export const calculateInvoiceStatus = (
  invoice: Invoice,
  allInvoices: Invoice[]
): Invoice['status'] => {
  // Credit notes don't have status
  if (invoice.type === 'credit-note') {
    return 'paid';
  }

  // Calculate amount due
  let amountDue = invoice.total;
  
  // Subtract payments
  if (invoice.payments && invoice.payments.length > 0) {
    const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    amountDue -= totalPaid;
  }
  
  // Subtract credit notes
  if (invoice.creditNotes && invoice.creditNotes.length > 0) {
    const creditNoteInvoices = allInvoices.filter(i => 
      invoice.creditNotes?.includes(i.id) && i.type === 'credit-note'
    );
    const totalCredit = creditNoteInvoices.reduce((sum, cn) => sum + Math.abs(cn.total), 0);
    amountDue -= totalCredit;
  }
  
  // Fully paid
  if (amountDue <= 0) {
    return 'paid';
  }
  
  // Check if overdue
  const dueDate = new Date(invoice.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  
  if (dueDate < today && amountDue > 0) {
    return 'overdue';
  }
  
  // Partly paid if some payment was made but not full
  if (amountDue < invoice.total) {
    return 'partly-paid';
  }
  
  // Otherwise unpaid
  return 'unpaid';
};

export const calculateAmountDue = (
  invoice: Invoice,
  allInvoices: Invoice[]
): number => {
  if (invoice.type === 'credit-note') {
    return 0;
  }

  let amountDue = invoice.total;
  
  if (invoice.payments && invoice.payments.length > 0) {
    const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    amountDue -= totalPaid;
  }
  
  if (invoice.creditNotes && invoice.creditNotes.length > 0) {
    const creditNoteInvoices = allInvoices.filter(i => 
      invoice.creditNotes?.includes(i.id) && i.type === 'credit-note'
    );
    const totalCredit = creditNoteInvoices.reduce((sum, cn) => sum + Math.abs(cn.total), 0);
    amountDue -= totalCredit;
  }
  
  return Math.max(0, amountDue);
};

