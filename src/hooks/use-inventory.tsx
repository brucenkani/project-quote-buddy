import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { InventoryItem } from '@/types/inventory';
import { loadInventory, saveInventoryItem as saveItemToDb, deleteInventoryItem as deleteItemFromDb } from '@/utils/inventoryStorage';

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

  const refreshInventory = async () => {
    setLoading(true);
    const data = await loadInventory();
    setInventory(data);
    setLoading(false);
  };

  useEffect(() => {
    refreshInventory();
  }, []);

  const saveItem = async (item: InventoryItem) => {
    await saveItemToDb(item);
    await refreshInventory();
  };

  const deleteItem = async (id: string) => {
    await deleteItemFromDb(id);
    await refreshInventory();
  };

  return (
    <InventoryContext.Provider value={{ inventory, loading, saveItem, deleteItem, refreshInventory }}>
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
