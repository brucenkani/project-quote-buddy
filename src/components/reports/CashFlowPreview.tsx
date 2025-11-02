import { ChartAccount } from '@/types/chartOfAccounts';
import { CompanySettings } from '@/types/settings';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { generateCashFlowStatement, PeriodData } from '@/utils/financialStatements';

interface CashFlowPreviewProps {
  accounts: ChartAccount[];
  currentPeriod: PeriodData;
  priorPeriod: PeriodData;
  settings: CompanySettings;
}

export function CashFlowPreview({ 
  accounts, 
  currentPeriod, 
  priorPeriod, 
  settings 
}: CashFlowPreviewProps) {
  const cashFlow = generateCashFlowStatement(accounts, currentPeriod);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{settings.companyName}</h2>
        <h3 className="text-xl font-semibold">Cash Flow Statement (Indirect Method)</h3>
        <p className="text-sm text-muted-foreground">
          For the period ending {currentPeriod.endDate}
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
            <TableHead className="text-primary-foreground">Operating Activities</TableHead>
            <TableHead className="text-right text-primary-foreground">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cashFlow.operating.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.description}</TableCell>
              <TableCell className="text-right">{settings.currencySymbol}{item.amount.toFixed(2)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="font-bold bg-muted">
            <TableCell>Net Cash from Operating Activities</TableCell>
            <TableCell className="text-right">
              {settings.currencySymbol}
              {cashFlow.operating.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Table>
        <TableHeader>
          <TableRow className="bg-blue-600 text-white hover:bg-blue-600">
            <TableHead className="text-white">Investing Activities</TableHead>
            <TableHead className="text-right text-white">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cashFlow.investing.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.description}</TableCell>
              <TableCell className="text-right">{settings.currencySymbol}{item.amount.toFixed(2)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="font-bold bg-muted">
            <TableCell>Net Cash from Investing Activities</TableCell>
            <TableCell className="text-right">
              {settings.currencySymbol}
              {cashFlow.investing.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Table>
        <TableHeader>
          <TableRow className="bg-green-600 text-white hover:bg-green-600">
            <TableHead className="text-white">Financing Activities</TableHead>
            <TableHead className="text-right text-white">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cashFlow.financing.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.description}</TableCell>
              <TableCell className="text-right">{settings.currencySymbol}{item.amount.toFixed(2)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="font-bold bg-muted">
            <TableCell>Net Cash from Financing Activities</TableCell>
            <TableCell className="text-right">
              {settings.currencySymbol}
              {cashFlow.financing.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Table>
        <TableHeader>
          <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
            <TableHead className="text-primary-foreground">Net Cash Flow</TableHead>
            <TableHead className="text-right text-primary-foreground">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="font-bold text-lg">
            <TableCell>Net Increase/(Decrease) in Cash</TableCell>
            <TableCell className="text-right">{settings.currencySymbol}{cashFlow.netCashFlow.toFixed(2)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
