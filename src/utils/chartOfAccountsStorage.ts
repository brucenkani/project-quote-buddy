import { ChartAccount, defaultChartOfAccounts } from '@/types/chartOfAccounts';

const CHART_KEY = 'quotebuilder-chart-of-accounts';

// Migration function to update old account types and numbers to new format
const migrateAccountTypes = (accounts: ChartAccount[]): ChartAccount[] => {
  // Canonical mapping by account name
  const nameToType: Record<string, string> = {
    // Current Assets
    'Cash': 'current-asset',
    'Cash on Hand': 'current-asset',
    'Bank Account': 'current-asset',
    'Accounts Receivable': 'current-asset',
    'Inventory': 'current-asset',
    'Prepaid Expenses': 'current-asset',
    // Non-current Assets
    'Equipment': 'non-current-asset',
    'Furniture': 'non-current-asset',
    'Buildings': 'non-current-asset',
    // Liabilities
    'Accounts Payable': 'current-liability',
    'Salaries Payable': 'current-liability',
    'Taxes Payable': 'current-liability',
    'Loan Payable': 'non-current-liability',
  };

  // Canonical numbering for built-in accounts
  const nameToNumber: Record<string, string> = {
    'Cash': '101',
    'Cash on Hand': '102',
    'Bank Account': '103',
    'Accounts Receivable': '104',
    'Inventory': '105',
    'Prepaid Expenses': '106',
    'Equipment': '151',
    'Furniture': '152',
    'Buildings': '153',
    'Accounts Payable': '201',
    'Salaries Payable': '202',
    'Taxes Payable': '203',
    'Loan Payable': '251',
  };

  const mapOldType = (account: ChartAccount): string => {
    const nameType = nameToType[account.accountName];
    if (nameType) return nameType;

    // Fallbacks for legacy values using number ranges
    const numericPart = parseInt(String(account.accountNumber).toString().split('-')[0], 10);
    const oldType = account.accountType as unknown as string;

    if (oldType === 'asset') {
      if (!isNaN(numericPart)) {
        return numericPart >= 150 ? 'non-current-asset' : 'current-asset';
      }
      return 'current-asset';
    }
    if (oldType === 'liability') {
      if (!isNaN(numericPart)) {
        return numericPart >= 250 ? 'non-current-liability' : 'current-liability';
      }
      return 'current-liability';
    }
    // Already new type or other category
    return (account.accountType as unknown as string);
  };

  // Perform migration with renumbering when we know canonical numbers
  let updated = accounts.map((account) => {
    const newType = mapOldType(account) as any;
    const canonicalNumber = nameToNumber[account.accountName];

    let newNumber = account.accountNumber;
    if (canonicalNumber) {
      newNumber = canonicalNumber;
    }

    return { ...account, accountType: newType, accountNumber: newNumber } as ChartAccount;
  });

  // Ensure unique account numbers by appending suffix if collision
  const seen: Record<string, number> = {};
  updated = updated.map((acc) => {
    const base = acc.accountNumber;
    if (!seen[base]) {
      seen[base] = 1;
      return acc;
    }
    // collision: append -{n}
    const n = ++seen[base];
    return { ...acc, accountNumber: `${base}-${n}` };
  });

  return updated;
};

export const loadChartOfAccounts = (): ChartAccount[] => {
  try {
    const stored = localStorage.getItem(CHART_KEY);
    if (stored) {
      const accounts = JSON.parse(stored);
      // Run migration
      const migratedAccounts = migrateAccountTypes(accounts);
      // Save migrated data back
      saveChartOfAccounts(migratedAccounts);
      return migratedAccounts;
    } else {
      // Initialize with default accounts
      const accounts = defaultChartOfAccounts.map(acc => ({
        ...acc,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      }));
      saveChartOfAccounts(accounts);
      return accounts;
    }
  } catch (error) {
    console.error('Failed to load chart of accounts:', error);
    return [];
  }
};

export const saveChartOfAccounts = (accounts: ChartAccount[]): void => {
  try {
    localStorage.setItem(CHART_KEY, JSON.stringify(accounts));
  } catch (error) {
    console.error('Failed to save chart of accounts:', error);
  }
};

export const addChartAccount = (account: Omit<ChartAccount, 'id' | 'createdAt'>): ChartAccount => {
  const accounts = loadChartOfAccounts();
  const newAccount: ChartAccount = {
    ...account,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  accounts.push(newAccount);
  saveChartOfAccounts(accounts);
  return newAccount;
};

export const deleteChartAccount = (id: string): void => {
  const accounts = loadChartOfAccounts().filter(acc => acc.id !== id);
  saveChartOfAccounts(accounts);
};

export const generateNextAccountNumber = (accountType: string): string => {
  const accounts = loadChartOfAccounts();
  const typeAccounts = accounts.filter(acc => acc.accountType === accountType);
  
  if (typeAccounts.length === 0) {
    // Starting numbers for each account type (standard chart of accounts)
    const startingNumbers: Record<string, number> = {
      'current-asset': 100,
      'non-current-asset': 150,
      'current-liability': 200,
      'non-current-liability': 250,
      equity: 300,
      revenue: 400,
      expense: 500,
    };
    return String(startingNumbers[accountType] || 100);
  }
  
  // Extract numbers from existing account numbers
  const numbers = typeAccounts
    .map(acc => parseInt(acc.accountNumber, 10))
    .filter(n => !isNaN(n));
  
  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
  const nextNumber = maxNumber + 1;
  
  return String(nextNumber);
};
