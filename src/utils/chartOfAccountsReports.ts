import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ChartAccount } from '@/types/chartOfAccounts';

export const generateChartOfAccountsPDF = (accounts: ChartAccount[]) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text('Chart of Accounts', 14, 20);
  
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
  
  // Prepare data for table
  const tableData = accounts.map(account => [
    account.accountNumber,
    account.accountName,
    account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1),
    account.openingBalance ? `R ${account.openingBalance.toFixed(2)}` : 'R 0.00'
  ]);
  
  // Generate table
  autoTable(doc, {
    startY: 35,
    head: [['Account #', 'Account Name', 'Type', 'Opening Balance']],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [71, 85, 105],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 80 },
      2: { cellWidth: 35 },
      3: { cellWidth: 40, halign: 'right' }
    }
  });
  
  // Save the PDF
  doc.save(`chart-of-accounts-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateChartOfAccountsExcel = (accounts: ChartAccount[]) => {
  // Prepare data
  const data = accounts.map(account => ({
    'Account Number': account.accountNumber,
    'Account Name': account.accountName,
    'Account Type': account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1),
    'Opening Balance': account.openingBalance || 0,
    'Created Date': new Date(account.createdAt).toLocaleDateString()
  }));
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 15 },  // Account Number
    { wch: 35 },  // Account Name
    { wch: 15 },  // Account Type
    { wch: 18 },  // Opening Balance
    { wch: 15 }   // Created Date
  ];
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Chart of Accounts');
  
  // Save file
  XLSX.writeFile(wb, `chart-of-accounts-${new Date().toISOString().split('T')[0]}.xlsx`);
};
