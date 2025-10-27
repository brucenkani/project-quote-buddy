import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Search, Mail, Plus, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: string | null;
  company_count: number;
}

export default function UserManagementTable() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'owner' as 'owner' | 'accountant' | 'employee' | 'super_admin' | 'none',
    company_id: ''
  });

  useEffect(() => {
    loadUsers();
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data: usersData, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersWithDetails = await Promise.all(
        (usersData || []).map(async (user) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

          const { count: companyCount } = await supabase
            .from('company_members')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          
          return {
            ...user,
            role: roleData?.role || null,
            company_count: companyCount || 0,
          };
        })
      );

      setUsers(usersWithDetails);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: 'owner',
      company_id: companies[0]?.id || ''
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      full_name: user.full_name || '',
      role: (user.role || 'owner') as any,
      company_id: ''
    });
    setIsDialogOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.company_id) {
      toast({
        title: 'Error',
        description: 'Email, password, and company are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          fullName: formData.full_name,
          role: formData.role,
          companyId: formData.company_id
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User created successfully',
      });

      setIsCreateDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUser) return;

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          full_name: formData.full_name,
          email: formData.email
        })
        .eq('id', editingUser.id);

      if (profileError) throw profileError;

      // Update role if changed
      if (formData.role !== 'none') {
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', editingUser.id);

        if (deleteError && deleteError.code !== 'PGRST116') throw deleteError;

        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([{
            user_id: editingUser.id,
            role: formData.role
          }]);

        if (roleError) throw roleError;
      } else {
        // Remove role if set to none
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', editingUser.id);

        if (deleteError && deleteError.code !== 'PGRST116') throw deleteError;
      }

      toast({
        title: 'Success',
        description: 'User updated successfully',
      });

      setIsDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string, isSuperAdmin: boolean) => {
    if (isSuperAdmin) {
      toast({
        title: 'Cannot Delete',
        description: 'Super admin users cannot be deleted',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `User "${userEmail}" deleted successfully`,
      });

      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleBadgeVariant = (role: string | null) => {
    if (role === 'super_admin') return 'default';
    if (role === 'owner') return 'secondary';
    return 'outline';
  };

  const getRoleDisplay = (role: string | null) => {
    if (role === 'super_admin') return 'Super Admin';
    if (role === 'owner') return 'Owner';
    if (role === 'accountant') return 'Accountant';
    if (role === 'employee') return 'Employee';
    return 'No Role';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading users...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Manage all users in the system</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {filteredUsers.length} Users
            </Badge>
            <Button onClick={handleCreateUser}>
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </div>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {searchTerm ? 'No users found matching your search' : 'No users yet'}
          </p>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Companies</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="font-medium">{user.full_name || 'No Name'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleDisplay(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.company_count}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.email, user.role === 'super_admin')}
                          className="text-destructive hover:text-destructive"
                          disabled={user.role === 'super_admin'}
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

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a new user and assign them to a company
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Password *</Label>
              <Input
                id="create-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-full-name">Full Name</Label>
              <Input
                id="create-full-name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Role *</Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="accountant">Accountant</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-company">Company *</Label>
              <Select value={formData.company_id} onValueChange={(value) => setFormData({ ...formData, company_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create User</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and role
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-full-name">Full Name</Label>
              <Input
                id="edit-full-name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="accountant">Accountant</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="none">No Role</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update User</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
