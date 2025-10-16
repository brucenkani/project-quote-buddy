-- Create inventory movements table for tracking all stock changes
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJ_IN', 'ADJ_OUT', 'RETURN_IN', 'RETURN_OUT')),
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC NOT NULL,
  reference_id TEXT NOT NULL,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('PURCHASE_ORDER', 'PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN')),
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  -- Prevent duplicate movements for the same transaction
  UNIQUE(reference_id, reference_type, item_id, movement_type)
);

-- Enable RLS on inventory_movements
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- RLS policies for inventory_movements
CREATE POLICY "Company members can view inventory movements"
ON public.inventory_movements
FOR SELECT
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can insert inventory movements"
ON public.inventory_movements
FOR INSERT
WITH CHECK (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can update inventory movements"
ON public.inventory_movements
FOR UPDATE
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can delete inventory movements"
ON public.inventory_movements
FOR DELETE
USING (is_company_member(auth.uid(), company_id));

-- Add supplier_invoice_number to purchases table to prevent duplicate invoices
ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS supplier_invoice_number TEXT,
ADD COLUMN IF NOT EXISTS received_date DATE,
ADD COLUMN IF NOT EXISTS invoice_date DATE;

-- Add unique constraint to prevent duplicate supplier invoices per company
CREATE UNIQUE INDEX IF NOT EXISTS unique_supplier_invoice 
ON public.purchases(company_id, supplier_id, supplier_invoice_number) 
WHERE supplier_invoice_number IS NOT NULL;

-- Add received quantities to purchase line items
ALTER TABLE public.purchase_line_items
ADD COLUMN IF NOT EXISTS received_quantity NUMERIC DEFAULT 0;

-- Add status tracking to purchase orders
ALTER TABLE public.purchase_orders
ADD COLUMN IF NOT EXISTS received_date DATE,
ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- Add inventory account tracking
ALTER TABLE public.inventory_items
ADD COLUMN IF NOT EXISTS gl_account_id TEXT,
ADD COLUMN IF NOT EXISTS last_cost NUMERIC;

-- Create index for faster inventory movement queries
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item 
ON public.inventory_movements(item_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference 
ON public.inventory_movements(reference_id, reference_type);

-- Add trigger to update updated_at on inventory_movements
CREATE TRIGGER update_inventory_movements_updated_at
BEFORE UPDATE ON public.inventory_movements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();