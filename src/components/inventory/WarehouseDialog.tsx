import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Warehouse } from '@/types/warehouse';
import { useToast } from '@/hooks/use-toast';
import { useWarehouse } from '@/contexts/WarehouseContext';

interface WarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse?: Warehouse | null;
}

export function WarehouseDialog({ open, onOpenChange, warehouse }: WarehouseDialogProps) {
  const { toast } = useToast();
  const { saveWarehouse } = useWarehouse();
  const [formData, setFormData] = useState<Partial<Warehouse>>(
    warehouse || {
      name: '',
      location: '',
      description: '',
      is_active: true,
    }
  );

  const handleSubmit = async () => {
    if (!formData.name) {
      toast({ title: 'Please enter warehouse name', variant: 'destructive' });
      return;
    }

    const warehouseData: Warehouse = {
      id: warehouse?.id || crypto.randomUUID(),
      company_id: warehouse?.company_id || '',
      user_id: warehouse?.user_id || '',
      name: formData.name,
      location: formData.location || '',
      description: formData.description || '',
      is_active: formData.is_active ?? true,
      created_at: warehouse?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await saveWarehouse(warehouseData);
      toast({ title: warehouse ? 'Warehouse updated' : 'Warehouse created successfully' });
      onOpenChange(false);
      setFormData({ name: '', location: '', description: '', is_active: true });
    } catch (error) {
      toast({ title: 'Failed to save warehouse', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{warehouse ? 'Edit Warehouse' : 'Add New Warehouse'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Warehouse Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Main Warehouse"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="123 Storage St, City"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
