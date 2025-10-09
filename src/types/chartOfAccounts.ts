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
  // Current Assets (100-149)
  { accountNumber: '101', accountName: 'Cash', accountType: 'current-asset', isDefault: true },
  { accountNumber: '102', accountName: 'Cash on Hand', accountType: 'current-asset', isDefault: true },
  { accountNumber: '103', accountName: 'Bank Account', accountType: 'current-asset', isDefault: true },
  { accountNumber: '104', accountName: 'Accounts Receivable', accountType: 'current-asset', isDefault: true },
  { accountNumber: '105', accountName: 'Inventory', accountType: 'current-asset', isDefault: true },
  { accountNumber: '106', accountName: 'Prepaid Expenses', accountType: 'current-asset', isDefault: true },
  
  // Non-current Assets (150-199)
  { accountNumber: '151', accountName: 'Equipment', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '152', accountName: 'Furniture', accountType: 'non-current-asset', isDefault: true },
  { accountNumber: '153', accountName: 'Buildings', accountType: 'non-current-asset', isDefault: true },
  
  // Current Liabilities (200-249)
  { accountNumber: '201', accountName: 'Accounts Payable', accountType: 'current-liability', isDefault: true },
  { accountNumber: '202', accountName: 'Salaries Payable', accountType: 'current-liability', isDefault: true },
  { accountNumber: '203', accountName: 'Taxes Payable', accountType: 'current-liability', isDefault: true },
  
  // Non-current Liabilities (250-299)
  { accountNumber: '251', accountName: 'Loan Payable', accountType: 'non-current-liability', isDefault: true },
  
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
