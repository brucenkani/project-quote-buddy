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
  widgets: Widget[];
  createdAt: string;
  updatedAt: string;
}
