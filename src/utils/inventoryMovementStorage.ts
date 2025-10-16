import { supabase } from '@/integrations/supabase/client';
import { InventoryMovement, MovementType, ReferenceType } from '@/types/inventoryMovement';

export const createInventoryMovement = async (
  itemId: string,
  movementType: MovementType,
  quantity: number,
  unitCost: number,
  referenceId: string,
  referenceType: ReferenceType,
  companyId: string,
  notes?: string
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if movement already exists (prevent duplicates)
    const { data: existing } = await supabase
      .from('inventory_movements')
      .select('id')
      .eq('reference_id', referenceId)
      .eq('reference_type', referenceType)
      .eq('item_id', itemId)
      .eq('movement_type', movementType)
      .maybeSingle();

    if (existing) {
      console.log('Movement already recorded, skipping duplicate');
      return;
    }

    // Create the movement
    const { error: movementError } = await supabase
      .from('inventory_movements')
      .insert({
        item_id: itemId,
        movement_type: movementType,
        quantity,
        unit_cost: unitCost,
        reference_id: referenceId,
        reference_type: referenceType,
        user_id: user.id,
        company_id: companyId,
        notes,
      });

    if (movementError) throw movementError;

    // Update inventory item quantity and cost
    await updateInventoryFromMovement(itemId, movementType, quantity, unitCost);
  } catch (error) {
    console.error('Failed to create inventory movement:', error);
    throw error;
  }
};

const updateInventoryFromMovement = async (
  itemId: string,
  movementType: MovementType,
  quantity: number,
  unitCost: number
): Promise<void> => {
  // Get current inventory
  const { data: item, error: fetchError } = await supabase
    .from('inventory_items')
    .select('quantity, unit_price')
    .eq('id', itemId)
    .single();

  if (fetchError) throw fetchError;

  const currentQty = Number(item.quantity);
  const currentCost = Number(item.unit_price);

  let newQty = currentQty;
  let newCost = currentCost;

  // Calculate new quantity based on movement type
  if (movementType === 'IN' || movementType === 'ADJ_IN' || movementType === 'RETURN_IN') {
    newQty = currentQty + quantity;
    // Weighted average cost
    if (newQty > 0) {
      newCost = ((currentCost * currentQty) + (unitCost * quantity)) / newQty;
    }
  } else if (movementType === 'OUT' || movementType === 'ADJ_OUT' || movementType === 'RETURN_OUT') {
    newQty = currentQty - quantity;
    // Cost remains the same when reducing quantity
  }

  // Update inventory item
  const { error: updateError } = await supabase
    .from('inventory_items')
    .update({
      quantity: newQty,
      unit_price: newCost,
      cost_price: newCost,
      last_cost: unitCost,
    })
    .eq('id', itemId);

  if (updateError) throw updateError;
};

export const getInventoryMovements = async (
  itemId?: string,
  companyId?: string
): Promise<InventoryMovement[]> => {
  try {
    let query = supabase
      .from('inventory_movements')
      .select('*')
      .order('created_at', { ascending: false });

    if (itemId) {
      query = query.eq('item_id', itemId);
    }

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      itemId: row.item_id,
      movementType: row.movement_type as MovementType,
      quantity: Number(row.quantity),
      unitCost: Number(row.unit_cost),
      referenceId: row.reference_id,
      referenceType: row.reference_type as ReferenceType,
      userId: row.user_id,
      companyId: row.company_id,
      notes: row.notes,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('Failed to fetch inventory movements:', error);
    return [];
  }
};

export const getInventoryValuation = async (companyId: string) => {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('id, name, quantity, unit_price, cost_price')
      .eq('company_id', companyId);

    if (error) throw error;

    return (data || []).map(item => ({
      itemId: item.id,
      itemName: item.name,
      currentQty: Number(item.quantity),
      unitCost: Number(item.cost_price || item.unit_price),
      totalValue: Number(item.quantity) * Number(item.cost_price || item.unit_price),
    }));
  } catch (error) {
    console.error('Failed to get inventory valuation:', error);
    return [];
  }
};

