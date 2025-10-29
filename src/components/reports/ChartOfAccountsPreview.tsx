import { ChartAccount } from '@/types/chartOfAccounts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ChartOfAccountsPreviewProps {
  accounts: ChartAccount[];
}

const formatAccountType = (type: string) => {
  const typeMap: Record<string, string> = {
    'current-asset': 'Current Asset',
    'non-current-asset': 'Non-Current Asset',
    'current-liability': 'Current Liability',
    'non-current-liability': 'Non-Current Liability',
    'equity': 'Equity',
    'revenue': 'Revenue',
    'expense': 'Expense'
  };
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

export function ChartOfAccountsPreview({ accounts }: ChartOfAccountsPreviewProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Chart of Accounts</h2>
        <p className="text-sm text-gray-600">Generated: {new Date().toLocaleDateString()}</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold">Account #</TableHead>
            <TableHead className="font-bold">Account Name</TableHead>
            <TableHead className="font-bold">Type</TableHead>
            <TableHead className="font-bold text-right">Opening Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account, idx) => (
            <TableRow key={idx}>
              <TableCell>{account.accountNumber}</TableCell>
              <TableCell>{account.accountName}</TableCell>
              <TableCell>{formatAccountType(account.accountType)}</TableCell>
              <TableCell className="text-right">
                R {(account.openingBalance || 0).toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
