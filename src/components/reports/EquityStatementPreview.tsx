import { ChartAccount } from '@/types/chartOfAccounts';
import { CompanySettings } from '@/types/settings';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { generateEquityStatement, PeriodData } from '@/utils/financialStatements';

interface EquityStatementPreviewProps {
  accounts: ChartAccount[];
  currentPeriod: PeriodData;
  priorPeriod: PeriodData;
  settings: CompanySettings;
}

export function EquityStatementPreview({ 
  accounts, 
  currentPeriod, 
  priorPeriod, 
  settings 
}: EquityStatementPreviewProps) {
  const equity = generateEquityStatement(accounts, currentPeriod, priorPeriod);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{settings.companyName}</h2>
        <h3 className="text-xl font-semibold">Statement of Changes in Equity</h3>
        <p className="text-sm text-muted-foreground">
          For the period ending {currentPeriod.endDate}
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
            <TableHead className="text-primary-foreground">Description</TableHead>
            <TableHead className="text-right text-primary-foreground">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Opening Balance</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{equity.openingBalance.toFixed(2)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Add: Net Income for the Period</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{equity.netIncome.toFixed(2)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Less: Drawings</TableCell>
            <TableCell className="text-right">({settings.currencySymbol}{Math.abs(equity.drawings).toFixed(2)})</TableCell>
          </TableRow>
          <TableRow className="font-bold bg-muted text-lg">
            <TableCell>Closing Balance</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{equity.closingBalance.toFixed(2)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="text-sm text-muted-foreground mt-4">
        <p>This statement shows the movement in equity during the period, reconciling the opening balance to the closing balance.</p>
      </div>
    </div>
  );
}
