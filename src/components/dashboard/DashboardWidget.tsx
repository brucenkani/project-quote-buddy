import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Settings } from 'lucide-react';
import { Widget } from '@/types/dashboard';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardWidgetProps {
  widget: Widget;
  onUpdate: (widget: Widget) => void;
  onDelete: (id: string) => void;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function DashboardWidget({ widget, onUpdate, onDelete }: DashboardWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);

  const renderContent = () => {
    switch (widget.type) {
      case 'text':
        return isEditing ? (
          <Input
            value={widget.config.value as string || ''}
            onChange={(e) => onUpdate({ ...widget, config: { ...widget.config, value: e.target.value } })}
            placeholder="Enter text..."
            onBlur={() => setIsEditing(false)}
            autoFocus
          />
        ) : (
          <p className="text-muted-foreground" onClick={() => setIsEditing(true)}>
            {widget.config.value || 'Click to edit text'}
          </p>
        );

      case 'kpi':
        return (
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">{widget.config.value || '0'}</div>
            <p className="text-sm text-muted-foreground mt-2">{widget.config.title || 'KPI Value'}</p>
          </div>
        );

      case 'metric':
        return (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{widget.config.title || 'Metric'}</span>
            <span className="text-2xl font-bold">{widget.config.value || '0'}</span>
          </div>
        );

      case 'chart-bar':
        const barData = widget.config.data || [
          { name: 'A', value: 400 },
          { name: 'B', value: 300 },
          { name: 'C', value: 500 },
        ];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'chart-line':
        const lineData = widget.config.data || [
          { name: 'A', value: 400 },
          { name: 'B', value: 300 },
          { name: 'C', value: 500 },
        ];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'chart-pie':
        const pieData = widget.config.data || [
          { name: 'A', value: 400 },
          { name: 'B', value: 300 },
          { name: 'C', value: 300 },
        ];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'table':
        const tableData = widget.config.data || [
          { col1: 'Row 1', col2: '100' },
          { col1: 'Row 2', col2: '200' },
        ];
        return (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Column 1</th>
                  <th className="text-left p-2">Column 2</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{row.col1}</td>
                    <td className="p-2">{row.col2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return <p>Unknown widget type</p>;
    }
  };

  return (
    <Card
      className="h-full"
      style={{
        position: 'absolute',
        left: `${widget.x}px`,
        top: `${widget.y}px`,
        width: `${widget.width}px`,
        height: `${widget.height}px`,
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            {isEditing ? (
              <Input
                value={widget.config.title || ''}
                onChange={(e) => onUpdate({ ...widget, config: { ...widget.config, title: e.target.value } })}
                placeholder="Widget title..."
                className="h-6 text-sm"
              />
            ) : (
              widget.config.title || 'Untitled Widget'
            )}
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
              <Settings className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(widget.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2" style={{ height: 'calc(100% - 60px)' }}>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
