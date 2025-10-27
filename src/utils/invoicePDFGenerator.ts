import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { Invoice } from '@/types/invoice';
import { type Country } from '@/types/settings';

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [59, 130, 246];
};

// Generate QR code data URL
const generateQRCode = async (data: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(data, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('QR Code generation failed:', error);
    return '';
  }
};

// Generate QR code data based on country
const getQRCodeData = (invoice: Invoice, country: Country, settings: any): string => {
  
  switch (country) {
    case 'ZM': // Zambia - ZRA Smart Invoice format
      return JSON.stringify({
        invoiceNumber: invoice.invoiceNumber,
        tpin: settings.incomeTaxNumber || '',
        date: invoice.issueDate,
        total: invoice.total.toFixed(2),
        vat: invoice.taxAmount.toFixed(2),
        customer: invoice.projectDetails.clientName,
        smartInvoiceId: invoice.fiscalData?.smartInvoiceId || 'PENDING',
      });
    
    case 'ZW': // Zimbabwe - ZIMRA Fiscal Device format
      return JSON.stringify({
        invoiceNumber: invoice.invoiceNumber,
        tin: settings.incomeTaxNumber || '',
        date: invoice.issueDate,
        amount: invoice.total.toFixed(2),
        vat: invoice.taxAmount.toFixed(2),
        fiscalCode: invoice.fiscalData?.fiscalSignature || 'PENDING',
        deviceId: invoice.fiscalData?.fiscalDeviceId || '',
      });
    
    case 'ZA': // South Africa - verification data
      return JSON.stringify({
        invoiceNumber: invoice.invoiceNumber,
        vatNumber: settings.vatNumber || '',
        date: invoice.issueDate,
        total: invoice.total.toFixed(2),
        supplier: settings.companyName,
      });
    
    default:
      return invoice.invoiceNumber;
  }
};

export const generateInvoicePDF = async (invoice: Invoice, companySettings: any) => {
  // Map database schema to expected format
  const settings = {
    companyName: companySettings.company_name || companySettings.companyName || '',
    email: companySettings.email || '',
    phone: companySettings.phone || '',
    address: companySettings.address || '',
    logoUrl: companySettings.logo_url || companySettings.logoUrl,
    primaryColor: companySettings.primary_color || companySettings.primaryColor || '#3b82f6',
    currencySymbol: companySettings.currency_symbol || companySettings.currencySymbol || 'R',
    country: companySettings.country || 'ZA',
    vatNumber: companySettings.tax_number || companySettings.vatNumber,
    incomeTaxNumber: companySettings.tax_number || companySettings.incomeTaxNumber,
    companyRegistrationNumber: companySettings.registration_number || companySettings.companyRegistrationNumber,
  };
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const brandColor = hexToRgb(settings.primaryColor);
  const country = settings.country;
  
  // Generate QR code for countries that require it
  let qrCodeImage = '';
  if (country === 'ZM' || country === 'ZW') {
    const qrData = getQRCodeData(invoice, country, settings);
    qrCodeImage = await generateQRCode(qrData);
  }
  
  // Header
  doc.setFillColor(...brandColor);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.type === 'credit-note' ? 'CREDIT NOTE' : 'TAX INVOICE', 14, 22);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #${invoice.invoiceNumber}`, 14, 32);
  doc.text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 14, 38);
  
  // Company Logo and Info (right side)
  if (settings.logoUrl) {
    try {
      doc.addImage(settings.logoUrl, 'PNG', pageWidth - 50, 8, 35, 15);
    } catch (error) {
      console.error('Failed to add logo:', error);
    }
  }
  
  doc.setFontSize(9);
  const companyHeaderText = [
    settings.companyName,
  ];
  companyHeaderText.forEach((text, i) => {
    doc.text(text, pageWidth - 14, 28 + (i * 4), { align: 'right' });
  });
  
  // Supplier Details Section (Left)
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Supplier Details:', 14, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const supplierDetails = [
    settings.companyName,
    settings.address,
    `Email: ${settings.email}`,
    `Phone: ${settings.phone}`,
  ];
  
  // Add country-specific tax numbers
  if (country === 'ZA') {
    if (settings.vatNumber) supplierDetails.push(`VAT No: ${settings.vatNumber}`);
    if (settings.incomeTaxNumber) supplierDetails.push(`Tax No: ${settings.incomeTaxNumber}`);
    if (settings.companyRegistrationNumber) supplierDetails.push(`Reg No: ${settings.companyRegistrationNumber}`);
  } else if (country === 'ZW') {
    if (settings.vatNumber) supplierDetails.push(`VAT Reg No: ${settings.vatNumber}`);
    if (settings.incomeTaxNumber) supplierDetails.push(`TIN: ${settings.incomeTaxNumber}`);
    if (settings.companyRegistrationNumber) supplierDetails.push(`Co Reg No: ${settings.companyRegistrationNumber}`);
  } else if (country === 'ZM') {
    if (settings.vatNumber) supplierDetails.push(`VAT Reg No: ${settings.vatNumber}`);
    if (settings.incomeTaxNumber) supplierDetails.push(`TPIN: ${settings.incomeTaxNumber}`);
    if (settings.companyRegistrationNumber) supplierDetails.push(`PACRA No: ${settings.companyRegistrationNumber}`);
  }
  
  supplierDetails.filter(Boolean).forEach((text, i) => {
    doc.text(text, 14, 61 + (i * 4.5));
  });
  
  // Customer Details Section (Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Bill To:', pageWidth / 2 + 7, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const customerDetails = [
    invoice.projectDetails.clientName,
    invoice.projectDetails.clientEmail,
    invoice.projectDetails.clientPhone,
  ].filter(Boolean);
  
  customerDetails.forEach((text, i) => {
    doc.text(text, pageWidth / 2 + 7, 61 + (i * 4.5));
  });
  
  // Invoice Details Box
  const detailsY = 61 + Math.max(supplierDetails.length, customerDetails.length) * 4.5 + 8;
  
  doc.setFillColor(245, 245, 245);
  doc.rect(14, detailsY, pageWidth - 28, 18, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  
  doc.text('Invoice Number:', 18, detailsY + 6);
  doc.text('Issue Date:', 18, detailsY + 12);
  
  doc.text('Due Date:', pageWidth / 2, detailsY + 6);
  doc.text('Payment Terms:', pageWidth / 2, detailsY + 12);
  
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceNumber, 55, detailsY + 6);
  doc.text(new Date(invoice.issueDate).toLocaleDateString(), 55, detailsY + 12);
  doc.text(new Date(invoice.dueDate).toLocaleDateString(), pageWidth / 2 + 30, detailsY + 6);
  doc.text(invoice.paymentTerms, pageWidth / 2 + 30, detailsY + 12);
  
  // Line Items Table
  const tableStartY = detailsY + 25;
  const tableData = invoice.lineItems.map(item => [
    item.description,
    item.quantity.toString(),
    item.unit,
    `${settings.currencySymbol}${item.unitPrice.toFixed(2)}`,
    `${settings.currencySymbol}${item.total.toFixed(2)}`,
  ]);
  
  autoTable(doc, {
    startY: tableStartY,
    head: [['Description', 'Qty', 'Unit', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: brandColor,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 75 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 25 },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
  });
  
  // Summary Section
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // QR Code for ZM and ZW (left side)
  if (qrCodeImage && (country === 'ZM' || country === 'ZW')) {
    doc.addImage(qrCodeImage, 'PNG', 14, finalY, 35, 35);
    
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    const qrLabel = country === 'ZM' 
      ? 'Scan for ZRA Verification' 
      : 'Scan for ZIMRA Verification';
    doc.text(qrLabel, 31.5, finalY + 38, { align: 'center' });
    
    // Add fiscal info below QR code
    if (country === 'ZM' && invoice.fiscalData?.smartInvoiceId) {
      doc.setFontSize(7);
      doc.text(`Smart Invoice ID:`, 14, finalY + 43);
      doc.text(invoice.fiscalData.smartInvoiceId, 14, finalY + 47);
    } else if (country === 'ZW' && invoice.fiscalData?.fiscalSignature) {
      doc.setFontSize(7);
      doc.text(`Fiscal Code:`, 14, finalY + 43);
      doc.text(invoice.fiscalData.fiscalSignature, 14, finalY + 47);
    }
  }
  
  // Financial Summary (right side)
  const summaryX = pageWidth - 80;
  const summaryItems = [
    ['Subtotal:', `${settings.currencySymbol}${invoice.subtotal.toFixed(2)}`],
  ];
  
  if (invoice.discount > 0) {
    summaryItems.push(['Discount:', `-${settings.currencySymbol}${invoice.discount.toFixed(2)}`]);
  }
  
  // VAT/Tax line with country-specific label
  const taxLabel = country === 'ZA' ? 'VAT' : country === 'ZW' ? 'VAT' : 'VAT';
  summaryItems.push([`${taxLabel} (${(invoice.taxRate * 100).toFixed(1)}%):`, `${settings.currencySymbol}${invoice.taxAmount.toFixed(2)}`]);
  summaryItems.push(['Total Amount Due:', `${settings.currencySymbol}${invoice.total.toFixed(2)}`]);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  summaryItems.forEach((item, i) => {
    const y = finalY + (i * 7);
    if (item[0] === 'Total Amount Due:') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setFillColor(240, 240, 240);
      doc.rect(summaryX - 5, y - 5, 85, 8, 'F');
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
    }
    doc.text(item[0], summaryX, y);
    doc.text(item[1], pageWidth - 14, y, { align: 'right' });
  });
  
  // Notes Section
  if (invoice.notes) {
    const notesY = finalY + (summaryItems.length * 7) + 12;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 14, notesY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 28);
    doc.text(splitNotes, 14, notesY + 5);
  }
  
  // Country-specific compliance footer
  const footerY = pageHeight - 25;
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  
  if (country === 'ZA') {
    doc.text('This is a valid tax invoice as per South African VAT Act requirements.', pageWidth / 2, footerY, { align: 'center' });
    doc.text('Please retain this invoice for your VAT records.', pageWidth / 2, footerY + 3, { align: 'center' });
  } else if (country === 'ZW') {
    doc.text('This is a fiscal tax invoice certified by ZIMRA.', pageWidth / 2, footerY, { align: 'center' });
    if (invoice.fiscalData?.fiscalDeviceId) {
      doc.text(`Fiscal Device ID: ${invoice.fiscalData.fiscalDeviceId}`, pageWidth / 2, footerY + 3, { align: 'center' });
    }
  } else if (country === 'ZM') {
    doc.text('This invoice is registered with Zambia Revenue Authority Smart Invoice system.', pageWidth / 2, footerY, { align: 'center' });
    doc.text('Verify authenticity by scanning the QR code above.', pageWidth / 2, footerY + 3, { align: 'center' });
  }
  
  // General Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`BizCounting Systems (Registered to ${settings.companyName})`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  return doc;
};
