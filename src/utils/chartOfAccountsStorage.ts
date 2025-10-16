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
  
  if (typeAccounts.length === 0) {
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
  
  const numbers = typeAccounts
    .map(acc => parseInt(acc.accountNumber, 10))
    .filter(n => !isNaN(n));
  
  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
  return String(maxNumber + 1);
};
