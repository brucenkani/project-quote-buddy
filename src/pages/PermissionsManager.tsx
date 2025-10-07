import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Shield, Save } from 'lucide-react';

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

export default function PermissionsManager() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    setSaving(true);
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
      setSaving(false);
    }
  };

  const getRolePermissions = (role: 'admin' | 'accountant' | 'employee') => {
    return permissions.filter((p) => p.role === role);
  };

  const renderPermissionsList = (role: 'admin' | 'accountant' | 'employee') => {
    const rolePermissions = getRolePermissions(role);

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
              disabled={role === 'admin'} // Admin permissions are always enabled
            />
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading permissions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button onClick={() => navigate('/landing')} variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <CardTitle>Role Permissions Manager</CardTitle>
            </div>
            <CardDescription>
              Configure permissions for each role in your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="admin" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="admin">Admin</TabsTrigger>
                <TabsTrigger value="accountant">Accountant</TabsTrigger>
                <TabsTrigger value="employee">Employee</TabsTrigger>
              </TabsList>

              <TabsContent value="admin" className="space-y-4">
                <div className="bg-muted p-4 rounded-lg mb-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Admin role</strong> has full access to all features and cannot be modified.
                  </p>
                </div>
                {renderPermissionsList('admin')}
              </TabsContent>

              <TabsContent value="accountant" className="space-y-4">
                <div className="bg-muted p-4 rounded-lg mb-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Accountant role</strong> is designed for financial management. Toggle permissions as needed.
                  </p>
                </div>
                {renderPermissionsList('accountant')}
              </TabsContent>

              <TabsContent value="employee" className="space-y-4">
                <div className="bg-muted p-4 rounded-lg mb-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Employee role</strong> has limited access. Grant permissions carefully.
                  </p>
                </div>
                {renderPermissionsList('employee')}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
