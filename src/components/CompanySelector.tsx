import { useCompany } from '@/contexts/CompanyContext';
import { Building2, ChevronDown, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { CreateCompanyDialog } from './CreateCompanyDialog';

export function CompanySelector() {
  const { companies, activeCompany, setActiveCompany } = useCompany();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (!activeCompany) {
    return (
      <>
        <Button onClick={() => setShowCreateDialog(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Company
        </Button>
        <CreateCompanyDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="max-w-[150px] truncate">{activeCompany.name}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>Companies</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {companies.map((company) => (
            <DropdownMenuItem
              key={company.id}
              onClick={() => setActiveCompany(company)}
              className={activeCompany.id === company.id ? 'bg-accent' : ''}
            >
              <Building2 className="mr-2 h-4 w-4" />
              <span className="truncate">{company.name}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Company
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateCompanyDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </>
  );
}
