import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useInventory } from '@/contexts/InventoryContext';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

interface WarehouseTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WarehouseTransferDialog({ open, onOpenChange }: WarehouseTransferDialogProps) {
  const { toast } = useToast();
  const { warehouses } = useWarehouse();
  const { inventory, refreshInventory } = useInventory();
  const { activeCompany } = useCompany();
  const [formData, setFormData] = useState({
    item_id: '',
    source_warehouse_id: '',
    destination_warehouse_id: '',
    quantity: 0,
    notes: '',
  });

  const handleSubmit = async () => {
    if (!formData.item_id || !formData.source_warehouse_id || !formData.destination_warehouse_id || formData.quantity <= 0) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    if (formData.source_warehouse_id === formData.destination_warehouse_id) {
      toast({ title: 'Source and destination warehouses must be different', variant: 'destructive' });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeCompany) throw new Error('User not authenticated');

      const selectedItem = inventory.find(item => item.id === formData.item_id);
      if (!selectedItem) throw new Error('Item not found');

      // Check if item has enough quantity in source warehouse
      if (selectedItem.quantity < formData.quantity) {
        toast({ title: 'Insufficient quantity in source warehouse', variant: 'destructive' });
        return;
      }

      // Create inventory movement record
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          item_id: formData.item_id,
          user_id: user.id,
          company_id: activeCompany.id,
          movement_type: 'warehouse_transfer',
          quantity: formData.quantity,
          unit_cost: selectedItem.unitCost,
          source_warehouse_id: formData.source_warehouse_id,
          destination_warehouse_id: formData.destination_warehouse_id,
          reference_type: 'warehouse_transfer',
          reference_id: crypto.randomUUID(),
          notes: formData.notes,
        });

      if (movementError) throw movementError;

      await refreshInventory();
      toast({ title: 'Warehouse transfer completed successfully' });
      onOpenChange(false);
      setFormData({ item_id: '', source_warehouse_id: '', destination_warehouse_id: '', quantity: 0, notes: '' });
    } catch (error) {
      console.error('Transfer error:', error);
      toast({ title: 'Failed to complete transfer', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Warehouse Transfer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="item">Item *</Label>
            <Select value={formData.item_id} onValueChange={(value) => setFormData({ ...formData, item_id: value })}>
              <SelectTrigger id="item">
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {inventory.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} ({item.quantity} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="source">From Warehouse *</Label>
            <Select value={formData.source_warehouse_id} onValueChange={(value) => setFormData({ ...formData, source_warehouse_id: value })}>
              <SelectTrigger id="source">
                <SelectValue placeholder="Select source warehouse" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {warehouses.filter(w => w.is_active).map(warehouse => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination">To Warehouse *</Label>
            <Select value={formData.destination_warehouse_id} onValueChange={(value) => setFormData({ ...formData, destination_warehouse_id: value })}>
              <SelectTrigger id="destination">
                <SelectValue placeholder="Select destination warehouse" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {warehouses.filter(w => w.is_active).map(warehouse => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional transfer notes"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Transfer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
