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
            <TableHead className="text-right text-primary-foreground">Opening Balance</TableHead>
            <TableHead className="text-right text-primary-foreground">Movement</TableHead>
            <TableHead className="text-right text-primary-foreground">Closing Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Share Capital Section */}
          {equity.shareCapital.length > 0 && (
            <>
              <TableRow className="bg-blue-50">
                <TableCell colSpan={4} className="font-semibold">Share Capital</TableCell>
              </TableRow>
              {equity.shareCapital.map(item => (
                <TableRow key={item.account}>
                  <TableCell className="pl-8">{item.account}</TableCell>
                  <TableCell className="text-right tabular-nums">{settings.currencySymbol}{item.opening.toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums">{settings.currencySymbol}{item.movement.toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums">{settings.currencySymbol}{item.closing.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </>
          )}

          {/* Reserves Section */}
          {equity.reserves.length > 0 && (
            <>
              <TableRow className="bg-green-50">
                <TableCell colSpan={4} className="font-semibold">Reserves</TableCell>
              </TableRow>
              {equity.reserves.map(item => (
                <TableRow key={item.account}>
                  <TableCell className="pl-8">{item.account}</TableCell>
                  <TableCell className="text-right tabular-nums">{settings.currencySymbol}{item.opening.toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums">{settings.currencySymbol}{item.movement.toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums">{settings.currencySymbol}{item.closing.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </>
          )}

          {/* Retained Earnings Section */}
          <TableRow className="bg-yellow-50">
            <TableCell colSpan={4} className="font-semibold">Retained Earnings</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="pl-8">Opening Balance</TableCell>
            <TableCell className="text-right tabular-nums">{settings.currencySymbol}{equity.retainedEarnings.opening.toFixed(2)}</TableCell>
            <TableCell className="text-right tabular-nums">-</TableCell>
            <TableCell className="text-right tabular-nums">-</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="pl-8">Add: Net Income for Period</TableCell>
            <TableCell className="text-right tabular-nums">-</TableCell>
            <TableCell className="text-right tabular-nums">{settings.currencySymbol}{equity.retainedEarnings.netIncome.toFixed(2)}</TableCell>
            <TableCell className="text-right tabular-nums">-</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="pl-8">Less: Drawings</TableCell>
            <TableCell className="text-right tabular-nums">-</TableCell>
            <TableCell className="text-right tabular-nums">({settings.currencySymbol}{equity.retainedEarnings.drawings.toFixed(2)})</TableCell>
            <TableCell className="text-right tabular-nums">-</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="pl-8">Closing Balance</TableCell>
            <TableCell className="text-right tabular-nums">-</TableCell>
            <TableCell className="text-right tabular-nums">-</TableCell>
            <TableCell className="text-right tabular-nums">{settings.currencySymbol}{equity.retainedEarnings.closing.toFixed(2)}</TableCell>
          </TableRow>

          {/* Total Equity */}
          <TableRow className="font-bold bg-primary text-primary-foreground text-lg">
            <TableCell>Total Equity</TableCell>
            <TableCell className="text-right tabular-nums">{settings.currencySymbol}{equity.totalOpening.toFixed(2)}</TableCell>
            <TableCell className="text-right tabular-nums">{settings.currencySymbol}{equity.totalMovement.toFixed(2)}</TableCell>
            <TableCell className="text-right tabular-nums">{settings.currencySymbol}{equity.totalClosing.toFixed(2)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="text-sm text-muted-foreground mt-4">
        <p>This statement shows the detailed movement in each equity component during the period, including share capital, reserves, and retained earnings.</p>
      </div>
    </div>
  );
}
