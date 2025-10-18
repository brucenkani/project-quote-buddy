export type WidgetType = 'text' | 'kpi' | 'chart-bar' | 'chart-line' | 'chart-pie' | 'table' | 'metric' | 'formula';

export interface Widget {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  width: number;
  height: number;
  data_source_id?: string; // Each widget can have its own data source
  config: {
    title?: string;
    value?: string | number;
    data?: any[];
    color?: string;
    dataKey?: string; // Which column to use for values
    xAxisKey?: string; // Which column to use for labels/x-axis
    metric?: string; // Which metric is being displayed
    availableColumns?: string[]; // All available columns from data source
    formulaType?: string; // Type of formula (SUM, COUNT, NPV, etc.)
    formulaParams?: any; // Parameters for the formula
    valueType?: string; // Aggregation type for pie charts (sum, average, count, etc.)
  };
}

export interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  widgets: Widget[];
  data_source_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DataSource {
  id: string;
  name: string;
  file_name: string;
  columns: string[];
  data: any[];
  row_count: number;
  created_at: string;
  updated_at: string;
}
