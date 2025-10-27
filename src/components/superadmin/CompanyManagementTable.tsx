import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Search, Users, Plus, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  member_count: number;
}

export default function CompanyManagementTable() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const { data: companiesData, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const companiesWithCounts = await Promise.all(
        (companiesData || []).map(async (company) => {
          const { count } = await supabase
            .from('company_members')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id);
          
          return {
            ...company,
            member_count: count || 0,
          };
        })
      );

      setCompanies(companiesWithCounts);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load companies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = () => {
    setEditingCompany(null);
    setFormData({ name: '' });
    setIsDialogOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setFormData({ name: company.name });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Company name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingCompany) {
        const { error } = await supabase
          .from('companies')
          .update({ name: formData.name })
          .eq('id', editingCompany.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Company updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('companies')
          .insert([{ 
            name: formData.name,
            created_by: user.id 
          }]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Company created successfully',
        });
      }

      setIsDialogOpen(false);
      loadCompanies();
    } catch (error) {
      console.error('Error saving company:', error);
      toast({
        title: 'Error',
        description: 'Failed to save company',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (!confirm(`Are you sure you want to delete "${companyName}"? This will remove all associated data.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Company "${companyName}" deleted successfully`,
      });

      loadCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete company',
        variant: 'destructive',
      });
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading companies...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>All Companies</CardTitle>
            <CardDescription>Manage all companies in the system</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {filteredCompanies.length} Companies
            </Badge>
            <Button onClick={handleCreateCompany}>
              <Plus className="h-4 w-4 mr-2" />
              Create Company
            </Button>
          </div>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredCompanies.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {searchTerm ? 'No companies found matching your search' : 'No companies yet'}
          </p>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary">{company.member_count}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(company.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCompany(company)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCompany(company.id, company.name)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCompany ? 'Edit Company' : 'Create Company'}</DialogTitle>
            <DialogDescription>
              {editingCompany ? 'Update company details' : 'Create a new company in the system'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder="Enter company name"
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCompany ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
