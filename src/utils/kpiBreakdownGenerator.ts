import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ChartAccount } from '@/types/chartOfAccounts';
import { JournalEntry, Expense } from '@/types/accounting';
import { CompanySettings } from '@/types/settings';
import { PeriodData, calculateAccountBalance } from '@/utils/financialStatements';
import { loadInvoices } from '@/utils/invoiceStorage';

type KPIType = 
  | 'revenue' 
  | 'netIncome' 
  | 'grossMargin'
  | 'netProfitMargin'
  | 'accountsReceivable' 
  | 'accountsPayable' 
  | 'inventory' 
  | 'workingCapital'
  | 'currentRatio'
  | 'quickRatio'
  | 'debtToEquity'
  | 'debtRatio'
  | 'roa'
  | 'roe'
  | 'assetTurnover';

interface BreakdownLine {
  date: string;
  description: string;
  reference: string;
  amount: number;
  account?: string;
}

const getKPIBreakdown = (
  kpiType: KPIType,
  accounts: ChartAccount[],
  periodData: PeriodData,
  settings: CompanySettings
): { title: string; lines: BreakdownLine[]; total: number } => {
  const lines: BreakdownLine[] = [];
  let total = 0;

  switch (kpiType) {
    case 'revenue': {
      const revenueAccounts = accounts.filter(a => a.accountType === 'revenue');
      revenueAccounts.forEach(account => {
        periodData.journalEntries.forEach(entry => {
          entry.entries.forEach(line => {
            if (line.account === account.accountName && line.credit > 0) {
              lines.push({
                date: entry.date,
                description: entry.description,
                reference: entry.reference || '-',
                amount: line.credit,
                account: account.accountName,
              });
              total += line.credit;
            }
          });
        });
      });
      return { title: 'Total Revenue Breakdown', lines, total };
    }

    case 'netIncome': {
      // Revenue
      const revenueAccounts = accounts.filter(a => a.accountType === 'revenue');
      revenueAccounts.forEach(account => {
        periodData.journalEntries.forEach(entry => {
          entry.entries.forEach(line => {
            if (line.account === account.accountName && line.credit > 0) {
              lines.push({
                date: entry.date,
                description: `Revenue: ${entry.description}`,
                reference: entry.reference || '-',
                amount: line.credit,
                account: account.accountName,
              });
              total += line.credit;
            }
          });
        });
      });

      // Expenses
      const expenseAccounts = accounts.filter(a => a.accountType === 'expense');
      expenseAccounts.forEach(account => {
        periodData.journalEntries.forEach(entry => {
          entry.entries.forEach(line => {
            if (line.account === account.accountName && line.debit > 0) {
              lines.push({
                date: entry.date,
                description: `Expense: ${entry.description}`,
                reference: entry.reference || '-',
                amount: -line.debit,
                account: account.accountName,
              });
              total -= line.debit;
            }
          });
        });

        // From expenses table
        periodData.expenses.forEach(expense => {
          if (expense.category === account.accountName) {
            const netAmount = expense.includesVAT && expense.vatAmount 
              ? expense.amount - expense.vatAmount 
              : expense.amount;
            lines.push({
              date: expense.date,
              description: `Expense: ${expense.description}`,
              reference: expense.reference || '-',
              amount: -netAmount,
              account: account.accountName,
            });
            total -= netAmount;
          }
        });
      });

      lines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return { title: 'Net Income Breakdown', lines, total };
    }

    case 'accountsReceivable': {
      const account = accounts.find(a => a.accountName === 'Accounts Receivable');
      if (account) {
        periodData.journalEntries.forEach(entry => {
          entry.entries.forEach(line => {
            if (line.account === account.accountName) {
              const amount = line.debit - line.credit;
              if (amount !== 0) {
                lines.push({
                  date: entry.date,
                  description: entry.description,
                  reference: entry.reference || '-',
                  amount: amount,
                });
                total += amount;
              }
            }
          });
        });
      }
      lines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return { title: 'Accounts Receivable Breakdown', lines, total };
    }

    case 'accountsPayable': {
      const account = accounts.find(a => a.accountName === 'Accounts Payable');
      if (account) {
        periodData.journalEntries.forEach(entry => {
          entry.entries.forEach(line => {
            if (line.account === account.accountName) {
              const amount = line.credit - line.debit;
              if (amount !== 0) {
                lines.push({
                  date: entry.date,
                  description: entry.description,
                  reference: entry.reference || '-',
                  amount: amount,
                });
                total += amount;
              }
            }
          });
        });
      }
      lines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return { title: 'Accounts Payable Breakdown', lines, total };
    }

    case 'inventory': {
      const account = accounts.find(a => a.accountName === 'Inventory');
      if (account) {
        periodData.journalEntries.forEach(entry => {
          entry.entries.forEach(line => {
            if (line.account === account.accountName) {
              const amount = line.debit - line.credit;
              if (amount !== 0) {
                lines.push({
                  date: entry.date,
                  description: entry.description,
                  reference: entry.reference || '-',
                  amount: amount,
                });
                total += amount;
              }
            }
          });
        });
      }
      lines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return { title: 'Inventory Breakdown', lines, total };
    }

    case 'workingCapital': {
      // Current Assets
      const currentAssetAccounts = ['Cash on Hand', 'Bank Account', 'Accounts Receivable', 'Inventory', 'Prepaid Expenses'];
      currentAssetAccounts.forEach(accountName => {
        const account = accounts.find(a => a.accountName === accountName);
        if (account) {
          const balance = calculateAccountBalance(account, periodData.journalEntries, periodData.expenses);
          if (balance !== 0) {
            lines.push({
              date: periodData.endDate,
              description: `Current Asset: ${accountName}`,
              reference: 'Balance',
              amount: balance,
              account: accountName,
            });
            total += balance;
          }
        }
      });

      // Current Liabilities
      const liabilityAccounts = accounts.filter(a => a.accountType === 'liability');
      liabilityAccounts.forEach(account => {
        const balance = calculateAccountBalance(account, periodData.journalEntries, periodData.expenses);
        if (balance !== 0) {
          lines.push({
            date: periodData.endDate,
            description: `Current Liability: ${account.accountName}`,
            reference: 'Balance',
            amount: -balance,
            account: account.accountName,
          });
          total -= balance;
        }
      });

      return { title: 'Working Capital Breakdown', lines, total };
    }

    case 'currentRatio':
    case 'quickRatio': {
      const currentAssetAccounts = ['Cash on Hand', 'Bank Account', 'Accounts Receivable', 'Inventory', 'Prepaid Expenses'];
      let currentAssets = 0;
      let quickAssets = 0;

      currentAssetAccounts.forEach(accountName => {
        const account = accounts.find(a => a.accountName === accountName);
        if (account) {
          const balance = calculateAccountBalance(account, periodData.journalEntries, periodData.expenses);
          if (balance !== 0) {
            lines.push({
              date: periodData.endDate,
              description: `Current Asset: ${accountName}`,
              reference: 'Balance',
              amount: balance,
              account: accountName,
            });
            currentAssets += balance;
            if (accountName !== 'Inventory') {
              quickAssets += balance;
            }
          }
        }
      });

      // Current Liabilities
      const liabilityAccounts = accounts.filter(a => a.accountType === 'liability');
      let currentLiabilities = 0;
      liabilityAccounts.forEach(account => {
        const balance = calculateAccountBalance(account, periodData.journalEntries, periodData.expenses);
        if (balance !== 0) {
          lines.push({
            date: periodData.endDate,
            description: `Current Liability: ${account.accountName}`,
            reference: 'Balance',
            amount: balance,
            account: account.accountName,
          });
          currentLiabilities += balance;
        }
      });

      const ratio = kpiType === 'currentRatio' 
        ? (currentLiabilities > 0 ? currentAssets / currentLiabilities : 0)
        : (currentLiabilities > 0 ? quickAssets / currentLiabilities : 0);

      return { 
        title: kpiType === 'currentRatio' ? 'Current Ratio Breakdown' : 'Quick Ratio Breakdown', 
        lines, 
        total: ratio 
      };
    }

    case 'grossMargin':
    case 'netProfitMargin': {
      // Revenue
      let revenue = 0;
      const revenueAccounts = accounts.filter(a => a.accountType === 'revenue');
      revenueAccounts.forEach(account => {
        periodData.journalEntries.forEach(entry => {
          entry.entries.forEach(line => {
            if (line.account === account.accountName && line.credit > 0) {
              lines.push({
                date: entry.date,
                description: `Revenue: ${entry.description}`,
                reference: entry.reference || '-',
                amount: line.credit,
                account: account.accountName,
              });
              revenue += line.credit;
            }
          });
        });
      });

      // Expenses
      let expenses = 0;
      const expenseAccounts = accounts.filter(a => a.accountType === 'expense');
      expenseAccounts.forEach(account => {
        periodData.journalEntries.forEach(entry => {
          entry.entries.forEach(line => {
            if (line.account === account.accountName && line.debit > 0) {
              lines.push({
                date: entry.date,
                description: `Expense: ${entry.description}`,
                reference: entry.reference || '-',
                amount: -line.debit,
                account: account.accountName,
              });
              expenses += line.debit;
            }
          });
        });

        periodData.expenses.forEach(expense => {
          if (expense.category === account.accountName) {
            const netAmount = expense.includesVAT && expense.vatAmount 
              ? expense.amount - expense.vatAmount 
              : expense.amount;
            lines.push({
              date: expense.date,
              description: `Expense: ${expense.description}`,
              reference: expense.reference || '-',
              amount: -netAmount,
              account: account.accountName,
            });
            expenses += netAmount;
          }
        });
      });

      const netIncome = revenue - expenses;
      const margin = revenue > 0 ? (netIncome / revenue) * 100 : 0;

      lines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Add summary lines
      lines.push({
        date: periodData.endDate,
        description: 'Total Revenue',
        reference: 'Summary',
        amount: revenue,
      });
      lines.push({
        date: periodData.endDate,
        description: 'Total Expenses',
        reference: 'Summary',
        amount: -expenses,
      });
      lines.push({
        date: periodData.endDate,
        description: 'Net Income',
        reference: 'Summary',
        amount: netIncome,
      });

      return { 
        title: kpiType === 'grossMargin' ? 'Gross Margin Breakdown' : 'Net Profit Margin Breakdown', 
        lines, 
        total: margin 
      };
    }

    case 'debtToEquity':
    case 'debtRatio': {
      // Liabilities
      let totalLiabilities = 0;
      const liabilityAccounts = accounts.filter(a => a.accountType === 'liability');
      liabilityAccounts.forEach(account => {
        const balance = calculateAccountBalance(account, periodData.journalEntries, periodData.expenses);
        if (balance !== 0) {
          lines.push({
            date: periodData.endDate,
            description: `Liability: ${account.accountName}`,
            reference: 'Balance',
            amount: balance,
            account: account.accountName,
          });
          totalLiabilities += balance;
        }
      });

      if (kpiType === 'debtToEquity') {
        // Equity
        let totalEquity = 0;
        const equityAccounts = accounts.filter(a => a.accountType === 'equity');
        equityAccounts.forEach(account => {
          const balance = calculateAccountBalance(account, periodData.journalEntries, periodData.expenses);
          if (balance !== 0) {
            lines.push({
              date: periodData.endDate,
              description: `Equity: ${account.accountName}`,
              reference: 'Balance',
              amount: balance,
              account: account.accountName,
            });
            totalEquity += balance;
          }
        });

        const ratio = totalEquity > 0 ? totalLiabilities / totalEquity : 0;
        return { title: 'Debt to Equity Ratio Breakdown', lines, total: ratio };
      } else {
        // Assets for debt ratio
        let totalAssets = 0;
        const assetAccounts = accounts.filter(a => a.accountType === 'asset');
        assetAccounts.forEach(account => {
          const balance = calculateAccountBalance(account, periodData.journalEntries, periodData.expenses);
          if (balance !== 0) {
            lines.push({
              date: periodData.endDate,
              description: `Asset: ${account.accountName}`,
              reference: 'Balance',
              amount: balance,
              account: account.accountName,
            });
            totalAssets += balance;
          }
        });

        const ratio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
        return { title: 'Debt Ratio Breakdown', lines, total: ratio };
      }
    }

    case 'roa':
    case 'roe': {
      // Net Income calculation
      let revenue = 0;
      let expenses = 0;

      const revenueAccounts = accounts.filter(a => a.accountType === 'revenue');
      revenueAccounts.forEach(account => {
        periodData.journalEntries.forEach(entry => {
          entry.entries.forEach(line => {
            if (line.account === account.accountName && line.credit > 0) {
              lines.push({
                date: entry.date,
                description: `Revenue: ${entry.description}`,
                reference: entry.reference || '-',
                amount: line.credit,
                account: account.accountName,
              });
              revenue += line.credit;
            }
          });
        });
      });

      const expenseAccounts = accounts.filter(a => a.accountType === 'expense');
      expenseAccounts.forEach(account => {
        periodData.journalEntries.forEach(entry => {
          entry.entries.forEach(line => {
            if (line.account === account.accountName && line.debit > 0) {
              lines.push({
                date: entry.date,
                description: `Expense: ${entry.description}`,
                reference: entry.reference || '-',
                amount: -line.debit,
                account: account.accountName,
              });
              expenses += line.debit;
            }
          });
        });

        periodData.expenses.forEach(expense => {
          if (expense.category === account.accountName) {
            const netAmount = expense.includesVAT && expense.vatAmount 
              ? expense.amount - expense.vatAmount 
              : expense.amount;
            lines.push({
              date: expense.date,
              description: `Expense: ${expense.description}`,
              reference: expense.reference || '-',
              amount: -netAmount,
              account: account.accountName,
            });
            expenses += netAmount;
          }
        });
      });

      const netIncome = revenue - expenses;

      if (kpiType === 'roa') {
        // Total Assets
        let totalAssets = 0;
        const assetAccounts = accounts.filter(a => a.accountType === 'asset');
        assetAccounts.forEach(account => {
          const balance = calculateAccountBalance(account, periodData.journalEntries, periodData.expenses);
          if (balance !== 0) {
            lines.push({
              date: periodData.endDate,
              description: `Asset: ${account.accountName}`,
              reference: 'Balance',
              amount: balance,
              account: account.accountName,
            });
            totalAssets += balance;
          }
        });

        const roa = totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0;
        
        lines.push({
          date: periodData.endDate,
          description: 'Net Income',
          reference: 'Summary',
          amount: netIncome,
        });
        lines.push({
          date: periodData.endDate,
          description: 'Total Assets',
          reference: 'Summary',
          amount: totalAssets,
        });

        return { title: 'Return on Assets (ROA) Breakdown', lines, total: roa };
      } else {
        // Total Equity
        let totalEquity = 0;
        const equityAccounts = accounts.filter(a => a.accountType === 'equity');
        equityAccounts.forEach(account => {
          const balance = calculateAccountBalance(account, periodData.journalEntries, periodData.expenses);
          if (balance !== 0) {
            lines.push({
              date: periodData.endDate,
              description: `Equity: ${account.accountName}`,
              reference: 'Balance',
              amount: balance,
              account: account.accountName,
            });
            totalEquity += balance;
          }
        });

        const roe = totalEquity > 0 ? (netIncome / totalEquity) * 100 : 0;
        
        lines.push({
          date: periodData.endDate,
          description: 'Net Income',
          reference: 'Summary',
          amount: netIncome,
        });
        lines.push({
          date: periodData.endDate,
          description: 'Total Equity',
          reference: 'Summary',
          amount: totalEquity,
        });

        return { title: 'Return on Equity (ROE) Breakdown', lines, total: roe };
      }
    }

    case 'assetTurnover': {
      // Revenue
      let revenue = 0;
      const revenueAccounts = accounts.filter(a => a.accountType === 'revenue');
      revenueAccounts.forEach(account => {
        periodData.journalEntries.forEach(entry => {
          entry.entries.forEach(line => {
            if (line.account === account.accountName && line.credit > 0) {
              lines.push({
                date: entry.date,
                description: `Revenue: ${entry.description}`,
                reference: entry.reference || '-',
                amount: line.credit,
                account: account.accountName,
              });
              revenue += line.credit;
            }
          });
        });
      });

      // Total Assets
      let totalAssets = 0;
      const assetAccounts = accounts.filter(a => a.accountType === 'asset');
      assetAccounts.forEach(account => {
        const balance = calculateAccountBalance(account, periodData.journalEntries, periodData.expenses);
        if (balance !== 0) {
          lines.push({
            date: periodData.endDate,
            description: `Asset: ${account.accountName}`,
            reference: 'Balance',
            amount: balance,
            account: account.accountName,
          });
          totalAssets += balance;
        }
      });

      const turnover = totalAssets > 0 ? revenue / totalAssets : 0;
      
      lines.push({
        date: periodData.endDate,
        description: 'Total Revenue',
        reference: 'Summary',
        amount: revenue,
      });
      lines.push({
        date: periodData.endDate,
        description: 'Total Assets',
        reference: 'Summary',
        amount: totalAssets,
      });

      return { title: 'Asset Turnover Breakdown', lines, total: turnover };
    }

    default:
      return { title: 'KPI Breakdown', lines: [], total: 0 };
  }
};

export const generateKPIBreakdownPDF = (
  kpiType: KPIType,
  accounts: ChartAccount[],
  periodData: PeriodData,
  settings: CompanySettings
) => {
  const doc = new jsPDF();
  const breakdown = getKPIBreakdown(kpiType, accounts, periodData, settings);

  // Header
  doc.setFontSize(20);
  doc.text(breakdown.title, 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Period: ${periodData.startDate} to ${periodData.endDate}`, 105, 28, { align: 'center' });
  doc.text(settings.companyName, 105, 35, { align: 'center' });

  // Table data
  const tableData = breakdown.lines.map(line => [
    line.date,
    line.description,
    line.reference,
    line.account || '-',
    `${settings.currencySymbol}${line.amount.toFixed(2)}`,
  ]);

  // Add total row
  const isRatioType = ['currentRatio', 'quickRatio', 'debtToEquity', 'debtRatio', 'assetTurnover'].includes(kpiType);
  const isPercentageType = ['grossMargin', 'netProfitMargin', 'roa', 'roe', 'debtRatio'].includes(kpiType);
  
  if (isRatioType && !isPercentageType) {
    tableData.push(['', '', '', 'RATIO', breakdown.total.toFixed(2)]);
  } else if (isPercentageType) {
    tableData.push(['', '', '', 'PERCENTAGE', `${breakdown.total.toFixed(2)}%`]);
  } else {
    tableData.push(['', '', '', 'TOTAL', `${settings.currencySymbol}${breakdown.total.toFixed(2)}`]);
  }

  autoTable(doc, {
    startY: 45,
    head: [['Date', 'Description', 'Reference', 'Account', 'Amount']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
    footStyles: { fillColor: [200, 200, 200], fontStyle: 'bold' },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Generated: ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  doc.save(`${kpiType}-breakdown-${periodData.startDate}-to-${periodData.endDate}.pdf`);
};

export const generateKPIBreakdownExcel = (
  kpiType: KPIType,
  accounts: ChartAccount[],
  periodData: PeriodData,
  settings: CompanySettings
) => {
  const breakdown = getKPIBreakdown(kpiType, accounts, periodData, settings);

  const data = breakdown.lines.map(line => ({
    Date: line.date,
    Description: line.description,
    Reference: line.reference,
    Account: line.account || '-',
    Amount: line.amount,
  }));

  // Add total row
  const isRatioType = ['currentRatio', 'quickRatio', 'debtToEquity', 'assetTurnover'].includes(kpiType);
  const isPercentageType = ['grossMargin', 'netProfitMargin', 'roa', 'roe', 'debtRatio'].includes(kpiType);
  
  data.push({
    Date: '',
    Description: '',
    Reference: '',
    Account: isRatioType && !isPercentageType ? 'RATIO' : isPercentageType ? 'PERCENTAGE' : 'TOTAL',
    Amount: breakdown.total,
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, breakdown.title);

  XLSX.writeFile(workbook, `${kpiType}-breakdown-${periodData.startDate}-to-${periodData.endDate}.xlsx`);
};
