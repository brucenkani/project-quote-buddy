import { ChartAccount } from '@/types/chartOfAccounts';
import { CompanySettings } from '@/types/settings';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { generateIncomeStatement, PeriodData } from '@/utils/financialStatements';

interface IncomeStatementPreviewProps {
  accounts: ChartAccount[];
  currentPeriod: PeriodData;
  priorPeriod: PeriodData;
  settings: CompanySettings;
}

export function IncomeStatementPreview({ 
  accounts, 
  currentPeriod, 
  priorPeriod, 
  settings 
}: IncomeStatementPreviewProps) {
  const current = generateIncomeStatement(accounts, currentPeriod);
  const prior = generateIncomeStatement(accounts, priorPeriod);

  const formatRow = (label: string, currentAmount: number, priorAmount: number) => {
    const variance = currentAmount - priorAmount;
    const variancePercent = priorAmount !== 0 ? ((variance / Math.abs(priorAmount)) * 100) : 0;

    return (
      <TableRow>
        <TableCell className="font-medium">{label}</TableCell>
        <TableCell className="text-right">{settings.currencySymbol}{currentAmount.toFixed(2)}</TableCell>
        <TableCell className="text-right">{settings.currencySymbol}{priorAmount.toFixed(2)}</TableCell>
        <TableCell className="text-right">{settings.currencySymbol}{variance.toFixed(2)}</TableCell>
        <TableCell className="text-right">{variancePercent.toFixed(1)}%</TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{settings.companyName}</h2>
        <h3 className="text-xl font-semibold">Income Statement</h3>
        <p className="text-sm text-muted-foreground">
          For the period ending {currentPeriod.endDate} (Compared to {priorPeriod.endDate})
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
            <TableHead className="text-primary-foreground">Revenue</TableHead>
            <TableHead className="text-right text-primary-foreground">Current Year</TableHead>
            <TableHead className="text-right text-primary-foreground">Prior Year</TableHead>
            <TableHead className="text-right text-primary-foreground">Variance</TableHead>
            <TableHead className="text-right text-primary-foreground">Variance %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {current.revenue.map(item => {
            const priorItem = prior.revenue.find(p => p.account === item.account) || { amount: 0 };
            return formatRow(item.account, item.amount, priorItem.amount);
          })}
          <TableRow className="font-bold bg-muted">
            <TableCell>Total Revenue</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{current.totalRevenue.toFixed(2)}</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{prior.totalRevenue.toFixed(2)}</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{(current.totalRevenue - prior.totalRevenue).toFixed(2)}</TableCell>
            <TableCell className="text-right">
              {prior.totalRevenue !== 0 ? (((current.totalRevenue - prior.totalRevenue) / Math.abs(prior.totalRevenue)) * 100).toFixed(1) : 0}%
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Table>
        <TableHeader>
          <TableRow className="bg-destructive text-destructive-foreground hover:bg-destructive">
            <TableHead className="text-destructive-foreground">Cost of Sales</TableHead>
            <TableHead className="text-right text-destructive-foreground">Current Year</TableHead>
            <TableHead className="text-right text-destructive-foreground">Prior Year</TableHead>
            <TableHead className="text-right text-destructive-foreground">Variance</TableHead>
            <TableHead className="text-right text-destructive-foreground">Variance %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {current.costOfSales.map(item => {
            const priorItem = prior.costOfSales.find(p => p.account === item.account) || { amount: 0 };
            return formatRow(item.account, item.amount, priorItem.amount);
          })}
          <TableRow className="font-bold bg-muted">
            <TableCell>Total Cost of Sales</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{current.totalCostOfSales.toFixed(2)}</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{prior.totalCostOfSales.toFixed(2)}</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{(current.totalCostOfSales - prior.totalCostOfSales).toFixed(2)}</TableCell>
            <TableCell className="text-right">
              {prior.totalCostOfSales !== 0 ? (((current.totalCostOfSales - prior.totalCostOfSales) / Math.abs(prior.totalCostOfSales)) * 100).toFixed(1) : 0}%
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead>Gross Profit</TableHead>
            <TableHead className="text-right">Current Year</TableHead>
            <TableHead className="text-right">Prior Year</TableHead>
            <TableHead className="text-right">Variance</TableHead>
            <TableHead className="text-right">Variance %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="font-bold">
            <TableCell>Gross Profit</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{current.grossProfit.toFixed(2)}</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{prior.grossProfit.toFixed(2)}</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{(current.grossProfit - prior.grossProfit).toFixed(2)}</TableCell>
            <TableCell className="text-right">
              {prior.grossProfit !== 0 ? (((current.grossProfit - prior.grossProfit) / Math.abs(prior.grossProfit)) * 100).toFixed(1) : 0}%
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Table>
        <TableHeader>
          <TableRow className="bg-orange-500 text-white hover:bg-orange-500">
            <TableHead className="text-white">Operating Expenses</TableHead>
            <TableHead className="text-right text-white">Current Year</TableHead>
            <TableHead className="text-right text-white">Prior Year</TableHead>
            <TableHead className="text-right text-white">Variance</TableHead>
            <TableHead className="text-right text-white">Variance %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {current.operatingExpenses.map(item => {
            const priorItem = prior.operatingExpenses.find(p => p.account === item.account) || { amount: 0 };
            return formatRow(item.account, item.amount, priorItem.amount);
          })}
          <TableRow className="font-bold bg-muted">
            <TableCell>Total Operating Expenses</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{current.totalOperatingExpenses.toFixed(2)}</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{prior.totalOperatingExpenses.toFixed(2)}</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{(current.totalOperatingExpenses - prior.totalOperatingExpenses).toFixed(2)}</TableCell>
            <TableCell className="text-right">
              {prior.totalOperatingExpenses !== 0 ? (((current.totalOperatingExpenses - prior.totalOperatingExpenses) / Math.abs(prior.totalOperatingExpenses)) * 100).toFixed(1) : 0}%
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Table>
        <TableHeader>
          <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
            <TableHead className="text-primary-foreground">Net Income</TableHead>
            <TableHead className="text-right text-primary-foreground">Current Year</TableHead>
            <TableHead className="text-right text-primary-foreground">Prior Year</TableHead>
            <TableHead className="text-right text-primary-foreground">Variance</TableHead>
            <TableHead className="text-right text-primary-foreground">Variance %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="font-bold text-lg">
            <TableCell>Net Income</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{current.netIncome.toFixed(2)}</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{prior.netIncome.toFixed(2)}</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{(current.netIncome - prior.netIncome).toFixed(2)}</TableCell>
            <TableCell className="text-right">
              {prior.netIncome !== 0 ? (((current.netIncome - prior.netIncome) / Math.abs(prior.netIncome)) * 100).toFixed(1) : 0}%
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
