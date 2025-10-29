import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Plus, FileText, Search, MoreVertical, Trash2 } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { loadPurchaseOrders, savePurchaseOrder, deletePurchaseOrder, generatePONumber } from '@/utils/purchaseOrderStorage';
import { savePurchase, generatePurchaseNumber } from '@/utils/purchaseStorage';
import { useSettings } from '@/contexts/SettingsContext';
import { useInventory } from '@/contexts/InventoryContext';
import { PurchaseOrder, PurchaseOrderLineItem } from '@/types/purchaseOrder';
import { Purchase, PurchaseLineItem } from '@/types/purchase';
import { InventoryType } from '@/types/inventory';
import { useToast } from '@/hooks/use-toast';
import { ContactSelector } from '@/components/ContactSelector';
import { Contact } from '@/types/contacts';
import { recordPurchase } from '@/utils/purchaseDoubleEntry';

export default function PurchaseOrders() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { inventory } = useInventory();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Contact | null>(null);
  const [nextPONumber, setNextPONumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [orderToConvert, setOrderToConvert] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const loadedOrders = await loadPurchaseOrders();
      setOrders(loadedOrders);
      const poNumber = await generatePONumber();
      setNextPONumber(poNumber);
    };
    loadData();
  }, []);

  const [formData, setFormData] = useState<Partial<PurchaseOrder>>({
    poNumber: '',
    vendor: '',
    date: new Date().toISOString().split('T')[0],
    lineItems: [],
    subtotal: 0,
    taxRate: settings.taxRate || 0.15,
    taxAmount: 0,
    discount: 0,
    total: 0,
    status: 'draft',
  });

  useEffect(() => {
    if (nextPONumber && !formData.poNumber) {
      setFormData(prev => ({ ...prev, poNumber: nextPONumber }));
    }
  }, [nextPONumber]);

  const [lineItems, setLineItems] = useState<PurchaseOrderLineItem[]>([]);
  const [currentLineItem, setCurrentLineItem] = useState<Partial<PurchaseOrderLineItem>>({
    description: '',
    quantity: 1,
    unitCost: 0,
    total: 0,
  });

  const handleAddLineItem = () => {
    if (!currentLineItem.description || !currentLineItem.quantity || !currentLineItem.unitCost) {
      toast({ title: 'Please fill in all line item fields', variant: 'destructive' });
      return;
    }

    const item: PurchaseOrderLineItem = {
      id: crypto.randomUUID(),
      description: currentLineItem.description!,
      quantity: currentLineItem.quantity!,
      unitCost: currentLineItem.unitCost!,
      total: currentLineItem.quantity! * currentLineItem.unitCost!,
    };

    const updatedItems = [...lineItems, item];
    setLineItems(updatedItems);
    calculateTotals(updatedItems);

    setCurrentLineItem({
      description: '',
      quantity: 1,
      unitCost: 0,
      total: 0,
    });
  };

  const handleRemoveLineItem = (id: string) => {
    const updatedItems = lineItems.filter(item => item.id !== id);
    setLineItems(updatedItems);
    calculateTotals(updatedItems);
  };

  const calculateTotals = (items: PurchaseOrderLineItem[]) => {
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
    if (isSaving) return; // Prevent duplicate submissions
    
    if (!formData.vendor || lineItems.length === 0) {
      toast({ title: 'Please fill in vendor and at least one line item', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const order: PurchaseOrder = {
        id: editingOrder?.id || crypto.randomUUID(),
        poNumber: formData.poNumber!,
        vendor: formData.vendor!,
        vendorContact: selectedVendor?.email,
        date: formData.date!,
        expectedDelivery: formData.expectedDelivery,
        lineItems,
        subtotal: formData.subtotal!,
        taxRate: formData.taxRate!,
        taxAmount: formData.taxAmount!,
        discount: formData.discount || 0,
        total: formData.total!,
        status: formData.status!,
        notes: formData.notes,
        projectId: formData.projectId,
        terms: formData.terms,
        deliveryAddress: formData.deliveryAddress,
        createdAt: editingOrder?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await savePurchaseOrder(order);
      const updated = await loadPurchaseOrders();
      setOrders(updated);
      toast({ title: editingOrder ? 'Purchase order updated' : 'Purchase order created' });
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save purchase order:', error);
      toast({ title: 'Failed to save purchase order', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvertToPurchase = (order: PurchaseOrder) => {
    if (order.status === 'confirmed') {
      toast({ title: 'This PO has already been converted', variant: 'destructive' });
      return;
    }
    
    setOrderToConvert(order);
    setConvertDialogOpen(true);
  };

  const confirmConversion = async () => {
    if (!orderToConvert) return;

    const purchaseNum = await generatePurchaseNumber();
    const purchase: Purchase = {
      id: crypto.randomUUID(),
      purchaseNumber: purchaseNum,
      vendor: orderToConvert.vendor,
      vendorContact: orderToConvert.vendorContact,
      date: new Date().toISOString().split('T')[0],
      dueDate: orderToConvert.expectedDelivery,
      lineItems: orderToConvert.lineItems.map(item => ({
        ...item,
        receivedQuantity: 0,
        inventoryType: 'raw-materials',
      } as PurchaseLineItem)),
      subtotal: orderToConvert.subtotal,
      taxRate: orderToConvert.taxRate,
      taxAmount: orderToConvert.taxAmount,
      discount: orderToConvert.discount,
      total: orderToConvert.total,
      status: 'pending',
      paymentMethod: 'credit',
      notes: `Converted from PO ${orderToConvert.poNumber}`,
      projectId: orderToConvert.projectId,
      inventoryMethod: 'perpetual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await savePurchase(purchase);

    // Record in accounting
    try {
      recordPurchase(purchase, settings.companyType || 'trading');
    } catch (error) {
      console.error('Failed to record purchase:', error);
    }

    // Update PO status to confirmed
    const updatedOrder = { ...orderToConvert, status: 'confirmed' as const, convertedToPurchaseId: purchase.id, updatedAt: new Date().toISOString() };
    await savePurchaseOrder(updatedOrder);
    const updated = await loadPurchaseOrders();
    setOrders(updated);

    setConvertDialogOpen(false);
    setOrderToConvert(null);
    toast({ title: 'Converted to purchase', description: `Purchase ${purchase.purchaseNumber} created` });
    navigate('/purchases');
  };

  const resetForm = async () => {
    const poNumber = await generatePONumber();
    setFormData({
      poNumber,
      vendor: '',
      date: new Date().toISOString().split('T')[0],
      lineItems: [],
      subtotal: 0,
      taxRate: settings.taxRate || 0.15,
      taxAmount: 0,
      discount: 0,
      total: 0,
      status: 'draft',
    });
    setLineItems([]);
    setEditingOrder(null);
    setSelectedVendor(null);
  };

  const handleEdit = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setFormData(order);
    setLineItems(order.lineItems);
    // Set vendor for ContactSelector
    if (order.vendor) {
      setSelectedVendor({ 
        id: order.vendor, 
        name: order.vendor, 
        email: order.vendorContact || '',
        type: 'supplier' 
      } as Contact);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this purchase order?')) {
      await deletePurchaseOrder(id);
      const updated = await loadPurchaseOrders();
      setOrders(updated);
      toast({ title: 'Purchase order deleted' });
    }
  };

  const handleStatusChange = async (order: PurchaseOrder, status: PurchaseOrder['status']) => {
    const updatedOrder = { ...order, status, updatedAt: new Date().toISOString() };
    await savePurchaseOrder(updatedOrder);
    const updated = await loadPurchaseOrders();
    setOrders(updated);
    toast({ title: `Status updated to ${status}` });
  };

  const filteredOrders = orders.filter(o =>
    o.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.poNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    const variants = {
      draft: 'secondary',
      sent: 'outline',
      approved: 'default',
      rejected: 'destructive',
      confirmed: 'default',
    } as const;
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              Purchase Orders
            </h1>
            <p className="text-muted-foreground mt-1">Manage purchase orders and convert to purchases</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                New Purchase Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>PO Number</Label>
                    <Input
                      value={formData.poNumber}
                      onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
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

                <div>
                  <Label>Expected Delivery</Label>
                  <Input
                    type="date"
                    value={formData.expectedDelivery || ''}
                    onChange={(e) => setFormData({ ...formData, expectedDelivery: e.target.value })}
                  />
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
                  
                  <div className="grid grid-cols-4 gap-2">
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
                  <Label>Terms & Conditions</Label>
                  <Textarea
                    value={formData.terms || ''}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    placeholder="Payment terms, delivery conditions, etc."
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes"
                  />
                </div>

                <Button onClick={handleSubmit} className="w-full" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingOrder ? 'Update Purchase Order' : 'Create Purchase Order'}
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
                  placeholder="Search purchase orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No purchase orders found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.poNumber}</TableCell>
                      <TableCell>{order.vendor}</TableCell>
                      <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                      <TableCell>{settings.currencySymbol}{order.total.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {order.status !== 'confirmed' && (
                              <DropdownMenuItem onClick={() => handleEdit(order)}>
                                Edit
                              </DropdownMenuItem>
                            )}
                            {order.status !== 'confirmed' && (
                              <DropdownMenuItem onClick={() => handleConvertToPurchase(order)}>
                                Convert to Purchase
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDelete(order.id)}
                              className="text-destructive"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to Purchase?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Before converting this Purchase Order to a Purchase, you may want to edit it first to add:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Warehouse/location details</li>
                <li>Inventory item linking</li>
                <li>Payment method and bank account</li>
                <li>Supplier invoice number</li>
                <li>Additional notes or references</li>
              </ul>
              <p className="font-medium pt-2">
                Would you like to convert now or edit the PO first?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setConvertDialogOpen(false);
              setOrderToConvert(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                setConvertDialogOpen(false);
                if (orderToConvert) {
                  handleEdit(orderToConvert);
                }
                setOrderToConvert(null);
              }}
            >
              Edit First
            </Button>
            <AlertDialogAction onClick={confirmConversion}>
              Convert Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
