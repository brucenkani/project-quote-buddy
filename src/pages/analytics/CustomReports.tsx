import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, Download, BarChart, PieChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CustomReports() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const dashboardTemplates = [
    { name: 'Executive Dashboard', widgets: 12, category: 'Leadership' },
    { name: 'Sales Performance', widgets: 8, category: 'Sales' },
    { name: 'Financial Overview', widgets: 10, category: 'Finance' },
  ];

  const exportFormats = ['PDF', 'Excel', 'CSV', 'JSON'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/calculators')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Custom Reports</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="dashboards" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboards">Custom Dashboards</TabsTrigger>
            <TabsTrigger value="adhoc">Ad-hoc Reports</TabsTrigger>
            <TabsTrigger value="visualization">Data Visualization</TabsTrigger>
            <TabsTrigger value="export">Export Capabilities</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboards" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Templates</CardTitle>
                <CardDescription>Pre-built and customizable dashboards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardTemplates.map((template, i) => (
                  <div key={i} className="p-4 border rounded-lg flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.widgets} widgets • {template.category}</p>
                    </div>
                    <Button>Use Template</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="adhoc" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ad-hoc Report Builder</CardTitle>
                <CardDescription>Create custom reports on demand</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full"><BarChart className="h-4 w-4 mr-2" /> Create New Report</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visualization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Visualization</CardTitle>
                <CardDescription>Interactive charts and graphs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {['Bar Chart', 'Line Chart', 'Pie Chart', 'Area Chart'].map(chart => (
                    <div key={chart} className="p-4 border rounded-lg text-center">
                      <PieChart className="h-12 w-12 mx-auto mb-2 text-primary" />
                      <p className="font-medium">{chart}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>Download reports in multiple formats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {exportFormats.map(format => (
                    <Button key={format} variant="outline" onClick={() => toast({ title: `Exporting as ${format}` })}>
                      <Download className="h-4 w-4 mr-2" /> Export as {format}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
