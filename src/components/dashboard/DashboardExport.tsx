import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { DashboardConfig } from '@/types/dashboard';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface DashboardExportProps {
  dashboard: DashboardConfig;
}

export function DashboardExport({ dashboard }: DashboardExportProps) {
  const { toast } = useToast();

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Title
      doc.setFontSize(20);
      doc.text(dashboard.name, pageWidth / 2, 20, { align: 'center' });
      
      // Description
      if (dashboard.description) {
        doc.setFontSize(12);
        doc.text(dashboard.description, pageWidth / 2, 30, { align: 'center' });
      }
      
      let yPosition = 45;
      
      // Process each widget
      dashboard.widgets.forEach((widget, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.text(widget.config.title || `Widget ${index + 1}`, 15, yPosition);
        yPosition += 10;
        
        if (widget.type === 'table' && widget.config.data) {
          const columns = widget.config.availableColumns || Object.keys(widget.config.data[0] || {});
          const rows = widget.config.data.map(row => 
            columns.map(col => row[col])
          );
          
          autoTable(doc, {
            startY: yPosition,
            head: [columns],
            body: rows,
            margin: { left: 15, right: 15 },
            styles: { fontSize: 8 },
          });
          
          yPosition = (doc as any).lastAutoTable.finalY + 15;
        } else if (widget.config.value != null) {
          doc.setFontSize(12);
          doc.text(`Value: ${widget.config.value}`, 15, yPosition);
          yPosition += 10;
        }
      });
      
      doc.save(`${dashboard.name}.pdf`);
      
      toast({
        title: 'PDF Exported',
        description: 'Your report has been downloaded',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export to PDF',
        variant: 'destructive',
      });
    }
  };

  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      dashboard.widgets.forEach((widget, index) => {
        const sheetName = (widget.config.title || `Sheet${index + 1}`).substring(0, 31);
        
        if (widget.type === 'table' && widget.config.data) {
          const ws = XLSX.utils.json_to_sheet(widget.config.data);
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        } else if (widget.config.value != null) {
          const data = [
            [widget.config.title || 'Widget'],
            ['Value', widget.config.value]
          ];
          const ws = XLSX.utils.aoa_to_sheet(data);
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }
      });
      
      XLSX.writeFile(wb, `${dashboard.name}.xlsx`);
      
      toast({
        title: 'Excel Exported',
        description: 'Your report has been downloaded',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export to Excel',
        variant: 'destructive',
      });
    }
  };

  const exportToWord = () => {
    try {
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${dashboard.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; text-align: center; }
            h2 { color: #666; margin-top: 30px; }
            p { color: #999; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .value { font-size: 24px; font-weight: bold; color: #007bff; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>${dashboard.name}</h1>
          ${dashboard.description ? `<p>${dashboard.description}</p>` : ''}
      `;
      
      dashboard.widgets.forEach((widget) => {
        htmlContent += `<h2>${widget.config.title || 'Widget'}</h2>`;
        
        if (widget.type === 'table' && widget.config.data) {
          const columns = widget.config.availableColumns || Object.keys(widget.config.data[0] || {});
          htmlContent += '<table><thead><tr>';
          columns.forEach(col => {
            htmlContent += `<th>${col}</th>`;
          });
          htmlContent += '</tr></thead><tbody>';
          
          widget.config.data.forEach(row => {
            htmlContent += '<tr>';
            columns.forEach(col => {
              htmlContent += `<td>${row[col] || ''}</td>`;
            });
            htmlContent += '</tr>';
          });
          
          htmlContent += '</tbody></table>';
        } else if (widget.config.value != null) {
          htmlContent += `<div class="value">Value: ${widget.config.value}</div>`;
        }
      });
      
      htmlContent += '</body></html>';
      
      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-word' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${dashboard.name}.doc`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Word Exported',
        description: 'Your report has been downloaded',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export to Word',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportToPDF}>
        <Download className="h-4 w-4 mr-2" />
        PDF
      </Button>
      <Button variant="outline" size="sm" onClick={exportToWord}>
        <FileText className="h-4 w-4 mr-2" />
        Word
      </Button>
      <Button variant="outline" size="sm" onClick={exportToExcel}>
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Excel
      </Button>
    </div>
  );
}
