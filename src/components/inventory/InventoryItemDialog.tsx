import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryItem, InventoryType } from '@/types/inventory';
import { useToast } from '@/hooks/use-toast';
import { useInventory } from '@/contexts/InventoryContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { Plus } from 'lucide-react';
import { WarehouseDialog } from './WarehouseDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface InventoryItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItem | null;
  onItemCreated?: (item: InventoryItem) => void;
}

export function InventoryItemDialog({ open, onOpenChange, item, onItemCreated }: InventoryItemDialogProps) {
  const { toast } = useToast();
  const { saveItem, refreshInventory } = useInventory();
  const { warehouses, refreshWarehouses } = useWarehouse();
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    type: 'raw-materials',
    sku: '',
    description: '',
    unit: 'unit',
    quantity: 0,
    minQuantity: 0,
    unitCost: 0,
    supplier: '',
    location: '',
    warehouse_id: '',
  });

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        name: '',
        type: 'raw-materials',
        sku: '',
        description: '',
        unit: 'unit',
        quantity: 0,
        minQuantity: 0,
        unitCost: 0,
        supplier: '',
        location: '',
        warehouse_id: '',
      });
    }
  }, [item, open]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.type) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const inventoryItem: InventoryItem = {
      id: item?.id || crypto.randomUUID(),
      name: formData.name!,
      type: formData.type!,
      sku: formData.sku || `SKU-${Date.now()}`,
      description: formData.description || '',
      unit: formData.unit || 'unit',
      quantity: item ? formData.quantity || 0 : 0, // Always 0 for new items, preserve for edits
      minQuantity: formData.minQuantity || 0,
      unitCost: formData.unitCost || 0,
      totalValue: item ? (formData.quantity || 0) * (formData.unitCost || 0) : 0,
      supplier: formData.supplier,
      location: formData.location,
      warehouse_id: formData.warehouse_id || undefined,
      lastRestocked: new Date().toISOString(),
      createdAt: item?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveItem(inventoryItem);
      await refreshInventory();
      onOpenChange(false);
      toast({ title: item ? 'Item updated' : 'Item added successfully' });
      
      // Call the callback if provided (for integration with purchases)
      if (!item && onItemCreated) {
        onItemCreated(inventoryItem);
      }
    } catch (error) {
      toast({ title: 'Failed to save item', variant: 'destructive' });
    }
  };

  const handleWarehouseCreated = async () => {
    await refreshWarehouses();
    setIsWarehouseDialogOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{item ? 'Edit Inventory Item' : 'Create New Inventory Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter item name"
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Auto-generated if empty"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Inventory Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: InventoryType) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw-materials">Raw Materials</SelectItem>
                    <SelectItem value="work-in-progress">Work in Progress</SelectItem>
                    <SelectItem value="consumables">Consumables</SelectItem>
                    <SelectItem value="finished-products">Finished Products</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="warehouse">Warehouse</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.warehouse_id}
                    onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}
                  >
                    <SelectTrigger id="warehouse" className="flex-1">
                      <SelectValue placeholder="Select warehouse (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(warehouse => (
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
                    onClick={() => setIsWarehouseDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit">Unit of Measure</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit">Unit</SelectItem>
                    <SelectItem value="kg">Kilogram (kg)</SelectItem>
                    <SelectItem value="g">Gram (g)</SelectItem>
                    <SelectItem value="l">Liter (l)</SelectItem>
                    <SelectItem value="ml">Milliliter (ml)</SelectItem>
                    <SelectItem value="m">Meter (m)</SelectItem>
                    <SelectItem value="cm">Centimeter (cm)</SelectItem>
                    <SelectItem value="piece">Piece</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="pack">Pack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="minQuantity">Minimum Quantity</Label>
                <Input
                  id="minQuantity"
                  type="number"
                  value={formData.minQuantity}
                  onChange={(e) => setFormData({ ...formData, minQuantity: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unitCost">Unit Cost</Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Label htmlFor="quantity">Current Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={formData.quantity}
                          disabled
                          className="bg-muted cursor-not-allowed"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Quantity is managed through purchases (IN) and invoices (OUT)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Supplier name (optional)"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Storage location (optional)"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <WarehouseDialog
        open={isWarehouseDialogOpen}
        onOpenChange={(open) => {
          setIsWarehouseDialogOpen(open);
          if (!open) handleWarehouseCreated();
        }}
      />
    </>
  );
}
