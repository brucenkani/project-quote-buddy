import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateEMP501PDF = async (
  payrollData: any[],
  companySettings: any,
  year: number
) => {
  const doc = new jsPDF();
  
  // Group by employee
  const employeeSummary = payrollData.reduce((acc, record) => {
    const empId = record.employee_id;
    if (!acc[empId]) {
      acc[empId] = {
        employee: record.employees,
        totalGross: 0,
        totalPaye: 0,
        totalUif: 0,
      };
    }
    acc[empId].totalGross += Number(record.gross_salary || 0);
    acc[empId].totalPaye += Number(record.paye || 0);
    acc[empId].totalUif += Number(record.uif || 0);
    return acc;
  }, {} as any);

  const employees = Object.values(employeeSummary);
  
  const totals = employees.reduce((acc: { gross: number; paye: number; uif: number }, emp: any) => ({
    gross: acc.gross + emp.totalGross,
    paye: acc.paye + emp.totalPaye,
    uif: acc.uif + emp.totalUif,
  }), { gross: 0, paye: 0, uif: 0 });

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('EMP501', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Employer Annual Reconciliation Declaration', 105, 28, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text('South African Revenue Service', 105, 35, { align: 'center' });
  
  // Tax year
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Tax Year: 1 March ${year - 1} to 28 February ${year}`, 14, 50);
  
  // Employer details
  doc.setFont('helvetica', 'bold');
  doc.text('EMPLOYER DETAILS', 14, 60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Name: ${companySettings?.company_name || 'N/A'}`, 14, 68);
  doc.text(`PAYE Reference: ${companySettings?.tax_number || 'N/A'}`, 14, 75);
  doc.text(`Address: ${companySettings?.address || 'N/A'}`, 14, 82);
  
  // Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('ANNUAL SUMMARY', 14, 95);
  
  const summaryData = [
    ['Total number of employees', employees.length.toString()],
    ['Total remuneration paid', `R ${(totals as any).gross.toFixed(2)}`],
    ['Total PAYE deducted', `R ${(totals as any).paye.toFixed(2)}`],
    ['Total UIF contributions', `R ${((totals as any).uif * 2).toFixed(2)}`],
    ['TOTAL TAX LIABILITY', `R ${((totals as any).paye + ((totals as any).uif * 2)).toFixed(2)}`],
  ];

  (doc as any).autoTable({
    startY: 100,
    head: [['Description', 'Amount']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60, halign: 'right' }
    },
    didParseCell: (data: any) => {
      if (data.row.index === summaryData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 240];
      }
    }
  });

  // Employee details on new page
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('EMPLOYEE CERTIFICATE DETAILS', 14, 20);
  
  const employeeData = employees.map((emp: any) => [
    emp.employee?.employee_number || 'N/A',
    `${emp.employee?.first_name || ''} ${emp.employee?.last_name || ''}`,
    emp.employee?.id_number || 'N/A',
    `R ${emp.totalGross.toFixed(2)}`,
    `R ${emp.totalPaye.toFixed(2)}`,
    `R ${(emp.totalUif * 2).toFixed(2)}`,
  ]);

  (doc as any).autoTable({
    startY: 30,
    head: [['Emp No.', 'Name', 'ID Number', 'Gross Income', 'PAYE', 'UIF']],
    body: employeeData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 45 },
      2: { cellWidth: 35 },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' }
    }
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text('This is a system-generated reconciliation document', 105, 280, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
  }
  
  // Save PDF
  doc.save(`EMP501_${year - 1}_${year}.pdf`);
};
