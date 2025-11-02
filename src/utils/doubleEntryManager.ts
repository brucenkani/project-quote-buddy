import { JournalEntry, JournalEntryLine, Expense } from '@/types/accounting';
import { Invoice } from '@/types/invoice';
import { saveJournalEntry } from './accountingStorage';
import {
  getTradeDebtorsAccount,
  getSalesRevenueAccount,
  getVATPayableAccount,
  getTradeCreditorsAccount,
  getDynamicPaymentAccount,
} from './accountMapping';

/**
 * Centralized Double-Entry Bookkeeping Manager
 * Ensures all transactions follow strict double-entry accounting principles
 * Every transaction must have balanced debits and credits
 * All accounts are dynamically loaded from the chart of accounts
 */

// Validate that debits equal credits
export const validateBalance = (entries: JournalEntryLine[]): boolean => {
  const totalDebits = entries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredits = entries.reduce((sum, entry) => sum + entry.credit, 0);
  return Math.abs(totalDebits - totalCredits) < 0.01; // Allow for floating point precision
};

// Create journal entry with validation
const createValidatedJournalEntry = (
  date: string,
  reference: string,
  description: string,
  entries: JournalEntryLine[]
): JournalEntry => {
  if (!validateBalance(entries)) {
    throw new Error('Transaction is not balanced. Debits must equal credits.');
  }

  const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);

  const journalEntry: JournalEntry = {
    id: crypto.randomUUID(),
    date,
    reference,
    description,
    entries,
    totalDebit,
    totalCredit,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveJournalEntry(journalEntry);
  return journalEntry;
};

/**
 * Transaction Type 1: Invoice (Sale on Credit)
 * For an invoice with discount:
 * Debit: Accounts Receivable (what customer owes after discount)
 * Debit: Sales Discounts (discount amount - contra-revenue)
 * Credit: Sales Revenue (gross sales before discount)
 * Credit: Taxes Payable (tax amount)
 */
export const recordInvoice = (invoice: Invoice): JournalEntry => {
  const entries: JournalEntryLine[] = [
    {
      id: crypto.randomUUID(),
      account: '1106 - Trade Debtors',
      accountType: 'current-asset',
      debit: invoice.total,
      credit: 0,
      description: `Invoice ${invoice.invoiceNumber} - ${invoice.projectDetails.clientName}`,
    },
    {
      id: crypto.randomUUID(),
      account: '6100 - Revenue',
      accountType: 'revenue',
      debit: 0,
      credit: invoice.subtotal,
      description: `Sales to ${invoice.projectDetails.clientName}`,
    },
  ];

  // Add discount entry if applicable (contra-revenue account)
  if (invoice.discount > 0) {
    entries.push({
      id: crypto.randomUUID(),
      account: '7100 - Cost of Goods Sold',
      accountType: 'expense',
      debit: invoice.discount,
      credit: 0,
      description: `Discount on Invoice ${invoice.invoiceNumber}`,
    });
  }

  // Add tax liability if applicable
  if (invoice.taxAmount > 0) {
    entries.push({
      id: crypto.randomUUID(),
      account: '3104 - VAT Payable',
      accountType: 'current-liability',
      debit: 0,
      credit: invoice.taxAmount,
      description: `Tax on Invoice ${invoice.invoiceNumber}`,
    });
  }

  return createValidatedJournalEntry(
    invoice.issueDate,
    invoice.invoiceNumber,
    `Invoice: ${invoice.projectDetails.clientName}`,
    entries
  );
};

// Record a credit note (reduces AR and reverses revenue/tax)
export const recordCreditNote = (creditNote: Invoice): JournalEntry => {
  const amountTotal = Math.abs(creditNote.total);
  const amountSubtotal = Math.abs(creditNote.subtotal);
  const amountTax = Math.abs(creditNote.taxAmount);

  const entries: JournalEntryLine[] = [
    {
      id: crypto.randomUUID(),
      account: '6100 - Revenue',
      accountType: 'revenue',
      debit: amountSubtotal,
      credit: 0,
      description: `Credit note for ${creditNote.projectDetails.clientName}`,
    },
  ];

  if (amountTax > 0) {
    entries.push({
      id: crypto.randomUUID(),
      account: '3104 - VAT Payable',
      accountType: 'current-liability',
      debit: amountTax,
      credit: 0,
      description: `Tax reversal on ${creditNote.invoiceNumber}`,
    });
  }

  entries.push({
    id: crypto.randomUUID(),
    account: '1106 - Trade Debtors',
    accountType: 'current-asset',
    debit: 0,
    credit: amountTotal,
    description: `Credit Note ${creditNote.invoiceNumber}`,
  });

  return createValidatedJournalEntry(
    creditNote.issueDate,
    creditNote.invoiceNumber,
    `Credit Note: ${creditNote.projectDetails.clientName}`,
    entries
  );
};

/**
 * Transaction Type 2: Receive Payment from Customer
 * Debit: Cash/Bank (Asset ↑)
 * Credit: Accounts Receivable (Asset ↓)
 */
export const recordPaymentReceived = async (
  invoice: Invoice,
  paymentMethod: 'cash' | 'bank',
  paymentDate: string,
  paymentReference: string,
  bankLedgerAccount?: string
): Promise<JournalEntry> => {
  const paymentAccount = await getDynamicPaymentAccount(paymentMethod, bankLedgerAccount);
  const tradeDebtorsAccount = await getTradeDebtorsAccount();

  const entries: JournalEntryLine[] = [
    {
      id: crypto.randomUUID(),
      account: paymentAccount,
      accountType: 'current-asset',
      debit: invoice.total,
      credit: 0,
      description: `Payment received from ${invoice.projectDetails.clientName}`,
    },
    {
      id: crypto.randomUUID(),
      account: tradeDebtorsAccount,
      accountType: 'current-asset',
      debit: 0,
      credit: invoice.total,
      description: `Payment for Invoice ${invoice.invoiceNumber}`,
    },
  ];

  return createValidatedJournalEntry(
    paymentDate,
    paymentReference,
    `Payment received: ${invoice.invoiceNumber}`,
    entries
  );
};

/**
 * Transaction Type 3: Record Expense (on Credit)
 * Debit: Expense Account (Expense ↑)
 * Credit: Accounts Payable (Liability ↑)
 */
export const recordExpense = async (expense: Expense): Promise<JournalEntry> => {
  const tradeCreditorsAccount = await getTradeCreditorsAccount();

  const entries: JournalEntryLine[] = [
    {
      id: crypto.randomUUID(),
      account: expense.category,
      accountType: 'expense',
      debit: expense.amount,
      credit: 0,
      description: `${expense.vendor} - ${expense.description || 'Expense'}`,
    },
    {
      id: crypto.randomUUID(),
      account: tradeCreditorsAccount,
      accountType: 'current-liability',
      debit: 0,
      credit: expense.amount,
      description: `Payable for ${expense.category}`,
    },
  ];

  return createValidatedJournalEntry(
    expense.date,
    expense.reference || `EXP-${expense.id.slice(0, 8)}`,
    `Expense: ${expense.vendor}`,
    entries
  );
};

/**
 * Transaction Type: Record Expense Payment
 * Debit: Accounts Payable (Liability ↓)
 * Credit: Bank/Cash (Asset ↓)
 */
export const recordExpensePayment = async (
  expense: Expense,
  paymentAmount: number,
  paymentMethod: 'cash' | 'bank',
  paymentDate: string,
  paymentReference: string,
  bankLedgerAccount?: string
): Promise<JournalEntry> => {
  const paymentAccount = await getDynamicPaymentAccount(paymentMethod, bankLedgerAccount);
  const tradeCreditorsAccount = await getTradeCreditorsAccount();

  const entries: JournalEntryLine[] = [
    {
      id: crypto.randomUUID(),
      account: tradeCreditorsAccount,
      accountType: 'current-liability',
      debit: paymentAmount,
      credit: 0,
      description: `Payment for ${expense.category}`,
    },
    {
      id: crypto.randomUUID(),
      account: paymentAccount,
      accountType: 'current-asset',
      debit: 0,
      credit: paymentAmount,
      description: `Payment via ${paymentMethod}`,
    },
  ];

  return createValidatedJournalEntry(
    paymentDate,
    paymentReference,
    `Expense Payment: ${expense.vendor}`,
    entries
  );
};

/**
 * Transaction Type 4: Purchase on Credit
 * Debit: Expense/Asset (depending on purchase type)
 * Credit: Accounts Payable (Liability ↑)
 */
export const recordPurchaseOnCredit = (
  date: string,
  vendor: string,
  account: string,
  accountType: 'expense' | 'current-asset' | 'non-current-asset',
  amount: number,
  reference: string
): JournalEntry => {
  const entries: JournalEntryLine[] = [
    {
      id: crypto.randomUUID(),
      account,
      accountType,
      debit: amount,
      credit: 0,
      description: `Purchase from ${vendor}`,
    },
    {
      id: crypto.randomUUID(),
      account: '2110 - Trade Creditors',
      accountType: 'current-liability',
      debit: 0,
      credit: amount,
      description: `Payable to ${vendor}`,
    },
  ];

  return createValidatedJournalEntry(
    date,
    reference,
    `Credit Purchase: ${vendor}`,
    entries
  );
};

/**
 * Transaction Type 5: Loan Received
 * Debit: Cash/Bank (Asset ↑)
 * Credit: Loan Payable (Liability ↑)
 */
export const recordLoanReceived = (
  date: string,
  lender: string,
  amount: number,
  reference: string,
  receivedIn: 'cash' | 'bank' = 'bank'
): JournalEntry => {
  const assetAccount = receivedIn === 'cash' ? '1120 - Cash on Hand' : '1130 - Bank Account – Current';

  const entries: JournalEntryLine[] = [
    {
      id: crypto.randomUUID(),
      account: assetAccount,
      accountType: 'current-asset',
      debit: amount,
      credit: 0,
      description: `Loan received from ${lender}`,
    },
    {
      id: crypto.randomUUID(),
      account: '2610 - Bank Loans',
      accountType: 'non-current-liability',
      debit: 0,
      credit: amount,
      description: `Loan from ${lender}`,
    },
  ];

  return createValidatedJournalEntry(
    date,
    reference,
    `Loan Received: ${lender}`,
    entries
  );
};

/**
 * Transaction Type 6: Loan Repayment (Principal + Interest)
 * Debit: Loan Payable (Liability ↓) - for principal
 * Debit: Interest Expense (Expense ↑) - for interest
 * Credit: Cash/Bank (Asset ↓)
 */
export const recordLoanRepayment = (
  date: string,
  lender: string,
  principal: number,
  interest: number,
  reference: string,
  paidFrom: 'cash' | 'bank' = 'bank'
): JournalEntry => {
  const assetAccount = paidFrom === 'cash' ? '1120 - Cash on Hand' : '1130 - Bank Account – Current';
  const totalPayment = principal + interest;

  const entries: JournalEntryLine[] = [
    {
      id: crypto.randomUUID(),
      account: '2610 - Bank Loans',
      accountType: 'non-current-liability',
      debit: principal,
      credit: 0,
      description: `Loan repayment to ${lender} (Principal)`,
    },
  ];

  if (interest > 0) {
    entries.push({
      id: crypto.randomUUID(),
      account: '6310 - Interest Expense – Loans',
      accountType: 'expense',
      debit: interest,
      credit: 0,
      description: `Interest on loan to ${lender}`,
    });
  }

  entries.push({
    id: crypto.randomUUID(),
    account: assetAccount,
    accountType: 'current-asset',
    debit: 0,
    credit: totalPayment,
    description: `Loan payment to ${lender}`,
  });

  return createValidatedJournalEntry(
    date,
    reference,
    `Loan Payment: ${lender}`,
    entries
  );
};

/**
 * Transaction Type 7: Capital Contribution (Owner Investment)
 * Debit: Cash/Bank (Asset ↑)
 * Credit: Owner's Capital (Equity ↑)
 */
export const recordCapitalContribution = (
  date: string,
  ownerName: string,
  amount: number,
  reference: string,
  receivedIn: 'cash' | 'bank' = 'bank'
): JournalEntry => {
  const assetAccount = receivedIn === 'cash' ? '1120 - Cash on Hand' : '1130 - Bank Account – Current';

  const entries: JournalEntryLine[] = [
    {
      id: crypto.randomUUID(),
      account: assetAccount,
      accountType: 'current-asset',
      debit: amount,
      credit: 0,
      description: `Capital contribution by ${ownerName}`,
    },
    {
      id: crypto.randomUUID(),
      account: "3110 - Ordinary Share Capital",
      accountType: 'equity',
      debit: 0,
      credit: amount,
      description: `Investment by ${ownerName}`,
    },
  ];

  return createValidatedJournalEntry(
    date,
    reference,
    `Capital Contribution: ${ownerName}`,
    entries
  );
};

/**
 * Transaction Type 8: Owner's Withdrawal (Drawings)
 * Debit: Owner's Drawings (Equity ↓)
 * Credit: Cash/Bank (Asset ↓)
 */
export const recordOwnerDrawing = (
  date: string,
  ownerName: string,
  amount: number,
  reference: string,
  paidFrom: 'cash' | 'bank' = 'bank'
): JournalEntry => {
  const assetAccount = paidFrom === 'cash' ? '1120 - Cash on Hand' : '1130 - Bank Account – Current';

  const entries: JournalEntryLine[] = [
    {
      id: crypto.randomUUID(),
      account: "3600 - Owner's Drawings",
      accountType: 'equity',
      debit: amount,
      credit: 0,
      description: `Drawing by ${ownerName}`,
    },
    {
      id: crypto.randomUUID(),
      account: assetAccount,
      accountType: 'current-asset',
      debit: 0,
      credit: amount,
      description: `Withdrawal by ${ownerName}`,
    },
  ];

  return createValidatedJournalEntry(
    date,
    reference,
    `Owner's Drawing: ${ownerName}`,
    entries
  );
};

/**
 * Transaction Type 9: Pay Supplier (Accounts Payable)
 * Debit: Accounts Payable (Liability ↓)
 * Credit: Cash/Bank (Asset ↓)
 */
export const recordSupplierPayment = (
  date: string,
  vendor: string,
  amount: number,
  reference: string,
  paidFrom: 'cash' | 'bank' = 'bank'
): JournalEntry => {
  const assetAccount = paidFrom === 'cash' ? '1120 - Cash on Hand' : '1130 - Bank Account – Current';

  const entries: JournalEntryLine[] = [
    {
      id: crypto.randomUUID(),
      account: '2110 - Trade Creditors',
      accountType: 'current-liability',
      debit: amount,
      credit: 0,
      description: `Payment to ${vendor}`,
    },
    {
      id: crypto.randomUUID(),
      account: assetAccount,
      accountType: 'current-asset',
      debit: 0,
      credit: amount,
      description: `Payment to supplier ${vendor}`,
    },
  ];

  return createValidatedJournalEntry(
    date,
    reference,
    `Supplier Payment: ${vendor}`,
    entries
  );
};

// Helper function to map payment methods to accounts
const getPaymentAccount = (paymentMethod: string): string => {
  switch (paymentMethod) {
    case 'cash':
      return '1120 - Cash on Hand';
    case 'card':
    case 'bank-transfer':
    case 'check':
      return '1130 - Bank Account – Current';
    default:
      return '1120 - Cash on Hand';
  }
};
