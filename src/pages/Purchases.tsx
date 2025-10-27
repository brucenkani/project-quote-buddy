import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ShoppingCart, Search, Pencil, Trash2, Package, Eye, DollarSign, History } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { loadPurchases, savePurchase, deletePurchase, generatePurchaseNumber } from '@/utils/purchaseStorage';
import { useSettings } from '@/contexts/SettingsContext';
import { useInventory } from '@/contexts/InventoryContext';
import { Purchase, PurchaseLineItem } from '@/types/purchase';
import { useToast } from '@/hooks/use-toast';
import { ContactSelector } from '@/components/ContactSelector';
import { Contact } from '@/types/contacts';
import { recordPurchase } from '@/utils/purchaseDoubleEntry';

export default function Purchases() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { inventory } = useInventory();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Contact | null>(null);

  useEffect(() => {
    const init = async () => {
      const loaded = await loadPurchases();
      setPurchases(loaded);
      const num = await generatePurchaseNumber();
      setFormData(prev => ({ ...prev, purchaseNumber: num }));
    };
    init();
  }, []);

  const [formData, setFormData] = useState<Partial<Purchase>>({
    purchaseNumber: '',
    vendor: '',
    date: new Date().toISOString().split('T')[0],
    lineItems: [],
    subtotal: 0,
    taxRate: settings.taxRate,
    taxAmount: 0,
    discount: 0,
    total: 0,
    status: 'pending',
    inventoryMethod: 'perpetual',
  });

  const [lineItems, setLineItems] = useState<PurchaseLineItem[]>([]);
  const [currentLineItem, setCurrentLineItem] = useState<Partial<PurchaseLineItem>>({
    description: '',
    quantity: 1,
    receivedQuantity: 0,
    unitCost: 0,
    total: 0,
  });

  const handleAddLineItem = () => {
    if (!currentLineItem.description || !currentLineItem.quantity || !currentLineItem.unitCost) {
      toast({ title: 'Please fill in all line item fields', variant: 'destructive' });
      return;
    }

    const item: PurchaseLineItem = {
      id: crypto.randomUUID(),
      description: currentLineItem.description!,
      quantity: currentLineItem.quantity!,
      receivedQuantity: currentLineItem.receivedQuantity || 0,
      unitCost: currentLineItem.unitCost!,
      total: currentLineItem.quantity! * currentLineItem.unitCost!,
      inventoryItemId: currentLineItem.inventoryItemId,
      category: currentLineItem.category,
      projectId: currentLineItem.projectId,
    };

    const updatedItems = [...lineItems, item];
    setLineItems(updatedItems);
    calculateTotals(updatedItems);

    setCurrentLineItem({
      description: '',
      quantity: 1,
      receivedQuantity: 0,
      unitCost: 0,
      total: 0,
    });
  };

  const handleRemoveLineItem = (id: string) => {
    const updatedItems = lineItems.filter(item => item.id !== id);
    setLineItems(updatedItems);
    calculateTotals(updatedItems);
  };

  const calculateTotals = (items: PurchaseLineItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = subtotal * (formData.taxRate || 0);
    const total = subtotal + taxAmount - (formData.discount || 0);

    setFormData(prev => ({
      ...prev,
      lineItems: items,
      subtotal,
      taxAmount,
      total,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.vendor || lineItems.length === 0) {
      toast({ title: 'Please provide vendor and at least one line item', variant: 'destructive' });
      return;
    }

    const purchase: Purchase = {
      id: editingPurchase?.id || crypto.randomUUID(),
      purchaseNumber: formData.purchaseNumber!,
      vendor: formData.vendor!,
      vendorContact: selectedVendor?.email,
      date: formData.date!,
      dueDate: formData.dueDate,
      lineItems,
      subtotal: formData.subtotal!,
      taxRate: formData.taxRate!,
      taxAmount: formData.taxAmount!,
      discount: formData.discount || 0,
      total: formData.total!,
      status: formData.status!,
      notes: formData.notes,
      projectId: formData.projectId,
      inventoryMethod: formData.inventoryMethod!,
      createdAt: editingPurchase?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await savePurchase(purchase);

    // Record double-entry accounting
    try {
      recordPurchase(purchase, settings.companyType);
      toast({ title: editingPurchase ? 'Purchase updated' : 'Purchase created and recorded in journals' });
    } catch (error) {
      toast({ 
        title: 'Purchase saved but accounting entry failed', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    }

    setPurchases(await loadPurchases());
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = async () => {
    const num = await generatePurchaseNumber();
    setFormData({
      purchaseNumber: num,
      vendor: '',
      date: new Date().toISOString().split('T')[0],
      lineItems: [],
      subtotal: 0,
      taxRate: settings.taxRate,
      taxAmount: 0,
      discount: 0,
      total: 0,
      status: 'pending',
      inventoryMethod: 'perpetual',
    });
    setLineItems([]);
    setEditingPurchase(null);
    setSelectedVendor(null);
  };

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setFormData(purchase);
    setLineItems(purchase.lineItems);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this purchase?')) {
      await deletePurchase(id);
      setPurchases(await loadPurchases());
      toast({ title: 'Purchase deleted' });
    }
  };

  const filteredPurchases = purchases.filter(p =>
    p.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Purchase['status']) => {
    const variants = {
      pending: 'secondary',
      received: 'default',
      'partly-received': 'outline',
      cancelled: 'destructive',
    } as const;
    return <Badge variant={variants[status]}>{status.replace('-', ' ').toUpperCase()}</Badge>;
  };

  const getBusinessTypeLabel = () => {
    switch (settings.companyType) {
      case 'trading': return 'Trading Business - Purchases to Inventory';
      case 'contractor': return 'Contractor Business - Purchases to Projects/Inventory';
      case 'manufacturer': return 'Manufacturing Business - Purchases to Raw Materials';
      default: return 'Purchases';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              Purchases
            </h1>
            <p className="text-muted-foreground mt-1">{getBusinessTypeLabel()}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                New Purchase
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPurchase ? 'Edit Purchase' : 'Create Purchase'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Purchase Number</Label>
                    <Input
                      value={formData.purchaseNumber}
                      onChange={(e) => setFormData({ ...formData, purchaseNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Vendor</Label>
                  <ContactSelector
                    type="supplier"
                    value={selectedVendor?.id || ''}
                    onSelect={(contact) => {
                      setSelectedVendor(contact);
                      setFormData({ ...formData, vendor: contact.name });
                    }}
                    placeholder="Select or search vendor"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Inventory Method</Label>
                    <Select
                      value={formData.inventoryMethod}
                      onValueChange={(value: 'perpetual' | 'periodic') =>
                        setFormData({ ...formData, inventoryMethod: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="perpetual">Perpetual</SelectItem>
                        <SelectItem value="periodic">Periodic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: Purchase['status']) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="partly-received">Partly Received</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {settings.companyType === 'contractor' && (
                  <div>
                    <Label>Project ID (Optional)</Label>
                    <Input
                      value={formData.projectId || ''}
                      onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                      placeholder="Link to specific project"
                    />
                  </div>
                )}

                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold">Line Items</h3>
                  
                  <div className="grid grid-cols-5 gap-2">
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={currentLineItem.description}
                        onChange={(e) => setCurrentLineItem({ ...currentLineItem, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={currentLineItem.quantity}
                        onChange={(e) => setCurrentLineItem({ ...currentLineItem, quantity: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Unit Cost</Label>
                      <Input
                        type="number"
                        value={currentLineItem.unitCost}
                        onChange={(e) => setCurrentLineItem({ ...currentLineItem, unitCost: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Link to Inventory</Label>
                      <Select
                        value={currentLineItem.inventoryItemId || ''}
                        onValueChange={(value) => setCurrentLineItem({ ...currentLineItem, inventoryItemId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventory.map(item => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleAddLineItem} className="w-full">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {lineItems.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Unit Cost</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineItems.map(item => (
                          <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{settings.currencySymbol}{item.unitCost.toFixed(2)}</TableCell>
                            <TableCell>{settings.currencySymbol}{item.total.toFixed(2)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveLineItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{settings.currencySymbol}{formData.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({(formData.taxRate! * 100).toFixed(0)}%):</span>
                    <span>{settings.currencySymbol}{formData.taxAmount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{settings.currencySymbol}{formData.total?.toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Input
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes"
                  />
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {editingPurchase ? 'Update Purchase' : 'Create Purchase'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search purchases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredPurchases.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
                <p className="text-muted-foreground">Create your first purchase to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purchase #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map(purchase => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">{purchase.purchaseNumber}</TableCell>
                      <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                      <TableCell>{purchase.vendor}</TableCell>
                      <TableCell>{purchase.lineItems.length} items</TableCell>
                      <TableCell>{settings.currencySymbol}{purchase.total.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{purchase.inventoryMethod}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate(`/purchase-preview/${purchase.id}`)}
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate(`/purchase-payment/${purchase.id}`)}
                            title="Payment"
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate(`/purchase-history/${purchase.id}`)}
                            title="History"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(purchase)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(purchase.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
