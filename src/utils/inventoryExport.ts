import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { InventoryItem } from '@/types/inventory';

export const exportInventoryToPDF = (
  items: InventoryItem[],
  title: string,
  currencySymbol: string = 'R'
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
  
  // Prepare table data
  const tableData = items.map(item => [
    item.name,
    item.sku,
    item.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    item.quantity.toString(),
    item.unit,
    `${currencySymbol}${item.unitCost.toFixed(2)}`,
    `${currencySymbol}${item.totalValue.toFixed(2)}`,
    item.quantity <= item.minQuantity ? 'Low Stock' : 'In Stock'
  ]);
  
  // Add table
  autoTable(doc, {
    head: [['Item', 'SKU', 'Type', 'Quantity', 'Unit', 'Unit Cost', 'Total Value', 'Status']],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [99, 102, 241] },
  });
  
  // Calculate totals
  const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = items.filter(item => item.quantity <= item.minQuantity).length;
  
  // Add summary
  const finalY = (doc as any).lastAutoTable.finalY || 35;
  doc.setFontSize(10);
  doc.text(`Total Items: ${totalItems}`, 14, finalY + 10);
  doc.text(`Total Quantity: ${totalQuantity}`, 14, finalY + 16);
  doc.text(`Total Value: ${currencySymbol}${totalValue.toFixed(2)}`, 14, finalY + 22);
  doc.text(`Low Stock Items: ${lowStockItems}`, 14, finalY + 28);
  
  // Save
  doc.save(`inventory-${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`);
};

export const exportInventoryToExcel = (
  items: InventoryItem[],
  title: string,
  currencySymbol: string = 'R'
) => {
  // Prepare data
  const data = items.map(item => ({
    'Item Name': item.name,
    'SKU': item.sku,
    'Type': item.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    'Description': item.description,
    'Quantity': item.quantity,
    'Unit': item.unit,
    'Min Quantity': item.minQuantity,
    'Unit Cost': item.unitCost,
    'Total Value': item.totalValue,
    'Status': item.quantity <= item.minQuantity ? 'Low Stock' : 'In Stock',
    'Supplier': item.supplier || '',
    'Location': item.location || '',
    'Last Restocked': item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString() : ''
  }));
  
  // Add summary rows
  const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = items.filter(item => item.quantity <= item.minQuantity).length;
  
  data.push({} as any); // Empty row
  data.push({
    'Item Name': 'SUMMARY',
    'SKU': '',
    'Type': '',
    'Description': '',
    'Quantity': '',
    'Unit': '',
    'Min Quantity': '',
    'Unit Cost': '',
    'Total Value': '',
    'Status': '',
    'Supplier': '',
    'Location': '',
    'Last Restocked': ''
  } as any);
  data.push({
    'Item Name': 'Total Items',
    'SKU': totalItems.toString(),
    'Type': '',
    'Description': '',
    'Quantity': '',
    'Unit': '',
    'Min Quantity': '',
    'Unit Cost': '',
    'Total Value': '',
    'Status': '',
    'Supplier': '',
    'Location': '',
    'Last Restocked': ''
  } as any);
  data.push({
    'Item Name': 'Total Quantity',
    'SKU': totalQuantity.toString(),
    'Type': '',
    'Description': '',
    'Quantity': '',
    'Unit': '',
    'Min Quantity': '',
    'Unit Cost': '',
    'Total Value': '',
    'Status': '',
    'Supplier': '',
    'Location': '',
    'Last Restocked': ''
  } as any);
  data.push({
    'Item Name': 'Total Value',
    'SKU': `${currencySymbol}${totalValue.toFixed(2)}`,
    'Type': '',
    'Description': '',
    'Quantity': '',
    'Unit': '',
    'Min Quantity': '',
    'Unit Cost': '',
    'Total Value': '',
    'Status': '',
    'Supplier': '',
    'Location': '',
    'Last Restocked': ''
  } as any);
  data.push({
    'Item Name': 'Low Stock Items',
    'SKU': lowStockItems.toString(),
    'Type': '',
    'Description': '',
    'Quantity': '',
    'Unit': '',
    'Min Quantity': '',
    'Unit Cost': '',
    'Total Value': '',
    'Status': '',
    'Supplier': '',
    'Location': '',
    'Last Restocked': ''
  } as any);
  
  // Create workbook
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title);
  
  // Save
  XLSX.writeFile(wb, `inventory-${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.xlsx`);
};
