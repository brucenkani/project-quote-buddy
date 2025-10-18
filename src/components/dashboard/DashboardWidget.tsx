import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Settings } from 'lucide-react';
import { Widget, DataSource } from '@/types/dashboard';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface DashboardWidgetProps {
  widget: Widget;
  dataSource?: DataSource | null;
  onUpdate: (widget: Widget) => void;
  onDelete: (id: string) => void;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function DashboardWidget({ widget, dataSource, onUpdate, onDelete }: DashboardWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
        const barData = widget.config.data || [];
        const barXKey = widget.config.xAxisKey || 'name';
        const barYKey = widget.config.dataKey || 'value';
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey={barXKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={barYKey} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'chart-line':
        const lineData = widget.config.data || [];
        const lineXKey = widget.config.xAxisKey || 'name';
        const lineYKey = widget.config.dataKey || 'value';
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <XAxis dataKey={lineXKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={lineYKey} stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'chart-pie':
        const pieData = widget.config.data || [];
        const pieNameKey = widget.config.xAxisKey || 'name';
        const pieValueKey = widget.config.dataKey || 'value';
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={60} dataKey={pieValueKey} nameKey={pieNameKey} label>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'table':
        const tableData = widget.config.data || [];
        const tableColumns = widget.config.availableColumns || Object.keys(tableData[0] || {});
        return (
          <div className="overflow-auto h-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {tableColumns.map((col) => (
                    <th key={col} className="text-left p-2">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => (
                  <tr key={idx} className="border-b">
                    {tableColumns.map((col) => (
                      <td key={col} className="p-2">{row[col]}</td>
                    ))}
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
            {widget.config.availableColumns && widget.config.availableColumns.length > 0 && (
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Widget Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Widget Title</Label>
                      <Input
                        value={widget.config.title || ''}
                        onChange={(e) => onUpdate({ ...widget, config: { ...widget.config, title: e.target.value } })}
                        placeholder="Enter title..."
                      />
                    </div>
                    {(widget.type.startsWith('chart-') || widget.type === 'table') && (
                      <>
                        <div className="space-y-2">
                          <Label>Label/Category Column</Label>
                          <Select
                            value={widget.config.xAxisKey || ''}
                            onValueChange={(value) => onUpdate({ 
                              ...widget, 
                              config: { ...widget.config, xAxisKey: value } 
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              {widget.config.availableColumns?.map((col) => (
                                <SelectItem key={col} value={col}>{col}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Value Column</Label>
                          <Select
                            value={widget.config.dataKey || ''}
                            onValueChange={(value) => onUpdate({ 
                              ...widget, 
                              config: { ...widget.config, dataKey: value } 
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              {widget.config.availableColumns?.map((col) => (
                                <SelectItem key={col} value={col}>{col}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
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
