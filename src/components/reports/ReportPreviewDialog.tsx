import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileDown, FileSpreadsheet, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ReportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  onExportWord?: () => void;
}

export function ReportPreviewDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onExportPDF,
  onExportExcel,
  onExportWord,
}: ReportPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </div>
            <div className="flex gap-2">
              {onExportPDF && (
                <Button onClick={onExportPDF} size="sm" className="gap-2">
                  <FileDown className="h-4 w-4" />
                  PDF
                </Button>
              )}
              {onExportExcel && (
                <Button onClick={onExportExcel} size="sm" variant="outline" className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Button>
              )}
              {onExportWord && (
                <Button onClick={onExportWord} size="sm" variant="outline" className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Word
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="bg-white text-black p-8 rounded-lg shadow-inner">
            {children}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
