import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, Search, Pencil, Trash2 } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { loadInventory, saveInventoryItem, deleteInventoryItem } from '@/utils/inventoryStorage';
import { loadSettings } from '@/utils/settingsStorage';
import { InventoryItem, getInventoryTypesForCompanyType } from '@/types/inventory';
import { useToast } from '@/hooks/use-toast';
import { ContactSelector } from '@/components/ContactSelector';
import { Contact } from '@/types/contacts';

export default function Inventory() {
  const { toast } = useToast();
  const settings = loadSettings();
  const [items, setItems] = useState<InventoryItem[]>(loadInventory());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const availableTypes = getInventoryTypesForCompanyType(settings.companyType);

  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    type: availableTypes[0],
    sku: '',
    category: '',
    description: '',
    unit: 'unit',
    quantity: 0,
    minQuantity: 0,
    unitCost: 0,
    supplier: '',
    location: '',
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.type) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const item: InventoryItem = {
      id: editingItem?.id || crypto.randomUUID(),
      name: formData.name!,
      type: formData.type!,
      sku: formData.sku || `SKU-${Date.now()}`,
      category: formData.category || 'General',
      description: formData.description || '',
      unit: formData.unit || 'unit',
      quantity: formData.quantity || 0,
      minQuantity: formData.minQuantity || 0,
      unitCost: formData.unitCost || 0,
      totalValue: (formData.quantity || 0) * (formData.unitCost || 0),
      supplier: formData.supplier,
      location: formData.location,
      lastRestocked: new Date().toISOString(),
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveInventoryItem(item);
    setItems(loadInventory());
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({
      name: '',
      type: availableTypes[0],
      sku: '',
      category: '',
      description: '',
      unit: 'unit',
      quantity: 0,
      minQuantity: 0,
      unitCost: 0,
      supplier: '',
      location: '',
    });
    toast({ title: editingItem ? 'Item updated' : 'Item added successfully' });
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData(item);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteInventoryItem(id);
      setItems(loadInventory());
      toast({ title: 'Item deleted successfully' });
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeLabel = (type: string) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              Inventory
            </h1>
            <p className="text-muted-foreground">Manage your {getTypeLabel(settings.companyType)} inventory</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => { setEditingItem(null); setFormData({ name: '', type: availableTypes[0], sku: '', category: '', description: '', unit: 'unit', quantity: 0, minQuantity: 0, unitCost: 0, supplier: '', location: '' }); }}>
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTypes.map(type => (
                        <SelectItem key={type} value={type}>{getTypeLabel(type)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitCost">Unit Cost ({settings.currencySymbol})</Label>
                  <Input
                    id="unitCost"
                    type="number"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minQuantity">Min Quantity (Alert)</Label>
                  <Input
                    id="minQuantity"
                    type="number"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData({ ...formData, minQuantity: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <ContactSelector
                    type="supplier"
                    value=""
                    onSelect={(contact: Contact) => {
                      setFormData({ ...formData, supplier: contact.name });
                    }}
                    placeholder="Select or add supplier"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, SKU, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No inventory items</h3>
              <p className="text-muted-foreground mb-4">Add your first item to start tracking inventory</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="shadow-[var(--shadow-elegant)] border-border/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <Badge>{getTypeLabel(item.type)}</Badge>
                        {item.quantity <= item.minQuantity && (
                          <Badge variant="destructive">Low Stock</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                        <p><strong>SKU:</strong> {item.sku}</p>
                        <p><strong>Category:</strong> {item.category}</p>
                        <p><strong>Quantity:</strong> {item.quantity} {item.unit}</p>
                        <p><strong>Unit Cost:</strong> {settings.currencySymbol}{item.unitCost.toFixed(2)}</p>
                        {item.supplier && <p><strong>Supplier:</strong> {item.supplier}</p>}
                        {item.location && <p><strong>Location:</strong> {item.location}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">
                        {settings.currencySymbol}{item.totalValue.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Value</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex gap-2 border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
