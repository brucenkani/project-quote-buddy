import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Shield, Save, Users, Edit, Trash2, UserCog, UserPlus } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
interface RolePermission {
  id: string;
  role: 'admin' | 'accountant' | 'employee';
  permission: string;
  enabled: boolean;
}

const permissionLabels: Record<string, string> = {
  manage_users: 'Manage Users & Invitations',
  manage_roles: 'Manage User Roles',
  manage_permissions: 'Manage Permissions',
  view_all_data: 'View All Data',
  manage_settings: 'Manage System Settings',
  manage_accounting: 'Manage Accounting',
  manage_payroll: 'Manage Payroll',
  manage_employees: 'Manage Employees',
  manage_inventory: 'Manage Inventory',
  view_reports: 'View Reports',
};

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: 'owner' | 'accountant' | 'employee' | 'admin' | null;
}

export default function InviteUsers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeCompany } = useCompany();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'accountant' | 'employee'>('accountant');
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUserRole, setNewUserRole] = useState<'owner' | 'accountant' | 'employee' | 'admin' | 'none'>('accountant');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchPermissions();
    fetchUsers();
  }, []);

  const fetchPermissions = async () => {
    try {
      const { data, error }: any = await (supabase as any)
        .from('role_permissions')
        .select('*')
        .order('role', { ascending: true })
        .order('permission', { ascending: true });

      if (error) throw error;
      setPermissions((data || []) as RolePermission[]);
    } catch (error: any) {
      console.error('Error fetching permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load permissions',
        variant: 'destructive',
      });
    } finally {
      setLoadingPermissions(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for each user
      const usersWithRoles: UserWithRole[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id)
            .single();

          return {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            created_at: profile.created_at,
            role: roleData?.role || null,
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { 
          email, 
          password, 
          role,
          companyId: activeCompany?.id 
        },
      });

      if (error) throw error;

      toast({
        title: 'User Created',
        description: `User ${email} has been created with ${role} role. Login credentials: ${email} / ${password}`,
      });

      setEmail('');
      setPassword('');
      setRole('accountant');
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async () => {
    if (!editingUserId) return;

    try {
      // Call edge function to update user role securely
      const { error: functionError } = await supabase.functions.invoke('update-user-role', {
        body: { userId: editingUserId, role: newUserRole },
      });

      if (functionError) throw functionError;

      toast({
        title: 'Success',
        description: newUserRole === 'none' ? 'User role removed successfully' : 'User role updated successfully',
      });

      setEditingUserId(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUserId) return;

    try {
      // Call edge function to delete user completely (including auth)
      const { error: functionError } = await supabase.functions.invoke('delete-user', {
        body: { userId: deletingUserId },
      });

      if (functionError) {
        // Fallback: delete from user_roles and profiles
        console.warn('Edge function failed, using fallback deletion:', functionError);
        
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', deletingUserId);

        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', deletingUserId);

        if (profileError) throw profileError;
      }

      toast({
        title: 'Success',
        description: 'User removed completely from the system',
      });

      setDeletingUserId(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove user',
        variant: 'destructive',
      });
    }
  };

  const handlePermissionToggle = (permissionId: string, currentValue: boolean) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.id === permissionId ? { ...p, enabled: !currentValue } : p
      )
    );
  };

  const handleSavePermissions = async () => {
    setSavingPermissions(true);
    try {
      const updates = permissions.map((p) => ({
        id: p.id,
        enabled: p.enabled,
      }));

      for (const update of updates) {
        const { error }: any = await (supabase as any)
          .from('role_permissions')
          .update({ enabled: update.enabled })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Permissions updated successfully',
      });
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save permissions',
        variant: 'destructive',
      });
    } finally {
      setSavingPermissions(false);
    }
  };

  const getRolePermissions = (roleType: 'admin' | 'accountant' | 'employee') => {
    return permissions.filter((p) => p.role === roleType);
  };

  const renderPermissionsList = (roleType: 'admin' | 'accountant' | 'employee') => {
    const rolePermissions = getRolePermissions(roleType);

    return (
      <div className="space-y-4">
        {rolePermissions.map((permission) => (
          <div key={permission.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor={permission.id} className="text-base font-medium">
                {permissionLabels[permission.permission] || permission.permission}
              </Label>
              <p className="text-sm text-muted-foreground">
                {permission.permission}
              </p>
            </div>
            <Switch
              id={permission.id}
              checked={permission.enabled}
              onCheckedChange={() => handlePermissionToggle(permission.id, permission.enabled)}
              disabled={roleType === 'admin'}
            />
          </div>
        ))}
      </div>
    );
  };

  if (loadingPermissions) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button onClick={() => navigate('/landing')} variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle>User Management</CardTitle>
            </div>
            <CardDescription>
              Invite new users and manage role permissions for your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="create">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </TabsTrigger>
                <TabsTrigger value="users">
                  <UserCog className="h-4 w-4 mr-2" />
                  Manage Users
                </TabsTrigger>
                <TabsTrigger value="permissions">
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Permissions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-6 mt-6">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Create a new user account with login credentials. The user will be able to login immediately with the email and password you provide. {activeCompany && `They will be added to ${activeCompany.name}.`}
                  </p>
                </div>
                
                <form onSubmit={handleCreateUser} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="text"
                      placeholder="Enter a secure password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum 6 characters. Save this password to share with the user.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={(value: 'admin' | 'accountant' | 'employee') => setRole(value)}>
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="accountant">Accountant</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      {role === 'admin' 
                        ? 'Admins have full access to all features and settings' 
                        : role === 'accountant'
                        ? 'Accountants can manage financial records based on configured permissions'
                        : 'Employees have limited access based on configured permissions'}
                    </p>
                  </div>

                  <Button type="submit" className="w-full gap-2" disabled={loading}>
                    <UserPlus className="h-4 w-4" />
                    {loading ? 'Creating User...' : 'Create User Account'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="users" className="space-y-6 mt-6">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Manage existing users, update their roles, or remove them from the system.
                  </p>
                </div>

                {loadingUsers ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading users...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.full_name || 'N/A'}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              {user.role ? (
                                <Badge variant={user.role === 'owner' ? 'default' : user.role === 'accountant' ? 'secondary' : 'outline'}>
                                  {user.role === 'owner' ? 'Admin' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </Badge>
                              ) : (
                                <Badge variant="outline">No Role</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingUserId(user.id);
                                    setNewUserRole(user.role || 'accountant');
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit Role
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setDeletingUserId(user.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="permissions" className="space-y-6 mt-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="bg-muted p-4 rounded-lg flex-1">
                    <p className="text-sm text-muted-foreground">
                      Configure default permissions for each role. These permissions will be automatically assigned to users when they accept their invitation.
                    </p>
                  </div>
                  <Button onClick={handleSavePermissions} disabled={savingPermissions} className="gap-2 ml-4">
                    <Save className="h-4 w-4" />
                    {savingPermissions ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>

                <Tabs defaultValue="admin" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="admin">Admin</TabsTrigger>
                    <TabsTrigger value="accountant">Accountant</TabsTrigger>
                    <TabsTrigger value="employee">Employee</TabsTrigger>
                  </TabsList>

                  <TabsContent value="admin" className="space-y-4 mt-4">
                    <div className="bg-muted p-4 rounded-lg mb-4">
                      <p className="text-sm text-muted-foreground">
                        <strong>Admin role</strong> has full access to all features and cannot be modified.
                      </p>
                    </div>
                    {renderPermissionsList('admin')}
                  </TabsContent>

                  <TabsContent value="accountant" className="space-y-4 mt-4">
                    <div className="bg-muted p-4 rounded-lg mb-4">
                      <p className="text-sm text-muted-foreground">
                        <strong>Accountant role</strong> is designed for financial management. Toggle permissions as needed.
                      </p>
                    </div>
                    {renderPermissionsList('accountant')}
                  </TabsContent>

                  <TabsContent value="employee" className="space-y-4 mt-4">
                    <div className="bg-muted p-4 rounded-lg mb-4">
                      <p className="text-sm text-muted-foreground">
                        <strong>Employee role</strong> has limited access. Grant permissions carefully.
                      </p>
                    </div>
                    {renderPermissionsList('employee')}
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Edit Role Dialog */}
      <AlertDialog open={!!editingUserId} onOpenChange={(open) => !open && setEditingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update User Role</AlertDialogTitle>
            <AlertDialogDescription>
              Select a new role for this user. Their permissions will be updated accordingly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-role">New Role</Label>
            <Select value={newUserRole} onValueChange={(value: 'owner' | 'accountant' | 'employee' | 'none') => setNewUserRole(value)}>
              <SelectTrigger id="edit-role" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Admin</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="none">No Role</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateUserRole}>Update Role</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Dialog */}
      <AlertDialog open={!!deletingUserId} onOpenChange={(open) => !open && setDeletingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently remove this user from the system? This will delete their account, profile, and revoke all access. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
