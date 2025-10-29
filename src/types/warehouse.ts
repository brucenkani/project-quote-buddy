export interface Warehouse {
  id: string;
  company_id: string;
  user_id: string;
  name: string;
  location?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WarehouseStock {
  warehouse_id: string;
  warehouse_name: string;
  item_count: number;
  total_value: number;
  low_stock_items: number;
}

export interface WarehouseTransfer {
  id: string;
  item_id: string;
  item_name: string;
  source_warehouse_id: string;
  source_warehouse_name: string;
  destination_warehouse_id: string;
  destination_warehouse_name: string;
  quantity: number;
  transfer_date: string;
  notes?: string;
}
