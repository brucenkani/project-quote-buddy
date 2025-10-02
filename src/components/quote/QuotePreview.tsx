import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Quote } from '@/types/quote';
import { generateQuotePDF, generateBillOfMaterialsPDF } from '@/utils/pdfGenerator';
import { FileText, Package, ArrowLeft, Download } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { loadSettings } from '@/utils/settingsStorage';

interface QuotePreviewProps {
  quote: Quote;
  onBack: () => void;
}

export const QuotePreview = ({ quote, onBack }: QuotePreviewProps) => {
  const settings = loadSettings();
  
  const handleDownloadQuote = () => {
    const doc = generateQuotePDF(quote);
    doc.save(`quote-${quote.id.substring(0, 8)}.pdf`);
  };

  const handleDownloadBOM = () => {
    const doc = generateBillOfMaterialsPDF(quote);
    doc.save(`bom-${quote.id.substring(0, 8)}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Preview & Export</h2>
        <p className="text-muted-foreground">Review your quote and download as PDF</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold">Quote #{quote.id.substring(0, 8).toUpperCase()}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Created: {new Date(quote.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Valid until: {new Date(quote.validUntil).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Industry</p>
              <p className="text-lg font-semibold capitalize">{quote.projectDetails.industry.replace('-', ' ')}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Client Information</h4>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{quote.projectDetails.clientName}</p>
                <p className="text-muted-foreground">{quote.projectDetails.clientEmail}</p>
                {quote.projectDetails.clientPhone && (
                  <p className="text-muted-foreground">{quote.projectDetails.clientPhone}</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Project Details</h4>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{quote.projectDetails.projectName}</p>
                {quote.projectDetails.projectAddress && (
                  <p className="text-muted-foreground">{quote.projectDetails.projectAddress}</p>
                )}
                {quote.projectDetails.estimatedDuration && (
                  <p className="text-muted-foreground">Duration: {quote.projectDetails.estimatedDuration}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-3">Line Items</h4>
            <div className="space-y-2">
              {quote.lineItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} {item.unit} × {settings.currencySymbol}{item.unitPrice.toFixed(2)}
                      {item.category && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {item.category}
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="font-semibold">{settings.currencySymbol}{item.total.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{settings.currencySymbol}{quote.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({(quote.taxRate * 100).toFixed(1)}%)</span>
              <span>{settings.currencySymbol}{quote.taxAmount.toFixed(2)}</span>
            </div>
            {quote.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-destructive">-{settings.currencySymbol}{quote.discount.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{settings.currencySymbol}{quote.total.toFixed(2)}</span>
            </div>
          </div>

          {quote.projectDetails.additionalNotes && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Additional Notes</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {quote.projectDetails.additionalNotes}
                </p>
              </div>
            </>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Download Documents</h3>
            <div className="space-y-3">
              <Button
                onClick={handleDownloadQuote}
                className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity"
              >
                <FileText className="mr-2 h-4 w-4" />
                Download Quote PDF
              </Button>
              <Button
                onClick={handleDownloadBOM}
                variant="outline"
                className="w-full"
              >
                <Package className="mr-2 h-4 w-4" />
                Download Bill of Materials
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-muted/30">
            <h3 className="font-semibold mb-2">Quote Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Line Items</span>
                <span className="font-medium">{quote.lineItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Value</span>
                <span className="font-medium">{settings.currencySymbol}{quote.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Industry</span>
                <span className="font-medium capitalize">{quote.projectDetails.industry.replace('-', ' ')}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-start pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Edit
        </Button>
      </div>
    </div>
  );
};
