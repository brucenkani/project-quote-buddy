import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { WidgetPalette } from '@/components/dashboard/WidgetPalette';
import { DashboardWidget } from '@/components/dashboard/DashboardWidget';
import { Widget, WidgetType, DashboardConfig, DataSource } from '@/types/dashboard';

export default function DashboardBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState<DashboardConfig | null>(null);
  const [dataSource, setDataSource] = useState<DataSource | null>(null);
  const [draggedWidgetType, setDraggedWidgetType] = useState<WidgetType | null>(null);

  useEffect(() => {
    loadDashboard();
  }, [id]);

  const loadDashboard = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_dashboards')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setDashboard(data as unknown as DashboardConfig);
        
        // Load associated data source
        if (data.data_source_id) {
          const { data: dsData, error: dsError } = await supabase
            .from('data_sources')
            .select('*')
            .eq('id', data.data_source_id)
            .single();
          
          if (!dsError && dsData) {
            setDataSource(dsData as unknown as DataSource);
          }
        }
      } else {
        toast({
          title: 'Dashboard not found',
          description: 'Redirecting back...',
          variant: 'destructive',
        });
        navigate('/analytics/custom-reports');
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: 'Error loading dashboard',
        description: 'Redirecting back...',
        variant: 'destructive',
      });
      navigate('/analytics/custom-reports');
    }
  };

  const handleDragStart = (type: WidgetType) => {
    setDraggedWidgetType(type);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedWidgetType || !dashboard) return;

    const canvas = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - canvas.left;
    const y = e.clientY - canvas.top;

    // Prepare widget config based on data source
    let widgetConfig: Widget['config'] = {
      title: `New ${draggedWidgetType} Widget`,
    };

    if (dataSource) {
      const columns = dataSource.columns as string[];
      const data = dataSource.data as any[];

      // For charts, use first two columns as default (label and value)
      if (draggedWidgetType.startsWith('chart-') || draggedWidgetType === 'table') {
        widgetConfig.data = data.slice(0, 10); // Limit to first 10 rows for performance
        widgetConfig.dataKey = columns[1] || columns[0]; // Value column
        widgetConfig.xAxisKey = columns[0]; // Label column
        widgetConfig.availableColumns = columns;
      } else if (draggedWidgetType === 'kpi' || draggedWidgetType === 'metric') {
        // For KPI/Metric, calculate sum or count of first numeric column
        const numericColumn = columns.find(col => {
          const value = data[0]?.[col];
          return typeof value === 'number' || !isNaN(Number(value));
        }) || columns[1] || columns[0];
        
        const total = data.reduce((sum, row) => {
          const val = Number(row[numericColumn]) || 0;
          return sum + val;
        }, 0);
        
        widgetConfig.value = total;
        widgetConfig.metric = numericColumn;
      } else if (draggedWidgetType === 'text') {
        widgetConfig.value = 'Enter text here';
      }
    } else {
      // Fallback for widgets without data source
      widgetConfig.value = draggedWidgetType === 'text' ? 'Enter text here' : 100;
    }

    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: draggedWidgetType,
      x: Math.max(0, x - 150),
      y: Math.max(0, y - 75),
      width: draggedWidgetType === 'table' ? 600 : 300,
      height: draggedWidgetType === 'table' ? 400 : 250,
      config: widgetConfig,
    };

    setDashboard({
      ...dashboard,
      widgets: [...dashboard.widgets, newWidget],
    });
    setDraggedWidgetType(null);
  };

  const handleUpdateWidget = (updatedWidget: Widget) => {
    if (!dashboard) return;
    setDashboard({
      ...dashboard,
      widgets: dashboard.widgets.map(w => w.id === updatedWidget.id ? updatedWidget : w),
    });
  };

  const handleDeleteWidget = (widgetId: string) => {
    if (!dashboard) return;
    setDashboard({
      ...dashboard,
      widgets: dashboard.widgets.filter(w => w.id !== widgetId),
    });
  };

  const handleSave = async () => {
    if (!dashboard) return;
    
    try {
      const { error } = await supabase
        .from('custom_dashboards')
        .update({
          widgets: dashboard.widgets as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dashboard.id);

      if (error) throw error;

      toast({
        title: 'Dashboard Saved',
        description: 'Your changes have been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to save dashboard',
        variant: 'destructive',
      });
    }
  };

  if (!dashboard) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/analytics/custom-reports')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">{dashboard.name}</h1>
            </div>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-[250px_1fr] gap-6 h-[calc(100vh-140px)]">
          <aside>
            <WidgetPalette onDragStart={handleDragStart} />
          </aside>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="relative border-2 border-dashed border-muted-foreground/20 rounded-lg bg-background/50 p-4 overflow-auto"
            style={{ minHeight: '600px' }}
          >
            {dashboard.widgets.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <p>Drag and drop widgets here to build your dashboard</p>
              </div>
            ) : (
              dashboard.widgets.map((widget) => (
                <DashboardWidget
                  key={widget.id}
                  widget={widget}
                  dataSource={dataSource}
                  onUpdate={handleUpdateWidget}
                  onDelete={handleDeleteWidget}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
