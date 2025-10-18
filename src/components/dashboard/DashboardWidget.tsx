import { useState } from 'react';
import { Rnd } from 'react-rnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Settings } from 'lucide-react';
import { Widget, DataSource } from '@/types/dashboard';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { calculateFormula, formatFormulaResult, formulaFunctions } from '@/utils/formulaCalculations';

interface DashboardWidgetProps {
  widget: Widget;
  availableDataSources?: DataSource[];
  onUpdate: (widget: Widget) => void;
  onDelete: (id: string) => void;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function DashboardWidget({ widget, availableDataSources = [], onUpdate, onDelete }: DashboardWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Get the data source for this widget
  const widgetDataSource = availableDataSources.find(ds => ds.id === widget.data_source_id);

  const handleDataSourceChange = (dataSourceId: string) => {
    const dataSource = availableDataSources.find(ds => ds.id === dataSourceId);
    if (!dataSource) return;

    const columns = dataSource.columns as string[];
    const data = dataSource.data as any[];

    let updatedConfig = { ...widget.config };

    // Auto-populate data based on widget type
    if (widget.type.startsWith('chart-') || widget.type === 'table') {
      updatedConfig.data = data.slice(0, 50); // Limit rows for performance
      updatedConfig.dataKey = columns[1] || columns[0];
      updatedConfig.xAxisKey = columns[0];
      updatedConfig.availableColumns = columns;
      if (widget.type === 'chart-pie') {
        updatedConfig.metricType = 'count'; // Default to count for pie charts
      }
    } else if (widget.type === 'kpi' || widget.type === 'metric') {
      const numericColumn = columns.find(col => {
        const value = data[0]?.[col];
        return typeof value === 'number' || !isNaN(Number(value));
      }) || columns[1] || columns[0];
      
      const total = data.reduce((sum, row) => {
        const val = Number(row[numericColumn]) || 0;
        return sum + val;
      }, 0);
      
      updatedConfig.value = total;
      updatedConfig.metric = numericColumn;
      updatedConfig.availableColumns = columns;
    } else if (widget.type === 'formula') {
      updatedConfig.availableColumns = columns;
      updatedConfig.formulaType = 'SUM';
      updatedConfig.dataKey = columns[1] || columns[0];
    }

    onUpdate({ 
      ...widget, 
      data_source_id: dataSourceId,
      config: updatedConfig
    });
  };

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

      case 'formula':
        const widgetData = widgetDataSource?.data || [];
        const formulaColumn = widget.config.dataKey || '';
        const formulaType = widget.config.formulaType || 'SUM';
        const result = widgetData.length > 0 && formulaColumn 
          ? calculateFormula(formulaType, widgetData, formulaColumn, widget.config.formulaParams)
          : 0;
        
        return (
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">{formulaType}</div>
            <div className="text-4xl font-bold text-primary">{formatFormulaResult(result, formulaType)}</div>
            <p className="text-sm text-muted-foreground mt-2">{formulaColumn || 'Select column'}</p>
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
        const rawData = widgetDataSource?.data || [];
        const segmentKey = widget.config.xAxisKey || 'name';
        const metricType = widget.config.metricType || 'count';
        const valueColumn = widget.config.dataKey;
        
        // Group data by segment and calculate metrics
        const groupedData = rawData.reduce((acc: any, row: any) => {
          const segment = row[segmentKey] || 'Unknown';
          if (!acc[segment]) {
            acc[segment] = { name: segment, count: 0, sum: 0, values: [] };
          }
          acc[segment].count++;
          if (valueColumn) {
            const val = Number(row[valueColumn]) || 0;
            acc[segment].sum += val;
            acc[segment].values.push(val);
          }
          return acc;
        }, {});
        
        const pieData = Object.values(groupedData).map((item: any) => {
          let value = 0;
          if (metricType === 'count') {
            value = item.count;
          } else if (metricType === 'percentage') {
            value = (item.count / rawData.length) * 100;
          } else if (metricType === 'sum') {
            value = item.sum;
          } else if (metricType === 'average') {
            value = item.values.length > 0 ? item.sum / item.values.length : 0;
          }
          return { ...item, value };
        });
        
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={pieData} 
                cx="50%" 
                cy="50%" 
                outerRadius={60} 
                dataKey="value" 
                nameKey="name" 
                label={(entry) => `${entry.name}: ${metricType === 'percentage' ? entry.value.toFixed(1) + '%' : entry.value.toFixed(2)}`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => metricType === 'percentage' ? `${value.toFixed(1)}%` : value.toFixed(2)} />
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

  const renderWidgetSettings = () => {
    const columns = widget.config.availableColumns || [];
    
    // Formula-specific settings
    if (widget.type === 'formula') {
      const formulaType = widget.config.formulaType || 'SUM';
      const needsMultipleCriteria = ['SUMIFS', 'COUNTIFS', 'AVERAGEIFS'].includes(formulaType);
      
      return (
        <>
          <div className="space-y-2">
            <Label>Formula Type</Label>
            <Select
              value={formulaType}
              onValueChange={(value) => onUpdate({ 
                ...widget, 
                config: { ...widget.config, formulaType: value, formulaParams: {} } 
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select formula" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(formulaFunctions).map(([key, desc]) => (
                  <SelectItem key={key} value={key}>
                    {key} - {desc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsMultipleCriteria ? (
            <>
              <div className="space-y-2">
                <Label>Sum/Count Range</Label>
                <Select
                  value={widget.config.dataKey || ''}
                  onValueChange={(value) => onUpdate({ 
                    ...widget, 
                    config: { ...widget.config, dataKey: value } 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column to sum/count" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Criteria Column 1</Label>
                <Select
                  value={widget.config.formulaParams?.criteriaCol1 || ''}
                  onValueChange={(value) => onUpdate({ 
                    ...widget, 
                    config: { 
                      ...widget.config, 
                      formulaParams: { ...widget.config.formulaParams, criteriaCol1: value } 
                    } 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select criteria column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Criteria Value 1</Label>
                <Input
                  value={widget.config.formulaParams?.criteriaVal1 || ''}
                  onChange={(e) => onUpdate({ 
                    ...widget, 
                    config: { 
                      ...widget.config, 
                      formulaParams: { ...widget.config.formulaParams, criteriaVal1: e.target.value } 
                    } 
                  })}
                  placeholder="Enter criteria value"
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label>Data Column</Label>
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
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {['NPV', 'IRR'].includes(formulaType) && (
            <div className="space-y-2">
              <Label>Discount Rate {formulaType === 'NPV' ? '(%)' : ''}</Label>
              <Input
                type="number"
                step="0.01"
                value={widget.config.formulaParams?.rate || ''}
                onChange={(e) => onUpdate({ 
                  ...widget, 
                  config: { 
                    ...widget.config, 
                    formulaParams: { ...widget.config.formulaParams, rate: parseFloat(e.target.value) || 0 } 
                  } 
                })}
                placeholder="Enter rate (e.g., 10 for 10%)"
              />
            </div>
          )}

          {['PMT', 'PV', 'FV'].includes(formulaType) && (
            <>
              <div className="space-y-2">
                <Label>Interest Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={widget.config.formulaParams?.rate || ''}
                  onChange={(e) => onUpdate({ 
                    ...widget, 
                    config: { 
                      ...widget.config, 
                      formulaParams: { ...widget.config.formulaParams, rate: parseFloat(e.target.value) || 0 } 
                    } 
                  })}
                  placeholder="Enter rate"
                />
              </div>
              <div className="space-y-2">
                <Label>Number of Periods</Label>
                <Input
                  type="number"
                  value={widget.config.formulaParams?.nper || ''}
                  onChange={(e) => onUpdate({ 
                    ...widget, 
                    config: { 
                      ...widget.config, 
                      formulaParams: { ...widget.config.formulaParams, nper: parseInt(e.target.value) || 0 } 
                    } 
                  })}
                  placeholder="Enter number of periods"
                />
              </div>
              {formulaType === 'PMT' && (
                <div className="space-y-2">
                  <Label>Present Value</Label>
                  <Input
                    type="number"
                    value={widget.config.formulaParams?.pv || ''}
                    onChange={(e) => onUpdate({ 
                      ...widget, 
                      config: { 
                        ...widget.config, 
                        formulaParams: { ...widget.config.formulaParams, pv: parseFloat(e.target.value) || 0 } 
                      } 
                    })}
                    placeholder="Enter present value"
                  />
                </div>
              )}
            </>
          )}
        </>
      );
    }

    // Pie chart-specific settings
    if (widget.type === 'chart-pie') {
      return (
        <>
          <div className="space-y-2">
            <Label>Segment By Column</Label>
            <Select
              value={widget.config.xAxisKey || ''}
              onValueChange={(value) => onUpdate({ 
                ...widget, 
                config: { ...widget.config, xAxisKey: value } 
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column to segment" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Value Type</Label>
            <Select
              value={widget.config.metricType || 'count'}
              onValueChange={(value) => onUpdate({ 
                ...widget, 
                config: { ...widget.config, metricType: value } 
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select metric type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="count">Count</SelectItem>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
                <SelectItem value="sum">Sum</SelectItem>
                <SelectItem value="average">Average</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(widget.config.metricType === 'sum' || widget.config.metricType === 'average') && (
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
                  <SelectValue placeholder="Select column to calculate" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      );
    }

    // Other chart-specific settings (bar, line, table)
    if (widget.type.startsWith('chart-') || widget.type === 'table') {
      return (
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
                <SelectValue placeholder="Select column for labels" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
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
                <SelectValue placeholder="Select column for values" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <Rnd
      position={{ x: widget.x, y: widget.y }}
      size={{ width: widget.width, height: widget.height }}
      onDragStop={(e, d) => {
        onUpdate({ ...widget, x: d.x, y: d.y });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        onUpdate({
          ...widget,
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height),
          ...position,
        });
      }}
      minWidth={200}
      minHeight={150}
      bounds="parent"
    >
      <Card className="h-full w-full">
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
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Widget Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Data Source</Label>
                    <Select
                      value={widget.data_source_id || ''}
                      onValueChange={handleDataSourceChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a data source" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDataSources.map((ds) => (
                          <SelectItem key={ds.id} value={ds.id}>
                            {ds.name} ({ds.row_count} rows)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {widget.data_source_id && (
                    <>
                      <div className="space-y-2">
                        <Label>Widget Title</Label>
                        <Input
                          value={widget.config.title || ''}
                          onChange={(e) => onUpdate({ ...widget, config: { ...widget.config, title: e.target.value } })}
                          placeholder="Enter title..."
                        />
                      </div>

                      {widget.type !== 'text' && widget.config.availableColumns && widget.config.availableColumns.length > 0 && (
                        renderWidgetSettings()
                      )}
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
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
    </Rnd>
  );
}
