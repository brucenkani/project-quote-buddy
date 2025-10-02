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
