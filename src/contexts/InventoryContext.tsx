import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { InventoryItem, InventoryType } from '@/types/inventory';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from './CompanyContext';

interface InventoryContextType {
  inventory: InventoryItem[];
  loading: boolean;
  saveItem: (item: InventoryItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  refreshInventory: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeCompany } = useCompany();

  const loadInventory = async () => {
    try {
      if (!activeCompany) {
        setInventory([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('company_id', activeCompany.id)
        .order('name');

      if (error) throw error;

      const mappedInventory = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        sku: row.sku || '',
        unit: row.unit,
        type: 'consumables' as InventoryType,
        quantity: Number(row.quantity),
        minQuantity: Number(row.reorder_level || 0),
        unitCost: Number(row.cost_price || row.unit_price),
        totalValue: Number(row.quantity) * Number(row.cost_price || row.unit_price),
        supplier: '',
        location: '',
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || new Date().toISOString(),
      }) as InventoryItem);

      setInventory(mappedInventory);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load inventory:', error);
      setInventory([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [activeCompany]);

  const saveItem = async (item: InventoryItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeCompany) throw new Error('User not authenticated or no active company');

      const { error } = await supabase
        .from('inventory_items')
        .upsert({
          id: item.id,
          user_id: user.id,
          company_id: activeCompany.id,
          name: item.name,
          description: item.description,
          sku: item.sku,
          unit: item.unit,
          unit_price: item.unitCost,
          cost_price: item.unitCost,
          quantity: item.quantity,
          reorder_level: item.minQuantity,
          tax_rate: 15,
          is_taxable: true,
        });

      if (error) throw error;
      await loadInventory();
    } catch (error) {
      console.error('Failed to save inventory item:', error);
      throw error;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadInventory();
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
      throw error;
    }
  };

  return (
    <InventoryContext.Provider value={{ inventory, loading, saveItem, deleteItem, refreshInventory: loadInventory }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within InventoryProvider');
  }
  return context;
}
