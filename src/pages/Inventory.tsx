import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Package, Search, Pencil, Trash2, TrendingDown, TrendingUp, AlertTriangle, DollarSign, Boxes, BarChart3, Download, FileText, FileSpreadsheet, Warehouse as WarehouseIcon, ArrowRightLeft } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { InventoryItem, getInventoryTypesForCompanyType } from '@/types/inventory';
import { useToast } from '@/hooks/use-toast';
import { ContactSelector } from '@/components/ContactSelector';
import { Contact } from '@/types/contacts';
import { useInventory } from '@/contexts/InventoryContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { exportInventoryToPDF, exportInventoryToExcel } from '@/utils/inventoryExport';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { WarehouseDialog } from '@/components/inventory/WarehouseDialog';
import { WarehouseTransferDialog } from '@/components/inventory/WarehouseTransferDialog';
import { WarehouseSelector } from '@/components/inventory/WarehouseSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryItemDialog } from '@/components/inventory/InventoryItemDialog';

export default function Inventory() {
  const { toast } = useToast();
  const { activeCompanySettings } = useCompany();
  const { inventory: items, saveItem, deleteItem, refreshInventory } = useInventory();
  const { warehouses } = useWarehouse();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);


  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
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
    (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
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

    // Group by warehouse
    const byWarehouse = items.reduce((acc, item) => {
      const warehouseName = item.warehouse_name || 'Unassigned';
      if (!acc[warehouseName]) {
        acc[warehouseName] = { count: 0, value: 0, lowStock: 0 };
      }
      acc[warehouseName].count += 1;
      acc[warehouseName].value += item.totalValue;
      if (item.quantity <= item.minQuantity) {
        acc[warehouseName].lowStock += 1;
      }
      return acc;
    }, {} as Record<string, { count: number; value: number; lowStock: number }>);

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
      byWarehouse,
      topItems,
      totalWarehouses: warehouses.filter(w => w.is_active).length,
    };
  }, [items, warehouses]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              Inventory Management
            </h1>
            <p className="text-muted-foreground mt-1">Track and manage your inventory</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setIsWarehouseDialogOpen(true)}>
              <WarehouseIcon className="h-4 w-4" />
              Manage Warehouses
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setIsTransferDialogOpen(true)}>
              <ArrowRightLeft className="h-4 w-4" />
              Transfer Stock
            </Button>
            <Button className="gap-2" onClick={() => { setEditingItem(null); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        <WarehouseDialog open={isWarehouseDialogOpen} onOpenChange={setIsWarehouseDialogOpen} />
        <WarehouseTransferDialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen} />
        <InventoryItemDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen} 
          item={editingItem}
        />

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-[var(--shadow-elegant)] cursor-pointer hover:shadow-[var(--shadow-glow)] transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Download className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background">
                    <DropdownMenuItem onClick={() => exportInventoryToPDF(items, 'All Inventory', activeCompanySettings?.currency_symbol)} className="gap-2">
                      <FileText className="h-4 w-4" />
                      Export to PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportInventoryToExcel(items, 'All Inventory', activeCompanySettings?.currency_symbol)} className="gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Export to Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCompanySettings?.currency_symbol || 'R'}{dashboardMetrics.totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {dashboardMetrics.totalItems} items
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-elegant)] cursor-pointer hover:shadow-[var(--shadow-glow)] transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Download className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background">
                    <DropdownMenuItem onClick={() => exportInventoryToPDF(items, 'All Inventory', activeCompanySettings?.currency_symbol)} className="gap-2">
                      <FileText className="h-4 w-4" />
                      Export to PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportInventoryToExcel(items, 'All Inventory', activeCompanySettings?.currency_symbol)} className="gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Export to Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Boxes className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardMetrics.totalItems}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardMetrics.totalQuantity} units total
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-elegant)] cursor-pointer hover:shadow-[var(--shadow-glow)] transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Alerts</CardTitle>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Download className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background">
                    <DropdownMenuItem 
                      onClick={() => {
                        const lowStockItems = items.filter(item => item.quantity <= item.minQuantity);
                        exportInventoryToPDF(lowStockItems, 'Low Stock Items', activeCompanySettings?.currency_symbol);
                      }} 
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Export to PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        const lowStockItems = items.filter(item => item.quantity <= item.minQuantity);
                        exportInventoryToExcel(lowStockItems, 'Low Stock Items', activeCompanySettings?.currency_symbol);
                      }} 
                      className="gap-2"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Export to Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{dashboardMetrics.lowStockItems}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Items need restocking
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-elegant)] cursor-pointer hover:shadow-[var(--shadow-glow)] transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Types</CardTitle>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Download className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background">
                    <DropdownMenuItem onClick={() => exportInventoryToPDF(items, 'Inventory by Type', activeCompanySettings?.currency_symbol)} className="gap-2">
                      <FileText className="h-4 w-4" />
                      Export to PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportInventoryToExcel(items, 'Inventory by Type', activeCompanySettings?.currency_symbol)} className="gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Export to Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(dashboardMetrics.byType).length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active categories
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Warehouse KPI Card */}
        <Card className="shadow-[var(--shadow-elegant)] cursor-pointer hover:shadow-[var(--shadow-glow)] transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Warehouses</CardTitle>
            <WarehouseIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardMetrics.totalWarehouses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Managing inventory across locations
            </p>
          </CardContent>
        </Card>

        {/* Inventory by Type & Warehouse Distribution */}
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

          <Card className="shadow-[var(--shadow-elegant)]">
            <CardHeader>
              <CardTitle className="text-base">Inventory by Warehouse</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(dashboardMetrics.byWarehouse).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(dashboardMetrics.byWarehouse).map(([warehouse, data]) => (
                    <div key={warehouse} className="flex items-center justify-between pb-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <WarehouseIcon className="h-4 w-4 text-primary" />
                        <div>
                          <span className="font-medium">{warehouse}</span>
                          {data.lowStock > 0 && (
                            <p className="text-xs text-destructive">{data.lowStock} low stock items</p>
                          )}
                        </div>
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
                <p className="text-sm text-muted-foreground text-center py-4">No warehouse data</p>
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
                      <TableHead>Warehouse</TableHead>
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
                        <TableCell className="text-sm">
                          {item.warehouse_name || 'Unassigned'}
                        </TableCell>
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
