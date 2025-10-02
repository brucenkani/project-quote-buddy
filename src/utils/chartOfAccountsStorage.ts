import { ChartAccount, defaultChartOfAccounts } from '@/types/chartOfAccounts';

const CHART_KEY = 'quotebuilder-chart-of-accounts';

export const loadChartOfAccounts = (): ChartAccount[] => {
  try {
    const stored = localStorage.getItem(CHART_KEY);
    if (stored) {
      return JSON.parse(stored);
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
      asset: 1000,
      liability: 2000,
      equity: 3000,
      revenue: 4000,
      expense: 5000,
    };
    return String(startingNumbers[accountType] || 1000);
  }
  
  // Extract numbers from existing account numbers
  const numbers = typeAccounts
    .map(acc => parseInt(acc.accountNumber, 10))
    .filter(n => !isNaN(n));
  
  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
  const nextNumber = maxNumber + 1;
  
  return String(nextNumber);
};
