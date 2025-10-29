import { supabase } from '@/integrations/supabase/client';
import { CompanyType } from '@/types/settings';

/**
 * Centralized Journal Entry Manager for Supabase
 * Ensures all financial transactions create proper double-entry journal entries
 */

interface JournalEntryLine {
  account_id: string;
  account_name: string;
  debit: number;
  credit: number;
  description?: string;
}

interface JournalEntryData {
  entry_number: string;
  date: string;
  description: string;
  reference?: string;
  lines: JournalEntryLine[];
}

/**
 * Validates that debits equal credits
 */
const validateBalance = (lines: JournalEntryLine[]): boolean => {
  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);
  return Math.abs(totalDebits - totalCredits) < 0.01;
};

/**
 * Creates a validated journal entry in Supabase
 */
export const createJournalEntry = async (
  entry: JournalEntryData,
  userId: string,
  companyId: string
): Promise<string> => {
  if (!validateBalance(entry.lines)) {
    throw new Error('Transaction is not balanced. Debits must equal credits.');
  }

  try {
    // Create journal entry header
    const { data: journal, error: journalError } = await supabase
      .from('journal_entries')
      .insert({
        user_id: userId,
        company_id: companyId,
        entry_number: entry.entry_number,
        date: entry.date,
        description: entry.description,
        reference: entry.reference,
      })
      .select()
      .single();

    if (journalError) throw journalError;

    // Create journal entry lines
    const lineInserts = entry.lines.map(line => ({
      journal_entry_id: journal.id,
      account_id: line.account_id,
      account_name: line.account_name,
      debit: line.debit,
      credit: line.credit,
      description: line.description,
    }));

    const { error: linesError } = await supabase
      .from('journal_entry_lines')
      .insert(lineInserts);

    if (linesError) throw linesError;

    return journal.id;
  } catch (error) {
    console.error('Failed to create journal entry:', error);
    throw error;
  }
};

/**
 * Record Purchase Order Approval
 * (Memo entry only - no accounting impact until goods received)
 */
export const recordPurchaseOrder = async (
  poNumber: string,
  supplier: string,
  totalAmount: number,
  date: string,
  userId: string,
  companyId: string
): Promise<string> => {
  // PO approval is a commitment but not a transaction
  // We create a memo entry for tracking
  const entry: JournalEntryData = {
    entry_number: `PO-${poNumber}`,
    date,
    description: `Purchase Order to ${supplier}`,
    reference: poNumber,
    lines: [
      {
        account_id: '9900',
        account_name: '9900 - Memorandum',
        debit: totalAmount,
        credit: 0,
        description: `PO commitment to ${supplier}`,
      },
      {
        account_id: '9901',
        account_name: '9901 - Memorandum Contra',
        debit: 0,
        credit: totalAmount,
        description: 'PO commitment contra',
      },
    ],
  };

  return createJournalEntry(entry, userId, companyId);
};

/**
 * Record Purchase (Supplier Invoice) with Inventory Update
 * Dr Inventory (or Expense) / Cr Accounts Payable
 */
export const recordPurchaseInvoice = async (
  purchaseNumber: string,
  supplier: string,
  subtotal: number,
  taxAmount: number,
  total: number,
  date: string,
  companyType: CompanyType,
  userId: string,
  companyId: string,
  supplierInvoiceNumber?: string
): Promise<string> => {
  const lines: JournalEntryLine[] = [];

  // All inventory/raw materials go to account 1109 (or 1310 for specific cases)
  let inventoryAccount = '1109';
  let inventoryName = '1109 - Raw Materials';

  // Professional services expense rather than capitalize
  if (companyType === 'professional-services') {
    inventoryAccount = '7100';
    inventoryName = '7100 - Cost of Goods Sold';
  }

  // Debit: Inventory/Expense
  lines.push({
    account_id: inventoryAccount,
    account_name: inventoryName,
    debit: subtotal,
    credit: 0,
    description: `Purchase from ${supplier}`,
  });

  // Debit: VAT Input (if applicable)
  if (taxAmount > 0) {
    lines.push({
      account_id: '1105',
      account_name: '1105 - VAT Input (Accounts Receivable)',
      debit: taxAmount,
      credit: 0,
      description: 'VAT on purchase',
    });
  }

  // Credit: Accounts Payable
  lines.push({
    account_id: '3100',
    account_name: '3100 - Trade and Other Payables',
    debit: 0,
    credit: total,
    description: `Payable to ${supplier}`,
  });

  const entry: JournalEntryData = {
    entry_number: `PUR-${purchaseNumber}`,
    date,
    description: `Purchase from ${supplier}`,
    reference: supplierInvoiceNumber || purchaseNumber,
    lines,
  };

  return createJournalEntry(entry, userId, companyId);
};

/**
 * Record Purchase Payment
 * Dr Accounts Payable / Cr Bank
 */
export const recordPurchasePayment = async (
  purchaseNumber: string,
  supplier: string,
  amount: number,
  date: string,
  paymentReference: string,
  bankAccountId: string,
  userId: string,
  companyId: string
): Promise<string> => {
  const entry: JournalEntryData = {
    entry_number: `PAY-${paymentReference}`,
    date,
    description: `Payment to ${supplier}`,
    reference: paymentReference,
    lines: [
      {
        account_id: '3100',
        account_name: '3100 - Trade and Other Payables',
        debit: amount,
        credit: 0,
        description: `Payment for ${purchaseNumber}`,
      },
      {
        account_id: bankAccountId,
        account_name: `Bank Account`,
        debit: 0,
        credit: amount,
        description: `Payment to ${supplier}`,
      },
    ],
  };

  return createJournalEntry(entry, userId, companyId);
};

/**
 * Record Inventory Sale (COGS)
 * Dr Cost of Goods Sold / Cr Inventory
 */
export const recordInventorySale = async (
  invoiceNumber: string,
  cost: number,
  date: string,
  companyType: CompanyType,
  userId: string,
  companyId: string
): Promise<string> => {
  // Inventory account based on type
  const inventoryAccount = companyType === 'trading' ? '1110' : '1109';
  const inventoryName = companyType === 'trading' ? '1110 - Finished Goods' : '1109 - Raw Materials';

  const entry: JournalEntryData = {
    entry_number: `COGS-${invoiceNumber}`,
    date,
    description: `Cost of Goods Sold - ${invoiceNumber}`,
    reference: invoiceNumber,
    lines: [
      {
        account_id: '7100',
        account_name: '7100 - Cost of Goods Sold',
        debit: cost,
        credit: 0,
        description: `COGS for ${invoiceNumber}`,
      },
      {
        account_id: inventoryAccount,
        account_name: inventoryName,
        debit: 0,
        credit: cost,
        description: 'Inventory reduction',
      },
    ],
  };

  return createJournalEntry(entry, userId, companyId);
};

/**
 * Record Inventory Adjustment
 * Dr Inventory Adjustments (Expense) / Cr Inventory (if shortage)
 * Dr Inventory / Cr Inventory Adjustments (Income) (if surplus)
 */
export const recordInventoryAdjustment = async (
  adjustmentNumber: string,
  itemName: string,
  adjustmentValue: number,
  date: string,
  reason: string,
  companyType: CompanyType,
  userId: string,
  companyId: string
): Promise<string> => {
  // Inventory account based on type
  const inventoryAccount = companyType === 'trading' ? '1110' : '1109';
  const inventoryName = companyType === 'trading' ? '1110 - Finished Goods' : '1109 - Raw Materials';

  const isShortage = adjustmentValue < 0;
  const absValue = Math.abs(adjustmentValue);

  const entry: JournalEntryData = {
    entry_number: `ADJ-${adjustmentNumber}`,
    date,
    description: `Inventory Adjustment - ${itemName}`,
    reference: reason,
    lines: isShortage
      ? [
          {
            account_id: '7500',
            account_name: '7500 - Inventory Adjustments',
            debit: absValue,
            credit: 0,
            description: `Loss/shortage of ${itemName}`,
          },
          {
            account_id: inventoryAccount,
            account_name: inventoryName,
            debit: 0,
            credit: absValue,
            description: 'Inventory reduction',
          },
        ]
      : [
          {
            account_id: inventoryAccount,
            account_name: inventoryName,
            debit: absValue,
            credit: 0,
            description: 'Inventory increase',
          },
          {
            account_id: '6500',
            account_name: '6500 - Other Income',
            debit: 0,
            credit: absValue,
            description: `Gain/surplus of ${itemName}`,
          },
        ],
  };

  return createJournalEntry(entry, userId, companyId);
};

/**
 * Reverse/Cancel a Journal Entry
 */
export const reverseJournalEntry = async (
  originalEntryNumber: string,
  date: string,
  reason: string,
  userId: string,
  companyId: string
): Promise<string> => {
  try {
    // Get original entry
    const { data: originalEntry, error: entryError } = await supabase
      .from('journal_entries')
      .select('*, journal_entry_lines(*)')
      .eq('company_id', companyId)
      .eq('entry_number', originalEntryNumber)
      .single();

    if (entryError) throw entryError;

    // Create reversed lines (swap debits and credits)
    const reversedLines = originalEntry.journal_entry_lines.map((line: any) => ({
      account_id: line.account_id,
      account_name: line.account_name,
      debit: line.credit,
      credit: line.debit,
      description: `Reversal: ${line.description || ''}`,
    }));

    const entry: JournalEntryData = {
      entry_number: `REV-${originalEntryNumber}`,
      date,
      description: `Reversal of ${originalEntryNumber}: ${reason}`,
      reference: originalEntryNumber,
      lines: reversedLines,
    };

    return createJournalEntry(entry, userId, companyId);
  } catch (error) {
    console.error('Failed to reverse journal entry:', error);
    throw error;
  }
};
