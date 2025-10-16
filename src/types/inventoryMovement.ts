export type MovementType = 'IN' | 'OUT' | 'ADJ_IN' | 'ADJ_OUT' | 'RETURN_IN' | 'RETURN_OUT';
export type ReferenceType = 'PURCHASE_ORDER' | 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN';

export interface InventoryMovement {
  id: string;
  itemId: string;
  movementType: MovementType;
  quantity: number;
  unitCost: number;
  referenceId: string;
  referenceType: ReferenceType;
  userId: string;
  companyId: string;
  notes?: string;
  createdAt: string;
}
