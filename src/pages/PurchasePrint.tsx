import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { loadPurchases } from '@/utils/purchaseStorage';
import { useSettings } from '@/contexts/SettingsContext';
import { ArrowLeft } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PurchasePrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [purchase, setPurchase] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const purchases = await loadPurchases();
      const found = purchases.find(p => p.id === id);
      setPurchase(found);
      
      if (found) {
        const timer = setTimeout(() => {
          window.print();
        }, 500);
        return () => clearTimeout(timer);
      }
    };
    loadData();
  }, [id]);

  if (!purchase) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Purchase not found</p>
            <Button onClick={() => navigate('/purchases')} className="mt-4">
              Back to Purchases
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="print:hidden p-4">
        <Button variant="ghost" onClick={() => navigate(`/purchase-preview/${purchase.id}`)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Preview
        </Button>
      </div>

      <div className="max-w-4xl mx-auto p-8 bg-white text-black">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{settings.companyName}</h1>
          <p className="text-sm">{settings.address}</p>
          <p className="text-sm">{settings.email} | {settings.phone}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">PURCHASE ORDER</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold">PO Number:</p>
              <p>{purchase.purchaseNumber}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Date:</p>
              <p>{new Date(purchase.date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="font-semibold mb-2">Vendor:</h3>
          <p className="font-bold">{purchase.vendor}</p>
          {purchase.vendorContact && <p className="text-sm">{purchase.vendorContact}</p>}
        </div>

        <Table className="mb-8">
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Unit Cost</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchase.lineItems.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.description}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
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

        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{settings.currencySymbol}{purchase.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({(purchase.taxRate * 100).toFixed(0)}%):</span>
              <span>{settings.currencySymbol}{purchase.taxAmount.toFixed(2)}</span>
            </div>
            {purchase.discount > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-{settings.currencySymbol}{purchase.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total:</span>
              <span>{settings.currencySymbol}{purchase.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {purchase.notes && (
          <div className="mt-8">
            <h3 className="font-semibold mb-2">Notes:</h3>
            <p className="text-sm">{purchase.notes}</p>
          </div>
        )}

        <div className="mt-12 pt-8 border-t text-center text-sm text-gray-600">
          <p>Thank you for your business</p>
        </div>
      </div>
    </>
  );
}
