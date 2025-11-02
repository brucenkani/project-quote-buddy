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
            <TableHead className="text-primary-foreground w-1/2">Assets</TableHead>
            <TableHead className="text-right text-primary-foreground w-1/4">Current Year</TableHead>
            <TableHead className="text-right text-primary-foreground w-1/4">Prior Year</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {current.assets.map(item => {
            const priorItem = prior.assets.find(p => p.account === item.account) || { amount: 0 };
            return (
              <TableRow key={item.account}>
                <TableCell className="w-1/2">{item.account}</TableCell>
                <TableCell className="text-right w-1/4 tabular-nums">{settings.currencySymbol}{item.amount.toFixed(2)}</TableCell>
                <TableCell className="text-right w-1/4 tabular-nums">{settings.currencySymbol}{priorItem.amount.toFixed(2)}</TableCell>
              </TableRow>
            );
          })}
          <TableRow className="font-bold bg-muted">
            <TableCell className="w-1/2">Total Assets</TableCell>
            <TableCell className="text-right w-1/4 tabular-nums">{settings.currencySymbol}{current.totalAssets.toFixed(2)}</TableCell>
            <TableCell className="text-right w-1/4 tabular-nums">{settings.currencySymbol}{prior.totalAssets.toFixed(2)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Table>
        <TableHeader>
          <TableRow className="bg-destructive text-destructive-foreground hover:bg-destructive">
            <TableHead className="text-destructive-foreground w-1/2">Liabilities</TableHead>
            <TableHead className="text-right text-destructive-foreground w-1/4">Current Year</TableHead>
            <TableHead className="text-right text-destructive-foreground w-1/4">Prior Year</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {current.liabilities.map(item => {
            const priorItem = prior.liabilities.find(p => p.account === item.account) || { amount: 0 };
            return (
              <TableRow key={item.account}>
                <TableCell className="w-1/2">{item.account}</TableCell>
                <TableCell className="text-right w-1/4 tabular-nums">{settings.currencySymbol}{item.amount.toFixed(2)}</TableCell>
                <TableCell className="text-right w-1/4 tabular-nums">{settings.currencySymbol}{priorItem.amount.toFixed(2)}</TableCell>
              </TableRow>
            );
          })}
          <TableRow className="font-bold bg-muted">
            <TableCell className="w-1/2">Total Liabilities</TableCell>
            <TableCell className="text-right w-1/4 tabular-nums">{settings.currencySymbol}{current.totalLiabilities.toFixed(2)}</TableCell>
            <TableCell className="text-right w-1/4 tabular-nums">{settings.currencySymbol}{prior.totalLiabilities.toFixed(2)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Table>
        <TableHeader>
          <TableRow className="bg-green-600 text-white hover:bg-green-600">
            <TableHead className="text-white w-1/2">Equity</TableHead>
            <TableHead className="text-right text-white w-1/4">Current Year</TableHead>
            <TableHead className="text-right text-white w-1/4">Prior Year</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {current.equity.map(item => {
            const priorItem = prior.equity.find(p => p.account === item.account) || { amount: 0 };
            return (
              <TableRow key={item.account}>
                <TableCell className="w-1/2">{item.account}</TableCell>
                <TableCell className="text-right w-1/4 tabular-nums">{settings.currencySymbol}{item.amount.toFixed(2)}</TableCell>
                <TableCell className="text-right w-1/4 tabular-nums">{settings.currencySymbol}{priorItem.amount.toFixed(2)}</TableCell>
              </TableRow>
            );
          })}
          <TableRow className="font-bold bg-muted">
            <TableCell className="w-1/2">Total Equity</TableCell>
            <TableCell className="text-right w-1/4 tabular-nums">{settings.currencySymbol}{current.totalEquity.toFixed(2)}</TableCell>
            <TableCell className="text-right w-1/4 tabular-nums">{settings.currencySymbol}{prior.totalEquity.toFixed(2)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Table>
        <TableHeader>
          <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
            <TableHead className="text-primary-foreground w-1/2 font-bold">Total Liabilities & Equity</TableHead>
            <TableHead className="text-right text-primary-foreground w-1/4">Current Year</TableHead>
            <TableHead className="text-right text-primary-foreground w-1/4">Prior Year</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="font-bold text-lg">
            <TableCell className="w-1/2">Total Liabilities & Equity</TableCell>
            <TableCell className="text-right w-1/4 tabular-nums">{settings.currencySymbol}{(current.totalLiabilities + current.totalEquity).toFixed(2)}</TableCell>
            <TableCell className="text-right w-1/4 tabular-nums">{settings.currencySymbol}{(prior.totalLiabilities + prior.totalEquity).toFixed(2)}</TableCell>
          </TableRow>
          <TableRow className={`font-bold text-lg ${Math.abs(current.totalAssets - (current.totalLiabilities + current.totalEquity)) > 0.01 ? 'bg-red-100 text-red-900' : 'bg-green-100 text-green-900'}`}>
            <TableCell className="w-1/2">Balance Check (Assets - (Liabilities + Equity))</TableCell>
            <TableCell className="text-right w-1/4 tabular-nums">{settings.currencySymbol}{(current.totalAssets - (current.totalLiabilities + current.totalEquity)).toFixed(2)}</TableCell>
            <TableCell className="text-right w-1/4 tabular-nums">{settings.currencySymbol}{(prior.totalAssets - (prior.totalLiabilities + prior.totalEquity)).toFixed(2)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
