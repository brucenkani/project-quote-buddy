import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Invoice } from '@/types/invoice';
import { Expense } from '@/types/accounting';
import { CompanySettings } from '@/types/settings';

interface VATReportData {
  outputVAT: { // VAT collected from sales (invoices)
    transactions: Array<{
      date: string;
      reference: string;
      description: string;
      taxableAmount: number;
      vatAmount: number;
    }>;
    totalTaxable: number;
    totalVAT: number;
  };
  inputVAT: { // VAT paid on purchases (expenses)
    transactions: Array<{
      date: string;
      reference: string;
      description: string;
      taxableAmount: number;
      vatAmount: number;
    }>;
    totalTaxable: number;
    totalVAT: number;
  };
  netVAT: number; // Output VAT - Input VAT (amount owed to or refundable from tax authority)
}

export const calculateVATReport = (
  invoices: Invoice[],
  expenses: Expense[],
  dateRange: { startDate: string; endDate: string }
): VATReportData => {
  const outputTransactions = invoices
    .filter(inv => {
      const invDate = new Date(inv.issueDate);
      return invDate >= new Date(dateRange.startDate) && 
             invDate <= new Date(dateRange.endDate) &&
             inv.type !== 'credit-note';
    })
    .map(inv => ({
      date: inv.issueDate,
      reference: inv.invoiceNumber,
      description: inv.projectDetails.projectName || inv.projectDetails.clientName,
      taxableAmount: inv.subtotal - (inv.discount || 0),
      vatAmount: inv.taxAmount,
    }));

  const inputTransactions = expenses
    .filter(exp => {
      const expDate = new Date(exp.date);
      return expDate >= new Date(dateRange.startDate) && 
             expDate <= new Date(dateRange.endDate) &&
             exp.includesVAT &&
             exp.vatAmount;
    })
    .map(exp => ({
      date: exp.date,
      reference: exp.reference || exp.id.slice(0, 8),
      description: exp.description || exp.category,
      taxableAmount: exp.amount - (exp.vatAmount || 0),
      vatAmount: exp.vatAmount || 0,
    }));

  const outputVATTotal = outputTransactions.reduce((sum, t) => sum + t.vatAmount, 0);
  const outputTaxableTotal = outputTransactions.reduce((sum, t) => sum + t.taxableAmount, 0);
  
  const inputVATTotal = inputTransactions.reduce((sum, t) => sum + t.vatAmount, 0);
  const inputTaxableTotal = inputTransactions.reduce((sum, t) => sum + t.taxableAmount, 0);

  return {
    outputVAT: {
      transactions: outputTransactions,
      totalTaxable: outputTaxableTotal,
      totalVAT: outputVATTotal,
    },
    inputVAT: {
      transactions: inputTransactions,
      totalTaxable: inputTaxableTotal,
      totalVAT: inputVATTotal,
    },
    netVAT: outputVATTotal - inputVATTotal,
  };
};

export const generateVATReportPDF = (
  invoices: Invoice[],
  expenses: Expense[],
  dateRange: { startDate: string; endDate: string },
  settings: CompanySettings
): void => {
  const doc = new jsPDF();
  const data = calculateVATReport(invoices, expenses, dateRange);

  // Header
  doc.setFontSize(20);
  doc.text(settings.companyName, 14, 20);
  doc.setFontSize(12);
  doc.text('VAT/Tax Report', 14, 28);
  doc.setFontSize(10);
  doc.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, 14, 35);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 40);

  // Output VAT (Sales Tax Collected)
  doc.setFontSize(14);
  doc.text('Output VAT (Tax Collected on Sales)', 14, 50);
  
  autoTable(doc, {
    startY: 55,
    head: [['Date', 'Reference', 'Description', 'Taxable Amount', 'VAT Amount']],
    body: data.outputVAT.transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.reference,
      t.description,
      `${settings.currencySymbol}${t.taxableAmount.toFixed(2)}`,
      `${settings.currencySymbol}${t.vatAmount.toFixed(2)}`,
    ]),
    foot: [[
      '', '', 'TOTAL',
      `${settings.currencySymbol}${data.outputVAT.totalTaxable.toFixed(2)}`,
      `${settings.currencySymbol}${data.outputVAT.totalVAT.toFixed(2)}`,
    ]],
    theme: 'striped',
  });

  // Input VAT (Purchase Tax Paid)
  const outputTableHeight = (doc as any).lastAutoTable.finalY;
  doc.setFontSize(14);
  doc.text('Input VAT (Tax Paid on Purchases)', 14, outputTableHeight + 15);
  
  autoTable(doc, {
    startY: outputTableHeight + 20,
    head: [['Date', 'Reference', 'Description', 'Taxable Amount', 'VAT Amount']],
    body: data.inputVAT.transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.reference,
      t.description,
      `${settings.currencySymbol}${t.taxableAmount.toFixed(2)}`,
      `${settings.currencySymbol}${t.vatAmount.toFixed(2)}`,
    ]),
    foot: [[
      '', '', 'TOTAL',
      `${settings.currencySymbol}${data.inputVAT.totalTaxable.toFixed(2)}`,
      `${settings.currencySymbol}${data.inputVAT.totalVAT.toFixed(2)}`,
    ]],
    theme: 'striped',
  });

  // Net VAT Summary
  const inputTableHeight = (doc as any).lastAutoTable.finalY;
  doc.setFontSize(14);
  doc.text('VAT Summary', 14, inputTableHeight + 15);
  
  autoTable(doc, {
    startY: inputTableHeight + 20,
    body: [
      ['Output VAT (Collected)', `${settings.currencySymbol}${data.outputVAT.totalVAT.toFixed(2)}`],
      ['Input VAT (Paid)', `${settings.currencySymbol}${data.inputVAT.totalVAT.toFixed(2)}`],
      ['Net VAT Payable/(Refundable)', `${settings.currencySymbol}${data.netVAT.toFixed(2)}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
  });

  doc.save(`VAT_Report_${dateRange.startDate}_to_${dateRange.endDate}.pdf`);
};

export const generateVATReportExcel = (
  invoices: Invoice[],
  expenses: Expense[],
  dateRange: { startDate: string; endDate: string },
  settings: CompanySettings
): void => {
  const data = calculateVATReport(invoices, expenses, dateRange);

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Output VAT Sheet
  const outputData = [
    [`${settings.companyName} - VAT Report`],
    [`Period: ${dateRange.startDate} to ${dateRange.endDate}`],
    [`Generated: ${new Date().toLocaleDateString()}`],
    [],
    ['OUTPUT VAT (Tax Collected on Sales)'],
    ['Date', 'Reference', 'Description', 'Taxable Amount', 'VAT Amount'],
    ...data.outputVAT.transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.reference,
      t.description,
      t.taxableAmount,
      t.vatAmount,
    ]),
    ['', '', 'TOTAL', data.outputVAT.totalTaxable, data.outputVAT.totalVAT],
    [],
    ['INPUT VAT (Tax Paid on Purchases)'],
    ['Date', 'Reference', 'Description', 'Taxable Amount', 'VAT Amount'],
    ...data.inputVAT.transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.reference,
      t.description,
      t.taxableAmount,
      t.vatAmount,
    ]),
    ['', '', 'TOTAL', data.inputVAT.totalTaxable, data.inputVAT.totalVAT],
    [],
    ['VAT SUMMARY'],
    ['Output VAT (Collected)', data.outputVAT.totalVAT],
    ['Input VAT (Paid)', data.inputVAT.totalVAT],
    ['Net VAT Payable/(Refundable)', data.netVAT],
  ];

  const ws = XLSX.utils.aoa_to_sheet(outputData);
  XLSX.utils.book_append_sheet(wb, ws, 'VAT Report');

  XLSX.writeFile(wb, `VAT_Report_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`);
};
