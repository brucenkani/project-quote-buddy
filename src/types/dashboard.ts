export type WidgetType = 'text' | 'kpi' | 'chart-bar' | 'chart-line' | 'chart-pie' | 'table' | 'metric';

export interface Widget {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  width: number;
  height: number;
  config: {
    title?: string;
    value?: string | number;
    data?: any[];
    color?: string;
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
