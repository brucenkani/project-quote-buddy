import { ChartAccount } from '@/types/chartOfAccounts';
import { CompanySettings } from '@/types/settings';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { generateBalanceSheet, PeriodData } from '@/utils/financialStatements';

interface BalanceSheetPreviewProps {
  accounts: ChartAccount[];
  currentPeriod: PeriodData;
  priorPeriod: PeriodData;
  settings: CompanySettings;
}

export function BalanceSheetPreview({ 
  accounts, 
  currentPeriod, 
  priorPeriod, 
  settings 
}: BalanceSheetPreviewProps) {
  const current = generateBalanceSheet(accounts, currentPeriod);
  const prior = generateBalanceSheet(accounts, priorPeriod);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{settings.companyName}</h2>
        <h3 className="text-xl font-semibold">Balance Sheet</h3>
        <p className="text-sm text-muted-foreground">
          As of {currentPeriod.endDate} (Compared to {priorPeriod.endDate})
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
            <TableHead className="text-primary-foreground">Assets</TableHead>
            <TableHead className="text-right text-primary-foreground">Current Year</TableHead>
            <TableHead className="text-right text-primary-foreground">Prior Year</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {current.assets.map(item => {
            const priorItem = prior.assets.find(p => p.account === item.account) || { amount: 0 };
            return (
              <TableRow key={item.account}>
                <TableCell>{item.account}</TableCell>
                <TableCell className="text-right">{settings.currencySymbol}{item.amount.toFixed(2)}</TableCell>
                <TableCell className="text-right">{settings.currencySymbol}{priorItem.amount.toFixed(2)}</TableCell>
              </TableRow>
            );
          })}
          <TableRow className="font-bold bg-muted">
            <TableCell>Total Assets</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{current.totalAssets.toFixed(2)}</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{prior.totalAssets.toFixed(2)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Table>
        <TableHeader>
          <TableRow className="bg-destructive text-destructive-foreground hover:bg-destructive">
            <TableHead className="text-destructive-foreground">Liabilities</TableHead>
            <TableHead className="text-right text-destructive-foreground">Current Year</TableHead>
            <TableHead className="text-right text-destructive-foreground">Prior Year</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {current.liabilities.map(item => {
            const priorItem = prior.liabilities.find(p => p.account === item.account) || { amount: 0 };
            return (
              <TableRow key={item.account}>
                <TableCell>{item.account}</TableCell>
                <TableCell className="text-right">{settings.currencySymbol}{item.amount.toFixed(2)}</TableCell>
                <TableCell className="text-right">{settings.currencySymbol}{priorItem.amount.toFixed(2)}</TableCell>
              </TableRow>
            );
          })}
          <TableRow className="font-bold bg-muted">
            <TableCell>Total Liabilities</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{current.totalLiabilities.toFixed(2)}</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{prior.totalLiabilities.toFixed(2)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Table>
        <TableHeader>
          <TableRow className="bg-green-600 text-white hover:bg-green-600">
            <TableHead className="text-white">Equity</TableHead>
            <TableHead className="text-right text-white">Current Year</TableHead>
            <TableHead className="text-right text-white">Prior Year</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {current.equity.map(item => {
            const priorItem = prior.equity.find(p => p.account === item.account) || { amount: 0 };
            return (
              <TableRow key={item.account}>
                <TableCell>{item.account}</TableCell>
                <TableCell className="text-right">{settings.currencySymbol}{item.amount.toFixed(2)}</TableCell>
                <TableCell className="text-right">{settings.currencySymbol}{priorItem.amount.toFixed(2)}</TableCell>
              </TableRow>
            );
          })}
          <TableRow className="font-bold bg-muted">
            <TableCell>Total Equity</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{current.totalEquity.toFixed(2)}</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{prior.totalEquity.toFixed(2)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Table>
        <TableHeader>
          <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
            <TableHead className="text-primary-foreground">Total Liabilities & Equity</TableHead>
            <TableHead className="text-right text-primary-foreground">Current Year</TableHead>
            <TableHead className="text-right text-primary-foreground">Prior Year</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="font-bold text-lg">
            <TableCell>Total Liabilities & Equity</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{(current.totalLiabilities + current.totalEquity).toFixed(2)}</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{(prior.totalLiabilities + prior.totalEquity).toFixed(2)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
