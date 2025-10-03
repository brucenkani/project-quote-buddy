import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { loadSettings } from './settingsStorage';

export const generatePayslipPDF = async (payrollRecord: any) => {
  const settings = loadSettings();
  const doc = new jsPDF();
  const employee = payrollRecord.employees;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.companyName, 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.address || '', 14, 27);
  doc.text(settings.email || '', 14, 32);
  doc.text(settings.phone || '', 14, 37);

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYSLIP', 105, 50, { align: 'center' });

  // Employee Details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const employeeDetails = [
    ['Employee Number:', employee.employee_number],
    ['Employee Name:', `${employee.first_name} ${employee.last_name}`],
    ['ID Number:', employee.id_number],
    ['Position:', employee.position],
    ['Department:', employee.department || '-'],
  ];

  let yPos = 60;
  employeeDetails.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 70, yPos);
    yPos += 6;
  });

  // Pay Period
  doc.setFont('helvetica', 'bold');
  doc.text('Pay Period:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${format(new Date(payrollRecord.period_start), 'dd/MM/yyyy')} - ${format(new Date(payrollRecord.period_end), 'dd/MM/yyyy')}`,
    70,
    yPos
  );
  yPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Payment Date:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(
    payrollRecord.payment_date ? format(new Date(payrollRecord.payment_date), 'dd/MM/yyyy') : 'Not yet paid',
    70,
    yPos
  );

  // Earnings Table
  yPos += 12;
  autoTable(doc, {
    startY: yPos,
    head: [['Earnings', 'Amount (R)']],
    body: [
      ['Basic Salary', parseFloat(payrollRecord.basic_salary).toFixed(2)],
      ['Allowances', parseFloat(payrollRecord.allowances).toFixed(2)],
      ['Overtime', parseFloat(payrollRecord.overtime).toFixed(2)],
      ['Bonuses', parseFloat(payrollRecord.bonuses).toFixed(2)],
    ],
    foot: [['Gross Salary', parseFloat(payrollRecord.gross_salary).toFixed(2)]],
    theme: 'grid',
    headStyles: { fillColor: [66, 66, 66] },
    footStyles: { fillColor: [100, 100, 100], fontStyle: 'bold' },
    columnStyles: {
      1: { halign: 'right' },
    },
  });

  // Deductions Table
  yPos = (doc as any).lastAutoTable.finalY + 10;
  autoTable(doc, {
    startY: yPos,
    head: [['Deductions', 'Amount (R)']],
    body: [
      ['PAYE (Pay As You Earn)', parseFloat(payrollRecord.paye).toFixed(2)],
      ['UIF (Unemployment Insurance)', parseFloat(payrollRecord.uif).toFixed(2)],
      ['Other Deductions', parseFloat(payrollRecord.other_deductions).toFixed(2)],
    ],
    foot: [['Total Deductions', parseFloat(payrollRecord.total_deductions).toFixed(2)]],
    theme: 'grid',
    headStyles: { fillColor: [66, 66, 66] },
    footStyles: { fillColor: [100, 100, 100], fontStyle: 'bold' },
    columnStyles: {
      1: { halign: 'right' },
    },
  });

  // Net Pay
  yPos = (doc as any).lastAutoTable.finalY + 10;
  doc.setFillColor(41, 128, 185);
  doc.rect(14, yPos, 182, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('NET PAY:', 20, yPos + 10);
  doc.text(
    `R ${parseFloat(payrollRecord.net_salary).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
    190,
    yPos + 10,
    { align: 'right' }
  );

  // Bank Details
  yPos += 20;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Banking Details', 14, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Bank: ${employee.bank_name || 'N/A'}`, 14, yPos);
  yPos += 5;
  doc.text(`Account Number: ${employee.account_number || 'N/A'}`, 14, yPos);
  yPos += 5;
  doc.text(`Account Type: ${employee.account_type || 'N/A'}`, 14, yPos);

  // Notes
  if (payrollRecord.notes) {
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 14, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(payrollRecord.notes, 14, yPos, { maxWidth: 180 });
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('This is a computer-generated payslip and does not require a signature.', 105, pageHeight - 10, { align: 'center' });

  // Save
  doc.save(`Payslip_${employee.employee_number}_${format(new Date(payrollRecord.period_end), 'yyyy-MM')}.pdf`);
};
