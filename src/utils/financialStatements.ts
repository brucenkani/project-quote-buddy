import { ChartAccount } from '@/types/chartOfAccounts';
import { JournalEntry, Expense, AccountType } from '@/types/accounting';
import { loadInvoices } from './invoiceStorage';

export interface PeriodData {
  startDate: string;
  endDate: string;
  journalEntries: JournalEntry[];
  expenses: Expense[];
}

export interface IncomeStatementLine {
  account: string;
  amount: number;
}

export interface IncomeStatementData {
  revenue: IncomeStatementLine[];
  costOfSales: IncomeStatementLine[];
  operatingExpenses: IncomeStatementLine[];
  otherComprehensiveIncome: IncomeStatementLine[];
  totalRevenue: number;
  totalCostOfSales: number;
  grossProfit: number;
  totalOperatingExpenses: number;
  totalOtherComprehensiveIncome: number;
  netIncome: number;
}

export interface BalanceSheetData {
  assets: { account: string; amount: number }[];
  liabilities: { account: string; amount: number }[];
  equity: { account: string; amount: number }[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export interface CashFlowData {
  operating: { description: string; amount: number }[];
  investing: { description: string; amount: number }[];
  financing: { description: string; amount: number }[];
  netCashFlow: number;
}

export interface EquityStatementData {
  openingBalance: number;
  netIncome: number;
  drawings: number;
  closingBalance: number;
}

// Helper function to extract account number from various formats
const extractAccountNumber = (accountString: string): string => {
  // If it's just a number, return it
  if (/^\d+$/.test(accountString)) return accountString;
  
  // Extract number from "1234 - Account Name" format
  const match = accountString.match(/^(\d+)\s*-/);
  if (match) return match[1];
  
  // Return original if no number found
  return accountString;
};

// Helper function to get account type from account number
// MAPPING: 1xxx=Current Assets, 2xxx=Non-Current Assets, 3xxx=Current Liabilities,
// 4xxx=Non-Current Liabilities, 5xxx=Equity, 6xxx=Income, 
// 7xxx=Cost of Sales, 8xxx=Operating Expenses, 9xxx=Other Comprehensive Income
export const getAccountTypeFromNumber = (accountNumber: string): AccountType => {
  const firstDigit = accountNumber.charAt(0);
  
  switch (firstDigit) {
    case '1':
      return 'current-asset';
    case '2':
      return 'non-current-asset';
    case '3':
      return 'current-liability';
    case '4':
      return 'non-current-liability';
    case '5':
      return 'equity';
    case '6':
      return 'revenue';
    case '7': // Cost of Sales
    case '8': // Operating Expenses
    case '9': // Other Comprehensive Income
      return 'expense';
    default:
      return 'expense'; // Default fallback
  }
};

// Classify a journal line to an AccountType using number, stored type or keywords
const classifyLineType = (line: { account: string; accountType?: AccountType }): AccountType => {
  const num = extractAccountNumber(line.account);
  if (/^\d+$/.test(num)) {
    return getAccountTypeFromNumber(num);
  }
  if (line.accountType) return line.accountType;
  const lower = line.account.toLowerCase();
  if (lower.includes('revenue') || lower.includes('sales') || lower.includes('income')) return 'revenue';
  if (lower.includes('cogs') || lower.includes('cost of goods') || lower.includes('expense')) return 'expense';
  if (lower.includes('payable') || lower.includes('creditors')) return 'current-liability';
  if (lower.includes('receivable') || lower.includes('debtors')) return 'current-asset';
  if (lower.includes('inventory') || lower.includes('stock')) return 'current-asset';
  return 'expense';
};
// Calculate account balance
export const calculateAccountBalance = (
  account: ChartAccount,
  journalEntries: JournalEntry[],
  expenses: Expense[]
): number => {
  let debit = 0;
  let credit = 0;

  // Create matching patterns for this account
  const accountMatches = (lineAccount: string): boolean => {
    // Extract account number from the line account
    const lineAccountNumber = extractAccountNumber(lineAccount);
    
    // Match by account number
    if (lineAccountNumber === account.accountNumber) return true;
    
    // Match by exact account name
    if (lineAccount === account.accountName) return true;
    
    // Match by "accountNumber - accountName" format
    const fullFormat = `${account.accountNumber} - ${account.accountName}`;
    if (lineAccount === fullFormat) return true;
    
    return false;
  };

  journalEntries.forEach(entry => {
    entry.entries.forEach(line => {
      if (accountMatches(line.account)) {
        debit += line.debit;
        credit += line.credit;
      }
    });
  });

  expenses.forEach(expense => {
    if (accountMatches(expense.category)) {
      // Only recognize VAT-exclusive amount for expenses with VAT
      const netAmount = expense.includesVAT && expense.vatAmount 
        ? expense.amount - expense.vatAmount 
        : expense.amount;
      debit += netAmount;
    }
  });

  // For normal balance: Assets/Expenses = Debit, Liabilities/Equity/Revenue = Credit
  const acctType = getAccountTypeFromNumber(account.accountNumber);
  if (acctType === 'current-asset' || acctType === 'non-current-asset' || acctType === 'expense') {
    return debit - credit;
  } else {
    return credit - debit;
  }
};

// Generate Income Statement with categorized expenses
export const generateIncomeStatement = (
  accounts: ChartAccount[],
  periodData: PeriodData
): IncomeStatementData => {
  const revenue: IncomeStatementLine[] = [];
  const costOfSales: IncomeStatementLine[] = [];
  const operatingExpenses: IncomeStatementLine[] = [];
  const otherComprehensiveIncome: IncomeStatementLine[] = [];

  accounts.forEach(account => {
    const balance = calculateAccountBalance(account, periodData.journalEntries, periodData.expenses);
    
    if (balance === 0) return;
    
    const accountType = getAccountTypeFromNumber(account.accountNumber);
    const accountLabel = `${account.accountNumber} - ${account.accountName}`;
    const firstDigit = account.accountNumber.charAt(0);
    
    if (accountType === 'revenue') {
      revenue.push({ account: accountLabel, amount: balance });
    } else if (accountType === 'expense') {
      // Categorize by first digit: 7xxx=Cost of Sales, 8xxx=Operating Expenses, 9xxx=Other Comprehensive Income
      if (firstDigit === '7') {
        costOfSales.push({ account: accountLabel, amount: balance });
      } else if (firstDigit === '8') {
        operatingExpenses.push({ account: accountLabel, amount: balance });
      } else if (firstDigit === '9') {
        otherComprehensiveIncome.push({ account: accountLabel, amount: balance });
      }
    }
  });

  // Compute totals
  const totalRevenue = revenue.reduce((sum, item) => sum + item.amount, 0);
  const totalCostOfSales = costOfSales.reduce((sum, item) => sum + item.amount, 0);
  const grossProfit = totalRevenue - totalCostOfSales;
  const totalOperatingExpenses = operatingExpenses.reduce((sum, item) => sum + item.amount, 0);
  const totalOtherComprehensiveIncome = otherComprehensiveIncome.reduce((sum, item) => sum + item.amount, 0);
  const netIncome = grossProfit - totalOperatingExpenses - totalOtherComprehensiveIncome;

  // Fallback: derive totals directly from journal lines if no chart accounts matched
  // This ensures we don't show empty reports if data exists
  let finalRevenue = totalRevenue;
  let finalCostOfSales = totalCostOfSales;
  let finalOperatingExpenses = totalOperatingExpenses;
  let finalOtherIncome = totalOtherComprehensiveIncome;
  
  if (totalRevenue === 0 && totalCostOfSales === 0 && totalOperatingExpenses === 0) {
    periodData.journalEntries.forEach(entry => {
      entry.entries.forEach((line: any) => {
        const num = extractAccountNumber(line.account);
        const t = classifyLineType({ account: line.account, accountType: line.accountType });
        const firstDigit = num.charAt(0);
        
        if (t === 'revenue') {
          finalRevenue += (line.credit - line.debit);
        } else if (t === 'expense') {
          if (firstDigit === '7') {
            finalCostOfSales += (line.debit - line.credit);
          } else if (firstDigit === '8') {
            finalOperatingExpenses += (line.debit - line.credit);
          } else if (firstDigit === '9') {
            finalOtherIncome += (line.debit - line.credit);
          }
        }
      });
    });
  }

  const finalGrossProfit = finalRevenue - finalCostOfSales;
  const finalNetIncome = finalGrossProfit - finalOperatingExpenses - finalOtherIncome;

  return {
    revenue,
    costOfSales,
    operatingExpenses,
    otherComprehensiveIncome,
    totalRevenue: finalRevenue,
    totalCostOfSales: finalCostOfSales,
    grossProfit: finalGrossProfit,
    totalOperatingExpenses: finalOperatingExpenses,
    totalOtherComprehensiveIncome: finalOtherIncome,
    netIncome: finalNetIncome
  };
};

// Generate Balance Sheet
export const generateBalanceSheet = (
  accounts: ChartAccount[],
  periodData: PeriodData
): BalanceSheetData => {
  const assets: { account: string; amount: number }[] = [];
  const liabilities: { account: string; amount: number }[] = [];
  const equity: { account: string; amount: number }[] = [];

  accounts.forEach(account => {
    const balance = calculateAccountBalance(account, periodData.journalEntries, periodData.expenses);
    
    if (balance === 0) return;

    // Determine account type from account number for accurate categorization
    const accountType = getAccountTypeFromNumber(account.accountNumber);
    const accountLabel = `${account.accountNumber} - ${account.accountName}`;

    if (accountType === 'current-asset' || accountType === 'non-current-asset') {
      assets.push({ account: accountLabel, amount: balance });
    } else if (accountType === 'current-liability' || accountType === 'non-current-liability') {
      liabilities.push({ account: accountLabel, amount: balance });
    } else if (accountType === 'equity') {
      equity.push({ account: accountLabel, amount: balance });
    }
  });

  const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
  const totalEquity = equity.reduce((sum, item) => sum + item.amount, 0);

  // The accounting equation: Assets = Liabilities + Equity
  // Equity already includes all equity accounts from the chart of accounts
  // Net income flows through retained earnings via journal entries, so no need to add it separately

  return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity };
};

// Generate Cash Flow Statement (Indirect Method)
export const generateCashFlowStatement = (
  accounts: ChartAccount[],
  periodData: PeriodData
): CashFlowData => {
  const operating: { description: string; amount: number }[] = [];
  const investing: { description: string; amount: number }[] = [];
  const financing: { description: string; amount: number }[] = [];

  // Step 1: Start with Net Income (from Income Statement)
  const incomeStatement = generateIncomeStatement(accounts, periodData);
  const netIncome = incomeStatement.netIncome;
  
  operating.push({ description: 'Net Income', amount: netIncome });

  // Step 2: Add back non-cash expenses
  accounts.forEach(account => {
    const accountType = getAccountTypeFromNumber(account.accountNumber);
    const accountName = account.accountName.toLowerCase();
    
    // Identify non-cash expense accounts (depreciation, amortization, etc.)
    if (accountType === 'expense' && 
        (accountName.includes('depreciation') || 
         accountName.includes('amortization') ||
         accountName.includes('impairment'))) {
      const balance = calculateAccountBalance(account, periodData.journalEntries, periodData.expenses);
      if (balance !== 0) {
        const accountLabel = `${account.accountNumber} - ${account.accountName}`;
        operating.push({ description: `Add: ${accountLabel}`, amount: Math.abs(balance) });
      }
    }
  });

  // Step 3: Adjust for changes in working capital (Current Assets and Current Liabilities)
  // For this to work properly, we need to compare with prior period balances
  // Since we don't have prior period data here, we'll use the current period movements
  
  // Changes in Current Assets (excluding cash)
  accounts.forEach(account => {
    const accountType = getAccountTypeFromNumber(account.accountNumber);
    const accountName = account.accountName.toLowerCase();
    
    if (accountType === 'current-asset' && 
        !accountName.includes('cash') && 
        !accountName.includes('bank')) {
      const balance = calculateAccountBalance(account, periodData.journalEntries, periodData.expenses);
      if (balance !== 0) {
        const accountLabel = `${account.accountNumber} - ${account.accountName}`;
        // Increase in current assets = cash outflow (negative)
        // Decrease in current assets = cash inflow (positive)
        operating.push({ 
          description: balance > 0 ? `Increase in ${accountLabel}` : `Decrease in ${accountLabel}`, 
          amount: -balance 
        });
      }
    }
  });

  // Changes in Current Liabilities
  accounts.forEach(account => {
    const accountType = getAccountTypeFromNumber(account.accountNumber);
    
    if (accountType === 'current-liability') {
      const balance = calculateAccountBalance(account, periodData.journalEntries, periodData.expenses);
      if (balance !== 0) {
        const accountLabel = `${account.accountNumber} - ${account.accountName}`;
        // Increase in current liabilities = cash inflow (positive)
        // Decrease in current liabilities = cash outflow (negative)
        operating.push({ 
          description: balance > 0 ? `Increase in ${accountLabel}` : `Decrease in ${accountLabel}`, 
          amount: balance 
        });
      }
    }
  });

  // Investing activities - changes in non-current assets
  accounts.forEach(account => {
    const accountType = getAccountTypeFromNumber(account.accountNumber);
    if (accountType === 'non-current-asset') {
      const accountName = account.accountName.toLowerCase();
      // Exclude accumulated depreciation as it's already handled in operating activities
      if (!accountName.includes('accumulated depreciation') && 
          !accountName.includes('depreciation')) {
        const balance = calculateAccountBalance(account, periodData.journalEntries, periodData.expenses);
        if (balance !== 0) {
          const accountLabel = `${account.accountNumber} - ${account.accountName}`;
          // Purchase of assets = cash outflow (negative)
          // Sale of assets = cash inflow (positive)
          investing.push({ 
            description: balance > 0 ? `Purchase of ${accountLabel}` : `Sale of ${accountLabel}`, 
            amount: -balance 
          });
        }
      }
    }
  });

  // Financing activities - equity and non-current liabilities (excluding retained earnings)
  accounts.forEach(account => {
    const accountType = getAccountTypeFromNumber(account.accountNumber);
    const accountName = account.accountName.toLowerCase();
    
    if ((accountType === 'equity' || accountType === 'non-current-liability') &&
        !accountName.includes('retained earnings')) {
      const balance = calculateAccountBalance(account, periodData.journalEntries, periodData.expenses);
      if (balance !== 0) {
        const accountLabel = `${account.accountNumber} - ${account.accountName}`;
        
        if (accountType === 'equity') {
          // Equity contributions = cash inflow (positive)
          // Drawings/Dividends = cash outflow (negative)
          if (accountName.includes('drawing') || accountName.includes('dividend')) {
            financing.push({ description: `${accountLabel}`, amount: -Math.abs(balance) });
          } else {
            financing.push({ description: `${accountLabel}`, amount: balance });
          }
        } else {
          // Non-current liabilities
          // Loan received = cash inflow (positive)
          // Loan repayment = cash outflow (negative)
          financing.push({ 
            description: balance > 0 ? `Proceeds from ${accountLabel}` : `Repayment of ${accountLabel}`, 
            amount: balance 
          });
        }
      }
    }
  });

  const netCashFlow = 
    operating.reduce((sum, item) => sum + item.amount, 0) +
    investing.reduce((sum, item) => sum + item.amount, 0) +
    financing.reduce((sum, item) => sum + item.amount, 0);

  return { operating, investing, financing, netCashFlow };
};

// Generate Equity Statement
export const generateEquityStatement = (
  accounts: ChartAccount[],
  currentPeriod: PeriodData,
  priorPeriod: PeriodData
): EquityStatementData => {
  // Get opening balance from prior period equity accounts
  const equityAccounts = accounts.filter(a => a.accountType === 'equity');
  let openingBalance = 0;
  
  equityAccounts.forEach(account => {
    openingBalance += calculateAccountBalance(account, priorPeriod.journalEntries, priorPeriod.expenses);
  });

  // Get net income from current period
  const incomeStatement = generateIncomeStatement(accounts, currentPeriod);
  const netIncome = incomeStatement.netIncome;

  // Get drawings
  const drawingsAccount = accounts.find(a => a.accountName === "Owner's Drawings");
  const drawings = drawingsAccount 
    ? calculateAccountBalance(drawingsAccount, currentPeriod.journalEntries, currentPeriod.expenses)
    : 0;

  const closingBalance = openingBalance + netIncome - drawings;

  return { openingBalance, netIncome, drawings, closingBalance };
};

// Enhanced KPIs Interface
export interface EnhancedKPIs {
  current: {
    revenue: number;
    netIncome: number;
    grossMargin: number;
    netProfitMargin: number;
    accountsReceivable: number;
    accountsPayable: number;
    inventory?: number;
    currentRatio: number;
    quickRatio: number;
    workingCapital: number;
    debtToEquity: number;
    debtRatio: number;
    roa: number;
    roe: number;
    assetTurnover: number;
  };
  prior: {
    revenue: number;
    netIncome: number;
    grossMargin: number;
    netProfitMargin: number;
    accountsReceivable: number;
    accountsPayable: number;
    inventory?: number;
    currentRatio: number;
    quickRatio: number;
    workingCapital: number;
    debtToEquity: number;
    debtRatio: number;
    roa: number;
    roe: number;
    assetTurnover: number;
  };
}

// Calculate KPIs
export const calculateKPIs = (
  accounts: ChartAccount[],
  currentPeriod: PeriodData,
  priorPeriod: PeriodData
) => {
  const currentIncome = generateIncomeStatement(accounts, currentPeriod);
  const priorIncome = generateIncomeStatement(accounts, priorPeriod);
  
  const currentBalance = generateBalanceSheet(accounts, currentPeriod);
  const priorBalance = generateBalanceSheet(accounts, priorPeriod);

  // Profitability ratios
  const currentGrossMargin = currentIncome.totalRevenue > 0 
    ? (currentIncome.netIncome / currentIncome.totalRevenue) * 100 
    : 0;
  const priorGrossMargin = priorIncome.totalRevenue > 0 
    ? (priorIncome.netIncome / priorIncome.totalRevenue) * 100 
    : 0;

  // Liquidity ratios
  const currentRatio = currentBalance.totalLiabilities > 0 
    ? currentBalance.totalAssets / currentBalance.totalLiabilities 
    : 0;
  const priorCurrentRatio = priorBalance.totalLiabilities > 0 
    ? priorBalance.totalAssets / priorBalance.totalLiabilities 
    : 0;

  // Leverage ratios
  const debtToEquity = currentBalance.totalEquity > 0 
    ? currentBalance.totalLiabilities / currentBalance.totalEquity 
    : 0;
  const priorDebtToEquity = priorBalance.totalEquity > 0 
    ? priorBalance.totalLiabilities / priorBalance.totalEquity 
    : 0;

  // Return on Assets
  const roa = currentBalance.totalAssets > 0 
    ? (currentIncome.netIncome / currentBalance.totalAssets) * 100 
    : 0;
  const priorRoa = priorBalance.totalAssets > 0 
    ? (priorIncome.netIncome / priorBalance.totalAssets) * 100 
    : 0;

  // Return on Equity
  const roe = currentBalance.totalEquity > 0 
    ? (currentIncome.netIncome / currentBalance.totalEquity) * 100 
    : 0;
  const priorRoe = priorBalance.totalEquity > 0 
    ? (priorIncome.netIncome / priorBalance.totalEquity) * 100 
    : 0;

  return {
    current: {
      revenue: currentIncome.totalRevenue,
      netIncome: currentIncome.netIncome,
      grossMargin: currentGrossMargin,
      currentRatio,
      debtToEquity,
      roa,
      roe,
    },
    prior: {
      revenue: priorIncome.totalRevenue,
      netIncome: priorIncome.netIncome,
      grossMargin: priorGrossMargin,
      currentRatio: priorCurrentRatio,
      debtToEquity: priorDebtToEquity,
      roa: priorRoa,
      roe: priorRoe,
    }
  };
};

// Calculate Enhanced KPIs with additional metrics
export const calculateEnhancedKPIs = async (
  accounts: ChartAccount[],
  currentPeriod: PeriodData,
  priorPeriod: PeriodData,
  companyType: string
): Promise<EnhancedKPIs> => {
  const currentIncome = generateIncomeStatement(accounts, currentPeriod);
  const priorIncome = generateIncomeStatement(accounts, priorPeriod);
  
  const currentBalance = generateBalanceSheet(accounts, currentPeriod);
  const priorBalance = generateBalanceSheet(accounts, priorPeriod);

  // Get specific account balances
  const getAccountBalance = (accountName: string, period: PeriodData) => {
    const account = accounts.find(a => a.accountName === accountName);
    return account ? calculateAccountBalance(account, period.journalEntries, period.expenses) : 0;
  };

  // Calculate AR from actual invoices (not journal entries)
  const calculateARFromInvoices = async (endDate: string) => {
    const invoices = await loadInvoices();
    const endDateObj = new Date(endDate);
    
    let total = 0;
    invoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.issueDate);
      // Only include invoices issued on or before the period end date
      if (invoiceDate <= endDateObj && invoice.type === 'invoice') {
        const amountDue = invoice.total - 
          (invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0) -
          (invoice.creditNotes?.reduce((sum, cnId) => {
            const cn = invoices.find(i => i.id === cnId);
            return sum + (cn ? Math.abs(cn.total) : 0);
          }, 0) || 0);
        
        if (amountDue > 0) {
          total += amountDue;
        }
      }
    });
    
    return total;
  };

  // Balance sheet items - AR from invoices
  const currentAR = await calculateARFromInvoices(currentPeriod.endDate);
  const priorAR = await calculateARFromInvoices(priorPeriod.endDate);
  
  const currentAP = getAccountBalance('Accounts Payable', currentPeriod);
  const priorAP = getAccountBalance('Accounts Payable', priorPeriod);

  // Inventory (only for trading and manufacturing companies)
  let currentInventory: number | undefined;
  let priorInventory: number | undefined;
  if (companyType === 'trading' || companyType === 'manufacturer') {
    currentInventory = getAccountBalance('Inventory', currentPeriod);
    priorInventory = getAccountBalance('Inventory', priorPeriod);
  }

  // Current assets and liabilities for liquidity ratios
  const currentAssets = accounts
    .filter(a => a.accountType === 'current-asset')
    .reduce((sum, acc) => sum + calculateAccountBalance(acc, currentPeriod.journalEntries, currentPeriod.expenses), 0);
  
  const priorCurrentAssets = accounts
    .filter(a => a.accountType === 'current-asset')
    .reduce((sum, acc) => sum + calculateAccountBalance(acc, priorPeriod.journalEntries, priorPeriod.expenses), 0);

  const currentLiabilities = accounts
    .filter(a => a.accountType === 'current-liability')
    .reduce((sum, acc) => sum + calculateAccountBalance(acc, currentPeriod.journalEntries, currentPeriod.expenses), 0);
    
  const priorCurrentLiabilities = accounts
    .filter(a => a.accountType === 'current-liability')
    .reduce((sum, acc) => sum + calculateAccountBalance(acc, priorPeriod.journalEntries, priorPeriod.expenses), 0);

  // Profitability ratios
  const currentGrossMargin = currentIncome.totalRevenue > 0 
    ? (currentIncome.netIncome / currentIncome.totalRevenue) * 100 
    : 0;
  const priorGrossMargin = priorIncome.totalRevenue > 0 
    ? (priorIncome.netIncome / priorIncome.totalRevenue) * 100 
    : 0;

  const currentNetProfitMargin = currentIncome.totalRevenue > 0 
    ? (currentIncome.netIncome / currentIncome.totalRevenue) * 100 
    : 0;
  const priorNetProfitMargin = priorIncome.totalRevenue > 0 
    ? (priorIncome.netIncome / priorIncome.totalRevenue) * 100 
    : 0;

  // Liquidity ratios
  const currentRatio = currentLiabilities > 0 
    ? currentAssets / currentLiabilities 
    : 0;
  const priorCurrentRatio = priorCurrentLiabilities > 0 
    ? priorCurrentAssets / priorCurrentLiabilities 
    : 0;

  // Quick ratio (excludes inventory)
  const currentQuickAssets = currentAssets - (currentInventory || 0);
  const priorQuickAssets = priorCurrentAssets - (priorInventory || 0);
  const quickRatio = currentLiabilities > 0 
    ? currentQuickAssets / currentLiabilities 
    : 0;
  const priorQuickRatio = priorCurrentLiabilities > 0 
    ? priorQuickAssets / priorCurrentLiabilities 
    : 0;

  // Working capital
  const workingCapital = currentAssets - currentLiabilities;
  const priorWorkingCapital = priorCurrentAssets - priorCurrentLiabilities;

  // Leverage ratios
  const debtToEquity = currentBalance.totalEquity > 0 
    ? currentBalance.totalLiabilities / currentBalance.totalEquity 
    : 0;
  const priorDebtToEquity = priorBalance.totalEquity > 0 
    ? priorBalance.totalLiabilities / priorBalance.totalEquity 
    : 0;

  const debtRatio = currentBalance.totalAssets > 0 
    ? (currentBalance.totalLiabilities / currentBalance.totalAssets) * 100 
    : 0;
  const priorDebtRatio = priorBalance.totalAssets > 0 
    ? (priorBalance.totalLiabilities / priorBalance.totalAssets) * 100 
    : 0;

  // Return on Assets
  const roa = currentBalance.totalAssets > 0 
    ? (currentIncome.netIncome / currentBalance.totalAssets) * 100 
    : 0;
  const priorRoa = priorBalance.totalAssets > 0 
    ? (priorIncome.netIncome / priorBalance.totalAssets) * 100 
    : 0;

  // Return on Equity
  const roe = currentBalance.totalEquity > 0 
    ? (currentIncome.netIncome / currentBalance.totalEquity) * 100 
    : 0;
  const priorRoe = priorBalance.totalEquity > 0 
    ? (priorIncome.netIncome / priorBalance.totalEquity) * 100 
    : 0;

  // Asset Turnover
  const assetTurnover = currentBalance.totalAssets > 0 
    ? currentIncome.totalRevenue / currentBalance.totalAssets 
    : 0;
  const priorAssetTurnover = priorBalance.totalAssets > 0 
    ? priorIncome.totalRevenue / priorBalance.totalAssets 
    : 0;

  return {
    current: {
      revenue: currentIncome.totalRevenue,
      netIncome: currentIncome.netIncome,
      grossMargin: currentGrossMargin,
      netProfitMargin: currentNetProfitMargin,
      accountsReceivable: currentAR,
      accountsPayable: currentAP,
      inventory: currentInventory,
      currentRatio,
      quickRatio,
      workingCapital,
      debtToEquity,
      debtRatio,
      roa,
      roe,
      assetTurnover,
    },
    prior: {
      revenue: priorIncome.totalRevenue,
      netIncome: priorIncome.netIncome,
      grossMargin: priorGrossMargin,
      netProfitMargin: priorNetProfitMargin,
      accountsReceivable: priorAR,
      accountsPayable: priorAP,
      inventory: priorInventory,
      currentRatio: priorCurrentRatio,
      quickRatio: priorQuickRatio,
      workingCapital: priorWorkingCapital,
      debtToEquity: priorDebtToEquity,
      debtRatio: priorDebtRatio,
      roa: priorRoa,
      roe: priorRoe,
      assetTurnover: priorAssetTurnover,
    }
  };
};
