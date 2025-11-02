import { ChartAccount, accountSubCategories } from '@/types/chartOfAccounts';
import { CompanySettings } from '@/types/settings';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { generateBalanceSheet, PeriodData } from '@/utils/financialStatements';

interface BalanceSheetPreviewProps {
  accounts: ChartAccount[];
  currentPeriod: PeriodData;
  priorPeriod: PeriodData;
  settings: CompanySettings;
}

const getSubCategoryLabel = (subCat?: string) => {
  if (!subCat) return 'Other';
  for (const categories of Object.values(accountSubCategories)) {
    const found = categories.find(cat => cat.value === subCat);
    if (found) return found.label;
  }
  return subCat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export function BalanceSheetPreview({ 
  accounts, 
  currentPeriod, 
  priorPeriod, 
  settings 
}: BalanceSheetPreviewProps) {
  const current = generateBalanceSheet(accounts, currentPeriod);
  const prior = generateBalanceSheet(accounts, priorPeriod);

  // Separate current and non-current assets
  const currentAssets = current.assets.filter(a => {
    const accNum = a.account.split(' - ')[0];
    return accNum.startsWith('1');
  });
  const nonCurrentAssets = current.assets.filter(a => {
    const accNum = a.account.split(' - ')[0];
    return accNum.startsWith('2');
  });

  // Separate current and non-current liabilities
  const currentLiabilities = current.liabilities.filter(l => {
    const accNum = l.account.split(' - ')[0];
    return accNum.startsWith('3');
  });
  const nonCurrentLiabilities = current.liabilities.filter(l => {
    const accNum = l.account.split(' - ')[0];
    return accNum.startsWith('4');
  });

  const renderSection = (title: string, items: typeof current.assets, bgColor: string) => {
    // Group by sub-category
    const grouped = items.reduce((acc, item) => {
      const subCat = item.subCategory || 'other';
      if (!acc[subCat]) acc[subCat] = [];
      acc[subCat].push(item);
      return acc;
    }, {} as Record<string, typeof items>);

    const sectionTotal = items.reduce((sum, item) => sum + item.amount, 0);
    const priorSectionTotal = items.reduce((sum, item) => {
      const priorItem = prior.assets.concat(prior.liabilities).find(p => p.account === item.account);
      return sum + (priorItem?.amount || 0);
    }, 0);

    return (
      <>
        <Table>
          <TableHeader>
            <TableRow className={`${bgColor} hover:${bgColor}`}>
              <TableHead className="text-white w-1/2">{title}</TableHead>
              <TableHead className="text-right text-white w-1/4">Current Year</TableHead>
              <TableHead className="text-right text-white w-1/4">Prior Year</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(grouped).map(([subCat, subItems]) => (
              <>
                <TableRow key={`${title}-${subCat}-header`} className="bg-muted/50">
                  <TableCell colSpan={3} className="font-semibold text-sm">
                    {getSubCategoryLabel(subCat)}
                  </TableCell>
                </TableRow>
                {subItems.map(item => {
                  const priorItem = prior.assets.concat(prior.liabilities).concat(prior.equity).find(p => p.account === item.account) || { amount: 0 };
                  return (
                    <TableRow key={item.account}>
                      <TableCell className="w-1/2 pl-8">{item.account}</TableCell>
                      <TableCell className="text-right w-1/4 tabular-nums">{settings.currencySymbol}{item.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right w-1/4 tabular-nums">{settings.currencySymbol}{priorItem.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </>
            ))}
            <TableRow className="font-bold bg-muted">
              <TableCell className="w-1/2">{title} Total</TableCell>
              <TableCell className="text-right w-1/4 tabular-nums">{settings.currencySymbol}{sectionTotal.toFixed(2)}</TableCell>
              <TableCell className="text-right w-1/4 tabular-nums">{settings.currencySymbol}{priorSectionTotal.toFixed(2)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{settings.companyName}</h2>
        <h3 className="text-xl font-semibold">Balance Sheet</h3>
        <p className="text-sm text-muted-foreground">
          As of {currentPeriod.endDate} (Compared to {priorPeriod.endDate})
        </p>
      </div>

      {renderSection('Current Assets', currentAssets, 'bg-blue-600 text-white')}
      {renderSection('Non-Current Assets', nonCurrentAssets, 'bg-blue-800 text-white')}
      
      <Table>
        <TableBody>
          <TableRow className="font-bold bg-primary text-primary-foreground text-lg">
            <TableCell className="w-1/2">Total Assets</TableCell>
            <TableCell className="text-right w-1/4 tabular-nums">{settings.currencySymbol}{current.totalAssets.toFixed(2)}</TableCell>
            <TableCell className="text-right w-1/4 tabular-nums">{settings.currencySymbol}{prior.totalAssets.toFixed(2)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {renderSection('Current Liabilities', currentLiabilities, 'bg-red-600 text-white')}
      {renderSection('Non-Current Liabilities', nonCurrentLiabilities, 'bg-red-800 text-white')}
      
      <Table>
        <TableBody>
          <TableRow className="font-bold bg-destructive text-destructive-foreground text-lg">
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
