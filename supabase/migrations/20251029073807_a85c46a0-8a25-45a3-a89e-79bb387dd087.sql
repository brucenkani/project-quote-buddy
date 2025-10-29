-- Add serial number tracking to inventory items
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS serial_numbers jsonb DEFAULT '[]'::jsonb;

-- Create index for faster serial number lookups
CREATE INDEX IF NOT EXISTS idx_inventory_items_serial_numbers ON inventory_items USING GIN (serial_numbers);

-- Add comments
COMMENT ON COLUMN inventory_items.serial_numbers IS 'Array of serial numbers for this inventory item at this warehouse';

-- Create a function to check if a serial number exists
CREATE OR REPLACE FUNCTION check_serial_number_exists(
  p_serial_number text,
  p_company_id uuid
)
RETURNS TABLE(
  item_id uuid,
  item_name text,
  item_sku text,
  warehouse_id uuid,
  warehouse_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.name,
    i.sku,
    i.warehouse_id,
    w.name as warehouse_name
  FROM inventory_items i
  LEFT JOIN warehouses w ON i.warehouse_id = w.id
  WHERE i.company_id = p_company_id
    AND i.serial_numbers ? p_serial_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to transfer serial numbers between warehouses
CREATE OR REPLACE FUNCTION transfer_serial_numbers(
  p_serial_numbers text[],
  p_source_warehouse_id uuid,
  p_destination_warehouse_id uuid,
  p_company_id uuid,
  p_user_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb := '{"success": [], "errors": []}'::jsonb;
  v_serial text;
  v_item record;
  v_movement_id uuid;
BEGIN
  FOREACH v_serial IN ARRAY p_serial_numbers
  LOOP
    -- Find the item with this serial number
    SELECT i.id, i.name, i.sku, i.warehouse_id, i.unit_price, i.serial_numbers
    INTO v_item
    FROM inventory_items i
    WHERE i.company_id = p_company_id
      AND i.serial_numbers ? v_serial
      AND i.warehouse_id = p_source_warehouse_id;
    
    IF NOT FOUND THEN
      v_result := jsonb_set(
        v_result,
        '{errors}',
        (v_result->'errors') || jsonb_build_object(
          'serial_number', v_serial,
          'error', 'Serial number not found in source warehouse'
        )
      );
      CONTINUE;
    END IF;
    
    -- Remove serial from source item
    UPDATE inventory_items
    SET serial_numbers = serial_numbers - v_serial,
        quantity = GREATEST(0, quantity - 1),
        updated_at = now()
    WHERE id = v_item.id;
    
    -- Add serial to destination warehouse (same item or create new)
    INSERT INTO inventory_items (
      id, company_id, user_id, name, description, sku, unit,
      unit_price, cost_price, quantity, warehouse_id, serial_numbers,
      tax_rate, is_taxable, created_at, updated_at
    )
    SELECT 
      gen_random_uuid(),
      p_company_id,
      p_user_id,
      v_item.name,
      (SELECT description FROM inventory_items WHERE id = v_item.id),
      v_item.sku,
      (SELECT unit FROM inventory_items WHERE id = v_item.id),
      v_item.unit_price,
      v_item.unit_price,
      1,
      p_destination_warehouse_id,
      jsonb_build_array(v_serial),
      15,
      true,
      now(),
      now()
    WHERE NOT EXISTS (
      SELECT 1 FROM inventory_items
      WHERE company_id = p_company_id
        AND sku = v_item.sku
        AND warehouse_id = p_destination_warehouse_id
    )
    ON CONFLICT DO NOTHING;
    
    -- Update existing item in destination warehouse
    UPDATE inventory_items
    SET serial_numbers = CASE
          WHEN serial_numbers ? v_serial THEN serial_numbers
          ELSE serial_numbers || jsonb_build_array(v_serial)
        END,
        quantity = quantity + 1,
        updated_at = now()
    WHERE company_id = p_company_id
      AND sku = v_item.sku
      AND warehouse_id = p_destination_warehouse_id;
    
    -- Record movement
    v_movement_id := gen_random_uuid();
    INSERT INTO inventory_movements (
      id, item_id, user_id, company_id, movement_type,
      quantity, unit_cost, source_warehouse_id, destination_warehouse_id,
      reference_type, reference_id, notes
    )
    VALUES (
      v_movement_id,
      v_item.id,
      p_user_id,
      p_company_id,
      'warehouse_transfer',
      1,
      v_item.unit_price,
      p_source_warehouse_id,
      p_destination_warehouse_id,
      'warehouse_transfer',
      v_movement_id::text,
      'Serial number transfer: ' || v_serial
    );
    
    v_result := jsonb_set(
      v_result,
      '{success}',
      (v_result->'success') || jsonb_build_object(
        'serial_number', v_serial,
        'item_name', v_item.name,
        'sku', v_item.sku
      )
    );
  END LOOP;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;