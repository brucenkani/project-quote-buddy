import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Ticket {
  id: string;
  title: string;
  assignedTo: string;
  status: 'todo' | 'in-progress' | 'completed' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  dueDate?: string;
}

interface TicketExportProps {
  tickets: Ticket[];
}

export function TicketExport({ tickets }: TicketExportProps) {
  const { toast } = useToast();

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'todo': 'To Do',
      'in-progress': 'In Progress',
      'completed': 'Completed',
      'on-hold': 'On Hold',
    };
    return labels[status] || status;
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFontSize(20);
      doc.text('Internal Tickets Report', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });
      
      const tableData = tickets.map(ticket => [
        ticket.id,
        ticket.title,
        ticket.assignedTo,
        getStatusLabel(ticket.status),
        ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1),
        ticket.dueDate || '-',
        ticket.createdAt,
      ]);
      
      autoTable(doc, {
        startY: 40,
        head: [['ID', 'Task', 'Assigned To', 'Status', 'Priority', 'Due Date', 'Created']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [71, 85, 105] },
      });
      
      doc.save(`internal-tickets-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: 'PDF Exported',
        description: 'Your tickets report has been downloaded',
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
      const data = tickets.map(ticket => ({
        'ID': ticket.id,
        'Task': ticket.title,
        'Assigned To': ticket.assignedTo,
        'Status': getStatusLabel(ticket.status),
        'Priority': ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1),
        'Due Date': ticket.dueDate || '-',
        'Created': ticket.createdAt,
      }));
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      XLSX.utils.book_append_sheet(wb, ws, 'Tickets');
      XLSX.writeFile(wb, `internal-tickets-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: 'Excel Exported',
        description: 'Your tickets report has been downloaded',
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

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportToPDF}>
        <Download className="h-4 w-4 mr-2" />
        PDF
      </Button>
      <Button variant="outline" size="sm" onClick={exportToExcel}>
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Excel
      </Button>
    </div>
  );
}
