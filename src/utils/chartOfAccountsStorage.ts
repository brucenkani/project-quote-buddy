import { ChartAccount, defaultChartOfAccounts } from '@/types/chartOfAccounts';

const CHART_KEY = 'quotebuilder-chart-of-accounts';

// Migration function to update old account types to new format
const migrateAccountTypes = (accounts: ChartAccount[]): ChartAccount[] => {
  return accounts.map(account => {
    let newAccountType = account.accountType;
    
    // Map old types to new types based on account number or name
    if (account.accountType === 'asset' as any) {
      // Current assets: 100-149
      // Non-current assets: 150-199
      const accountNum = parseInt(account.accountNumber);
      if (accountNum >= 100 && accountNum < 150) {
        newAccountType = 'current-asset';
      } else if (accountNum >= 150 && accountNum < 200) {
        newAccountType = 'non-current-asset';
      } else {
        // Default based on account name
        const currentAssetNames = ['Cash', 'Cash on Hand', 'Bank Account', 'Accounts Receivable', 'Inventory', 'Prepaid Expenses'];
        newAccountType = currentAssetNames.includes(account.accountName) ? 'current-asset' : 'non-current-asset';
      }
    } else if (account.accountType === 'liability' as any) {
      // Current liabilities: 200-249
      // Non-current liabilities: 250-299
      const accountNum = parseInt(account.accountNumber);
      if (accountNum >= 200 && accountNum < 250) {
        newAccountType = 'current-liability';
      } else if (accountNum >= 250 && accountNum < 300) {
        newAccountType = 'non-current-liability';
      } else {
        // Default based on account name
        const currentLiabilityNames = ['Accounts Payable', 'Salaries Payable', 'Taxes Payable'];
        newAccountType = currentLiabilityNames.includes(account.accountName) ? 'current-liability' : 'non-current-liability';
      }
    }
    
    return { ...account, accountType: newAccountType };
  });
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
