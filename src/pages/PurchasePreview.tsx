import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { loadPurchases } from '@/utils/purchaseStorage';
import { useSettings } from '@/contexts/SettingsContext';
import { ArrowLeft, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PurchasePreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [purchase, setPurchase] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const purchases = await loadPurchases();
      const found = purchases.find(p => p.id === id);
      setPurchase(found);
    };
    loadData();
  }, [id]);

  if (!purchase) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Purchase not found</p>
              <Button onClick={() => navigate('/purchases')} className="mt-4">
                Back to Purchases
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/purchases')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Purchases
          </Button>
          <Button onClick={() => navigate(`/purchase-print/${purchase.id}`)} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Purchase Order</CardTitle>
                <p className="text-muted-foreground mt-1">#{purchase.purchaseNumber}</p>
              </div>
              <Badge variant={purchase.status === 'received' ? 'default' : 'secondary'}>
                {purchase.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">From:</h3>
                <p className="font-bold">{settings.companyName}</p>
                <p className="text-sm text-muted-foreground">{settings.address}</p>
                <p className="text-sm text-muted-foreground">{settings.email}</p>
                <p className="text-sm text-muted-foreground">{settings.phone}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">To:</h3>
                <p className="font-bold">{purchase.vendor}</p>
                {purchase.vendorContact && (
                  <p className="text-sm text-muted-foreground">{purchase.vendorContact}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Purchase Date</p>
                <p className="font-medium">{new Date(purchase.date).toLocaleDateString()}</p>
              </div>
              {purchase.dueDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">{new Date(purchase.dueDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-4">Items</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.lineItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{item.receivedQuantity}</TableCell>
                      <TableCell className="text-right">
                        {settings.currencySymbol}{item.unitCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {settings.currencySymbol}{item.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{settings.currencySymbol}{purchase.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({(purchase.taxRate * 100).toFixed(0)}%):</span>
                <span>{settings.currencySymbol}{purchase.taxAmount.toFixed(2)}</span>
              </div>
              {purchase.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span>-{settings.currencySymbol}{purchase.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span>{settings.currencySymbol}{purchase.total.toFixed(2)}</span>
              </div>
            </div>

            {purchase.notes && (
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{purchase.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
