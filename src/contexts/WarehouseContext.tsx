import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Warehouse } from '@/types/warehouse';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from './CompanyContext';

interface WarehouseContextType {
  warehouses: Warehouse[];
  loading: boolean;
  saveWarehouse: (warehouse: Warehouse) => Promise<void>;
  deleteWarehouse: (id: string) => Promise<void>;
  refreshWarehouses: () => Promise<void>;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeCompany } = useCompany();

  const loadWarehouses = async () => {
    try {
      if (!activeCompany) {
        setWarehouses([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('company_id', activeCompany.id)
        .order('name');

      if (error) throw error;

      const mappedWarehouses = (data || []).map(row => ({
        id: row.id,
        company_id: row.company_id,
        user_id: row.user_id,
        name: row.name,
        location: row.location || '',
        description: row.description || '',
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }) as Warehouse);

      setWarehouses(mappedWarehouses);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load warehouses:', error);
      setWarehouses([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, [activeCompany]);

  const saveWarehouse = async (warehouse: Warehouse) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeCompany) throw new Error('User not authenticated or no active company');

      const { error } = await supabase
        .from('warehouses')
        .upsert({
          id: warehouse.id,
          user_id: user.id,
          company_id: activeCompany.id,
          name: warehouse.name,
          location: warehouse.location,
          description: warehouse.description,
          is_active: warehouse.is_active,
        });

      if (error) throw error;
      await loadWarehouses();
    } catch (error) {
      console.error('Failed to save warehouse:', error);
      throw error;
    }
  };

  const deleteWarehouse = async (id: string) => {
    try {
      const { error } = await supabase
        .from('warehouses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadWarehouses();
    } catch (error) {
      console.error('Failed to delete warehouse:', error);
      throw error;
    }
  };

  return (
    <WarehouseContext.Provider value={{ warehouses, loading, saveWarehouse, deleteWarehouse, refreshWarehouses: loadWarehouses }}>
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouse() {
  const context = useContext(WarehouseContext);
  if (!context) {
    throw new Error('useWarehouse must be used within WarehouseProvider');
  }
  return context;
}
