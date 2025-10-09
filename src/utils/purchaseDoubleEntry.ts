import { JournalEntry, JournalEntryLine } from '@/types/accounting';
import { Purchase } from '@/types/purchase';
import { InventoryItem } from '@/types/inventory';
import { CompanyType } from '@/types/settings';
import { saveJournalEntry } from './accountingStorage';
import { saveInventoryItem, loadInventory } from './inventoryStorage';

/**
 * Purchase Double-Entry Accounting - Business Type Specific
 * Implements different accounting treatment based on business type
 */

const validateBalance = (entries: JournalEntryLine[]): boolean => {
  const totalDebits = entries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredits = entries.reduce((sum, entry) => sum + entry.credit, 0);
  return Math.abs(totalDebits - totalCredits) < 0.01;
};

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
 * TRADING BUSINESS: Purchases → Inventory (Perpetual)
 * Dr Inventory
 * Cr Accounts Payable
 */
export const recordTradingPurchase = (purchase: Purchase): JournalEntry => {
  const entries: JournalEntryLine[] = [
    {
      id: crypto.randomUUID(),
      account: 'Inventory - Finished Goods',
      accountType: 'current-asset',
      debit: purchase.total,
      credit: 0,
      description: `Purchase ${purchase.purchaseNumber} - ${purchase.vendor}`,
    },
    {
      id: crypto.randomUUID(),
      account: 'Accounts Payable',
      accountType: 'current-liability',
      debit: 0,
      credit: purchase.total,
      description: `Payable to ${purchase.vendor}`,
    },
  ];

  // Update inventory quantities
  if (purchase.inventoryMethod === 'perpetual') {
    updateInventoryFromPurchase(purchase, 'finished-products');
  }

  return createValidatedJournalEntry(
    purchase.date,
    purchase.purchaseNumber,
    `Purchase from ${purchase.vendor}`,
    entries
  );
};

/**
 * CONTRACTOR BUSINESS: Purchases → WIP or Inventory
 * If project-specific: Dr Work-in-Progress, Cr Accounts Payable
 * If inventory: Dr Inventory, Cr Accounts Payable
 */
export const recordContractorPurchase = (purchase: Purchase): JournalEntry => {
  const entries: JournalEntryLine[] = [];

  if (purchase.projectId) {
    // Direct to project WIP
    entries.push({
      id: crypto.randomUUID(),
      account: `Work-in-Progress - Project ${purchase.projectId}`,
      accountType: 'current-asset',
      debit: purchase.total,
      credit: 0,
      description: `Materials for Project ${purchase.projectId}`,
    });
  } else {
    // To inventory for later use
    entries.push({
      id: crypto.randomUUID(),
      account: 'Inventory - Raw Materials',
      accountType: 'current-asset',
      debit: purchase.total,
      credit: 0,
      description: `Purchase ${purchase.purchaseNumber} - ${purchase.vendor}`,
    });

    if (purchase.inventoryMethod === 'perpetual') {
      updateInventoryFromPurchase(purchase, 'raw-materials');
    }
  }

  entries.push({
    id: crypto.randomUUID(),
    account: 'Accounts Payable',
    accountType: 'current-liability',
    debit: 0,
    credit: purchase.total,
    description: `Payable to ${purchase.vendor}`,
  });

  return createValidatedJournalEntry(
    purchase.date,
    purchase.purchaseNumber,
    `Purchase from ${purchase.vendor}`,
    entries
  );
};

/**
 * MANUFACTURING BUSINESS: Purchases → Raw Materials Inventory
 * Dr Raw Materials Inventory
 * Cr Accounts Payable
 */
export const recordManufacturingPurchase = (purchase: Purchase): JournalEntry => {
  const entries: JournalEntryLine[] = [
    {
      id: crypto.randomUUID(),
      account: 'Inventory - Raw Materials',
      accountType: 'current-asset',
      debit: purchase.total,
      credit: 0,
      description: `Purchase ${purchase.purchaseNumber} - ${purchase.vendor}`,
    },
    {
      id: crypto.randomUUID(),
      account: 'Accounts Payable',
      accountType: 'current-liability',
      debit: 0,
      credit: purchase.total,
      description: `Payable to ${purchase.vendor}`,
    },
  ];

  if (purchase.inventoryMethod === 'perpetual') {
    updateInventoryFromPurchase(purchase, 'raw-materials');
  }

  return createValidatedJournalEntry(
    purchase.date,
    purchase.purchaseNumber,
    `Purchase from ${purchase.vendor}`,
    entries
  );
};

/**
 * Manufacturing: Issue materials to production (Raw Materials → WIP)
 * Dr Work-in-Progress
 * Cr Raw Materials Inventory
 */
export const recordMaterialsToProduction = (
  materialCost: number,
  productionBatch: string,
  date: string
): JournalEntry => {
  const entries: JournalEntryLine[] = [
    {
      id: crypto.randomUUID(),
      account: 'Work-in-Progress',
      accountType: 'current-asset',
      debit: materialCost,
      credit: 0,
      description: `Materials issued to production - ${productionBatch}`,
    },
    {
      id: crypto.randomUUID(),
      account: 'Inventory - Raw Materials',
      accountType: 'current-asset',
      debit: 0,
      credit: materialCost,
      description: `Materials issued from stock`,
    },
  ];

  return createValidatedJournalEntry(
    date,
    `PROD-${productionBatch}`,
    `Materials to Production - ${productionBatch}`,
    entries
  );
};

/**
 * Manufacturing: Complete production (WIP → Finished Goods)
 * Dr Finished Goods Inventory
 * Cr Work-in-Progress
 */
export const recordProductionCompletion = (
  productionCost: number,
  productionBatch: string,
  date: string
): JournalEntry => {
  const entries: JournalEntryLine[] = [
    {
      id: crypto.randomUUID(),
      account: 'Inventory - Finished Goods',
      accountType: 'current-asset',
      debit: productionCost,
      credit: 0,
      description: `Production completed - ${productionBatch}`,
    },
    {
      id: crypto.randomUUID(),
      account: 'Work-in-Progress',
      accountType: 'current-asset',
      debit: 0,
      credit: productionCost,
      description: `WIP transferred to finished goods`,
    },
  ];

  return createValidatedJournalEntry(
    date,
    `PROD-${productionBatch}`,
    `Production Completion - ${productionBatch}`,
    entries
  );
};

/**
 * Record COGS when inventory is sold (any business type)
 * Dr Cost of Goods Sold
 * Cr Inventory (Finished Goods)
 */
export const recordCOGS = (
  cost: number,
  invoiceNumber: string,
  date: string,
  companyType: CompanyType
): JournalEntry => {
  const inventoryAccount = companyType === 'trading' 
    ? 'Inventory - Finished Goods'
    : companyType === 'manufacturer'
    ? 'Inventory - Finished Goods'
    : 'Work-in-Progress';

  const entries: JournalEntryLine[] = [
    {
      id: crypto.randomUUID(),
      account: 'Cost of Goods Sold',
      accountType: 'expense',
      debit: cost,
      credit: 0,
      description: `COGS for ${invoiceNumber}`,
    },
    {
      id: crypto.randomUUID(),
      account: inventoryAccount,
      accountType: 'current-asset',
      debit: 0,
      credit: cost,
      description: `Inventory reduction for ${invoiceNumber}`,
    },
  ];

  return createValidatedJournalEntry(
    date,
    invoiceNumber,
    `Cost of Goods Sold - ${invoiceNumber}`,
    entries
  );
};

/**
 * Update inventory quantities from purchase (Perpetual method)
 */
const updateInventoryFromPurchase = (
  purchase: Purchase,
  defaultType: 'raw-materials' | 'finished-products'
): void => {
  const inventory = loadInventory();

  purchase.lineItems.forEach(item => {
    if (item.inventoryItemId) {
      // Update existing inventory item
      const inventoryItem = inventory.find(i => i.id === item.inventoryItemId);
      if (inventoryItem) {
        inventoryItem.quantity += item.quantity;
        inventoryItem.totalValue = inventoryItem.quantity * inventoryItem.unitCost;
        inventoryItem.updatedAt = new Date().toISOString();
        saveInventoryItem(inventoryItem);
      }
    } else {
      // Create new inventory item
      const newItem: InventoryItem = {
        id: crypto.randomUUID(),
        name: item.description,
        type: defaultType,
        sku: `AUTO-${Date.now()}`,
        category: item.category || 'General',
        description: item.description,
        unit: 'unit',
        quantity: item.quantity,
        minQuantity: 0,
        unitCost: item.unitCost,
        totalValue: item.total,
        supplier: purchase.vendor,
        location: 'Main Warehouse',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveInventoryItem(newItem);
    }
  });
};

/**
 * Main purchase recording function - routes to appropriate business type handler
 */
export const recordPurchase = (purchase: Purchase, companyType: CompanyType): JournalEntry => {
  switch (companyType) {
    case 'trading':
      return recordTradingPurchase(purchase);
    case 'contractor':
      return recordContractorPurchase(purchase);
    case 'manufacturer':
      return recordManufacturingPurchase(purchase);
    case 'professional-services':
      throw new Error('Professional services businesses do not have purchases');
    default:
      throw new Error(`Unknown company type: ${companyType}`);
  }
};
