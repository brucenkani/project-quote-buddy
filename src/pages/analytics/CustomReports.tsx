import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, FileText, Download, BarChart, PieChart, LineChart, Plus, Trash2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BarChart as RechartsBarChart, Bar, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function CustomReports() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customDashboards, setCustomDashboards] = useState<any[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<string | null>(null);
  const [newDashboardName, setNewDashboardName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('customDashboards');
    if (saved) {
      setCustomDashboards(JSON.parse(saved));
    }
  }, []);
  const [reportConfig, setReportConfig] = useState({
    name: '',
    dataSource: 'sales',
    dateRange: 'last-30-days',
    metrics: [] as string[],
  });

  const dashboardTemplates = [
    { id: 'exec', name: 'Executive Dashboard', widgets: 12, category: 'Leadership', description: 'High-level overview of business performance' },
    { id: 'sales', name: 'Sales Performance', widgets: 8, category: 'Sales', description: 'Track sales metrics and pipeline' },
    { id: 'finance', name: 'Financial Overview', widgets: 10, category: 'Finance', description: 'Monitor financial health and trends' },
  ];

  const sampleData = {
    sales: [
      { month: 'Jan', revenue: 45000, expenses: 32000, profit: 13000 },
      { month: 'Feb', revenue: 52000, expenses: 35000, profit: 17000 },
      { month: 'Mar', revenue: 48000, expenses: 33000, profit: 15000 },
      { month: 'Apr', revenue: 61000, expenses: 38000, profit: 23000 },
      { month: 'May', revenue: 55000, expenses: 36000, profit: 19000 },
      { month: 'Jun', revenue: 67000, expenses: 40000, profit: 27000 },
    ],
    expenses: [
      { category: 'Salaries', value: 120000 },
      { category: 'Marketing', value: 45000 },
      { category: 'Operations', value: 65000 },
      { category: 'Technology', value: 38000 },
      { category: 'Other', value: 22000 },
    ],
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const handleUseTemplate = (template: any) => {
    const newDashboard = {
      id: Date.now().toString(),
      name: `${template.name} - Copy`,
      templateId: template.id,
      widgets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...customDashboards, newDashboard];
    setCustomDashboards(updated);
    localStorage.setItem('customDashboards', JSON.stringify(updated));
    toast({
      title: 'Dashboard Created',
      description: `${template.name} has been added to your dashboards.`,
    });
  };

  const handleCreateDashboard = () => {
    if (!newDashboardName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a dashboard name.',
        variant: 'destructive',
      });
      return;
    }
    const newDashboard = {
      id: Date.now().toString(),
      name: newDashboardName,
      widgets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...customDashboards, newDashboard];
    setCustomDashboards(updated);
    localStorage.setItem('customDashboards', JSON.stringify(updated));
    setNewDashboardName('');
    toast({
      title: 'Dashboard Created',
      description: `"${newDashboardName}" has been created successfully.`,
    });
  };

  const handleDeleteDashboard = (id: string) => {
    const updated = customDashboards.filter(d => d.id !== id);
    setCustomDashboards(updated);
    localStorage.setItem('customDashboards', JSON.stringify(updated));
    toast({
      title: 'Dashboard Deleted',
      description: 'The dashboard has been removed.',
    });
  };

  const handleCreateReport = () => {
    if (!reportConfig.name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a report name.',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Report Generated',
      description: `"${reportConfig.name}" has been created successfully.`,
    });
    setReportConfig({ name: '', dataSource: 'sales', dateRange: 'last-30-days', metrics: [] });
  };

  const handleExport = (format: string) => {
    toast({
      title: `Exporting as ${format}`,
      description: 'Your report is being prepared for download...',
    });
    
    // Simulate export
    setTimeout(() => {
      toast({
        title: 'Export Complete',
        description: `Your ${format} file is ready.`,
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/business-analytics')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Custom Reports</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="dashboards" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="dashboards">Custom Dashboards</TabsTrigger>
            <TabsTrigger value="adhoc">Ad-hoc Reports</TabsTrigger>
            <TabsTrigger value="visualization">Data Visualization</TabsTrigger>
            <TabsTrigger value="export">Export Capabilities</TabsTrigger>
          </TabsList>

          {/* Custom Dashboards Tab */}
          <TabsContent value="dashboards" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Templates</CardTitle>
                <CardDescription>Pre-built and customizable dashboards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardTemplates.map((template) => (
                  <div key={template.id} className="p-4 border rounded-lg flex justify-between items-center hover:border-primary/50 transition-colors">
                    <div>
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.widgets} widgets • {template.category}</p>
                      <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    </div>
                    <Button onClick={() => handleUseTemplate(template)}>Use Template</Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>My Custom Dashboards</CardTitle>
                <CardDescription>Your created and customized dashboards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="New dashboard name..."
                    value={newDashboardName}
                    onChange={(e) => setNewDashboardName(e.target.value)}
                  />
                  <Button onClick={handleCreateDashboard}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </Button>
                </div>

                {customDashboards.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No custom dashboards yet. Create one or use a template above.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customDashboards.map((dashboard) => (
                      <div 
                        key={dashboard.id} 
                        className="p-4 border rounded-lg flex justify-between items-center hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/analytics/dashboard-builder/${dashboard.id}`)}
                      >
                        <div>
                          <h3 className="font-semibold">{dashboard.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Created {new Date(dashboard.createdAt).toLocaleDateString()}
                            {dashboard.widgets && <> • {dashboard.widgets.length} widgets</>}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDashboard(dashboard.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ad-hoc Reports Tab */}
          <TabsContent value="adhoc" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ad-hoc Report Builder</CardTitle>
                <CardDescription>Create custom reports on demand</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="report-name">Report Name</Label>
                    <Input
                      id="report-name"
                      placeholder="Enter report name..."
                      value={reportConfig.name}
                      onChange={(e) => setReportConfig({ ...reportConfig, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="data-source">Data Source</Label>
                    <Select
                      value={reportConfig.dataSource}
                      onValueChange={(value) => setReportConfig({ ...reportConfig, dataSource: value })}
                    >
                      <SelectTrigger id="data-source">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Sales Data</SelectItem>
                        <SelectItem value="expenses">Expense Data</SelectItem>
                        <SelectItem value="inventory">Inventory Data</SelectItem>
                        <SelectItem value="customers">Customer Data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="date-range">Date Range</Label>
                    <Select
                      value={reportConfig.dateRange}
                      onValueChange={(value) => setReportConfig({ ...reportConfig, dateRange: value })}
                    >
                      <SelectTrigger id="date-range">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                        <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                        <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                        <SelectItem value="ytd">Year to Date</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full" onClick={handleCreateReport}>
                    <BarChart className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sample Report Preview</CardTitle>
                <CardDescription>Revenue vs Expenses Analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={sampleData.sales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue" />
                    <Bar dataKey="expenses" fill="hsl(var(--chart-2))" name="Expenses" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Visualization Tab */}
          <TabsContent value="visualization" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Monthly revenue over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsLineChart data={sampleData.sales}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expense Distribution</CardTitle>
                  <CardDescription>Breakdown by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={sampleData.expenses}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sampleData.expenses.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Profit Analysis</CardTitle>
                  <CardDescription>Monthly profit trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={sampleData.sales}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="profit" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Comparative Analysis</CardTitle>
                  <CardDescription>Revenue, Expenses, and Profit</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsLineChart data={sampleData.sales}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                      <Line type="monotone" dataKey="expenses" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                      <Line type="monotone" dataKey="profit" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Export Capabilities Tab */}
          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>Download reports in multiple formats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Button variant="outline" onClick={() => handleExport('PDF')} className="h-20 flex-col gap-2">
                    <Download className="h-6 w-6" />
                    <span>Export as PDF</span>
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('Excel')} className="h-20 flex-col gap-2">
                    <Download className="h-6 w-6" />
                    <span>Export as Excel</span>
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('CSV')} className="h-20 flex-col gap-2">
                    <Download className="h-6 w-6" />
                    <span>Export as CSV</span>
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('JSON')} className="h-20 flex-col gap-2">
                    <Download className="h-6 w-6" />
                    <span>Export as JSON</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scheduled Exports</CardTitle>
                <CardDescription>Automate report generation and delivery</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="schedule-frequency">Frequency</Label>
                    <Select defaultValue="weekly">
                      <SelectTrigger id="schedule-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="schedule-format">Export Format</Label>
                    <Select defaultValue="pdf">
                      <SelectTrigger id="schedule-format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="schedule-email">Email Recipients</Label>
                    <Input id="schedule-email" placeholder="email@example.com" type="email" />
                  </div>

                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
