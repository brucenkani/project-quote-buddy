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
  // Assets
  { accountNumber: '101', accountName: 'Cash', accountType: 'asset', isDefault: true },
  { accountNumber: '101-1', accountName: 'Cash on Hand', accountType: 'asset', isDefault: true },
  { accountNumber: '102', accountName: 'Bank Account', accountType: 'asset', isDefault: true },
  { accountNumber: '103', accountName: 'Accounts Receivable', accountType: 'asset', isDefault: true },
  { accountNumber: '104', accountName: 'Inventory', accountType: 'asset', isDefault: true },
  { accountNumber: '105', accountName: 'Prepaid Expenses', accountType: 'asset', isDefault: true },
  { accountNumber: '106', accountName: 'Equipment', accountType: 'asset', isDefault: true },
  { accountNumber: '107', accountName: 'Furniture', accountType: 'asset', isDefault: true },
  { accountNumber: '108', accountName: 'Buildings', accountType: 'asset', isDefault: true },
  
  // Liabilities
  { accountNumber: '201', accountName: 'Accounts Payable', accountType: 'liability', isDefault: true },
  { accountNumber: '202', accountName: 'Salaries Payable', accountType: 'liability', isDefault: true },
  { accountNumber: '203', accountName: 'Taxes Payable', accountType: 'liability', isDefault: true },
  { accountNumber: '204', accountName: 'Loan Payable', accountType: 'liability', isDefault: true },
  
  // Equity
  { accountNumber: '301', accountName: "Owner's Capital", accountType: 'equity', isDefault: true },
  { accountNumber: '302', accountName: "Owner's Drawings", accountType: 'equity', isDefault: true },
  { accountNumber: '303', accountName: 'Retained Earnings', accountType: 'equity', isDefault: true },
  
  // Revenue
  { accountNumber: '401', accountName: 'Sales Revenue', accountType: 'revenue', isDefault: true },
  { accountNumber: '402', accountName: 'Service Income', accountType: 'revenue', isDefault: true },
  { accountNumber: '403', accountName: 'Interest Income', accountType: 'revenue', isDefault: true },
  
  // Expenses
  { accountNumber: '501', accountName: 'Rent Expense', accountType: 'expense', isDefault: true },
  { accountNumber: '502', accountName: 'Salaries Expense', accountType: 'expense', isDefault: true },
  { accountNumber: '503', accountName: 'Utilities Expense', accountType: 'expense', isDefault: true },
  { accountNumber: '504', accountName: 'Supplies Expense', accountType: 'expense', isDefault: true },
  { accountNumber: '505', accountName: 'Insurance Expense', accountType: 'expense', isDefault: true },
  { accountNumber: '506', accountName: 'Depreciation Expense', accountType: 'expense', isDefault: true },
  { accountNumber: '507', accountName: 'Interest Expense', accountType: 'expense', isDefault: true },
];
