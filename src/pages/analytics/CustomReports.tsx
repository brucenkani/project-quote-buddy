import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, LayoutDashboard, Trash2, ArrowLeft, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DataSourceUpload } from '@/components/dashboard/DataSourceUpload';
import { DataSourceList } from '@/components/dashboard/DataSourceList';
import { DashboardConfig } from '@/types/dashboard';

export default function CustomReports() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dashboards, setDashboards] = useState<DashboardConfig[]>([]);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [newDashboardDesc, setNewDashboardDesc] = useState('');
  const [uploadTrigger, setUploadTrigger] = useState(0);

  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_dashboards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDashboards((data || []) as unknown as DashboardConfig[]);
    } catch (error) {
      console.error('Error loading dashboards:', error);
    }
  };

  const handleCreateDashboard = async () => {
    if (!newDashboardName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a report name',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: memberData } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase
        .from('custom_dashboards')
        .insert({
          user_id: user.id,
          company_id: memberData?.company_id || null,
          name: newDashboardName,
          description: newDashboardDesc,
          widgets: [],
        });

      if (error) throw error;

      toast({
        title: 'Report created',
        description: `"${newDashboardName}" has been created successfully`,
      });

      setNewDashboardName('');
      setNewDashboardDesc('');
      loadDashboards();
    } catch (error) {
      console.error('Error creating dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to create report',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDashboard = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_dashboards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Report deleted',
        description: 'Report has been removed',
      });

      loadDashboards();
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete report',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/business-analytics')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Analytics
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Custom Reports</h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2 ml-12">
            Upload data sources and build custom dashboards with drag-and-drop widgets
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Data Source Upload Section */}
          <div className="grid gap-4">
            <DataSourceUpload onUploadComplete={() => setUploadTrigger(prev => prev + 1)} />
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Available Data Sources</h3>
            <DataSourceList refreshTrigger={uploadTrigger} />
          </div>

          {/* Create Report Section */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Report</CardTitle>
              <CardDescription>Build a custom report with drag-and-drop widgets using your uploaded data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="dashboard-name">Report Name</Label>
                  <Input
                    id="dashboard-name"
                    placeholder="Enter report name..."
                    value={newDashboardName}
                    onChange={(e) => setNewDashboardName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dashboard-desc">Description (Optional)</Label>
                  <Textarea
                    id="dashboard-desc"
                    placeholder="Describe this report..."
                    value={newDashboardDesc}
                    onChange={(e) => setNewDashboardDesc(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button onClick={handleCreateDashboard} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Report
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">Your Custom Reports</h3>
            {dashboards.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <LayoutDashboard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No custom reports yet</p>
                  <p className="text-sm mt-2">Create your first report above</p>
                </CardContent>
              </Card>
            ) : (
              dashboards.map((dashboard) => (
                <Card 
                  key={dashboard.id} 
                  className="hover:border-primary transition-colors cursor-pointer"
                  onClick={() => navigate(`/analytics/dashboard-builder/${dashboard.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <LayoutDashboard className="h-5 w-5" />
                          {dashboard.name}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {(dashboard.widgets as any[])?.length || 0} widgets • Last updated {new Date(dashboard.updated_at).toLocaleDateString()}
                          {dashboard.description && <p className="mt-1">{dashboard.description}</p>}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDashboard(dashboard.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
