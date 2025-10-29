import { ChartAccount } from '@/types/chartOfAccounts';
import { JournalEntry, Expense } from '@/types/accounting';
import { CompanySettings } from '@/types/settings';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface LedgerPreviewProps {
  account: ChartAccount;
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

export function LedgerPreview({ 
  account, 
  journalEntries, 
  expenses, 
  dateRange, 
  settings 
}: LedgerPreviewProps) {
  const transactions: any[] = [];
  const seenReferences = new Map<string, boolean>();

  journalEntries.forEach(entry => {
    entry.entries.forEach(line => {
      const lineNum = extractAccountNumber(line.account);
      if (lineNum === account.accountNumber || line.account === account.accountName ||
          line.account === `${account.accountNumber} - ${account.accountName}`) {
        const uniqueKey = `${entry.reference || ''}-${entry.date}-${line.debit}-${line.credit}`;
        
        if (seenReferences.has(uniqueKey)) return;
        
        seenReferences.set(uniqueKey, true);
        transactions.push({
          date: entry.date,
          description: entry.description,
          reference: entry.reference,
          debit: line.debit,
          credit: line.credit,
        });
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
      
      const uniqueKey = `${expense.reference || ''}-${expense.date}-${netAmount}-0`;
      if (seenReferences.has(uniqueKey)) return;
      
      seenReferences.set(uniqueKey, true);
      transactions.push({
        date: expense.date,
        description: expense.description,
        reference: expense.reference,
        debit: netAmount,
        credit: 0,
      });
    }
  });

  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let balance = 0;
  const tableData = transactions.map(t => {
    balance += t.debit - t.credit;
    return { ...t, balance };
  });

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Account Ledger</h2>
        <p className="text-sm text-gray-600">Account: {account.accountNumber} - {account.accountName}</p>
        <p className="text-sm text-gray-600">Period: {dateRange.startDate} to {dateRange.endDate}</p>
        <p className="text-lg font-semibold">{settings.companyName}</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold">Date</TableHead>
            <TableHead className="font-bold">Description</TableHead>
            <TableHead className="font-bold">Reference</TableHead>
            <TableHead className="font-bold text-right">Debit</TableHead>
            <TableHead className="font-bold text-right">Credit</TableHead>
            <TableHead className="font-bold text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableData.map((t, idx) => (
            <TableRow key={idx}>
              <TableCell>{t.date}</TableCell>
              <TableCell>{t.description}</TableCell>
              <TableCell>{t.reference || '-'}</TableCell>
              <TableCell className="text-right">
                {t.debit ? `${settings.currencySymbol}${t.debit.toFixed(2)}` : '-'}
              </TableCell>
              <TableCell className="text-right">
                {t.credit ? `${settings.currencySymbol}${t.credit.toFixed(2)}` : '-'}
              </TableCell>
              <TableCell className="text-right">
                {settings.currencySymbol}{t.balance.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
