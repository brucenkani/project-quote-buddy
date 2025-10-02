import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanySettings } from '@/types/settings';
import { EnhancedKPIs } from '@/utils/financialStatements';

export const generateDashboardPDF = (
  kpis: EnhancedKPIs,
  currentPeriod: { startDate: string; endDate: string },
  priorPeriod: { startDate: string; endDate: string },
  settings: CompanySettings
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 15;
  const marginRight = 15;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let yPos = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Dashboard', marginLeft, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.companyName, marginLeft, yPos);

  yPos += 5;
  doc.setFontSize(9);
  doc.text(`Current Period: ${currentPeriod.startDate} to ${currentPeriod.endDate}`, marginLeft, yPos);
  yPos += 4;
  doc.text(`Prior Period: ${priorPeriod.startDate} to ${priorPeriod.endDate}`, marginLeft, yPos);

  yPos += 10;

  const formatCurrency = (value: number) => 
    `${settings.currencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;
  
  const formatRatio = (value: number) => value.toFixed(2);

  // Financial Performance Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Performance', marginLeft, yPos);
  yPos += 7;

  const performanceData = [
    ['Total Revenue', formatCurrency(kpis.current.revenue), formatCurrency(kpis.prior.revenue)],
    ['Net Income', formatCurrency(kpis.current.netIncome), formatCurrency(kpis.prior.netIncome)],
    ['Gross Margin', formatPercentage(kpis.current.grossMargin), formatPercentage(kpis.prior.grossMargin)],
    ['Net Profit Margin', formatPercentage(kpis.current.netProfitMargin), formatPercentage(kpis.prior.netProfitMargin)],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Current Period', 'Prior Period']],
    body: performanceData,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    margin: { left: marginLeft, right: marginRight },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Balance Sheet Items Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Balance Sheet Items', marginLeft, yPos);
  yPos += 7;

  const balanceSheetData = [
    ['Accounts Receivable', formatCurrency(kpis.current.accountsReceivable), formatCurrency(kpis.prior.accountsReceivable)],
    ['Accounts Payable', formatCurrency(kpis.current.accountsPayable), formatCurrency(kpis.prior.accountsPayable)],
  ];

  if (kpis.current.inventory !== undefined) {
    balanceSheetData.push(['Inventory', formatCurrency(kpis.current.inventory), formatCurrency(kpis.prior.inventory || 0)]);
  }

  autoTable(doc, {
    startY: yPos,
    head: [['Item', 'Current Period', 'Prior Period']],
    body: balanceSheetData,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    margin: { left: marginLeft, right: marginRight },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Liquidity & Solvency Ratios
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Liquidity & Solvency Ratios', marginLeft, yPos);
  yPos += 7;

  const liquidityData = [
    ['Current Ratio', formatRatio(kpis.current.currentRatio), formatRatio(kpis.prior.currentRatio)],
    ['Quick Ratio', formatRatio(kpis.current.quickRatio), formatRatio(kpis.prior.quickRatio)],
    ['Working Capital', formatCurrency(kpis.current.workingCapital), formatCurrency(kpis.prior.workingCapital)],
    ['Debt to Equity', formatRatio(kpis.current.debtToEquity), formatRatio(kpis.prior.debtToEquity)],
    ['Debt Ratio', formatPercentage(kpis.current.debtRatio), formatPercentage(kpis.prior.debtRatio)],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Ratio', 'Current Period', 'Prior Period']],
    body: liquidityData,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    margin: { left: marginLeft, right: marginRight },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Profitability Ratios
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Profitability Ratios', marginLeft, yPos);
  yPos += 7;

  const profitabilityData = [
    ['Return on Assets (ROA)', formatPercentage(kpis.current.roa), formatPercentage(kpis.prior.roa)],
    ['Return on Equity (ROE)', formatPercentage(kpis.current.roe), formatPercentage(kpis.prior.roe)],
    ['Asset Turnover', formatRatio(kpis.current.assetTurnover), formatRatio(kpis.prior.assetTurnover)],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Ratio', 'Current Period', 'Prior Period']],
    body: profitabilityData,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    margin: { left: marginLeft, right: marginRight },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generated on ${new Date().toLocaleDateString()}`,
      marginLeft,
      doc.internal.pageSize.getHeight() - 10
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - marginRight - 20,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  doc.save(`Financial-Dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
};
