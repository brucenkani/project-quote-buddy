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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CompanySelector() {
  const { companies, activeCompany, setActiveCompany, createCompany } = useCompany();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return;
    
    setCreating(true);
    const company = await createCompany(newCompanyName.trim());
    setCreating(false);
    
    if (company) {
      setShowCreateDialog(false);
      setNewCompanyName('');
      setActiveCompany(company);
    }
  };

  if (!activeCompany) {
    return (
      <Button onClick={() => setShowCreateDialog(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" />
        Create Company
      </Button>
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

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
            <DialogDescription>
              Create a new company to manage your accounting separately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Enter company name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateCompany();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setNewCompanyName('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCompany} disabled={!newCompanyName.trim() || creating}>
              {creating ? 'Creating...' : 'Create Company'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
