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
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;
  
  console.log('⚖️ [VALIDATION DEBUG] Balance validation:', {
    totalDebits,
    totalCredits,
    difference: totalDebits - totalCredits,
    isBalanced
  });
  
  return isBalanced;
};

/**
 * Creates a validated journal entry in Supabase
 */
export const createJournalEntry = async (
  entry: JournalEntryData,
  userId: string,
  companyId: string
): Promise<string> => {
  console.log('🏗️ [CREATE ENTRY DEBUG] Starting journal entry creation');
  console.log('🏗️ [CREATE ENTRY DEBUG] Entry:', entry);
  console.log('🏗️ [CREATE ENTRY DEBUG] User ID:', userId);
  console.log('🏗️ [CREATE ENTRY DEBUG] Company ID:', companyId);

  if (!validateBalance(entry.lines)) {
    const totalDebits = entry.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredits = entry.lines.reduce((sum, line) => sum + line.credit, 0);
    const errorMsg = `Transaction is not balanced. Debits: ${totalDebits}, Credits: ${totalCredits}, Difference: ${Math.abs(totalDebits - totalCredits)}`;
    console.error('❌ [CREATE ENTRY DEBUG] Balance validation failed:', errorMsg);
    throw new Error(errorMsg);
  }

  try {
    console.log('📤 [CREATE ENTRY DEBUG] Inserting journal entry header...');
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

    if (journalError) {
      console.error('❌ [CREATE ENTRY DEBUG] Journal header insert error:', journalError);
      throw journalError;
    }

    console.log('✅ [CREATE ENTRY DEBUG] Journal header created:', journal);

    // Create journal entry lines
    const lineInserts = entry.lines.map(line => ({
      journal_entry_id: journal.id,
      account_id: line.account_id,
      account_name: line.account_name,
      debit: line.debit,
      credit: line.credit,
    }));

    console.log('📤 [CREATE ENTRY DEBUG] Inserting journal entry lines:', lineInserts);

    const { error: linesError } = await supabase
      .from('journal_entry_lines')
      .insert(lineInserts);

    if (linesError) {
      console.error('❌ [CREATE ENTRY DEBUG] Journal lines insert error:', linesError);
      throw linesError;
    }

    console.log('✅ [CREATE ENTRY DEBUG] Journal entry created successfully with ID:', journal.id);
    return journal.id;
  } catch (error) {
    console.error('❌ [CREATE ENTRY DEBUG] Failed to create journal entry:', error);
    console.error('❌ [CREATE ENTRY DEBUG] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      error
    });
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
      },
      {
        account_id: '9901',
        account_name: '9901 - Memorandum Contra',
        debit: 0,
        credit: totalAmount,
      },
    ],
  };

  return createJournalEntry(entry, userId, companyId);
};

/**
 * Record Purchase (Supplier Invoice) with Inventory Update
 * Dr Inventory (based on type) / Cr Accounts Payable OR Cash OR Bank
 */
export const recordPurchaseInvoice = async (
  purchaseNumber: string,
  supplier: string,
  subtotal: number,
  taxAmount: number,
  total: number,
  date: string,
  companyType: CompanyType,
  paymentMethod: 'credit' | 'cash' | 'bank-transfer',
  inventoryType: 'raw-materials' | 'work-in-progress' | 'consumables' | 'finished-products',
  userId: string,
  companyId: string,
  bankAccountId?: string,
  supplierInvoiceNumber?: string
): Promise<string> => {
  console.log('📝 [JOURNAL DEBUG] recordPurchaseInvoice called with:', {
    purchaseNumber,
    supplier,
    subtotal,
    taxAmount,
    total,
    date,
    companyType,
    paymentMethod,
    inventoryType,
    userId,
    companyId,
    bankAccountId,
    supplierInvoiceNumber
  });

  const lines: JournalEntryLine[] = [];

  // Determine inventory account based on inventory type and company type
  let inventoryAccount = '1109';
  let inventoryName = '1109 - Raw Materials';

  // For periodic inventory or consumables, expense immediately (debit COGS/Expense)
  // For perpetual inventory with non-consumables, capitalize to inventory (debit Asset)
  const useExpenseAccount = inventoryType === 'consumables' || companyType === 'professional-services';

  if (useExpenseAccount) {
    // Expense immediately for consumables or professional services
    inventoryAccount = '7100';
    inventoryName = '7100 - Cost of Goods Sold';
    console.log('🏢 [JOURNAL DEBUG] Using expense account for immediate recognition');
  } else {
    // Capitalize to inventory for resale items
    switch (inventoryType) {
      case 'raw-materials':
        inventoryAccount = '1109';
        inventoryName = '1109 - Raw Materials';
        break;
      case 'work-in-progress':
        inventoryAccount = '1310';
        inventoryName = '1310 - Work in Progress';
        break;
      case 'finished-products':
        inventoryAccount = '1110';
        inventoryName = '1110 - Finished Goods';
        break;
    }
    console.log('📦 [JOURNAL DEBUG] Capitalizing to inventory account');
  }

  console.log('📦 [JOURNAL DEBUG] Inventory account mapping:', {
    inventoryType,
    inventoryAccount,
    inventoryName,
    useExpenseAccount
  });

  // Debit: Inventory/Expense
  lines.push({
    account_id: inventoryAccount,
    account_name: inventoryName,
    debit: subtotal,
    credit: 0,
  });
  console.log('✅ [JOURNAL DEBUG] Added inventory/expense debit line:', subtotal);

  // Debit: VAT Input (if applicable)
  if (taxAmount > 0) {
    lines.push({
      account_id: '1105',
      account_name: '1105 - VAT Input (Accounts Receivable)',
      debit: taxAmount,
      credit: 0,
    });
    console.log('✅ [JOURNAL DEBUG] Added VAT input debit line:', taxAmount);
  }

  // Credit: Based on payment method
  switch (paymentMethod) {
    case 'credit':
      lines.push({
        account_id: '3100',
        account_name: '3100 - Trade and Other Payables',
        debit: 0,
        credit: total,
      });
      console.log('✅ [JOURNAL DEBUG] Added accounts payable credit line:', total);
      break;
    case 'cash':
      lines.push({
        account_id: '1100',
        account_name: '1100 - Cash on Hand',
        debit: 0,
        credit: total,
      });
      console.log('✅ [JOURNAL DEBUG] Added cash credit line:', total);
      break;
    case 'bank-transfer':
      if (!bankAccountId) {
        console.error('❌ [JOURNAL DEBUG] Bank account ID required but not provided');
        throw new Error('Bank account ID is required for bank transfer payment method');
      }
      lines.push({
        account_id: bankAccountId,
        account_name: 'Bank Account',
        debit: 0,
        credit: total,
      });
      console.log('✅ [JOURNAL DEBUG] Added bank account credit line:', total);
      break;
  }

  console.log('📊 [JOURNAL DEBUG] All journal entry lines:', lines);

  // Calculate totals for validation
  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);
  console.log('🧮 [JOURNAL DEBUG] Balance check:', {
    totalDebits,
    totalCredits,
    difference: Math.abs(totalDebits - totalCredits),
    isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
  });

  const entry: JournalEntryData = {
    entry_number: `PUR-${purchaseNumber}`,
    date,
    description: `Purchase from ${supplier} (${paymentMethod})`,
    reference: supplierInvoiceNumber || purchaseNumber,
    lines,
  };

  console.log('📋 [JOURNAL DEBUG] Journal entry to create:', entry);

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
      },
      {
        account_id: bankAccountId,
        account_name: `Bank Account`,
        debit: 0,
        credit: amount,
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
      },
      {
        account_id: inventoryAccount,
        account_name: inventoryName,
        debit: 0,
        credit: cost,
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
          },
          {
            account_id: inventoryAccount,
            account_name: inventoryName,
            debit: 0,
            credit: absValue,
          },
        ]
      : [
          {
            account_id: inventoryAccount,
            account_name: inventoryName,
            debit: absValue,
            credit: 0,
          },
          {
            account_id: '6500',
            account_name: '6500 - Other Income',
            debit: 0,
            credit: absValue,
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
