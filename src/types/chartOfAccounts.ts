import { AccountType } from './accounting';

export type AccountSubCategory =
  // Current Asset sub-categories
  | 'bank-cash'
  | 'accounts-receivable'
  | 'inventories'
  | 'prepayments'
  | 'short-term-investments'
  // Non-Current Asset sub-categories
  | 'property-plant-equipment'
  | 'intangible-assets'
  | 'investments'
  | 'deferred-tax-assets'
  // Current Liability sub-categories
  | 'accounts-payable'
  | 'tax-liabilities'
  | 'provisions'
  | 'deferred-income'
  | 'short-term-debt'
  // Non-Current Liability sub-categories
  | 'long-term-borrowings'
  | 'lease-liabilities'
  | 'deferred-tax-liabilities'
  // Equity sub-categories
  | 'share-capital'
  | 'reserves'
  | 'retained-earnings'
  // Revenue sub-categories
  | 'sales-revenue'
  | 'other-income'
  | 'interest-dividends'
  // Expense sub-categories
  | 'cost-of-sales'
  | 'administrative-expenses'
  | 'selling-distribution'
  | 'finance-costs'
  | 'tax-expense'
  | 'other-comprehensive-income';

export interface ChartAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: AccountType;
  subCategory?: AccountSubCategory;
  isDefault: boolean;
  createdAt: string;
  openingBalance?: number;
}

// Sub-category mapping for each account type
export const accountSubCategories: Record<AccountType, { value: AccountSubCategory; label: string }[]> = {
  'current-asset': [
    { value: 'bank-cash', label: 'Bank & Cash' },
    { value: 'accounts-receivable', label: 'Accounts Receivable' },
    { value: 'inventories', label: 'Inventories' },
    { value: 'prepayments', label: 'Prepayments' },
    { value: 'short-term-investments', label: 'Short-Term Investments' },
  ],
  'non-current-asset': [
    { value: 'property-plant-equipment', label: 'Property, Plant & Equipment' },
    { value: 'intangible-assets', label: 'Intangible Assets' },
    { value: 'investments', label: 'Investments' },
    { value: 'deferred-tax-assets', label: 'Deferred Tax Assets' },
  ],
  'current-liability': [
    { value: 'accounts-payable', label: 'Accounts Payable' },
    { value: 'tax-liabilities', label: 'Tax Liabilities' },
    { value: 'provisions', label: 'Provisions' },
    { value: 'deferred-income', label: 'Deferred Income' },
    { value: 'short-term-debt', label: 'Short-Term Debt' },
  ],
  'non-current-liability': [
    { value: 'long-term-borrowings', label: 'Long-Term Borrowings' },
    { value: 'lease-liabilities', label: 'Lease Liabilities' },
    { value: 'deferred-tax-liabilities', label: 'Deferred Tax Liabilities' },
  ],
  'equity': [
    { value: 'share-capital', label: 'Share Capital' },
    { value: 'reserves', label: 'Reserves' },
    { value: 'retained-earnings', label: 'Retained Earnings' },
  ],
  'revenue': [
    { value: 'sales-revenue', label: 'Sales Revenue' },
    { value: 'other-income', label: 'Other Income' },
    { value: 'interest-dividends', label: 'Interest & Dividends' },
  ],
  'expense': [
    { value: 'cost-of-sales', label: 'Cost of Sales' },
    { value: 'administrative-expenses', label: 'Administrative Expenses' },
    { value: 'selling-distribution', label: 'Selling & Distribution' },
    { value: 'finance-costs', label: 'Finance Costs' },
    { value: 'tax-expense', label: 'Tax Expense' },
    { value: 'other-comprehensive-income', label: 'Other Comprehensive Income' },
  ],
};

// MAPPING: 1xxx=Current Assets, 2xxx=Non-Current Assets, 3xxx=Current Liabilities,
// 4xxx=Non-Current Liabilities, 5xxx=Equity, 6xxx=Income, 
// 7xxx=Cost of Sales, 8xxx=Operating Expenses, 9xxx=Other Comprehensive Income
export const defaultChartOfAccounts: Omit<ChartAccount, 'id' | 'createdAt'>[] = [
  // Current Assets (1xxx)
  { accountNumber: '1100', accountName: 'Cash and Cash Equivalents', accountType: 'current-asset', subCategory: 'bank-cash', isDefault: true },
  { accountNumber: '1101', accountName: 'Petty Cash', accountType: 'current-asset', subCategory: 'bank-cash', isDefault: true },
  { accountNumber: '1102', accountName: 'Cash on Hand', accountType: 'current-asset', subCategory: 'bank-cash', isDefault: true },
  { accountNumber: '1103', accountName: 'Bank Account – Current', accountType: 'current-asset', subCategory: 'bank-cash', isDefault: true },
  { accountNumber: '1104', accountName: 'Bank Account – Savings', accountType: 'current-asset', subCategory: 'bank-cash', isDefault: true },
  { accountNumber: '1105', accountName: 'Accounts Receivable', accountType: 'current-asset', subCategory: 'accounts-receivable', isDefault: true },
  { accountNumber: '1106', accountName: 'Trade Debtors', accountType: 'current-asset', subCategory: 'accounts-receivable', isDefault: true },
  { accountNumber: '1107', accountName: 'Allowance for Credit Losses', accountType: 'current-asset', subCategory: 'accounts-receivable', isDefault: true },
  { accountNumber: '1108', accountName: 'Inventory', accountType: 'current-asset', subCategory: 'inventories', isDefault: true },
  { accountNumber: '1109', accountName: 'Raw Materials', accountType: 'current-asset', subCategory: 'inventories', isDefault: true },
  { accountNumber: '1110', accountName: 'Finished Goods', accountType: 'current-asset', subCategory: 'inventories', isDefault: true },
  { accountNumber: '1111', accountName: 'Prepayments and Deposits', accountType: 'current-asset', subCategory: 'prepayments', isDefault: true },
  { accountNumber: '1112', accountName: 'Prepaid Insurance', accountType: 'current-asset', subCategory: 'prepayments', isDefault: true },
  { accountNumber: '1113', accountName: 'Prepaid Rent', accountType: 'current-asset', subCategory: 'prepayments', isDefault: true },
  { accountNumber: '1114', accountName: 'Short-Term Investments', accountType: 'current-asset', subCategory: 'short-term-investments', isDefault: true },
  { accountNumber: '1115', accountName: 'Money Market Funds', accountType: 'current-asset', subCategory: 'short-term-investments', isDefault: true },
  
  // Non-current Assets (2xxx)
  { accountNumber: '2100', accountName: 'Property, Plant & Equipment', accountType: 'non-current-asset', subCategory: 'property-plant-equipment', isDefault: true },
  { accountNumber: '2101', accountName: 'Land', accountType: 'non-current-asset', subCategory: 'property-plant-equipment', isDefault: true },
  { accountNumber: '2102', accountName: 'Buildings', accountType: 'non-current-asset', subCategory: 'property-plant-equipment', isDefault: true },
  { accountNumber: '2103', accountName: 'Machinery', accountType: 'non-current-asset', subCategory: 'property-plant-equipment', isDefault: true },
  { accountNumber: '2104', accountName: 'Computer Equipment', accountType: 'non-current-asset', subCategory: 'property-plant-equipment', isDefault: true },
  { accountNumber: '2105', accountName: 'Motor Vehicles', accountType: 'non-current-asset', subCategory: 'property-plant-equipment', isDefault: true },
  { accountNumber: '2106', accountName: 'Accumulated Depreciation', accountType: 'non-current-asset', subCategory: 'property-plant-equipment', isDefault: true },
  { accountNumber: '2107', accountName: 'Intangible Assets', accountType: 'non-current-asset', subCategory: 'intangible-assets', isDefault: true },
  { accountNumber: '2108', accountName: 'Goodwill', accountType: 'non-current-asset', subCategory: 'intangible-assets', isDefault: true },
  { accountNumber: '2109', accountName: 'Software Licenses', accountType: 'non-current-asset', subCategory: 'intangible-assets', isDefault: true },
  { accountNumber: '2110', accountName: 'Investments', accountType: 'non-current-asset', subCategory: 'investments', isDefault: true },
  { accountNumber: '2111', accountName: 'Investment Property', accountType: 'non-current-asset', subCategory: 'investments', isDefault: true },
  { accountNumber: '2112', accountName: 'Long-Term Equity Investments', accountType: 'non-current-asset', subCategory: 'investments', isDefault: true },
  { accountNumber: '2113', accountName: 'Deferred Tax Asset', accountType: 'non-current-asset', subCategory: 'deferred-tax-assets', isDefault: true },
  
  // Current Liabilities (3xxx)
  { accountNumber: '3100', accountName: 'Trade and Other Payables', accountType: 'current-liability', subCategory: 'accounts-payable', isDefault: true },
  { accountNumber: '3101', accountName: 'Trade Creditors', accountType: 'current-liability', subCategory: 'accounts-payable', isDefault: true },
  { accountNumber: '3102', accountName: 'Accrued Expenses', accountType: 'current-liability', subCategory: 'accounts-payable', isDefault: true },
  { accountNumber: '3103', accountName: 'Tax Payables', accountType: 'current-liability', subCategory: 'tax-liabilities', isDefault: true },
  { accountNumber: '3104', accountName: 'VAT Payable', accountType: 'current-liability', subCategory: 'tax-liabilities', isDefault: true },
  { accountNumber: '3105', accountName: 'PAYE Payable', accountType: 'current-liability', subCategory: 'tax-liabilities', isDefault: true },
  { accountNumber: '3106', accountName: 'Income Tax Payable', accountType: 'current-liability', subCategory: 'tax-liabilities', isDefault: true },
  { accountNumber: '3107', accountName: 'Provisions (Short Term)', accountType: 'current-liability', subCategory: 'provisions', isDefault: true },
  { accountNumber: '3108', accountName: 'Bonus Accruals', accountType: 'current-liability', subCategory: 'provisions', isDefault: true },
  { accountNumber: '3109', accountName: 'Current Portion of Long-Term Debt', accountType: 'current-liability', subCategory: 'short-term-debt', isDefault: true },
  { accountNumber: '3110', accountName: 'Current Portion of Lease Liability', accountType: 'current-liability', subCategory: 'short-term-debt', isDefault: true },
  { accountNumber: '3111', accountName: 'Deferred Income', accountType: 'current-liability', subCategory: 'deferred-income', isDefault: true },
  { accountNumber: '3112', accountName: 'Unearned Revenue', accountType: 'current-liability', subCategory: 'deferred-income', isDefault: true },
  
  // Non-current Liabilities (4xxx)
  { accountNumber: '4100', accountName: 'Long-Term Borrowings', accountType: 'non-current-liability', subCategory: 'long-term-borrowings', isDefault: true },
  { accountNumber: '4101', accountName: 'Bank Loans', accountType: 'non-current-liability', subCategory: 'long-term-borrowings', isDefault: true },
  { accountNumber: '4102', accountName: 'Shareholder Loans', accountType: 'non-current-liability', subCategory: 'long-term-borrowings', isDefault: true },
  { accountNumber: '4103', accountName: 'Lease Liabilities', accountType: 'non-current-liability', subCategory: 'lease-liabilities', isDefault: true },
  { accountNumber: '4104', accountName: 'Deferred Tax Liability', accountType: 'non-current-liability', subCategory: 'deferred-tax-liabilities', isDefault: true },
  
  // Equity (5xxx)
  { accountNumber: '5100', accountName: 'Share Capital', accountType: 'equity', subCategory: 'share-capital', isDefault: true },
  { accountNumber: '5101', accountName: 'Ordinary Share Capital', accountType: 'equity', subCategory: 'share-capital', isDefault: true },
  { accountNumber: '5102', accountName: 'Preference Share Capital', accountType: 'equity', subCategory: 'share-capital', isDefault: true },
  { accountNumber: '5103', accountName: 'Share Premium', accountType: 'equity', subCategory: 'reserves', isDefault: true },
  { accountNumber: '5104', accountName: 'Retained Earnings', accountType: 'equity', subCategory: 'retained-earnings', isDefault: true },
  { accountNumber: '5105', accountName: 'Revaluation Surplus', accountType: 'equity', subCategory: 'reserves', isDefault: true },
  { accountNumber: '5106', accountName: 'Other Reserves', accountType: 'equity', subCategory: 'reserves', isDefault: true },
  { accountNumber: '5107', accountName: 'Foreign Currency Translation Reserve', accountType: 'equity', subCategory: 'reserves', isDefault: true },
  { accountNumber: '5108', accountName: "Owner's Drawings", accountType: 'equity', subCategory: 'retained-earnings', isDefault: true },
  
  // Income (6xxx)
  { accountNumber: '6100', accountName: 'Revenue', accountType: 'revenue', subCategory: 'sales-revenue', isDefault: true },
  { accountNumber: '6101', accountName: 'Product Sales', accountType: 'revenue', subCategory: 'sales-revenue', isDefault: true },
  { accountNumber: '6102', accountName: 'Service Income', accountType: 'revenue', subCategory: 'sales-revenue', isDefault: true },
  { accountNumber: '6103', accountName: 'Other Income', accountType: 'revenue', subCategory: 'other-income', isDefault: true },
  { accountNumber: '6104', accountName: 'Gain on Disposal of Assets', accountType: 'revenue', subCategory: 'other-income', isDefault: true },
  { accountNumber: '6105', accountName: 'Interest Income', accountType: 'revenue', subCategory: 'interest-dividends', isDefault: true },
  { accountNumber: '6106', accountName: 'Dividend Income', accountType: 'revenue', subCategory: 'interest-dividends', isDefault: true },
  
  // Cost of Sales (7xxx)
  { accountNumber: '7100', accountName: 'Cost of Goods Sold', accountType: 'expense', subCategory: 'cost-of-sales', isDefault: true },
  { accountNumber: '7101', accountName: 'Direct Labour', accountType: 'expense', subCategory: 'cost-of-sales', isDefault: true },
  { accountNumber: '7102', accountName: 'Subcontracting Costs', accountType: 'expense', subCategory: 'cost-of-sales', isDefault: true },
  { accountNumber: '7103', accountName: 'Freight & Import Duties', accountType: 'expense', subCategory: 'cost-of-sales', isDefault: true },
  // Operating Expenses (8xxx)
  { accountNumber: '8100', accountName: 'Administrative Expenses', accountType: 'expense', subCategory: 'administrative-expenses', isDefault: true },
  { accountNumber: '8101', accountName: 'Salaries and Wages (Admin)', accountType: 'expense', subCategory: 'administrative-expenses', isDefault: true },
  { accountNumber: '8102', accountName: 'Office Rent', accountType: 'expense', subCategory: 'administrative-expenses', isDefault: true },
  { accountNumber: '8103', accountName: 'Telephone & Internet', accountType: 'expense', subCategory: 'administrative-expenses', isDefault: true },
  { accountNumber: '8104', accountName: 'Stationery & Printing', accountType: 'expense', subCategory: 'administrative-expenses', isDefault: true },
  { accountNumber: '8105', accountName: 'Insurance (Admin)', accountType: 'expense', subCategory: 'administrative-expenses', isDefault: true },
  { accountNumber: '8106', accountName: 'Selling and Distribution Expenses', accountType: 'expense', subCategory: 'selling-distribution', isDefault: true },
  { accountNumber: '8107', accountName: 'Advertising & Marketing', accountType: 'expense', subCategory: 'selling-distribution', isDefault: true },
  { accountNumber: '8108', accountName: 'Travel & Accommodation (Sales)', accountType: 'expense', subCategory: 'selling-distribution', isDefault: true },
  { accountNumber: '8109', accountName: 'Motor Vehicle Expenses', accountType: 'expense', subCategory: 'selling-distribution', isDefault: true },
  { accountNumber: '8110', accountName: 'Finance Costs', accountType: 'expense', subCategory: 'finance-costs', isDefault: true },
  { accountNumber: '8111', accountName: 'Interest Expense – Loans', accountType: 'expense', subCategory: 'finance-costs', isDefault: true },
  { accountNumber: '8112', accountName: 'Bank Charges', accountType: 'expense', subCategory: 'finance-costs', isDefault: true },
  { accountNumber: '8113', accountName: 'Legal & Professional Fees', accountType: 'expense', subCategory: 'administrative-expenses', isDefault: true },
  { accountNumber: '8114', accountName: 'Audit & Accounting Fees', accountType: 'expense', subCategory: 'administrative-expenses', isDefault: true },
  { accountNumber: '8115', accountName: 'Consulting Fees', accountType: 'expense', subCategory: 'administrative-expenses', isDefault: true },
  { accountNumber: '8116', accountName: 'Current Income Tax Expense', accountType: 'expense', subCategory: 'tax-expense', isDefault: true },
  { accountNumber: '8117', accountName: 'Deferred Tax Expense/Income', accountType: 'expense', subCategory: 'tax-expense', isDefault: true },
  
  // Other Comprehensive Income (9xxx)
  { accountNumber: '9100', accountName: 'Revaluation Gains on PPE', accountType: 'expense', subCategory: 'other-comprehensive-income', isDefault: true },
  { accountNumber: '9101', accountName: 'Actuarial Gains/Losses on Pensions', accountType: 'expense', subCategory: 'other-comprehensive-income', isDefault: true },
];
