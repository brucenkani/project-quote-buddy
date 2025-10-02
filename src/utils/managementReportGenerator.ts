import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ChartAccount } from '@/types/chartOfAccounts';
import { CompanySettings } from '@/types/settings';
import { 
  PeriodData, 
  generateIncomeStatement, 
  generateBalanceSheet, 
  generateCashFlowStatement,
  generateEquityStatement 
} from './financialStatements';

// Income Statement PDF
export const generateIncomeStatementPDF = (
  accounts: ChartAccount[],
  currentPeriod: PeriodData,
  priorPeriod: PeriodData,
  settings: CompanySettings
) => {
  const doc = new jsPDF();
  
  const current = generateIncomeStatement(accounts, currentPeriod);
  const prior = generateIncomeStatement(accounts, priorPeriod);

  // Header
  doc.setFontSize(20);
  doc.text('Income Statement', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(settings.companyName, 105, 28, { align: 'center' });
  doc.text(`Current: ${currentPeriod.startDate} to ${currentPeriod.endDate}`, 105, 35, { align: 'center' });
  doc.text(`Prior: ${priorPeriod.startDate} to ${priorPeriod.endDate}`, 105, 42, { align: 'center' });

  // Revenue section with variance
  const revenueData = current.revenue.map(item => {
    const priorAmount = prior.revenue.find(p => p.account === item.account)?.amount || 0;
    const variance = item.amount - priorAmount;
    const variancePercent = priorAmount !== 0 ? ((variance / priorAmount) * 100) : 0;
    return [
      item.account,
      `${settings.currencySymbol}${item.amount.toFixed(2)}`,
      `${settings.currencySymbol}${priorAmount.toFixed(2)}`,
      `${settings.currencySymbol}${variance.toFixed(2)}`,
      `${variancePercent.toFixed(1)}%`,
    ];
  });

  const revenueVariance = current.totalRevenue - prior.totalRevenue;
  const revenueVariancePercent = prior.totalRevenue !== 0 ? ((revenueVariance / prior.totalRevenue) * 100) : 0;

  revenueData.push([
    'Total Revenue',
    `${settings.currencySymbol}${current.totalRevenue.toFixed(2)}`,
    `${settings.currencySymbol}${prior.totalRevenue.toFixed(2)}`,
    `${settings.currencySymbol}${revenueVariance.toFixed(2)}`,
    `${revenueVariancePercent.toFixed(1)}%`,
  ]);

  // Expenses section with variance
  const expenseData = current.expenses.map(item => {
    const priorAmount = prior.expenses.find(p => p.account === item.account)?.amount || 0;
    const variance = item.amount - priorAmount;
    const variancePercent = priorAmount !== 0 ? ((variance / priorAmount) * 100) : 0;
    return [
      item.account,
      `${settings.currencySymbol}${item.amount.toFixed(2)}`,
      `${settings.currencySymbol}${priorAmount.toFixed(2)}`,
      `${settings.currencySymbol}${variance.toFixed(2)}`,
      `${variancePercent.toFixed(1)}%`,
    ];
  });

  const expenseVariance = current.totalExpenses - prior.totalExpenses;
  const expenseVariancePercent = prior.totalExpenses !== 0 ? ((expenseVariance / prior.totalExpenses) * 100) : 0;

  expenseData.push([
    'Total Expenses',
    `${settings.currencySymbol}${current.totalExpenses.toFixed(2)}`,
    `${settings.currencySymbol}${prior.totalExpenses.toFixed(2)}`,
    `${settings.currencySymbol}${expenseVariance.toFixed(2)}`,
    `${expenseVariancePercent.toFixed(1)}%`,
  ]);

  autoTable(doc, {
    startY: 50,
    head: [['Revenue', 'Current Year', 'Prior Year', 'Variance', 'Variance %']],
    body: revenueData,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  autoTable(doc, {
    startY: finalY,
    head: [['Expenses', 'Current Year', 'Prior Year', 'Variance', 'Variance %']],
    body: expenseData,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  const netIncomeY = (doc as any).lastAutoTable.finalY + 10;
  const netIncomeVariance = current.netIncome - prior.netIncome;
  const netIncomeVariancePercent = prior.netIncome !== 0 ? ((netIncomeVariance / prior.netIncome) * 100) : 0;
  
  autoTable(doc, {
    startY: netIncomeY,
    body: [[
      'Net Income',
      `${settings.currencySymbol}${current.netIncome.toFixed(2)}`,
      `${settings.currencySymbol}${prior.netIncome.toFixed(2)}`,
      `${settings.currencySymbol}${netIncomeVariance.toFixed(2)}`,
      `${netIncomeVariancePercent.toFixed(1)}%`,
    ]],
    theme: 'grid',
    styles: { fontSize: 10, fontStyle: 'bold' },
  });

  doc.save(`income-statement-${currentPeriod.endDate}.pdf`);
};

// Income Statement Excel
export const generateIncomeStatementExcel = (
  accounts: ChartAccount[],
  currentPeriod: PeriodData,
  priorPeriod: PeriodData,
  settings: CompanySettings
) => {
  const current = generateIncomeStatement(accounts, currentPeriod);
  const prior = generateIncomeStatement(accounts, priorPeriod);

  const data: any[] = [
    { Item: 'REVENUE', 'Current Year': '', 'Prior Year': '', 'Variance': '', 'Variance %': '' },
  ];

  current.revenue.forEach(item => {
    const priorAmount = prior.revenue.find(p => p.account === item.account)?.amount || 0;
    const variance = item.amount - priorAmount;
    const variancePercent = priorAmount !== 0 ? ((variance / priorAmount) * 100) : 0;
    data.push({
      Item: item.account,
      'Current Year': item.amount,
      'Prior Year': priorAmount,
      'Variance': variance,
      'Variance %': `${variancePercent.toFixed(1)}%`,
    });
  });

  const revenueVariance = current.totalRevenue - prior.totalRevenue;
  const revenueVariancePercent = prior.totalRevenue !== 0 ? ((revenueVariance / prior.totalRevenue) * 100) : 0;

  data.push({
    Item: 'Total Revenue',
    'Current Year': current.totalRevenue,
    'Prior Year': prior.totalRevenue,
    'Variance': revenueVariance,
    'Variance %': `${revenueVariancePercent.toFixed(1)}%`,
  });

  data.push({ Item: '', 'Current Year': '', 'Prior Year': '', 'Variance': '', 'Variance %': '' });
  data.push({ Item: 'EXPENSES', 'Current Year': '', 'Prior Year': '', 'Variance': '', 'Variance %': '' });

  current.expenses.forEach(item => {
    const priorAmount = prior.expenses.find(p => p.account === item.account)?.amount || 0;
    const variance = item.amount - priorAmount;
    const variancePercent = priorAmount !== 0 ? ((variance / priorAmount) * 100) : 0;
    data.push({
      Item: item.account,
      'Current Year': item.amount,
      'Prior Year': priorAmount,
      'Variance': variance,
      'Variance %': `${variancePercent.toFixed(1)}%`,
    });
  });

  const expenseVariance = current.totalExpenses - prior.totalExpenses;
  const expenseVariancePercent = prior.totalExpenses !== 0 ? ((expenseVariance / prior.totalExpenses) * 100) : 0;

  data.push({
    Item: 'Total Expenses',
    'Current Year': current.totalExpenses,
    'Prior Year': prior.totalExpenses,
    'Variance': expenseVariance,
    'Variance %': `${expenseVariancePercent.toFixed(1)}%`,
  });

  const netIncomeVariance = current.netIncome - prior.netIncome;
  const netIncomeVariancePercent = prior.netIncome !== 0 ? ((netIncomeVariance / prior.netIncome) * 100) : 0;

  data.push({ Item: '', 'Current Year': '', 'Prior Year': '', 'Variance': '', 'Variance %': '' });
  data.push({
    Item: 'NET INCOME',
    'Current Year': current.netIncome,
    'Prior Year': prior.netIncome,
    'Variance': netIncomeVariance,
    'Variance %': `${netIncomeVariancePercent.toFixed(1)}%`,
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Income Statement');

  XLSX.writeFile(workbook, `income-statement-${currentPeriod.endDate}.xlsx`);
};

// Balance Sheet PDF
export const generateBalanceSheetPDF = (
  accounts: ChartAccount[],
  currentPeriod: PeriodData,
  priorPeriod: PeriodData,
  settings: CompanySettings
) => {
  const doc = new jsPDF();
  
  const current = generateBalanceSheet(accounts, currentPeriod);
  const prior = generateBalanceSheet(accounts, priorPeriod);

  // Header
  doc.setFontSize(20);
  doc.text('Balance Sheet', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(settings.companyName, 105, 28, { align: 'center' });
  doc.text(`As of ${currentPeriod.endDate} vs ${priorPeriod.endDate}`, 105, 35, { align: 'center' });

  // Assets with variance
  const assetData = current.assets.map(item => {
    const priorAmount = prior.assets.find(p => p.account === item.account)?.amount || 0;
    const variance = item.amount - priorAmount;
    const variancePercent = priorAmount !== 0 ? ((variance / priorAmount) * 100) : 0;
    return [
      item.account, 
      `${settings.currencySymbol}${item.amount.toFixed(2)}`, 
      `${settings.currencySymbol}${priorAmount.toFixed(2)}`,
      `${settings.currencySymbol}${variance.toFixed(2)}`,
      `${variancePercent.toFixed(1)}%`
    ];
  });
  
  const assetVariance = current.totalAssets - prior.totalAssets;
  const assetVariancePercent = prior.totalAssets !== 0 ? ((assetVariance / prior.totalAssets) * 100) : 0;
  
  assetData.push([
    'Total Assets', 
    `${settings.currencySymbol}${current.totalAssets.toFixed(2)}`, 
    `${settings.currencySymbol}${prior.totalAssets.toFixed(2)}`,
    `${settings.currencySymbol}${assetVariance.toFixed(2)}`,
    `${assetVariancePercent.toFixed(1)}%`
  ]);

  autoTable(doc, {
    startY: 45,
    head: [['Assets', 'Current Year', 'Prior Year', 'Variance', 'Variance %']],
    body: assetData,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 10;

  // Liabilities with variance
  const liabilityData = current.liabilities.map(item => {
    const priorAmount = prior.liabilities.find(p => p.account === item.account)?.amount || 0;
    const variance = item.amount - priorAmount;
    const variancePercent = priorAmount !== 0 ? ((variance / priorAmount) * 100) : 0;
    return [
      item.account, 
      `${settings.currencySymbol}${item.amount.toFixed(2)}`, 
      `${settings.currencySymbol}${priorAmount.toFixed(2)}`,
      `${settings.currencySymbol}${variance.toFixed(2)}`,
      `${variancePercent.toFixed(1)}%`
    ];
  });
  
  const liabilityVariance = current.totalLiabilities - prior.totalLiabilities;
  const liabilityVariancePercent = prior.totalLiabilities !== 0 ? ((liabilityVariance / prior.totalLiabilities) * 100) : 0;
  
  liabilityData.push([
    'Total Liabilities', 
    `${settings.currencySymbol}${current.totalLiabilities.toFixed(2)}`, 
    `${settings.currencySymbol}${prior.totalLiabilities.toFixed(2)}`,
    `${settings.currencySymbol}${liabilityVariance.toFixed(2)}`,
    `${liabilityVariancePercent.toFixed(1)}%`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Liabilities', 'Current Year', 'Prior Year', 'Variance', 'Variance %']],
    body: liabilityData,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Equity with variance
  const equityData = current.equity.map(item => {
    const priorAmount = prior.equity.find(p => p.account === item.account)?.amount || 0;
    const variance = item.amount - priorAmount;
    const variancePercent = priorAmount !== 0 ? ((variance / priorAmount) * 100) : 0;
    return [
      item.account, 
      `${settings.currencySymbol}${item.amount.toFixed(2)}`, 
      `${settings.currencySymbol}${priorAmount.toFixed(2)}`,
      `${settings.currencySymbol}${variance.toFixed(2)}`,
      `${variancePercent.toFixed(1)}%`
    ];
  });
  
  const equityVariance = current.totalEquity - prior.totalEquity;
  const equityVariancePercent = prior.totalEquity !== 0 ? ((equityVariance / prior.totalEquity) * 100) : 0;
  
  equityData.push([
    'Total Equity', 
    `${settings.currencySymbol}${current.totalEquity.toFixed(2)}`, 
    `${settings.currencySymbol}${prior.totalEquity.toFixed(2)}`,
    `${settings.currencySymbol}${equityVariance.toFixed(2)}`,
    `${equityVariancePercent.toFixed(1)}%`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Equity', 'Current Year', 'Prior Year', 'Variance', 'Variance %']],
    body: equityData,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  doc.save(`balance-sheet-${currentPeriod.endDate}.pdf`);
};

// Balance Sheet Excel
export const generateBalanceSheetExcel = (
  accounts: ChartAccount[],
  currentPeriod: PeriodData,
  priorPeriod: PeriodData,
  settings: CompanySettings
) => {
  const current = generateBalanceSheet(accounts, currentPeriod);
  const prior = generateBalanceSheet(accounts, priorPeriod);

  const data: any[] = [{ Item: 'ASSETS', 'Current Year': '', 'Prior Year': '', 'Variance': '', 'Variance %': '' }];

  current.assets.forEach(item => {
    const priorAmount = prior.assets.find(p => p.account === item.account)?.amount || 0;
    const variance = item.amount - priorAmount;
    const variancePercent = priorAmount !== 0 ? ((variance / priorAmount) * 100) : 0;
    data.push({ 
      Item: item.account, 
      'Current Year': item.amount, 
      'Prior Year': priorAmount,
      'Variance': variance,
      'Variance %': `${variancePercent.toFixed(1)}%`
    });
  });
  
  const assetVariance = current.totalAssets - prior.totalAssets;
  const assetVariancePercent = prior.totalAssets !== 0 ? ((assetVariance / prior.totalAssets) * 100) : 0;
  
  data.push({ 
    Item: 'Total Assets', 
    'Current Year': current.totalAssets, 
    'Prior Year': prior.totalAssets,
    'Variance': assetVariance,
    'Variance %': `${assetVariancePercent.toFixed(1)}%`
  });

  data.push({ Item: '', 'Current Year': '', 'Prior Year': '', 'Variance': '', 'Variance %': '' });
  data.push({ Item: 'LIABILITIES', 'Current Year': '', 'Prior Year': '', 'Variance': '', 'Variance %': '' });

  current.liabilities.forEach(item => {
    const priorAmount = prior.liabilities.find(p => p.account === item.account)?.amount || 0;
    const variance = item.amount - priorAmount;
    const variancePercent = priorAmount !== 0 ? ((variance / priorAmount) * 100) : 0;
    data.push({ 
      Item: item.account, 
      'Current Year': item.amount, 
      'Prior Year': priorAmount,
      'Variance': variance,
      'Variance %': `${variancePercent.toFixed(1)}%`
    });
  });
  
  const liabilityVariance = current.totalLiabilities - prior.totalLiabilities;
  const liabilityVariancePercent = prior.totalLiabilities !== 0 ? ((liabilityVariance / prior.totalLiabilities) * 100) : 0;
  
  data.push({ 
    Item: 'Total Liabilities', 
    'Current Year': current.totalLiabilities, 
    'Prior Year': prior.totalLiabilities,
    'Variance': liabilityVariance,
    'Variance %': `${liabilityVariancePercent.toFixed(1)}%`
  });

  data.push({ Item: '', 'Current Year': '', 'Prior Year': '', 'Variance': '', 'Variance %': '' });
  data.push({ Item: 'EQUITY', 'Current Year': '', 'Prior Year': '', 'Variance': '', 'Variance %': '' });

  current.equity.forEach(item => {
    const priorAmount = prior.equity.find(p => p.account === item.account)?.amount || 0;
    const variance = item.amount - priorAmount;
    const variancePercent = priorAmount !== 0 ? ((variance / priorAmount) * 100) : 0;
    data.push({ 
      Item: item.account, 
      'Current Year': item.amount, 
      'Prior Year': priorAmount,
      'Variance': variance,
      'Variance %': `${variancePercent.toFixed(1)}%`
    });
  });
  
  const equityVariance = current.totalEquity - prior.totalEquity;
  const equityVariancePercent = prior.totalEquity !== 0 ? ((equityVariance / prior.totalEquity) * 100) : 0;
  
  data.push({ 
    Item: 'Total Equity', 
    'Current Year': current.totalEquity, 
    'Prior Year': prior.totalEquity,
    'Variance': equityVariance,
    'Variance %': `${equityVariancePercent.toFixed(1)}%`
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Balance Sheet');

  XLSX.writeFile(workbook, `balance-sheet-${currentPeriod.endDate}.xlsx`);
};

// Cash Flow Statement PDF
export const generateCashFlowPDF = (
  accounts: ChartAccount[],
  currentPeriod: PeriodData,
  priorPeriod: PeriodData,
  settings: CompanySettings
) => {
  const doc = new jsPDF();
  
  const current = generateCashFlowStatement(accounts, currentPeriod);
  const prior = generateCashFlowStatement(accounts, priorPeriod);

  doc.setFontSize(20);
  doc.text('Cash Flow Statement', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(settings.companyName, 105, 28, { align: 'center' });
  doc.text(`Current: ${currentPeriod.startDate} to ${currentPeriod.endDate}`, 105, 35, { align: 'center' });

  const operatingData = current.operating.map(item => [
    item.description,
    `${settings.currencySymbol}${item.amount.toFixed(2)}`,
  ]);

  const investingData = current.investing.map(item => [
    item.description,
    `${settings.currencySymbol}${item.amount.toFixed(2)}`,
  ]);

  const financingData = current.financing.map(item => [
    item.description,
    `${settings.currencySymbol}${item.amount.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 45,
    head: [['Operating Activities', 'Amount']],
    body: operatingData,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 10;

  autoTable(doc, {
    startY: currentY,
    head: [['Investing Activities', 'Amount']],
    body: investingData.length > 0 ? investingData : [['No investing activities', '-']],
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  autoTable(doc, {
    startY: currentY,
    head: [['Financing Activities', 'Amount']],
    body: financingData.length > 0 ? financingData : [['No financing activities', '-']],
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  autoTable(doc, {
    startY: currentY,
    body: [['Net Cash Flow', `${settings.currencySymbol}${current.netCashFlow.toFixed(2)}`]],
    theme: 'grid',
    styles: { fontSize: 10, fontStyle: 'bold' },
  });

  doc.save(`cash-flow-${currentPeriod.endDate}.pdf`);
};

// Cash Flow Excel
export const generateCashFlowExcel = (
  accounts: ChartAccount[],
  currentPeriod: PeriodData,
  settings: CompanySettings
) => {
  const current = generateCashFlowStatement(accounts, currentPeriod);

  const data: any[] = [{ Activity: 'OPERATING ACTIVITIES', Amount: '' }];
  current.operating.forEach(item => {
    data.push({ Activity: item.description, Amount: item.amount });
  });

  data.push({ Activity: '', Amount: '' });
  data.push({ Activity: 'INVESTING ACTIVITIES', Amount: '' });
  current.investing.forEach(item => {
    data.push({ Activity: item.description, Amount: item.amount });
  });

  data.push({ Activity: '', Amount: '' });
  data.push({ Activity: 'FINANCING ACTIVITIES', Amount: '' });
  current.financing.forEach(item => {
    data.push({ Activity: item.description, Amount: item.amount });
  });

  data.push({ Activity: '', Amount: '' });
  data.push({ Activity: 'NET CASH FLOW', Amount: current.netCashFlow });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cash Flow');

  XLSX.writeFile(workbook, `cash-flow-${currentPeriod.endDate}.xlsx`);
};

// Equity Statement PDF
export const generateEquityStatementPDF = (
  accounts: ChartAccount[],
  currentPeriod: PeriodData,
  priorPeriod: PeriodData,
  settings: CompanySettings
) => {
  const doc = new jsPDF();
  
  const equity = generateEquityStatement(accounts, currentPeriod, priorPeriod);

  doc.setFontSize(20);
  doc.text('Statement of Changes in Equity', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(settings.companyName, 105, 28, { align: 'center' });
  doc.text(`Period: ${currentPeriod.startDate} to ${currentPeriod.endDate}`, 105, 35, { align: 'center' });

  const data = [
    ['Opening Balance', `${settings.currencySymbol}${equity.openingBalance.toFixed(2)}`],
    ['Add: Net Income', `${settings.currencySymbol}${equity.netIncome.toFixed(2)}`],
    ['Less: Drawings', `${settings.currencySymbol}${equity.drawings.toFixed(2)}`],
    ['Closing Balance', `${settings.currencySymbol}${equity.closingBalance.toFixed(2)}`],
  ];

  autoTable(doc, {
    startY: 45,
    head: [['Description', 'Amount']],
    body: data,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  doc.save(`equity-statement-${currentPeriod.endDate}.pdf`);
};

// Equity Statement Excel
export const generateEquityStatementExcel = (
  accounts: ChartAccount[],
  currentPeriod: PeriodData,
  priorPeriod: PeriodData,
  settings: CompanySettings
) => {
  const equity = generateEquityStatement(accounts, currentPeriod, priorPeriod);

  const data = [
    { Description: 'Opening Balance', Amount: equity.openingBalance },
    { Description: 'Add: Net Income', Amount: equity.netIncome },
    { Description: 'Less: Drawings', Amount: equity.drawings },
    { Description: 'Closing Balance', Amount: equity.closingBalance },
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Equity Statement');

  XLSX.writeFile(workbook, `equity-statement-${currentPeriod.endDate}.xlsx`);
};
