import { supabase } from '@/integrations/supabase/client';
import { Purchase, PurchaseLineItem } from '@/types/purchase';
import { PurchaseOrder } from '@/types/purchaseOrder';
import { createInventoryMovement } from './inventoryMovementStorage';
import { toast } from 'sonner';

/**
 * Receives goods from a purchase order
 * Creates inventory movements and updates quantities
 */
export const receiveGoodsFromPO = async (
  poId: string,
  receivedItems: Array<{ lineItemId: string; quantityReceived: number }>,
  companyId: string
): Promise<void> => {
  try {
    // Get the PO
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select('*, purchase_order_line_items(*)')
      .eq('id', poId)
      .single();

    if (poError) throw poError;
    if (po.status === 'received') {
      toast.error('This purchase order has already been fully received');
      return;
    }

    // Process each received item
    for (const received of receivedItems) {
      const lineItem = po.purchase_order_line_items.find(
        (li: any) => li.id === received.lineItemId
      );

      if (!lineItem) continue;

      // Check if we're not over-receiving
      const currentReceived = (lineItem as any).received_quantity || 0;
      const totalReceived = currentReceived + received.quantityReceived;
      if (totalReceived > lineItem.quantity) {
        toast.error(`Cannot receive more than ordered for ${lineItem.description}`);
        continue;
      }

      // Find matching inventory item by description (you may want to add inventory_item_id to line items)
      const { data: inventoryItems } = await supabase
        .from('inventory_items')
        .select('id, name')
        .eq('company_id', companyId)
        .ilike('name', `%${lineItem.description}%`)
        .limit(1);

      if (inventoryItems && inventoryItems.length > 0) {
        // Create inventory movement
        await createInventoryMovement(
          inventoryItems[0].id,
          'IN',
          received.quantityReceived,
          Number(lineItem.unit_price),
          poId,
          'PURCHASE_ORDER',
          companyId,
          `Received from PO ${po.po_number}`
        );
      }

      // Update received quantity on line item
      await supabase
        .from('purchase_order_line_items')
        .update({ received_quantity: totalReceived } as any)
        .eq('id', received.lineItemId);
    }

    // Check if all items are fully received
    const { data: allLineItems } = await supabase
      .from('purchase_order_line_items')
      .select('quantity, received_quantity')
      .eq('purchase_order_id', poId);

    const fullyReceived = allLineItems?.every(
      (li: any) => li.received_quantity >= li.quantity
    );

    if (fullyReceived) {
      await supabase
        .from('purchase_orders')
        .update({ status: 'received', received_date: new Date().toISOString() })
        .eq('id', poId);
    }

    toast.success('Goods received successfully');
  } catch (error) {
    console.error('Failed to receive goods:', error);
    toast.error('Failed to receive goods');
    throw error;
  }
};

/**
 * Captures supplier invoice and creates purchase record
 * Prevents duplicate invoices using supplier_invoice_number
 */
export const captureSupplierInvoice = async (
  purchase: Purchase,
  companyId: string
): Promise<string> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check for duplicate invoice
    if (purchase.supplierInvoiceNumber) {
      const { data: existing } = await supabase
        .from('purchases')
        .select('id')
        .eq('company_id', companyId)
        .eq('supplier_id', purchase.vendor)
        .eq('supplier_invoice_number', purchase.supplierInvoiceNumber)
        .maybeSingle();

      if (existing) {
        toast.error('Duplicate invoice detected for this supplier');
        throw new Error('Duplicate invoice');
      }
    }

    // Create purchase record
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: user.id,
        company_id: companyId,
        purchase_number: purchase.purchaseNumber,
        supplier_id: purchase.vendor,
        issue_date: purchase.date,
        due_date: purchase.dueDate,
        subtotal: purchase.subtotal,
        tax_amount: purchase.taxAmount,
        total_amount: purchase.total,
        status: purchase.status,
        notes: purchase.notes,
        supplier_invoice_number: purchase.supplierInvoiceNumber,
        invoice_date: purchase.invoiceDate,
        received_date: purchase.receivedDate,
      })
      .select()
      .single();

    if (purchaseError) throw purchaseError;

    // Create line items
    for (const item of purchase.lineItems) {
      await supabase
        .from('purchase_line_items')
        .insert({
          purchase_id: purchaseData.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitCost,
          tax_rate: purchase.taxRate,
          amount: item.total,
        });

      // If item has inventory link, create movement
      if (item.inventoryItemId) {
        await createInventoryMovement(
          item.inventoryItemId,
          'IN',
          item.quantity,
          item.unitCost,
          purchaseData.id,
          'PURCHASE',
          companyId,
          `Purchase ${purchase.purchaseNumber}`
        );
      }
    }

    // Create journal entry for double-entry bookkeeping
    await createPurchaseJournalEntry(purchase, purchaseData.id, user.id, companyId);

    toast.success('Invoice captured successfully');
    return purchaseData.id;
  } catch (error) {
    console.error('Failed to capture invoice:', error);
    toast.error('Failed to capture invoice');
    throw error;
  }
};

/**
 * Creates journal entry for purchase (double-entry bookkeeping)
 */
const createPurchaseJournalEntry = async (
  purchase: Purchase,
  purchaseId: string,
  userId: string,
  companyId: string
): Promise<void> => {
  try {
    // Create journal entry
    const { data: journal, error: journalError } = await supabase
      .from('journal_entries')
      .insert({
        user_id: userId,
        company_id: companyId,
        entry_number: `PUR-${purchase.purchaseNumber}`,
        date: purchase.date,
        description: `Purchase from ${purchase.vendor}`,
        reference: purchase.supplierInvoiceNumber || purchase.purchaseNumber,
      })
      .select()
      .single();

    if (journalError) throw journalError;

    // Debit: Inventory or Expense
    await supabase
      .from('journal_entry_lines')
      .insert({
        journal_entry_id: journal.id,
        account_id: '1108', // Inventory account
        account_name: '1108 - Inventory',
        debit: purchase.total,
        credit: 0,
      });

    // Credit: Accounts Payable
    await supabase
      .from('journal_entry_lines')
      .insert({
        journal_entry_id: journal.id,
        account_id: '3100', // Accounts Payable
        account_name: '3100 - Trade and Other Payables',
        debit: 0,
        credit: purchase.total,
      });
  } catch (error) {
    console.error('Failed to create journal entry:', error);
    // Don't throw - purchase is already created
  }
};

/**
 * Converts approved PO to Purchase (invoice)
 */
export const convertPOToPurchase = async (
  poId: string,
  supplierInvoiceNumber: string,
  companyId: string
): Promise<string> => {
  try {
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select('*, purchase_order_line_items(*)')
      .eq('id', poId)
      .single();

    if (poError) throw poError;

    // Create purchase from PO
    const purchase: Purchase = {
      id: '',
      purchaseNumber: `PUR-${Date.now()}`,
      vendor: po.supplier_id,
      date: new Date().toISOString().split('T')[0],
      dueDate: po.delivery_date,
      lineItems: po.purchase_order_line_items.map((item: any) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        receivedQuantity: item.received_quantity || 0,
        unitCost: Number(item.unit_price),
        total: Number(item.amount),
      })),
      subtotal: Number(po.subtotal),
      taxRate: 15,
      taxAmount: Number(po.tax_amount),
      discount: 0,
      total: Number(po.total_amount),
      status: 'received',
      notes: po.notes,
      inventoryMethod: 'perpetual',
      supplierInvoiceNumber,
      invoiceDate: new Date().toISOString().split('T')[0],
      receivedDate: po.received_date,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const purchaseId = await captureSupplierInvoice(purchase, companyId);

    // Update PO status
    await supabase
      .from('purchase_orders')
      .update({ status: 'converted', invoice_number: supplierInvoiceNumber })
      .eq('id', poId);

    return purchaseId;
  } catch (error) {
    console.error('Failed to convert PO to purchase:', error);
    throw error;
  }
};
