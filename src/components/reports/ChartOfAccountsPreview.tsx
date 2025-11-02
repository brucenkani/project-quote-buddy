import { ChartAccount, accountSubCategories, AccountSubCategory } from '@/types/chartOfAccounts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AccountType } from '@/types/accounting';

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

const formatSubCategory = (subCategory?: AccountSubCategory) => {
  if (!subCategory) return '-';
  
  // Find the label from accountSubCategories
  for (const categories of Object.values(accountSubCategories)) {
    const found = categories.find(cat => cat.value === subCategory);
    if (found) return found.label;
  }
  
  // Fallback: convert kebab-case to Title Case
  return subCategory.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export function ChartOfAccountsPreview({ accounts }: ChartOfAccountsPreviewProps) {
  // Group accounts by type and sub-category
  const groupedAccounts = accounts.reduce((acc, account) => {
    const type = account.accountType;
    const subCat = account.subCategory || 'other';
    
    if (!acc[type]) acc[type] = {};
    if (!acc[type][subCat]) acc[type][subCat] = [];
    acc[type][subCat].push(account);
    
    return acc;
  }, {} as Record<AccountType, Record<string, ChartAccount[]>>);

  // Sort the types in financial statement order
  const typeOrder: AccountType[] = [
    'current-asset', 
    'non-current-asset', 
    'current-liability', 
    'non-current-liability', 
    'equity', 
    'revenue', 
    'expense'
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Chart of Accounts</h2>
        <p className="text-sm text-gray-600">Generated: {new Date().toLocaleDateString()}</p>
      </div>

      {typeOrder.map((type) => {
        const typeGroups = groupedAccounts[type];
        if (!typeGroups) return null;

        return (
          <div key={type} className="space-y-3">
            <h3 className="text-lg font-semibold text-primary border-b pb-2">
              {formatAccountType(type)}
            </h3>
            
            {Object.entries(typeGroups).map(([subCat, accts]) => (
              <div key={subCat} className="ml-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  {formatSubCategory(subCat as AccountSubCategory)}
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold w-[120px]">Account #</TableHead>
                      <TableHead className="font-bold">Account Name</TableHead>
                      <TableHead className="font-bold text-right w-[150px]">Opening Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accts.sort((a, b) => a.accountNumber.localeCompare(b.accountNumber)).map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-mono">{account.accountNumber}</TableCell>
                        <TableCell>{account.accountName}</TableCell>
                        <TableCell className="text-right">
                          R {(account.openingBalance || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
