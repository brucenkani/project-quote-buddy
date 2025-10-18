import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, LayoutDashboard, FileText, BarChart3, Download, Trash2 } from 'lucide-react';
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
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState('');
  const [chartType, setChartType] = useState('');
  const [exportFormat, setExportFormat] = useState('');
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
        description: 'Please enter a dashboard name',
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
        title: 'Dashboard created',
        description: `"${newDashboardName}" has been created successfully`,
      });

      setNewDashboardName('');
      setNewDashboardDesc('');
      loadDashboards();
    } catch (error) {
      console.error('Error creating dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to create dashboard',
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
        title: 'Dashboard deleted',
        description: 'Dashboard has been removed',
      });

      loadDashboards();
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete dashboard',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateReport = () => {
    if (!reportName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a report name',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Report generated',
      description: `"${reportName}" has been created successfully`,
    });
    setReportName('');
  };

  const handleExport = (format: string) => {
    toast({
      title: `Exporting as ${format.toUpperCase()}`,
      description: 'Your report is being prepared for download...',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboards" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="dashboards">Custom Dashboards</TabsTrigger>
            <TabsTrigger value="adhoc">Ad-hoc Reports</TabsTrigger>
            <TabsTrigger value="visualization">Data Visualization</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          {/* Custom Dashboards Tab */}
          <TabsContent value="dashboards" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Dashboard</CardTitle>
                <CardDescription>Build a custom dashboard with drag-and-drop widgets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="dashboard-name">Dashboard Name</Label>
                    <Input
                      id="dashboard-name"
                      placeholder="Enter dashboard name..."
                      value={newDashboardName}
                      onChange={(e) => setNewDashboardName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dashboard-desc">Description (Optional)</Label>
                    <Textarea
                      id="dashboard-desc"
                      placeholder="Describe this dashboard..."
                      value={newDashboardDesc}
                      onChange={(e) => setNewDashboardDesc(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleCreateDashboard} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 mb-6">
              <DataSourceUpload onUploadComplete={() => setUploadTrigger(prev => prev + 1)} />
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Available Data Sources</h3>
              <DataSourceList refreshTrigger={uploadTrigger} />
            </div>

            <div className="grid gap-4">
              <h3 className="text-lg font-semibold">Your Dashboards</h3>
              {dashboards.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <LayoutDashboard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No custom dashboards yet</p>
                    <p className="text-sm mt-2">Create your first dashboard above</p>
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
          </TabsContent>

          {/* Ad-hoc Reports Tab */}
          <TabsContent value="adhoc" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Ad-hoc Report</CardTitle>
                <CardDescription>Create custom reports on-demand</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="report-name">Report Name</Label>
                  <Input
                    id="report-name"
                    placeholder="Enter report name..."
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger id="report-type">
                      <SelectValue placeholder="Select report type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales Report</SelectItem>
                      <SelectItem value="financial">Financial Report</SelectItem>
                      <SelectItem value="inventory">Inventory Report</SelectItem>
                      <SelectItem value="customer">Customer Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleGenerateReport}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Visualization Tab */}
          <TabsContent value="visualization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Visualization</CardTitle>
                <CardDescription>Build charts and graphs from your data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="chart-type">Chart Type</Label>
                  <Select value={chartType} onValueChange={setChartType}>
                    <SelectTrigger id="chart-type">
                      <SelectValue placeholder="Select chart type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                      <SelectItem value="area">Area Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Create Chart
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Reports</CardTitle>
                <CardDescription>Download reports in various formats</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="export-format">Export Format</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger id="export-format">
                      <SelectValue placeholder="Select format..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => exportFormat && handleExport(exportFormat)}
                  disabled={!exportFormat}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
