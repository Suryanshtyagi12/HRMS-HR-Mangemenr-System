import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { numberToWords } from './number-to-words';

export function generatePayslipPDF(data: any): ArrayBuffer {
  const doc = new jsPDF();
  
  // Header Section
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text("HRMS Pro", 14, 22);
  
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text("PAYSLIP", 196, 22, { align: 'right' });
  
  // Line separator
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.5);
  doc.line(14, 28, 196, 28);
  
  // Employee Details (Two columns)
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const leftColX = 14;
  const rightColX = 120;
  let startY = 38;
  const lineH = 6;
  
  // Left Column
  doc.setFont('helvetica', 'bold'); doc.text("Employee Name:", leftColX, startY);
  doc.setFont('helvetica', 'normal'); doc.text(`${data.employee.firstName} ${data.employee.lastName}`, leftColX + 35, startY);
  
  doc.setFont('helvetica', 'bold'); doc.text("Employee Code:", leftColX, startY + lineH);
  doc.setFont('helvetica', 'normal'); doc.text(data.employee.employeeCode, leftColX + 35, startY + lineH);
  
  doc.setFont('helvetica', 'bold'); doc.text("Department:", leftColX, startY + lineH * 2);
  doc.setFont('helvetica', 'normal'); doc.text(data.employee.department?.name || 'N/A', leftColX + 35, startY + lineH * 2);
  
  doc.setFont('helvetica', 'bold'); doc.text("Designation:", leftColX, startY + lineH * 3);
  doc.setFont('helvetica', 'normal'); doc.text(data.employee.designation || 'N/A', leftColX + 35, startY + lineH * 3);
  
  // Right Column
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const payPeriod = `${months[data.month - 1]} ${data.year}`;
  
  doc.setFont('helvetica', 'bold'); doc.text("Pay Period:", rightColX, startY);
  doc.setFont('helvetica', 'normal'); doc.text(payPeriod, rightColX + 30, startY);
  
  doc.setFont('helvetica', 'bold'); doc.text("Pay Date:", rightColX, startY + lineH);
  doc.setFont('helvetica', 'normal'); doc.text(new Date().toLocaleDateString(), rightColX + 30, startY + lineH);
  
  doc.setFont('helvetica', 'bold'); doc.text("Bank Account:", rightColX, startY + lineH * 2);
  doc.setFont('helvetica', 'normal'); doc.text("XXXXXXXX1234", rightColX + 30, startY + lineH * 2);
  
  startY += lineH * 4 + 5;
  
  // Earnings & Deductions Tables side by side? Or vertical? 
  // User says "EARNINGS TABLE... DEDUCTIONS TABLE". Will do them one below another for simplicity.
  
  const formatCurrency = (val: number) => `₹${val.toFixed(2)}`;
  
  // Earnings Table
  (doc as any).autoTable({
    startY: startY,
    head: [['EARNINGS', 'Amount']],
    body: [
      ['Basic Salary', formatCurrency(data.basicSalary)],
      ['HRA', formatCurrency(data.hra)],
      ['DA', formatCurrency(data.da)],
      ['Other Allowances', formatCurrency(data.allowances)],
      [{ content: 'Gross Salary', styles: { fontStyle: 'bold' } }, { content: formatCurrency(data.grossSalary), styles: { fontStyle: 'bold' } }],
    ],
    theme: 'grid',
    headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], lineColor: [226, 232, 240] },
    bodyStyles: { lineColor: [226, 232, 240] },
    columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'right' } }
  });
  
  startY = (doc as any).lastAutoTable.finalY + 10;
  
  // Deductions Table
  (doc as any).autoTable({
    startY: startY,
    head: [['DEDUCTIONS', 'Amount']],
    body: [
      ['PF Deduction', formatCurrency(data.pfDeduction)],
      ['Income Tax', formatCurrency(data.taxDeduction)],
      ['Other Deductions', formatCurrency(data.otherDeductions)],
      [{ content: 'Total Deductions', styles: { fontStyle: 'bold' } }, { content: formatCurrency(data.pfDeduction + data.taxDeduction + data.otherDeductions), styles: { fontStyle: 'bold' } }],
    ],
    theme: 'grid',
    headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], lineColor: [226, 232, 240] },
    bodyStyles: { lineColor: [226, 232, 240] },
    columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'right' } }
  });
  
  startY = (doc as any).lastAutoTable.finalY + 10;
  
  // Attendance Summary
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text("ATTENDANCE SUMMARY", 14, startY);
  
  (doc as any).autoTable({
    startY: startY + 4,
    head: [['Working Days', 'Present Days', 'Leave Days', 'LOP Days']],
    body: [[
      data.workingDays,
      data.presentDays,
      data.leaveDays,
      Math.max(0, data.workingDays - data.presentDays - data.leaveDays)
    ]],
    theme: 'plain',
    headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], halign: 'center' },
    bodyStyles: { halign: 'center' }
  });
  
  startY = (doc as any).lastAutoTable.finalY + 15;
  
  // Net Pay Box
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(14, startY, 182, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text("NET PAY", 20, startY + 12);
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.netSalary), 190, startY + 13, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(numberToWords(data.netSalary), 20, startY + 22);
  
  // Footer
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.setFontSize(8);
  doc.text("This is a computer generated payslip and does not require signature.", 105, 280, { align: 'center' });
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });
  
  // Output as ArrayBuffer to easily convert to Buffer for Supabase or direct send
  return doc.output('arraybuffer');
}
