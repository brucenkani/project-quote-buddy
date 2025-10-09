import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ChartAccount } from '@/types/chartOfAccounts';
import { JournalEntry, Expense } from '@/types/accounting';
import { CompanySettings } from '@/types/settings';

export const generateTrialBalancePDF = (
  accounts: ChartAccount[],
  journalEntries: JournalEntry[],
  expenses: Expense[],
  dateRange: { startDate: string; endDate: string },
  settings: CompanySettings
) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Trial Balance', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, 105, 28, { align: 'center' });
  doc.text(settings.companyName, 105, 35, { align: 'center' });

  // Calculate balances - single column format
  const balances = accounts.map(account => {
    let debit = 0;
    let credit = 0;

    // From journal entries
    journalEntries.forEach(entry => {
      entry.entries.forEach(line => {
        if (line.account === account.accountName) {
          debit += line.debit;
          credit += line.credit;
        }
      });
    });

    // From expenses (VAT-exclusive amounts)
    expenses.forEach(expense => {
      if (expense.category === account.accountName) {
        const netAmount = expense.includesVAT && expense.vatAmount 
          ? expense.amount - expense.vatAmount 
          : expense.amount;
        debit += netAmount;
      }
    });

    // Calculate net balance: positive for debit balance, negative for credit balance
    const netBalance = debit - credit;

    return {
      code: account.accountNumber,
      name: account.accountName,
      type: account.accountType,
      balance: netBalance,
    };
  }).filter(b => b.balance !== 0);

  // Table data - single column showing net balance
  const tableData = balances.map(b => [
    b.code,
    b.name,
    b.type,
    `${settings.currencySymbol}${b.balance.toFixed(2)}`,
  ]);

  const totalBalance = balances.reduce((sum, b) => sum + b.balance, 0);

  tableData.push([
    '', 'TOTAL', '',
    `${settings.currencySymbol}${totalBalance.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 45,
    head: [['Code', 'Account Name', 'Type', 'Balance']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
    footStyles: { fillColor: [200, 200, 200], fontStyle: 'bold' },
  });

  doc.save(`trial-balance-${dateRange.startDate}-to-${dateRange.endDate}.pdf`);
};

export const generateTrialBalanceExcel = (
  accounts: ChartAccount[],
  journalEntries: JournalEntry[],
  expenses: Expense[],
  dateRange: { startDate: string; endDate: string },
  settings: CompanySettings
) => {
  const balances = accounts.map(account => {
    let debit = 0;
    let credit = 0;

    journalEntries.forEach(entry => {
      entry.entries.forEach(line => {
        if (line.account === account.accountName) {
          debit += line.debit;
          credit += line.credit;
        }
      });
    });

    expenses.forEach(expense => {
      if (expense.category === account.accountName) {
        const netAmount = expense.includesVAT && expense.vatAmount 
          ? expense.amount - expense.vatAmount 
          : expense.amount;
        debit += netAmount;
      }
    });

    // Calculate net balance: positive for debit, negative for credit
    const netBalance = debit - credit;

    return {
      Code: account.accountNumber,
      'Account Name': account.accountName,
      Type: account.accountType,
      Balance: netBalance,
    };
  }).filter(b => b.Balance !== 0);

  const totalBalance = balances.reduce((sum, b) => sum + b.Balance, 0);

  balances.push({
    Code: '',
    'Account Name': 'TOTAL',
    Type: 'current-asset' as const,
    Balance: totalBalance,
  });

  const worksheet = XLSX.utils.json_to_sheet(balances);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Trial Balance');

  XLSX.writeFile(workbook, `trial-balance-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`);
};

export const generateLedgerPDF = (
  account: ChartAccount,
  journalEntries: JournalEntry[],
  expenses: Expense[],
  dateRange: { startDate: string; endDate: string },
  settings: CompanySettings
) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Account Ledger', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Account: ${account.accountNumber} - ${account.accountName}`, 105, 28, { align: 'center' });
  doc.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, 105, 35, { align: 'center' });
  doc.text(settings.companyName, 105, 42, { align: 'center' });

  // Collect transactions
  const transactions: any[] = [];

  journalEntries.forEach(entry => {
    entry.entries.forEach(line => {
      if (line.account === account.accountName) {
        transactions.push({
          date: entry.date,
          description: entry.description,
          reference: entry.reference,
          debit: line.debit,
          credit: line.credit,
        });
      }
    });
  });

  expenses.forEach(expense => {
    if (expense.category === account.accountName) {
      const netAmount = expense.includesVAT && expense.vatAmount 
        ? expense.amount - expense.vatAmount 
        : expense.amount;
      transactions.push({
        date: expense.date,
        description: expense.description,
        reference: expense.reference,
        debit: netAmount,
        credit: 0,
      });
    }
  });

  // Sort by date
  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate running balance
  let balance = 0;
  const tableData = transactions.map(t => {
    balance += t.debit - t.credit;
    return [
      t.date,
      t.description,
      t.reference || '-',
      t.debit ? `${settings.currencySymbol}${t.debit.toFixed(2)}` : '-',
      t.credit ? `${settings.currencySymbol}${t.credit.toFixed(2)}` : '-',
      `${settings.currencySymbol}${balance.toFixed(2)}`,
    ];
  });

  autoTable(doc, {
    startY: 50,
    head: [['Date', 'Description', 'Reference', 'Debit', 'Credit', 'Balance']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  doc.save(`ledger-${account.accountNumber}-${dateRange.startDate}-to-${dateRange.endDate}.pdf`);
};

export const generateLedgerExcel = (
  account: ChartAccount,
  journalEntries: JournalEntry[],
  expenses: Expense[],
  dateRange: { startDate: string; endDate: string },
  settings: CompanySettings
) => {
  const transactions: any[] = [];

  journalEntries.forEach(entry => {
    entry.entries.forEach(line => {
      if (line.account === account.accountName) {
        transactions.push({
          Date: entry.date,
          Description: entry.description,
          Reference: entry.reference,
          Debit: line.debit,
          Credit: line.credit,
        });
      }
    });
  });

  expenses.forEach(expense => {
    if (expense.category === account.accountName) {
      const netAmount = expense.includesVAT && expense.vatAmount 
        ? expense.amount - expense.vatAmount 
        : expense.amount;
      transactions.push({
        Date: expense.date,
        Description: expense.description,
        Reference: expense.reference,
        Debit: netAmount,
        Credit: 0,
      });
    }
  });

  transactions.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

  let balance = 0;
  const data = transactions.map(t => {
    balance += t.Debit - t.Credit;
    return {
      Date: t.Date,
      Description: t.Description,
      Reference: t.Reference || '-',
      Debit: t.Debit,
      Credit: t.Credit,
      Balance: balance,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ledger');

  XLSX.writeFile(workbook, `ledger-${account.accountNumber}-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`);
};
