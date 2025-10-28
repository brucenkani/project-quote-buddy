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

export const defaultChartOfAccounts: Omit<ChartAccount, 'id' | 'createdAt'>[] = [
  // Current Assets (1100-1599)
  { accountNumber: '1100', accountName: 'Cash and Cash Equivalents', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1110', accountName: 'Petty Cash', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1120', accountName: 'Cash on Hand', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1130', accountName: 'Bank Account – Current', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1140', accountName: 'Bank Account – Savings', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1200', accountName: 'Accounts Receivable', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1210', accountName: 'Trade Debtors', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1220', accountName: 'Allowance for Credit Losses', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1300', accountName: 'Inventory', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1310', accountName: 'Raw Materials', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1320', accountName: 'Finished Goods', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1400', accountName: 'Prepayments and Deposits', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1410', accountName: 'Prepaid Insurance', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1420', accountName: 'Prepaid Rent', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1500', accountName: 'Short-Term Investments', accountType: 'current-asset', isDefault: true },
  { accountNumber: '1510', accountName: 'Money Market Funds', accountType: 'current-asset', isDefault: true },
  
  // Non-current Assets (1600-1999)
  { accountNumber: '1600', accountName: 'Property, Plant & Equipment', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '1610', accountName: 'Land', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '1620', accountName: 'Buildings', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '1630', accountName: 'Machinery', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '1640', accountName: 'Computer Equipment', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '1650', accountName: 'Motor Vehicles', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '1660', accountName: 'Accumulated Depreciation', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '1700', accountName: 'Intangible Assets', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '1710', accountName: 'Goodwill', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '1720', accountName: 'Software Licenses', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '1800', accountName: 'Investments', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '1810', accountName: 'Investment Property', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '1820', accountName: 'Long-Term Equity Investments', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '1900', accountName: 'Deferred Tax Asset', accountType: 'non-current-asset', isDefault: true },
  
  // Current Liabilities (2100-2599)
  { accountNumber: '2100', accountName: 'Trade and Other Payables', accountType: 'current-liability', isDefault: true },
  { accountNumber: '2110', accountName: 'Trade Creditors', accountType: 'current-liability', isDefault: true },
  { accountNumber: '2120', accountName: 'Accrued Expenses', accountType: 'current-liability', isDefault: true },
  { accountNumber: '2200', accountName: 'Tax Payables', accountType: 'current-liability', isDefault: true },
  { accountNumber: '2210', accountName: 'VAT Payable', accountType: 'current-liability', isDefault: true },
  { accountNumber: '2220', accountName: 'PAYE Payable', accountType: 'current-liability', isDefault: true },
  { accountNumber: '2230', accountName: 'Income Tax Payable', accountType: 'current-liability', isDefault: true },
  { accountNumber: '2300', accountName: 'Provisions (Short Term)', accountType: 'current-liability', isDefault: true },
  { accountNumber: '2310', accountName: 'Bonus Accruals', accountType: 'current-liability', isDefault: true },
  { accountNumber: '2400', accountName: 'Current Portion of Long-Term Debt', accountType: 'current-liability', isDefault: true },
  { accountNumber: '2410', accountName: 'Current Portion of Lease Liability', accountType: 'current-liability', isDefault: true },
  { accountNumber: '2500', accountName: 'Deferred Income', accountType: 'current-liability', isDefault: true },
  { accountNumber: '2510', accountName: 'Unearned Revenue', accountType: 'current-liability', isDefault: true },
  
  // Non-current Liabilities (2600-2999)
  { accountNumber: '2600', accountName: 'Long-Term Borrowings', accountType: 'non-current-liability', isDefault: true },
  { accountNumber: '2610', accountName: 'Bank Loans', accountType: 'non-current-liability', isDefault: true },
  { accountNumber: '2620', accountName: 'Shareholder Loans', accountType: 'non-current-liability', isDefault: true },
  { accountNumber: '2700', accountName: 'Lease Liabilities', accountType: 'non-current-liability', isDefault: true },
  { accountNumber: '2800', accountName: 'Deferred Tax Liability', accountType: 'non-current-liability', isDefault: true },
  
  // Equity (3100-3699)
  { accountNumber: '3100', accountName: 'Share Capital', accountType: 'equity', isDefault: true },
  { accountNumber: '3110', accountName: 'Ordinary Share Capital', accountType: 'equity', isDefault: true },
  { accountNumber: '3120', accountName: 'Preference Share Capital', accountType: 'equity', isDefault: true },
  { accountNumber: '3200', accountName: 'Share Premium', accountType: 'equity', isDefault: true },
  { accountNumber: '3300', accountName: 'Retained Earnings', accountType: 'equity', isDefault: true },
  { accountNumber: '3400', accountName: 'Revaluation Surplus', accountType: 'equity', isDefault: true },
  { accountNumber: '3500', accountName: 'Other Reserves', accountType: 'equity', isDefault: true },
  { accountNumber: '3510', accountName: 'Foreign Currency Translation Reserve', accountType: 'equity', isDefault: true },
  { accountNumber: '3600', accountName: "Owner's Drawings", accountType: 'equity', isDefault: true },
  
  // Revenue (4100-4299)
  { accountNumber: '4100', accountName: 'Revenue', accountType: 'revenue', isDefault: true },
  { accountNumber: '4110', accountName: 'Product Sales', accountType: 'revenue', isDefault: true },
  { accountNumber: '4120', accountName: 'Service Income', accountType: 'revenue', isDefault: true },
  { accountNumber: '4200', accountName: 'Other Income', accountType: 'revenue', isDefault: true },
  { accountNumber: '4210', accountName: 'Gain on Disposal of Assets', accountType: 'revenue', isDefault: true },
  { accountNumber: '4220', accountName: 'Interest Income', accountType: 'revenue', isDefault: true },
  { accountNumber: '4230', accountName: 'Dividend Income', accountType: 'revenue', isDefault: true },
  
  // Expenses (5100-8299)
  { accountNumber: '5100', accountName: 'Cost of Goods Sold', accountType: 'expense', isDefault: true },
  { accountNumber: '5110', accountName: 'Direct Labour', accountType: 'expense', isDefault: true },
  { accountNumber: '5120', accountName: 'Subcontracting Costs', accountType: 'expense', isDefault: true },
  { accountNumber: '5130', accountName: 'Freight & Import Duties', accountType: 'expense', isDefault: true },
  { accountNumber: '6100', accountName: 'Administrative Expenses', accountType: 'expense', isDefault: true },
  { accountNumber: '6110', accountName: 'Salaries and Wages (Admin)', accountType: 'expense', isDefault: true },
  { accountNumber: '6120', accountName: 'Office Rent', accountType: 'expense', isDefault: true },
  { accountNumber: '6130', accountName: 'Telephone & Internet', accountType: 'expense', isDefault: true },
  { accountNumber: '6140', accountName: 'Stationery & Printing', accountType: 'expense', isDefault: true },
  { accountNumber: '6150', accountName: 'Insurance (Admin)', accountType: 'expense', isDefault: true },
  { accountNumber: '6200', accountName: 'Selling and Distribution Expenses', accountType: 'expense', isDefault: true },
  { accountNumber: '6210', accountName: 'Advertising & Marketing', accountType: 'expense', isDefault: true },
  { accountNumber: '6220', accountName: 'Travel & Accommodation (Sales)', accountType: 'expense', isDefault: true },
  { accountNumber: '6230', accountName: 'Motor Vehicle Expenses', accountType: 'expense', isDefault: true },
  { accountNumber: '6300', accountName: 'Finance Costs', accountType: 'expense', isDefault: true },
  { accountNumber: '6310', accountName: 'Interest Expense – Loans', accountType: 'expense', isDefault: true },
  { accountNumber: '6320', accountName: 'Bank Charges', accountType: 'expense', isDefault: true },
  { accountNumber: '6400', accountName: 'Legal & Professional Fees', accountType: 'expense', isDefault: true },
  { accountNumber: '6410', accountName: 'Audit & Accounting Fees', accountType: 'expense', isDefault: true },
  { accountNumber: '6420', accountName: 'Consulting Fees', accountType: 'expense', isDefault: true },
  { accountNumber: '8100', accountName: 'Current Income Tax Expense', accountType: 'expense', isDefault: true },
  { accountNumber: '8200', accountName: 'Deferred Tax Expense/Income', accountType: 'expense', isDefault: true },
];
