import { AccountType } from './accounting';

export interface ChartAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: AccountType;
  isDefault: boolean;
  createdAt: string;
  openingBalance?: number;
}

// MAPPING: 1xxx=Current Assets, 2xxx=Non-Current Assets, 3xxx=Current Liabilities,
// 4xxx=Non-Current Liabilities, 5xxx=Equity, 6xxx=Income, 
// 7xxx=Cost of Sales, 8xxx=Operating Expenses, 9xxx=Other Comprehensive Income
export const defaultChartOfAccounts: Omit<ChartAccount, 'id' | 'createdAt'>[] = [
  // Current Assets (1xxx)
  { accountNumber: '1100', accountName: 'Cash and Cash Equivalents', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1101', accountName: 'Petty Cash', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1102', accountName: 'Cash on Hand', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1103', accountName: 'Bank Account – Current', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1104', accountName: 'Bank Account – Savings', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1105', accountName: 'Accounts Receivable', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1106', accountName: 'Trade Debtors', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1107', accountName: 'Allowance for Credit Losses', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1108', accountName: 'Inventory', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1109', accountName: 'Raw Materials', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1110', accountName: 'Finished Goods', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1111', accountName: 'Prepayments and Deposits', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1112', accountName: 'Prepaid Insurance', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1113', accountName: 'Prepaid Rent', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1114', accountName: 'Short-Term Investments', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1115', accountName: 'Money Market Funds', accountType: 'current-asset', isDefault: true },
  
  // Non-current Assets (2xxx)
  { accountNumber: '2100', accountName: 'Property, Plant & Equipment', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '2101', accountName: 'Land', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '2102', accountName: 'Buildings', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '2103', accountName: 'Machinery', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '2104', accountName: 'Computer Equipment', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '2105', accountName: 'Motor Vehicles', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '2106', accountName: 'Accumulated Depreciation', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '2107', accountName: 'Intangible Assets', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '2108', accountName: 'Goodwill', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '2109', accountName: 'Software Licenses', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '2110', accountName: 'Investments', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '2111', accountName: 'Investment Property', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '2112', accountName: 'Long-Term Equity Investments', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '2113', accountName: 'Deferred Tax Asset', accountType: 'non-current-asset', isDefault: true },
  
  // Current Liabilities (3xxx)
  { accountNumber: '3100', accountName: 'Trade and Other Payables', accountType: 'current-liability', isDefault: true },
  { accountNumber: '3101', accountName: 'Trade Creditors', accountType: 'current-liability', isDefault: true },
  { accountNumber: '3102', accountName: 'Accrued Expenses', accountType: 'current-liability', isDefault: true },
  { accountNumber: '3103', accountName: 'Tax Payables', accountType: 'current-liability', isDefault: true },
  { accountNumber: '3104', accountName: 'VAT Payable', accountType: 'current-liability', isDefault: true },
  { accountNumber: '3105', accountName: 'PAYE Payable', accountType: 'current-liability', isDefault: true },
  { accountNumber: '3106', accountName: 'Income Tax Payable', accountType: 'current-liability', isDefault: true },
  { accountNumber: '3107', accountName: 'Provisions (Short Term)', accountType: 'current-liability', isDefault: true },
  { accountNumber: '3108', accountName: 'Bonus Accruals', accountType: 'current-liability', isDefault: true },
  { accountNumber: '3109', accountName: 'Current Portion of Long-Term Debt', accountType: 'current-liability', isDefault: true },
  { accountNumber: '3110', accountName: 'Current Portion of Lease Liability', accountType: 'current-liability', isDefault: true },
  { accountNumber: '3111', accountName: 'Deferred Income', accountType: 'current-liability', isDefault: true },
  { accountNumber: '3112', accountName: 'Unearned Revenue', accountType: 'current-liability', isDefault: true },
  
  // Non-current Liabilities (4xxx)
  { accountNumber: '4100', accountName: 'Long-Term Borrowings', accountType: 'non-current-liability', isDefault: true },
  { accountNumber: '4101', accountName: 'Bank Loans', accountType: 'non-current-liability', isDefault: true },
  { accountNumber: '4102', accountName: 'Shareholder Loans', accountType: 'non-current-liability', isDefault: true },
  { accountNumber: '4103', accountName: 'Lease Liabilities', accountType: 'non-current-liability', isDefault: true },
  { accountNumber: '4104', accountName: 'Deferred Tax Liability', accountType: 'non-current-liability', isDefault: true },
  
  // Equity (5xxx)
  { accountNumber: '5100', accountName: 'Share Capital', accountType: 'equity', isDefault: true },
  { accountNumber: '5101', accountName: 'Ordinary Share Capital', accountType: 'equity', isDefault: true },
  { accountNumber: '5102', accountName: 'Preference Share Capital', accountType: 'equity', isDefault: true },
  { accountNumber: '5103', accountName: 'Share Premium', accountType: 'equity', isDefault: true },
  { accountNumber: '5104', accountName: 'Retained Earnings', accountType: 'equity', isDefault: true },
  { accountNumber: '5105', accountName: 'Revaluation Surplus', accountType: 'equity', isDefault: true },
  { accountNumber: '5106', accountName: 'Other Reserves', accountType: 'equity', isDefault: true },
  { accountNumber: '5107', accountName: 'Foreign Currency Translation Reserve', accountType: 'equity', isDefault: true },
  { accountNumber: '5108', accountName: "Owner's Drawings", accountType: 'equity', isDefault: true },
  
  // Income (6xxx)
  { accountNumber: '6100', accountName: 'Revenue', accountType: 'revenue', isDefault: true },
  { accountNumber: '6101', accountName: 'Product Sales', accountType: 'revenue', isDefault: true },
  { accountNumber: '6102', accountName: 'Service Income', accountType: 'revenue', isDefault: true },
  { accountNumber: '6103', accountName: 'Other Income', accountType: 'revenue', isDefault: true },
  { accountNumber: '6104', accountName: 'Gain on Disposal of Assets', accountType: 'revenue', isDefault: true },
  { accountNumber: '6105', accountName: 'Interest Income', accountType: 'revenue', isDefault: true },
  { accountNumber: '6106', accountName: 'Dividend Income', accountType: 'revenue', isDefault: true },
  
  // Cost of Sales (7xxx)
  { accountNumber: '7100', accountName: 'Cost of Goods Sold', accountType: 'expense', isDefault: true },
  { accountNumber: '7101', accountName: 'Direct Labour', accountType: 'expense', isDefault: true },
  { accountNumber: '7102', accountName: 'Subcontracting Costs', accountType: 'expense', isDefault: true },
  { accountNumber: '7103', accountName: 'Freight & Import Duties', accountType: 'expense', isDefault: true },
  
  // Operating Expenses (8xxx)
  { accountNumber: '8100', accountName: 'Administrative Expenses', accountType: 'expense', isDefault: true },
  { accountNumber: '8101', accountName: 'Salaries and Wages (Admin)', accountType: 'expense', isDefault: true },
  { accountNumber: '8102', accountName: 'Office Rent', accountType: 'expense', isDefault: true },
  { accountNumber: '8103', accountName: 'Telephone & Internet', accountType: 'expense', isDefault: true },
  { accountNumber: '8104', accountName: 'Stationery & Printing', accountType: 'expense', isDefault: true },
  { accountNumber: '8105', accountName: 'Insurance (Admin)', accountType: 'expense', isDefault: true },
  { accountNumber: '8200', accountName: 'Selling and Distribution Expenses', accountType: 'expense', isDefault: true },
  { accountNumber: '8201', accountName: 'Advertising & Marketing', accountType: 'expense', isDefault: true },
  { accountNumber: '8202', accountName: 'Travel & Accommodation (Sales)', accountType: 'expense', isDefault: true },
  { accountNumber: '8203', accountName: 'Motor Vehicle Expenses', accountType: 'expense', isDefault: true },
  { accountNumber: '8300', accountName: 'Finance Costs', accountType: 'expense', isDefault: true },
  { accountNumber: '8301', accountName: 'Interest Expense – Loans', accountType: 'expense', isDefault: true },
  { accountNumber: '8302', accountName: 'Bank Charges', accountType: 'expense', isDefault: true },
  { accountNumber: '8400', accountName: 'Legal & Professional Fees', accountType: 'expense', isDefault: true },
  { accountNumber: '8401', accountName: 'Audit & Accounting Fees', accountType: 'expense', isDefault: true },
  { accountNumber: '8402', accountName: 'Consulting Fees', accountType: 'expense', isDefault: true },
  
  // Other Comprehensive Income (9xxx)
  { accountNumber: '9100', accountName: 'Current Income Tax Expense', accountType: 'expense', isDefault: true },
  { accountNumber: '9200', accountName: 'Deferred Tax Expense/Income', accountType: 'expense', isDefault: true },
];
