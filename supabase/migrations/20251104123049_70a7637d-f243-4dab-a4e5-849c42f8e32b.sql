-- Add item_type column to inventory_items table to support different inventory types
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS item_type text DEFAULT 'consumables';

-- Update existing records to have the default type
UPDATE inventory_items SET item_type = 'consumables' WHERE item_type IS NULL;