import { useState } from 'react';
import { Rnd } from 'react-rnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Settings, Plus, X } from 'lucide-react';
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
  
  // Transform array data to objects with column names
  const transformedDataSource = widgetDataSource ? {
    ...widgetDataSource,
    data: widgetDataSource.data.map((row: any) => {
      if (Array.isArray(row)) {
        // Convert array to object using column names
        const obj: any = {};
        widgetDataSource.columns.forEach((col: string, index: number) => {
          obj[col] = row[index];
        });
        return obj;
      }
      return row; // Already an object
    })
  } : undefined;

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
        const textFontSize = Math.max(Math.min(widget.width / 25, 18), 12);
        return isEditing ? (
          <Input
            value={widget.config.value as string || ''}
            onChange={(e) => onUpdate({ ...widget, config: { ...widget.config, value: e.target.value } })}
            placeholder="Enter text..."
            onBlur={() => setIsEditing(false)}
            autoFocus
            style={{ fontSize: `${textFontSize}px` }}
          />
        ) : (
          <p 
            className="text-muted-foreground break-words" 
            onClick={() => setIsEditing(true)}
            style={{ fontSize: `${textFontSize}px` }}
          >
            {widget.config.value || 'Click to edit text'}
          </p>
        );

      case 'kpi':
        const kpiSize = Math.min(widget.width, widget.height);
        const kpiFontSize = Math.max(Math.min(kpiSize / 6, 56), 24);
        return (
          <div className="text-center h-full flex flex-col justify-center">
            <div className="font-bold text-primary" style={{ fontSize: `${kpiFontSize}px` }}>
              {widget.config.value || '0'}
            </div>
            <p className="text-sm text-muted-foreground mt-2">{widget.config.title || 'KPI Value'}</p>
          </div>
        );

      case 'metric':
        const metricFontSize = Math.max(Math.min(widget.width / 12, 32), 16);
        return (
          <div className="flex items-center justify-between h-full px-2">
            <span className="text-sm font-medium">{widget.config.title || 'Metric'}</span>
            <span className="font-bold" style={{ fontSize: `${metricFontSize}px` }}>
              {widget.config.value || '0'}
            </span>
          </div>
        );

      case 'formula':
        const widgetData = transformedDataSource?.data || [];
        const formulaColumn = widget.config.dataKey || '';
        const formulaType = widget.config.formulaType || 'SUM';
        const result = widgetData.length > 0 && formulaColumn 
          ? calculateFormula(formulaType, widgetData, formulaColumn, widget.config.formulaParams)
          : 0;
        
        const formulaSize = Math.min(widget.width, widget.height);
        const formulaFontSize = Math.max(Math.min(formulaSize / 6, 56), 24);
        
        return (
          <div className="text-center h-full flex flex-col justify-center">
            <div className="text-xs text-muted-foreground mb-2">{formulaType}</div>
            <div className="font-bold text-primary" style={{ fontSize: `${formulaFontSize}px` }}>
              {formatFormulaResult(result, formulaType)}
            </div>
            <p className="text-xs text-muted-foreground mt-2 truncate px-2">{formulaColumn || 'Select column'}</p>
          </div>
        );

      case 'chart-bar':
        const rawBarData = transformedDataSource?.data || widget.config.data || [];
        const barXKey = widget.config.xAxisKey || 'name';
        const barYKey = widget.config.dataKey || 'value';
        const barValueType = widget.config.valueType || 'count';
        
        // Group data by category column and aggregate based on valueType
        const barData = barXKey && rawBarData.length > 0 ? (() => {
          const groups: { [key: string]: number[] } = {};
          
          rawBarData.forEach((row: any) => {
            const categoryValue = String(row[barXKey] || 'Unknown');
            const numericValue = barYKey ? (Number(row[barYKey]) || 0) : 1;
            
            if (!groups[categoryValue]) {
              groups[categoryValue] = [];
            }
            groups[categoryValue].push(numericValue);
          });
          
          const allValues = Object.values(groups).flat();
          const totalCount = allValues.length;
          
          return Object.entries(groups).map(([category, values]) => {
            let calculatedValue = 0;
            
            switch (barValueType) {
              case 'sum':
                calculatedValue = values.reduce((sum, val) => sum + val, 0);
                break;
              case 'average':
                calculatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
                break;
              case 'count':
                calculatedValue = values.length;
                break;
              case 'minimum':
                calculatedValue = Math.min(...values);
                break;
              case 'maximum':
                calculatedValue = Math.max(...values);
                break;
              case 'percentage':
                calculatedValue = totalCount > 0 ? (values.length / totalCount) * 100 : 0;
                break;
              default:
                calculatedValue = values.length;
            }
            
            return {
              [barXKey]: category,
              [barYKey]: Math.round(calculatedValue * 100) / 100
            };
          });
        })() : [];
        
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
        const rawLineData = transformedDataSource?.data || widget.config.data || [];
        const lineXKey = widget.config.xAxisKey || 'name';
        const lineYKey = widget.config.dataKey || 'value';
        const lineValueType = widget.config.valueType || 'count';
        
        // Group data by category column and aggregate based on valueType
        const lineData = lineXKey && rawLineData.length > 0 ? (() => {
          const groups: { [key: string]: number[] } = {};
          
          rawLineData.forEach((row: any) => {
            const categoryValue = String(row[lineXKey] || 'Unknown');
            const numericValue = lineYKey ? (Number(row[lineYKey]) || 0) : 1;
            
            if (!groups[categoryValue]) {
              groups[categoryValue] = [];
            }
            groups[categoryValue].push(numericValue);
          });
          
          const allValues = Object.values(groups).flat();
          const totalCount = allValues.length;
          
          return Object.entries(groups).map(([category, values]) => {
            let calculatedValue = 0;
            
            switch (lineValueType) {
              case 'sum':
                calculatedValue = values.reduce((sum, val) => sum + val, 0);
                break;
              case 'average':
                calculatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
                break;
              case 'count':
                calculatedValue = values.length;
                break;
              case 'minimum':
                calculatedValue = Math.min(...values);
                break;
              case 'maximum':
                calculatedValue = Math.max(...values);
                break;
              case 'percentage':
                calculatedValue = totalCount > 0 ? (values.length / totalCount) * 100 : 0;
                break;
              default:
                calculatedValue = values.length;
            }
            
            return {
              [lineXKey]: category,
              [lineYKey]: Math.round(calculatedValue * 100) / 100
            };
          });
        })() : [];
        
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
        const rawPieData = transformedDataSource?.data || widget.config.data || [];
        const pieNameKey = widget.config.xAxisKey || 'name';
        const pieValueKey = widget.config.dataKey || 'value';
        const pieValueType = widget.config.valueType || 'count';
        
        // Group data by category column and aggregate based on valueType
        const groupedData = pieNameKey && rawPieData.length > 0 ? (() => {
          const groups: { [key: string]: number[] } = {};
          
          rawPieData.forEach((row: any) => {
            const categoryValue = String(row[pieNameKey] || 'Unknown');
            const numericValue = pieValueKey ? (Number(row[pieValueKey]) || 0) : 1;
            
            if (!groups[categoryValue]) {
              groups[categoryValue] = [];
            }
            groups[categoryValue].push(numericValue);
          });
          
          // Calculate total for percentage
          const allValues = Object.values(groups).flat();
          const grandTotal = allValues.reduce((sum, val) => sum + val, 0);
          const totalCount = allValues.length;
          
          return Object.entries(groups).map(([category, values]) => {
            let calculatedValue = 0;
            
            switch (pieValueType) {
              case 'sum':
                calculatedValue = values.reduce((sum, val) => sum + val, 0);
                break;
              case 'average':
                calculatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
                break;
              case 'count':
                calculatedValue = values.length;
                break;
              case 'minimum':
                calculatedValue = Math.min(...values);
                break;
              case 'maximum':
                calculatedValue = Math.max(...values);
                break;
              case 'percentage':
                // Calculate percentage based on count
                calculatedValue = totalCount > 0 ? (values.length / totalCount) * 100 : 0;
                break;
              default:
                calculatedValue = values.length;
            }
            
            return {
              name: category,
              value: Math.round(calculatedValue * 100) / 100
            };
          });
        })() : [];
        
        const pieRadius = Math.min(widget.width, widget.height) * 0.25;
        
        return groupedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={groupedData} 
                cx="50%" 
                cy="50%" 
                outerRadius={pieRadius} 
                dataKey="value"
                nameKey="name"
                label={(entry) => {
                  const value = entry.value;
                  return pieValueType === 'percentage' ? `${value.toFixed(1)}%` : value.toFixed(0);
                }}
              >
                {groupedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => {
                  return pieValueType === 'percentage' ? `${Number(value).toFixed(1)}%` : Number(value).toFixed(0);
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Configure data source and columns in settings
          </div>
        );

      case 'table':
        const rawTableData = transformedDataSource?.data || widget.config.data || [];
        const labelColumn = widget.config.xAxisKey;
        const valueColumn = widget.config.dataKey;
        const valueType = widget.config.valueType || 'sum';
        const tableFontSize = Math.max(Math.min(widget.width / 60, 14), 10);
        const maxRows = Math.floor((widget.height - 80) / (tableFontSize * 2.5));
        
        // If both label and value columns are selected, create pivot table
        let tableData = rawTableData;
        let tableColumns = widget.config.availableColumns || Object.keys(rawTableData[0] || {});
        
        if (labelColumn && valueColumn && rawTableData.length > 0) {
          // Group by label column and aggregate value column
          const grouped = rawTableData.reduce((acc: any, row: any) => {
            const label = String(row[labelColumn] || 'Unknown');
            const value = parseFloat(row[valueColumn]) || 0;
            
            if (!acc[label]) {
              acc[label] = { label, values: [] };
            }
            acc[label].values.push(value);
            return acc;
          }, {});
          
          // Calculate aggregated values
          tableData = Object.values(grouped).map((group: any) => {
            let aggregatedValue = 0;
            const values = group.values;
            
            switch (valueType) {
              case 'sum':
                aggregatedValue = values.reduce((sum: number, v: number) => sum + v, 0);
                break;
              case 'average':
                aggregatedValue = values.reduce((sum: number, v: number) => sum + v, 0) / values.length;
                break;
              case 'count':
                aggregatedValue = values.length;
                break;
              case 'minimum':
                aggregatedValue = Math.min(...values);
                break;
              case 'maximum':
                aggregatedValue = Math.max(...values);
                break;
              default:
                aggregatedValue = values.reduce((sum: number, v: number) => sum + v, 0);
            }
            
            return {
              [labelColumn]: group.label,
              [valueColumn]: aggregatedValue.toFixed(2)
            };
          });
          
          tableColumns = [labelColumn, `${valueColumn} (${valueType})`];
        }
        
        return (
          <div className="overflow-auto h-full" style={{ fontSize: `${tableFontSize}px` }}>
            <table className="w-full">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b">
                  {tableColumns.map((col) => (
                    <th key={col} className="text-left p-2 font-semibold">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.slice(0, maxRows).map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    {tableColumns.map((col) => {
                      const actualCol = col.includes('(') ? col.split(' (')[0] : col;
                      return (
                        <td key={col} className="p-2">{row[actualCol] ?? row[col]}</td>
                      );
                    })}
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
      const isIFSFormula = ['SUMIFS', 'COUNTIFS', 'AVERAGEIFS'].includes(formulaType);
      
      return (
        <>
          <div className="space-y-2">
            <Label>Formula Type</Label>
            <Select
              value={formulaType}
              onValueChange={(value) => {
                const newParams = ['SUMIFS', 'COUNTIFS', 'AVERAGEIFS'].includes(value)
                  ? { criteria: [{ column: '', value: '' }] }
                  : {};
                onUpdate({ 
                  ...widget, 
                  config: { ...widget.config, formulaType: value, formulaParams: newParams } 
                });
              }}
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

          {isIFSFormula ? (
            <>
              <div className="space-y-2">
                <Label>
                  {formulaType === 'SUMIFS' ? 'Sum Range' : 
                   formulaType === 'COUNTIFS' ? 'Count Range' : 'Average Range'}
                </Label>
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
              
              {/* Multiple Criteria Builder */}
              <div className="space-y-3 border-t pt-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Criteria (all must match)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentCriteria = widget.config.formulaParams?.criteria || [];
                      onUpdate({ 
                        ...widget, 
                        config: { 
                          ...widget.config, 
                          formulaParams: { 
                            ...widget.config.formulaParams,
                            criteria: [...currentCriteria, { column: '', value: '' }]
                          }
                        } 
                      });
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Criteria
                  </Button>
                </div>
                
                {(widget.config.formulaParams?.criteria || []).map((criterion: any, index: number) => (
                  <div key={index} className="flex gap-2 items-start p-3 border rounded-lg bg-muted/30">
                    <div className="flex-1 space-y-2">
                      <div>
                        <Label className="text-xs">Column {index + 1}</Label>
                        <Select
                          value={criterion.column || ''}
                          onValueChange={(value) => {
                            const updatedCriteria = [...(widget.config.formulaParams?.criteria || [])];
                            updatedCriteria[index] = { ...updatedCriteria[index], column: value };
                            onUpdate({ 
                              ...widget, 
                              config: { 
                                ...widget.config, 
                                formulaParams: { 
                                  ...widget.config.formulaParams,
                                  criteria: updatedCriteria
                                }
                              } 
                            });
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {columns.map((col) => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-xs">Value {index + 1}</Label>
                        <Input
                          className="h-8"
                          value={criterion.value || ''}
                          onChange={(e) => {
                            const updatedCriteria = [...(widget.config.formulaParams?.criteria || [])];
                            updatedCriteria[index] = { ...updatedCriteria[index], value: e.target.value };
                            onUpdate({ 
                              ...widget, 
                              config: { 
                                ...widget.config, 
                                formulaParams: { 
                                  ...widget.config.formulaParams,
                                  criteria: updatedCriteria
                                }
                              } 
                            });
                          }}
                          placeholder="e.g., >100, >=50, =Active, Product"
                        />
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-5"
                      onClick={() => {
                        const updatedCriteria = (widget.config.formulaParams?.criteria || []).filter((_: any, i: number) => i !== index);
                        onUpdate({ 
                          ...widget, 
                          config: { 
                            ...widget.config, 
                            formulaParams: { 
                              ...widget.config.formulaParams,
                              criteria: updatedCriteria
                            }
                          } 
                        });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {(!widget.config.formulaParams?.criteria || widget.config.formulaParams.criteria.length === 0) && (
                  <p className="text-xs text-muted-foreground italic">Click "Add Criteria" to add conditions</p>
                )}
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

    // Chart-specific settings
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
          
          {(widget.type === 'chart-pie' || widget.type === 'table') && (
            <div className="space-y-2">
              <Label>Value Type</Label>
              <Select
                value={widget.config.valueType || (widget.type === 'table' ? 'sum' : 'count')}
                onValueChange={(value) => onUpdate({ 
                  ...widget, 
                  config: { ...widget.config, valueType: value } 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select aggregation type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sum">Sum</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="minimum">Minimum</SelectItem>
                  <SelectItem value="maximum">Maximum</SelectItem>
                  {widget.type === 'chart-pie' && <SelectItem value="percentage">Percentage (%)</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          )}
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
          <CardTitle className="text-sm flex-1 cursor-pointer" onClick={() => setIsEditing(true)}>
            {isEditing ? (
              <Input
                value={widget.config.title || ''}
                onChange={(e) => onUpdate({ ...widget, config: { ...widget.config, title: e.target.value } })}
                onBlur={() => setIsEditing(false)}
                placeholder="Widget title..."
                className="h-6 text-sm"
                autoFocus
              />
            ) : (
              <span>{widget.config.title || 'Untitled Widget'}</span>
            )}
          </CardTitle>
          <div className="flex gap-1">
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>Widget Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 overflow-y-auto flex-1">
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
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowSettings(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setShowSettings(false)}>
                    OK
                  </Button>
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
