import { ChartAccount, defaultChartOfAccounts } from '@/types/chartOfAccounts';
import { supabase } from '@/integrations/supabase/client';

// MIGRATED TO SUPABASE - Chart of accounts now stored in database
// Using in-memory cache for synchronous access pattern required by existing code

let chartCache: ChartAccount[] = [];
let cacheInitialized = false;

const initializeCache = async () => {
  if (cacheInitialized) return;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      chartCache = [];
      cacheInitialized = true;
      return;
    }

    // Get the active company_id from localStorage
    const activeCompanyId = localStorage.getItem('activeCompanyId');
    if (!activeCompanyId) {
      console.error('No active company selected');
      chartCache = [];
      cacheInitialized = true;
      return;
    }

    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', activeCompanyId)
      .order('account_number');

    if (error) throw error;

    if (!data || data.length === 0) {
      // Initialize with defaults
      chartCache = defaultChartOfAccounts.map(acc => ({
        ...acc,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      }));
      await saveChartOfAccountsToDb(chartCache);
    } else {
      chartCache = data.map(row => ({
        id: row.id,
        accountNumber: row.account_number,
        accountName: row.account_name,
        accountType: row.account_type as any,
        isDefault: false,
        openingBalance: Number(row.opening_balance),
        createdAt: row.created_at || new Date().toISOString(),
      }));
    }
    
    cacheInitialized = true;
  } catch (error) {
    console.error('Failed to initialize chart cache:', error);
    chartCache = [];
    cacheInitialized = true;
  }
};

const saveChartOfAccountsToDb = async (accounts: ChartAccount[]): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get the active company_id from localStorage
    const activeCompanyId = localStorage.getItem('activeCompanyId');
    if (!activeCompanyId) {
      console.error('No active company selected');
      return;
    }

    await supabase.from('chart_of_accounts').delete().eq('user_id', user.id).eq('company_id', activeCompanyId);

    if (accounts.length > 0) {
      await supabase.from('chart_of_accounts').insert(
        accounts.map(acc => ({
          id: acc.id,
          user_id: user.id,
          company_id: activeCompanyId,
          account_number: acc.accountNumber,
          account_name: acc.accountName,
          account_type: acc.accountType,
          is_active: true,
          opening_balance: acc.openingBalance || 0,
        }))
      );
    }
  } catch (error) {
    console.error('Failed to save to database:', error);
  }
};

// Initialize on module load
initializeCache();

export const loadChartOfAccounts = (): ChartAccount[] => {
  if (!cacheInitialized) {
    // Return empty and trigger async init
    initializeCache();
    return [];
  }
  return chartCache;
};

export const saveChartOfAccounts = (accounts: ChartAccount[]): void => {
  chartCache = accounts;
  saveChartOfAccountsToDb(accounts).catch(err => 
    console.error('Failed to sync chart of accounts:', err)
  );
};

export const addChartAccount = (account: Omit<ChartAccount, 'id' | 'createdAt'>): ChartAccount => {
  const newAccount: ChartAccount = {
    ...account,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  chartCache.push(newAccount);
  saveChartOfAccountsToDb(chartCache).catch(err =>
    console.error('Failed to add account to database:', err)
  );
  return newAccount;
};

export const deleteChartAccount = (id: string): void => {
  chartCache = chartCache.filter(acc => acc.id !== id);
  saveChartOfAccountsToDb(chartCache).catch(err =>
    console.error('Failed to delete account from database:', err)
  );
};

export const generateNextAccountNumber = (accountType: string): string => {
  const typeAccounts = chartCache.filter(acc => acc.accountType === accountType);
  
  // Define the account number ranges for each category
  const accountRanges: Record<string, { start: number; end: number }> = {
    'current-asset': { start: 1100, end: 1599 },
    'non-current-asset': { start: 1600, end: 1999 },
    'current-liability': { start: 2100, end: 2599 },
    'non-current-liability': { start: 2600, end: 2999 },
    equity: { start: 3100, end: 3699 },
    revenue: { start: 4100, end: 4299 },
    expense: { start: 5100, end: 8299 },
  };
  
  const range = accountRanges[accountType];
  if (!range) {
    return '1000'; // Fallback
  }
  
  if (typeAccounts.length === 0) {
    return String(range.start);
  }
  
  // Get all account numbers in this category and find the next sequential number
  const numbers = typeAccounts
    .map(acc => parseInt(acc.accountNumber, 10))
    .filter(n => !isNaN(n) && n >= range.start && n <= range.end)
    .sort((a, b) => a - b);
  
  if (numbers.length === 0) {
    return String(range.start);
  }
  
  // Find the next available number in sequence
  let nextNumber = numbers[numbers.length - 1] + 10;
  
  // Ensure we stay within the range
  if (nextNumber > range.end) {
    // Find gaps in the sequence
    for (let i = range.start; i <= range.end; i += 10) {
      if (!numbers.includes(i)) {
        nextNumber = i;
        break;
      }
    }
  }
  
  return String(nextNumber);
};
