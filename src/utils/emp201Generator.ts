import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateEMP201PDF = async (
  payrollData: any[],
  companySettings: any,
  month: number,
  year: number
) => {
  const doc = new jsPDF();
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calculate totals
  const totals = payrollData.reduce((acc, record) => ({
    paye: acc.paye + Number(record.paye || 0),
    uif: acc.uif + Number(record.uif || 0),
    grossSalary: acc.grossSalary + Number(record.gross_salary || 0),
  }), { paye: 0, uif: 0, grossSalary: 0 });

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('EMP201', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Monthly Employer Declaration', 105, 28, { align: 'center' });
  
  // SARS Logo placeholder
  doc.setFontSize(10);
  doc.text('South African Revenue Service', 105, 35, { align: 'center' });
  
  // Tax period
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Tax Period: ${months[month]} ${year}`, 14, 50);
  
  // Employer details
  doc.setFont('helvetica', 'bold');
  doc.text('EMPLOYER DETAILS', 14, 60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Name: ${companySettings?.company_name || 'N/A'}`, 14, 68);
  doc.text(`PAYE Reference Number: ${companySettings?.tax_number || 'N/A'}`, 14, 75);
  doc.text(`Trading Name: ${companySettings?.company_name || 'N/A'}`, 14, 82);
  doc.text(`Physical Address: ${companySettings?.address || 'N/A'}`, 14, 89);
  
  // Declaration details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('DECLARATION', 14, 105);
  
  // Table data
  const tableData = [
    ['Total number of employees', payrollData.length.toString()],
    ['Total remuneration (gross)', `R ${totals.grossSalary.toFixed(2)}`],
    ['', ''],
    ['PAYE (Employees Tax)', `R ${totals.paye.toFixed(2)}`],
    ['UIF - Employee contribution (1%)', `R ${totals.uif.toFixed(2)}`],
    ['UIF - Employer contribution (1%)', `R ${totals.uif.toFixed(2)}`],
    ['Total UIF', `R ${(totals.uif * 2).toFixed(2)}`],
    ['', ''],
    ['TOTAL AMOUNT DUE', `R ${(totals.paye + (totals.uif * 2)).toFixed(2)}`],
  ];

  (doc as any).autoTable({
    startY: 112,
    head: [['Description', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60, halign: 'right' }
    },
    didParseCell: (data: any) => {
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 240];
      }
    }
  });

  // Payment details
  const finalY = (doc as any).lastAutoTable.finalY || 180;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PAYMENT DETAILS', 14, finalY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Payment Reference: PAYE ${year}${String(month + 1).padStart(2, '0')}`, 14, finalY + 23);
  doc.text(`Due Date: 7th of the following month`, 14, finalY + 30);
  doc.text('Payment must be made via eFiling or at your bank', 14, finalY + 37);
  
  // Footer
  doc.setFontSize(8);
  doc.text('This is a system-generated document', 105, 280, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 285, { align: 'center' });
  
  // Save PDF
  doc.save(`EMP201_${months[month]}_${year}.pdf`);
};
