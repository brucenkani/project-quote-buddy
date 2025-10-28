import { ChartAccount } from '@/types/chartOfAccounts';
import { JournalEntry, Expense } from '@/types/accounting';
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
    // Match by exact account name
    if (lineAccount === account.accountName) return true;
    
    // Match by "accountNumber - accountName" format
    const fullFormat = `${account.accountNumber} - ${account.accountName}`;
    if (lineAccount === fullFormat) return true;
    
    // Match by account number prefix
    if (lineAccount.startsWith(account.accountNumber + ' -')) return true;
    
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
  if (account.accountType === 'current-asset' || account.accountType === 'non-current-asset' || account.accountType === 'expense') {
    return debit - credit;
  } else {
    return credit - debit;
  }
};

// Generate Income Statement
export const generateIncomeStatement = (
  accounts: ChartAccount[],
  periodData: PeriodData
) => {
  const revenue: IncomeStatementLine[] = [];
  const expenses: IncomeStatementLine[] = [];

  accounts.forEach(account => {
    const balance = calculateAccountBalance(account, periodData.journalEntries, periodData.expenses);
    
    if (account.accountType === 'revenue' && balance !== 0) {
      revenue.push({ account: account.accountName, amount: balance });
    } else if (account.accountType === 'expense' && balance !== 0) {
      expenses.push({ account: account.accountName, amount: balance });
    }
  });

  const totalRevenue = revenue.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const netIncome = totalRevenue - totalExpenses;

  return { revenue, expenses, totalRevenue, totalExpenses, netIncome };
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

    if (account.accountType === 'current-asset' || account.accountType === 'non-current-asset') {
      assets.push({ account: account.accountName, amount: balance });
    } else if (account.accountType === 'current-liability' || account.accountType === 'non-current-liability') {
      liabilities.push({ account: account.accountName, amount: balance });
    } else if (account.accountType === 'equity') {
      equity.push({ account: account.accountName, amount: balance });
    }
  });

  const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
  const totalEquity = equity.reduce((sum, item) => sum + item.amount, 0);

  return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity };
};

// Generate Cash Flow Statement
export const generateCashFlowStatement = (
  accounts: ChartAccount[],
  periodData: PeriodData
): CashFlowData => {
  const operating: { description: string; amount: number }[] = [];
  const investing: { description: string; amount: number }[] = [];
  const financing: { description: string; amount: number }[] = [];

  // Operating activities - revenue and expense accounts
  accounts.forEach(account => {
    const balance = calculateAccountBalance(account, periodData.journalEntries, periodData.expenses);
    
    if (balance === 0) return;

    if (account.accountType === 'revenue') {
      operating.push({ description: account.accountName, amount: balance });
    } else if (account.accountType === 'expense') {
      operating.push({ description: account.accountName, amount: -balance });
    }
  });

  // Investing activities - equipment, furniture, buildings
  accounts.forEach(account => {
    if (['Equipment', 'Furniture', 'Buildings'].includes(account.accountName)) {
      const balance = calculateAccountBalance(account, periodData.journalEntries, periodData.expenses);
      if (balance !== 0) {
        investing.push({ description: account.accountName, amount: -balance });
      }
    }
  });

  // Financing activities - loans, capital, drawings
  accounts.forEach(account => {
    if (['Loan Payable', "Owner's Capital", "Owner's Drawings"].includes(account.accountName)) {
      const balance = calculateAccountBalance(account, periodData.journalEntries, periodData.expenses);
      if (balance !== 0) {
        financing.push({ description: account.accountName, amount: balance });
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
