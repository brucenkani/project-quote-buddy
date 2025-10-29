-- Create purchase order line items table
CREATE TABLE IF NOT EXISTS public.purchase_order_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  inventory_item_id TEXT,
  inventory_type TEXT,
  project_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchase_order_line_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own PO line items"
  ON public.purchase_order_line_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_orders
      WHERE purchase_orders.id = purchase_order_line_items.purchase_order_id
      AND purchase_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own PO line items"
  ON public.purchase_order_line_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.purchase_orders
      WHERE purchase_orders.id = purchase_order_line_items.purchase_order_id
      AND purchase_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own PO line items"
  ON public.purchase_order_line_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_orders
      WHERE purchase_orders.id = purchase_order_line_items.purchase_order_id
      AND purchase_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own PO line items"
  ON public.purchase_order_line_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_orders
      WHERE purchase_orders.id = purchase_order_line_items.purchase_order_id
      AND purchase_orders.user_id = auth.uid()
    )
  );