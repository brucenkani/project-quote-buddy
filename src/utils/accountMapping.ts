import { loadChartOfAccounts } from './chartOfAccountsStorage';
import { ChartAccount } from '@/types/chartOfAccounts';

/**
 * Dynamic Account Mapping System
 * This module provides functions to look up accounts from the chart of accounts
 * instead of using hardcoded account numbers.
 */

// Cache for chart of accounts
let chartCache: ChartAccount[] | null = null;

// Load and cache the chart of accounts
const getChartOfAccounts = async (): Promise<ChartAccount[]> => {
  if (!chartCache) {
    chartCache = await loadChartOfAccounts();
  }
  return chartCache;
};

// Refresh cache when chart of accounts changes
export const refreshAccountCache = async () => {
  chartCache = await loadChartOfAccounts();
};

// Account type mapping for fallback
const accountTypeRanges: Record<string, { start: number; end: number }> = {
  'cash': { start: 1120, end: 1120 },
  'bank': { start: 1100, end: 1119 },
  'trade-debtors': { start: 1106, end: 1106 },
  'inventory': { start: 1140, end: 1149 },
  'trade-creditors': { start: 2110, end: 2110 },
  'vat-payable': { start: 3104, end: 3104 },
  'vat-input': { start: 1105, end: 1105 },
  'sales-revenue': { start: 6100, end: 6199 },
  'cost-of-sales': { start: 7100, end: 7999 },
  'operating-expenses': { start: 8100, end: 8999 },
};

/**
 * Find an account by name (case-insensitive partial match)
 */
const findAccountByName = (accounts: ChartAccount[], searchName: string): ChartAccount | null => {
  const normalized = searchName.toLowerCase();
  return accounts.find(acc => 
    acc.accountName.toLowerCase().includes(normalized)
  ) || null;
};

/**
 * Find an account by number
 */
const findAccountByNumber = (accounts: ChartAccount[], accountNumber: string): ChartAccount | null => {
  return accounts.find(acc => acc.accountNumber === accountNumber) || null;
};

/**
 * Find an account by type and range
 */
const findAccountByTypeRange = (accounts: ChartAccount[], accountType: string): ChartAccount | null => {
  const range = accountTypeRanges[accountType];
  if (!range) return null;
  
  return accounts.find(acc => {
    const num = parseInt(acc.accountNumber);
    return num >= range.start && num <= range.end;
  }) || null;
};

/**
 * Get the full account string in format "accountNumber - accountName"
 */
export const getAccountString = (account: ChartAccount): string => {
  return `${account.accountNumber} - ${account.accountName}`;
};

/**
 * Get Cash on Hand account
 */
export const getCashAccount = async (): Promise<string> => {
  const accounts = await getChartOfAccounts();
  const account = findAccountByName(accounts, 'cash on hand') || 
                  findAccountByTypeRange(accounts, 'cash');
  return account ? getAccountString(account) : '1120 - Cash on Hand';
};

/**
 * Get Default Bank Account (for when no specific bank is selected)
 */
export const getDefaultBankAccount = async (): Promise<string> => {
  const accounts = await getChartOfAccounts();
  const account = findAccountByName(accounts, 'bank account') ||
                  findAccountByNumber(accounts, '1103') ||
                  findAccountByNumber(accounts, '1130');
  return account ? getAccountString(account) : '1130 - Bank Account – Current';
};

/**
 * Get Trade Debtors (Accounts Receivable) account
 */
export const getTradeDebtorsAccount = async (): Promise<string> => {
  const accounts = await getChartOfAccounts();
  const account = findAccountByName(accounts, 'trade debtors') ||
                  findAccountByName(accounts, 'accounts receivable') ||
                  findAccountByTypeRange(accounts, 'trade-debtors');
  return account ? getAccountString(account) : '1106 - Trade Debtors';
};

/**
 * Get Trade Creditors (Accounts Payable) account
 */
export const getTradeCreditorsAccount = async (): Promise<string> => {
  const accounts = await getChartOfAccounts();
  const account = findAccountByName(accounts, 'trade creditors') ||
                  findAccountByName(accounts, 'accounts payable') ||
                  findAccountByTypeRange(accounts, 'trade-creditors');
  return account ? getAccountString(account) : '2110 - Trade Creditors';
};

/**
 * Get VAT Payable account
 */
export const getVATPayableAccount = async (): Promise<string> => {
  const accounts = await getChartOfAccounts();
  const account = findAccountByName(accounts, 'vat payable') ||
                  findAccountByName(accounts, 'vat output') ||
                  findAccountByTypeRange(accounts, 'vat-payable');
  return account ? getAccountString(account) : '3104 - VAT Payable';
};

/**
 * Get VAT Input account
 */
export const getVATInputAccount = async (): Promise<string> => {
  const accounts = await getChartOfAccounts();
  const account = findAccountByName(accounts, 'vat input') ||
                  findAccountByName(accounts, 'vat receivable') ||
                  findAccountByTypeRange(accounts, 'vat-input');
  return account ? getAccountString(account) : '1105 - VAT Input (Accounts Receivable)';
};

/**
 * Get Sales Revenue account
 */
export const getSalesRevenueAccount = async (): Promise<string> => {
  const accounts = await getChartOfAccounts();
  const account = findAccountByName(accounts, 'sales revenue') ||
                  findAccountByName(accounts, 'sales') ||
                  findAccountByNumber(accounts, '6101');
  return account ? getAccountString(account) : '6101 - Sales Revenue';
};

/**
 * Get account for specific bank by ledger account number
 */
export const getBankAccountByLedger = async (ledgerAccount: string): Promise<string> => {
  const accounts = await getChartOfAccounts();
  const account = findAccountByNumber(accounts, ledgerAccount);
  return account ? getAccountString(account) : ledgerAccount;
};

/**
 * Get payment account based on method and optional bank ledger account
 */
export const getDynamicPaymentAccount = async (
  paymentMethod: 'cash' | 'bank',
  bankLedgerAccount?: string
): Promise<string> => {
  if (paymentMethod === 'cash') {
    return getCashAccount();
  }
  
  if (bankLedgerAccount) {
    return getBankAccountByLedger(bankLedgerAccount);
  }
  
  return getDefaultBankAccount();
};
