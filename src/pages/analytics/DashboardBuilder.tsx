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
  const [availableDataSources, setAvailableDataSources] = useState<DataSource[]>([]);
  const [draggedWidgetType, setDraggedWidgetType] = useState<WidgetType | null>(null);

  useEffect(() => {
    loadDashboard();
    loadDataSources();
  }, [id]);

  const loadDataSources = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('data_sources')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setAvailableDataSources(data as unknown as DataSource[]);
      }
    } catch (error) {
      console.error('Error loading data sources:', error);
    }
  };

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

    // Create widget without data - user will select data source in settings
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: draggedWidgetType,
      x: Math.max(0, x - 150),
      y: Math.max(0, y - 75),
      width: draggedWidgetType === 'table' ? 600 : 300,
      height: draggedWidgetType === 'table' ? 400 : 250,
      config: {
        title: `New ${draggedWidgetType} Widget`,
        value: draggedWidgetType === 'text' ? 'Click settings to configure' : 'Select data source',
      },
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
                  availableDataSources={availableDataSources}
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
