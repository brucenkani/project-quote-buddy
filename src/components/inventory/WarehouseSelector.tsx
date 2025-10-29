import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { WarehouseDialog } from './WarehouseDialog';

interface WarehouseSelectorProps {
  value: string;
  onSelect: (warehouseId: string) => void;
  placeholder?: string;
}

export function WarehouseSelector({ value, onSelect, placeholder = 'Select warehouse' }: WarehouseSelectorProps) {
  const { warehouses } = useWarehouse();
  const [showWarehouseDialog, setShowWarehouseDialog] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onSelect}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="bg-background">
            {warehouses.filter(w => w.is_active).map(warehouse => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowWarehouseDialog(true)}
          title="Add new warehouse"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <WarehouseDialog
        open={showWarehouseDialog}
        onOpenChange={setShowWarehouseDialog}
      />
    </>
  );
}
