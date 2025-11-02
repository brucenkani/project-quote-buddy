import { CompanySettings } from '@/types/settings';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Invoice } from '@/types/invoice';
import { Expense } from '@/types/accounting';

interface VATReportPreviewProps {
  invoices: Invoice[];
  expenses: Expense[];
  dateRange: { startDate: string; endDate: string };
  settings: CompanySettings;
}

export function VATReportPreview({ 
  invoices, 
  expenses, 
  dateRange, 
  settings 
}: VATReportPreviewProps) {
  // Calculate output VAT (from invoices)
  const outputVAT = invoices.reduce((sum, inv) => {
    if (inv.type === 'credit-note') {
      return sum + inv.taxAmount; // Already negative
    }
    return sum + inv.taxAmount;
  }, 0);

  const outputTaxable = invoices.reduce((sum, inv) => {
    if (inv.type === 'credit-note') {
      return sum + inv.subtotal; // Already negative
    }
    return sum + inv.subtotal;
  }, 0);

  // Calculate input VAT (from expenses)
  const inputVAT = expenses.reduce((sum, exp) => {
    if (exp.includesVAT && exp.vatAmount) {
      return sum + exp.vatAmount;
    }
    return sum;
  }, 0);

  const inputTaxable = expenses.reduce((sum, exp) => {
    if (exp.includesVAT && exp.vatAmount) {
      return sum + (exp.amount - exp.vatAmount);
    }
    return sum;
  }, 0);

  const netVAT = outputVAT - inputVAT;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{settings.companyName}</h2>
        <h3 className="text-xl font-semibold">VAT Report</h3>
        <p className="text-sm text-muted-foreground">
          Period: {dateRange.startDate} to {dateRange.endDate}
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
            <TableHead className="text-primary-foreground">Output VAT (Sales)</TableHead>
            <TableHead className="text-right text-primary-foreground">Taxable Amount</TableHead>
            <TableHead className="text-right text-primary-foreground">VAT Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Standard Rated Sales</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{outputTaxable.toFixed(2)}</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{outputVAT.toFixed(2)}</TableCell>
          </TableRow>
          <TableRow className="font-bold bg-muted">
            <TableCell>Total Output VAT</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{outputTaxable.toFixed(2)}</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{outputVAT.toFixed(2)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Table>
        <TableHeader>
          <TableRow className="bg-destructive text-destructive-foreground hover:bg-destructive">
            <TableHead className="text-destructive-foreground">Input VAT (Purchases)</TableHead>
            <TableHead className="text-right text-destructive-foreground">Taxable Amount</TableHead>
            <TableHead className="text-right text-destructive-foreground">VAT Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Standard Rated Purchases</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{inputTaxable.toFixed(2)}</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{inputVAT.toFixed(2)}</TableCell>
          </TableRow>
          <TableRow className="font-bold bg-muted">
            <TableCell>Total Input VAT</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{inputTaxable.toFixed(2)}</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{inputVAT.toFixed(2)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Table>
        <TableHeader>
          <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
            <TableHead className="text-primary-foreground">Summary</TableHead>
            <TableHead className="text-right text-primary-foreground">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Output VAT (Collected)</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{outputVAT.toFixed(2)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Less: Input VAT (Paid)</TableCell>
            <TableCell className="text-right">({settings.currencySymbol}{inputVAT.toFixed(2)})</TableCell>
          </TableRow>
          <TableRow className="font-bold bg-muted text-lg">
            <TableCell>
              {netVAT >= 0 ? 'VAT Payable to SARS' : 'VAT Refund from SARS'}
            </TableCell>
            <TableCell className="text-right">
              {settings.currencySymbol}{Math.abs(netVAT).toFixed(2)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
