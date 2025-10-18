import { Type, BarChart3, LineChart, PieChart, Table, Hash, TrendingUp, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetType } from '@/types/dashboard';

interface WidgetPaletteProps {
  onDragStart: (type: WidgetType) => void;
}

const widgetTypes = [
  { type: 'text' as WidgetType, icon: Type, label: 'Text Field', color: 'text-blue-500' },
  { type: 'kpi' as WidgetType, icon: TrendingUp, label: 'KPI Card', color: 'text-green-500' },
  { type: 'metric' as WidgetType, icon: Hash, label: 'Metric', color: 'text-purple-500' },
  { type: 'formula' as WidgetType, icon: Calculator, label: 'Formula/Function', color: 'text-amber-500' },
  { type: 'chart-bar' as WidgetType, icon: BarChart3, label: 'Bar Chart', color: 'text-orange-500' },
  { type: 'chart-line' as WidgetType, icon: LineChart, label: 'Line Chart', color: 'text-pink-500' },
  { type: 'chart-pie' as WidgetType, icon: PieChart, label: 'Pie Chart', color: 'text-indigo-500' },
  { type: 'table' as WidgetType, icon: Table, label: 'Data Table', color: 'text-cyan-500' },
];

export function WidgetPalette({ onDragStart }: WidgetPaletteProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Widget Palette</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {widgetTypes.map(({ type, icon: Icon, label, color }) => (
          <div
            key={type}
            draggable
            onDragStart={() => onDragStart(type)}
            className="p-3 border rounded-lg cursor-move hover:border-primary hover:bg-accent transition-colors flex items-center gap-3"
          >
            <Icon className={`h-5 w-5 ${color}`} />
            <span className="text-sm font-medium">{label}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
