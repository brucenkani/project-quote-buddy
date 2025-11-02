import { ChartAccount } from '@/types/chartOfAccounts';
import { JournalEntry, Expense } from '@/types/accounting';
import { CompanySettings } from '@/types/settings';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TrialBalancePreviewProps {
  accounts: ChartAccount[];
  journalEntries: JournalEntry[];
  expenses: Expense[];
  dateRange: { startDate: string; endDate: string };
  settings: CompanySettings;
}

const extractAccountNumber = (accountString: string): string => {
  if (/^\d+$/.test(accountString)) return accountString;
  const match = accountString.match(/^(\d+)\s*-/);
  if (match) return match[1];
  return accountString;
};

export function TrialBalancePreview({ 
  accounts, 
  journalEntries, 
  expenses, 
  dateRange, 
  settings 
}: TrialBalancePreviewProps) {
  const balances = accounts.map(account => {
    let debit = 0;
    let credit = 0;

    journalEntries.forEach(entry => {
      entry.entries.forEach(line => {
        const lineNum = extractAccountNumber(line.account);
        if (lineNum === account.accountNumber || line.account === account.accountName ||
            line.account === `${account.accountNumber} - ${account.accountName}`) {
          debit += line.debit;
          credit += line.credit;
        }
      });
    });

    expenses.forEach(expense => {
      const expNum = extractAccountNumber(expense.category);
      if (expNum === account.accountNumber || expense.category === account.accountName ||
          expense.category === `${account.accountNumber} - ${account.accountName}`) {
        const netAmount = expense.includesVAT && expense.vatAmount 
          ? expense.amount - expense.vatAmount 
          : expense.amount;
        debit += netAmount;
      }
    });

    const netBalance = debit - credit;

    return {
      code: account.accountNumber,
      name: account.accountName,
      type: account.accountType,
      balance: netBalance,
    };
  }).filter(b => b.balance !== 0);

  const totalBalance = balances.reduce((sum, b) => sum + b.balance, 0);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Trial Balance</h2>
        <p className="text-sm text-gray-600">Period: {dateRange.startDate} to {dateRange.endDate}</p>
        <p className="text-lg font-semibold">{settings.companyName}</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold">Code</TableHead>
            <TableHead className="font-bold">Account Name</TableHead>
            <TableHead className="font-bold">Type</TableHead>
            <TableHead className="font-bold text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {balances.map((balance, idx) => (
            <TableRow key={idx}>
              <TableCell>{balance.code}</TableCell>
              <TableCell>{balance.name}</TableCell>
              <TableCell className="capitalize">{balance.type.replace('-', ' ')}</TableCell>
              <TableCell className="text-right">
                {settings.currencySymbol}{balance.balance.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="font-bold bg-gray-100">
            <TableCell></TableCell>
            <TableCell>TOTAL</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-right">
              {settings.currencySymbol}{totalBalance.toFixed(2)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
