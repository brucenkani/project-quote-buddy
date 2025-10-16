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
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Shield, Save, Users } from 'lucide-react';

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

export default function InviteUsers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'accountant' | 'employee'>('accountant');
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [savingPermissions, setSavingPermissions] = useState(false);

  useEffect(() => {
    fetchPermissions();
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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: { email, role },
      });

      if (error) throw error;

      toast({
        title: 'Invitation Sent',
        description: `An invitation has been sent to ${email} with ${role} role and its associated permissions`,
      });

      setEmail('');
      setRole('accountant');
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
            <Tabs defaultValue="invite" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="invite">
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitations
                </TabsTrigger>
                <TabsTrigger value="permissions">
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Permissions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="invite" className="space-y-6 mt-6">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    When you invite a user, they will automatically receive the permissions configured for their role. You can modify role permissions in the "Manage Permissions" tab.
                  </p>
                </div>
                
                <form onSubmit={handleInvite} className="space-y-6">
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
                    <Send className="h-4 w-4" />
                    {loading ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </form>
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
    </div>
  );
}
