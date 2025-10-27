import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CreateSuperAdmin() {
  const [loading, setLoading] = useState(false);

  const handleCreateSuperAdmin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-super-admin', {
        body: {
          email: 'bruce@nkani.co.za',
          password: 'Makanaka#2016'
        }
      });

      if (error) {
        toast.error('Failed to create super admin: ' + error.message);
        console.error('Error:', error);
        return;
      }

      if (data.error) {
        toast.error('Failed to create super admin: ' + data.error);
        return;
      }

      toast.success(data.message || 'Super admin created successfully!');
      console.log('Super admin created:', data);
    } catch (err: any) {
      toast.error('Failed to create super admin: ' + err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Create Super Admin</h1>
        <p className="mb-4 text-muted-foreground">
          Click the button below to create a super admin account with the credentials:
        </p>
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <p className="font-mono text-sm">Email: bruce@nkani.co.za</p>
          <p className="font-mono text-sm">Password: Makanaka#2016</p>
        </div>
        <Button 
          onClick={handleCreateSuperAdmin} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Creating...' : 'Create Super Admin Account'}
        </Button>
      </Card>
    </div>
  );
}
