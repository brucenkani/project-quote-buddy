-- Create warehouses table
CREATE TABLE public.warehouses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

-- Create policies for warehouses
CREATE POLICY "Company members can view warehouses"
ON public.warehouses
FOR SELECT
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can insert warehouses"
ON public.warehouses
FOR INSERT
WITH CHECK (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can update warehouses"
ON public.warehouses
FOR UPDATE
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can delete warehouses"
ON public.warehouses
FOR DELETE
USING (is_company_member(auth.uid(), company_id));

-- Add warehouse_id to inventory_items
ALTER TABLE public.inventory_items
ADD COLUMN warehouse_id UUID;

-- Add warehouse columns to inventory_movements for transfers
ALTER TABLE public.inventory_movements
ADD COLUMN source_warehouse_id UUID,
ADD COLUMN destination_warehouse_id UUID;

-- Create trigger for automatic timestamp updates on warehouses
CREATE TRIGGER update_warehouses_updated_at
BEFORE UPDATE ON public.warehouses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_inventory_items_warehouse_id ON public.inventory_items(warehouse_id);
CREATE INDEX idx_warehouses_company_id ON public.warehouses(company_id);
CREATE INDEX idx_inventory_movements_warehouses ON public.inventory_movements(source_warehouse_id, destination_warehouse_id);