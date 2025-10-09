import { InventoryItem } from '@/types/inventory';
import { supabase } from '@/integrations/supabase/client';

export const loadInventory = async (): Promise<InventoryItem[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      sku: row.sku || '',
      category: row.category || '',
      unit: row.unit,
      unitPrice: Number(row.unit_price),
      costPrice: row.cost_price ? Number(row.cost_price) : undefined,
      quantity: Number(row.quantity),
      reorderLevel: row.reorder_level ? Number(row.reorder_level) : undefined,
      taxRate: Number(row.tax_rate),
      isTaxable: row.is_taxable,
    }));
  } catch (error) {
    console.error('Failed to load inventory:', error);
    return [];
  }
};

export const saveInventory = async (items: InventoryItem[]): Promise<void> => {
  // Not used anymore - use saveInventoryItem instead
  console.warn('saveInventory is deprecated, use saveInventoryItem instead');
};

export const saveInventoryItem = async (item: InventoryItem): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('inventory_items')
      .upsert({
        id: item.id,
        user_id: user.id,
        name: item.name,
        description: item.description,
        sku: item.sku,
        category: item.category,
        unit: item.unit,
        unit_price: item.unitPrice,
        cost_price: item.costPrice,
        quantity: item.quantity,
        reorder_level: item.reorderLevel,
        tax_rate: item.taxRate,
        is_taxable: item.isTaxable,
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to save inventory item:', error);
    throw error;
  }
};

export const deleteInventoryItem = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete inventory item:', error);
    throw error;
  }
};
