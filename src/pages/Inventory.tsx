import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Package, Search, Pencil, Trash2, TrendingDown, TrendingUp, AlertTriangle, DollarSign, Boxes, BarChart3 } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { InventoryItem, getInventoryTypesForCompanyType } from '@/types/inventory';
import { useToast } from '@/hooks/use-toast';
import { ContactSelector } from '@/components/ContactSelector';
import { Contact } from '@/types/contacts';
import { useInventory } from '@/contexts/InventoryContext';
import { useCompany } from '@/contexts/CompanyContext';

export default function Inventory() {
  const { toast } = useToast();
  const { activeCompanySettings } = useCompany();
  const { inventory: items, saveItem, deleteItem, refreshInventory } = useInventory();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const availableTypes = getInventoryTypesForCompanyType(activeCompanySettings?.company_type || '');

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

  const handleSubmit = async () => {
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

    try {
      await saveItem(item);
      await refreshInventory();
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
    } catch (error) {
      toast({ title: 'Failed to save item', variant: 'destructive' });
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(id);
        await refreshInventory();
        toast({ title: 'Item deleted successfully' });
      } catch (error) {
        toast({ title: 'Failed to delete item', variant: 'destructive' });
      }
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

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo(() => {
    const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItems = items.filter(item => item.quantity <= item.minQuantity).length;
    
    // Group by type
    const byType = items.reduce((acc, item) => {
      const type = getTypeLabel(item.type);
      if (!acc[type]) {
        acc[type] = { count: 0, value: 0 };
      }
      acc[type].count += 1;
      acc[type].value += item.totalValue;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    // Top items by value
    const topItems = [...items]
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);

    return {
      totalValue,
      totalItems,
      totalQuantity,
      lowStockItems,
      byType,
      topItems,
    };
  }, [items]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              Inventory Management
            </h1>
            <p className="text-muted-foreground mt-1">Track and manage your {getTypeLabel(activeCompanySettings?.company_type || '')} inventory</p>
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
                  <Label htmlFor="unitCost">Unit Cost ({activeCompanySettings?.currency_symbol || 'R'})</Label>
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

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-[var(--shadow-elegant)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCompanySettings?.currency_symbol || 'R'}{dashboardMetrics.totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {dashboardMetrics.totalItems} items
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-elegant)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
              <Boxes className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardMetrics.totalItems}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardMetrics.totalQuantity} units total
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-elegant)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{dashboardMetrics.lowStockItems}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Items need restocking
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-elegant)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Types</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(dashboardMetrics.byType).length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active categories
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory by Type & Top Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="shadow-[var(--shadow-elegant)]">
            <CardHeader>
              <CardTitle className="text-base">Inventory by Type</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(dashboardMetrics.byType).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(dashboardMetrics.byType).map(([type, data]) => (
                    <div key={type} className="flex items-center justify-between pb-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        <span className="font-medium">{type}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{data.count} items</p>
                        <p className="text-xs text-muted-foreground">
                          {activeCompanySettings?.currency_symbol || 'R'}{data.value.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No inventory data</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-elegant)]">
            <CardHeader>
              <CardTitle className="text-base">Top 5 Items by Value</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardMetrics.topItems.length > 0 ? (
                <div className="space-y-3">
                  {dashboardMetrics.topItems.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between pb-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground w-4">#{index + 1}</span>
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity} {item.unit}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{activeCompanySettings?.currency_symbol || 'R'}{item.totalValue.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No items to display</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Inventory Items Table */}
        <Card className="shadow-[var(--shadow-elegant)]">
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No inventory items found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Try adjusting your search' : 'Add your first item to start tracking inventory'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{item.sku}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getTypeLabel(item.type)}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{item.category}</TableCell>
                        <TableCell className="text-right">
                          <div>
                            <p className="font-medium">{item.quantity}</p>
                            <p className="text-xs text-muted-foreground">{item.unit}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {activeCompanySettings?.currency_symbol || 'R'}{item.unitCost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {activeCompanySettings?.currency_symbol || 'R'}{item.totalValue.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {item.quantity <= item.minQuantity ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge variant="default" className="gap-1">
                              <TrendingUp className="h-3 w-3" />
                              In Stock
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
