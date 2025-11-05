import { supabase } from '@/integrations/supabase/client';
import { Invoice, LineItem } from '@/types/invoice';
import { getInventoryAccount, getCOGSAccount } from '@/utils/accountMapping';

/**
 * Process inventory movements and COGS when invoice is saved
 * Creates inventory movements (OUT) and records COGS journal entry
 */
export const processInvoiceInventory = async (
  invoice: Invoice,
  userId: string,
  companyId: string
): Promise<void> => {
  try {

    // Filter line items that are inventory type
    const inventoryLineItems = invoice.lineItems.filter(
      item => item.lineItemType === 'inventory' && item.inventoryItemId
    );

    if (inventoryLineItems.length === 0) return;

    // Process each inventory line item
    for (const item of inventoryLineItems) {
      // Get the inventory item to determine cost
      const { data: inventoryItem, error: invError } = await supabase
        .from('inventory_items')
        .select('cost_price, quantity')
        .eq('id', item.inventoryItemId!)
        .single();

      if (invError || !inventoryItem) {
        console.error('Failed to fetch inventory item:', invError);
        continue;
      }

      // Check if we have enough stock
      if (inventoryItem.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${item.description}. Available: ${inventoryItem.quantity}, Required: ${item.quantity}`);
      }

      // Create inventory movement (OUT)
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          item_id: item.inventoryItemId,
          movement_type: 'OUT',
          quantity: -item.quantity, // Negative for OUT
          unit_cost: inventoryItem.cost_price,
          reference_id: invoice.id,
          reference_type: 'SALE',
          user_id: userId,
          company_id: companyId,
          notes: `Sale via invoice ${invoice.invoiceNumber}`,
        });

      if (movementError) throw movementError;

      // Update inventory item quantity
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({
          quantity: inventoryItem.quantity - item.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.inventoryItemId);

      if (updateError) throw updateError;
    }

    // Create COGS journal entry for all inventory items
    await createCOGSJournalEntry(invoice, inventoryLineItems, userId, companyId);

  } catch (error) {
    console.error('Failed to process invoice inventory:', error);
    throw error;
  }
};

/**
 * Create journal entry for Cost of Goods Sold (COGS)
 * DR COGS
 * CR Inventory
 */
const createCOGSJournalEntry = async (
  invoice: Invoice,
  inventoryLineItems: LineItem[],
  userId: string,
  companyId: string
): Promise<void> => {
  try {

    // Calculate total COGS
    let totalCOGS = 0;
    for (const item of inventoryLineItems) {
      const { data: inventoryItem } = await supabase
        .from('inventory_items')
        .select('cost_price')
        .eq('id', item.inventoryItemId!)
        .single();

      if (inventoryItem) {
        totalCOGS += inventoryItem.cost_price * item.quantity;
      }
    }

    if (totalCOGS === 0) return;

    // Get account strings
    const cogsAccount = await getCOGSAccount();
    const inventoryAccount = await getInventoryAccount();

    // Generate journal entry number
    const { data: maxEntry } = await supabase
      .from('journal_entries')
      .select('entry_number')
      .eq('company_id', companyId)
      .order('entry_number', { ascending: false })
      .limit(1)
      .single();

    const lastNumber = maxEntry?.entry_number
      ? parseInt(maxEntry.entry_number.replace('JE-', ''))
      : 0;
    const entryNumber = `JE-${String(lastNumber + 1).padStart(5, '0')}`;

    // Create journal entry header
    const { data: journalEntry, error: entryError } = await supabase
      .from('journal_entries')
      .insert({
        entry_number: entryNumber,
        date: invoice.issueDate,
        description: `COGS for invoice ${invoice.invoiceNumber}`,
        reference: `${invoice.invoiceNumber}-COGS`,
        user_id: userId,
        company_id: companyId,
        is_manual: false,
      })
      .select()
      .single();

    if (entryError || !journalEntry) throw entryError;

    // Create journal entry lines
    const { error: linesError } = await supabase
      .from('journal_entry_lines')
      .insert([
        {
          journal_entry_id: journalEntry.id,
          account_id: cogsAccount.split(' - ')[0],
          account_name: cogsAccount,
          debit: totalCOGS,
          credit: 0,
        },
        {
          journal_entry_id: journalEntry.id,
          account_id: inventoryAccount.split(' - ')[0],
          account_name: inventoryAccount,
          debit: 0,
          credit: totalCOGS,
        },
      ]);

    if (linesError) throw linesError;

  } catch (error) {
    console.error('Failed to create COGS journal entry:', error);
    throw error;
  }
};
