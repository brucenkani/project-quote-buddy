import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote } from '@/types/quote';

export const generateQuotePDF = (quote: Quote) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Quote #${quote.id.substring(0, 8).toUpperCase()}`, 14, 30);
  
  // Company Info (right side)
  doc.setFontSize(9);
  const companyText = [
    'QuoteBuilder Pro',
    'professional@quotebuilder.com',
    'Valid until: ' + new Date(quote.validUntil).toLocaleDateString(),
  ];
  companyText.forEach((text, i) => {
    doc.text(text, pageWidth - 14, 15 + (i * 5), { align: 'right' });
  });
  
  // Client Details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Client Information', 14, 52);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const clientInfo = [
    quote.projectDetails.clientName,
    quote.projectDetails.clientEmail,
    quote.projectDetails.clientPhone,
  ];
  clientInfo.forEach((text, i) => {
    doc.text(text, 14, 60 + (i * 5));
  });
  
  // Project Details
  doc.setFont('helvetica', 'bold');
  doc.text('Project Details', pageWidth / 2 + 7, 52);
  
  doc.setFont('helvetica', 'normal');
  const projectInfo = [
    quote.projectDetails.projectName,
    quote.projectDetails.projectAddress,
    `Industry: ${quote.projectDetails.industry}`,
  ];
  projectInfo.forEach((text, i) => {
    doc.text(text, pageWidth / 2 + 7, 60 + (i * 5));
  });
  
  // Line Items Table
  const tableData = quote.lineItems.map(item => [
    item.description,
    item.quantity.toString(),
    item.unit,
    `$${item.unitPrice.toFixed(2)}`,
    `$${item.total.toFixed(2)}`,
  ]);
  
  autoTable(doc, {
    startY: 85,
    head: [['Description', 'Qty', 'Unit', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 25 },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
  });
  
  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  const summaryItems = [
    ['Subtotal', `$${quote.subtotal.toFixed(2)}`],
    ['Tax (' + (quote.taxRate * 100).toFixed(1) + '%)', `$${quote.taxAmount.toFixed(2)}`],
  ];
  
  if (quote.discount > 0) {
    summaryItems.push(['Discount', `-$${quote.discount.toFixed(2)}`]);
  }
  
  summaryItems.push(['Total', `$${quote.total.toFixed(2)}`]);
  
  const summaryX = pageWidth - 70;
  doc.setFontSize(10);
  
  summaryItems.forEach((item, i) => {
    const y = finalY + (i * 7);
    if (item[0] === 'Total') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
    }
    doc.text(item[0], summaryX, y);
    doc.text(item[1], pageWidth - 14, y, { align: 'right' });
  });
  
  // Notes
  if (quote.projectDetails.additionalNotes) {
    const notesY = finalY + (summaryItems.length * 7) + 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Notes:', 14, notesY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(quote.projectDetails.additionalNotes, pageWidth - 28);
    doc.text(splitNotes, 14, notesY + 6);
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  return doc;
};

export const generateBillOfMaterialsPDF = (quote: Quote) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL OF MATERIALS', 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`BOM #${quote.id.substring(0, 8).toUpperCase()}`, 14, 30);
  doc.text(new Date().toLocaleDateString(), pageWidth - 14, 20, { align: 'right' });
  
  // Project Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Project Information', 14, 52);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.projectDetails.projectName, 14, 60);
  doc.text(quote.projectDetails.clientName, 14, 66);
  doc.text(`Industry: ${quote.projectDetails.industry}`, 14, 72);
  
  // Group items by category
  const itemsByCategory: { [key: string]: typeof quote.lineItems } = {};
  quote.lineItems.forEach(item => {
    const category = item.category || 'Uncategorized';
    if (!itemsByCategory[category]) {
      itemsByCategory[category] = [];
    }
    itemsByCategory[category].push(item);
  });
  
  let currentY = 85;
  
  Object.entries(itemsByCategory).forEach(([category, items]) => {
    // Category Header
    doc.setFillColor(240, 240, 240);
    doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(category, 16, currentY);
    
    currentY += 10;
    
    // Items in category
    const tableData = items.map(item => [
      item.description,
      item.quantity.toString(),
      item.unit,
      `$${item.unitPrice.toFixed(2)}`,
      `$${item.total.toFixed(2)}`,
    ]);
    
    autoTable(doc, {
      startY: currentY,
      head: [['Item', 'Qty', 'Unit', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'plain',
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontSize: 9,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 25 },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      },
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 8;
  });
  
  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total Materials Cost:', pageWidth - 70, currentY);
  doc.text(`$${quote.subtotal.toFixed(2)}`, pageWidth - 14, currentY, { align: 'right' });
  
  return doc;
};
