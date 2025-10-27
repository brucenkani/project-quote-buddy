import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Plus, FileText, Search, Pencil, Trash2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { loadPurchaseOrders, savePurchaseOrder, deletePurchaseOrder, generatePONumber } from '@/utils/purchaseOrderStorage';
import { savePurchase, generatePurchaseNumber } from '@/utils/purchaseStorage';
import { useSettings } from '@/contexts/SettingsContext';
import { useInventory } from '@/contexts/InventoryContext';
import { PurchaseOrder, PurchaseOrderLineItem } from '@/types/purchaseOrder';
import { Purchase, PurchaseLineItem } from '@/types/purchase';
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

  const handleSubmit = () => {
    if (!formData.vendor || lineItems.length === 0) {
      toast({ title: 'Please provide vendor and at least one line item', variant: 'destructive' });
      return;
    }

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
  };

  const handleConvertToPurchase = async (order: PurchaseOrder) => {
    if (order.status === 'converted') {
      toast({ title: 'This PO has already been converted', variant: 'destructive' });
      return;
    }

    const purchaseNum = await generatePurchaseNumber();
    const purchase: Purchase = {
      id: crypto.randomUUID(),
      purchaseNumber: purchaseNum,
      vendor: order.vendor,
      vendorContact: order.vendorContact,
      date: new Date().toISOString().split('T')[0],
      dueDate: order.expectedDelivery,
      lineItems: order.lineItems.map(item => ({
        ...item,
        receivedQuantity: 0,
      } as PurchaseLineItem)),
      subtotal: order.subtotal,
      taxRate: order.taxRate,
      taxAmount: order.taxAmount,
      discount: order.discount,
      total: order.total,
      status: 'pending',
      notes: `Converted from PO ${order.poNumber}`,
      projectId: order.projectId,
      inventoryMethod: 'perpetual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await savePurchase(purchase);

    // Record in accounting
    try {
      recordPurchase(purchase, settings.companyType || 'LLC');
    } catch (error) {
      console.error('Failed to record purchase:', error);
    }

    // Update PO status
    const updatedOrder = { ...order, status: 'converted' as const, convertedToPurchaseId: purchase.id, updatedAt: new Date().toISOString() };
    await savePurchaseOrder(updatedOrder);
    const updated = await loadPurchaseOrders();
    setOrders(updated);

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
      converted: 'default',
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Expected Delivery</Label>
                    <Input
                      type="date"
                      value={formData.expectedDelivery || ''}
                      onChange={(e) => setFormData({ ...formData, expectedDelivery: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: PurchaseOrder['status']) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
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

                <Button onClick={handleSubmit} className="w-full">
                  {editingOrder ? 'Update Purchase Order' : 'Create Purchase Order'}
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
                        <div className="flex gap-2">
                          {order.status !== 'converted' && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(order)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {order.status === 'approved' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleConvertToPurchase(order)}
                                  title="Convert to Purchase"
                                >
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              )}
                              {order.status === 'draft' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStatusChange(order, 'sent')}
                                  title="Mark as Sent"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              {order.status === 'sent' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStatusChange(order, 'approved')}
                                    title="Approve"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStatusChange(order, 'rejected')}
                                    title="Reject"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(order.id)}>
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
