import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AllegationRow, ProcessingResult } from '@/types';

export function exportToPDF(
  allegations: AllegationRow[],
  processingResult?: ProcessingResult | null
): void {
  // Create new PDF document in landscape mode for better table fit
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Falsity Chart Analysis', 14, 20);

  // Add metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  let yPosition = 28;
  
  if (processingResult) {
    const statusText = processingResult.status === 'approved' 
      ? 'Status: Approved' 
      : 'Status: Max Iterations Reached';
    doc.text(statusText, 14, yPosition);
    yPosition += 5;
    
    doc.text(`Iterations: ${processingResult.iterations}`, 14, yPosition);
    yPosition += 5;
  }
  
  doc.text(`Total Allegations: ${allegations.length}`, 14, yPosition);
  yPosition += 5;
  
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPosition);
  yPosition += 10;

  // Prepare table data
  const tableData = allegations.map((allegation) => [
    allegation.paragraph || '-',
    allegation.date || '-',
    `${allegation.speaker || '-'}\n${allegation.context || ''}`,
    allegation.misstatement || '-',
    `${allegation.falsityType ? `[${allegation.falsityType}] ` : ''}${allegation.falsityReason || '-'}${allegation.falsitySummary ? `\n\nSummary: ${allegation.falsitySummary}` : ''}`,
  ]);

  // Generate table
  autoTable(doc, {
    startY: yPosition,
    head: [['Para #', 'Date', 'Speaker / Context', 'Alleged Misstatement', 'Reasons for Falsity']],
    body: tableData,
    headStyles: {
      fillColor: [55, 65, 81], // gray-700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 15 }, // Para #
      1: { cellWidth: 25 }, // Date
      2: { cellWidth: 40 }, // Speaker / Context
      3: { cellWidth: 70 }, // Alleged Misstatement
      4: { cellWidth: 'auto' }, // Reasons for Falsity
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // gray-50
    },
    margin: { top: 10, right: 14, bottom: 10, left: 14 },
    didDrawPage: (data) => {
      // Add page number at bottom
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    },
  });

  // Save the PDF
  const timestamp = new Date().toISOString().split('T')[0];
  doc.save(`falsity-chart-${timestamp}.pdf`);
}