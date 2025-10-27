import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { loadPurchases } from '@/utils/purchaseStorage';
import { getPurchasePayments } from '@/utils/purchasePaymentStorage';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Purchase } from '@/types/purchase';
import { PurchasePayment } from '@/types/purchasePayment';

export default function PurchaseHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [payments, setPayments] = useState<PurchasePayment[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const purchases = await loadPurchases();
      const found = purchases.find(p => p.id === id);
      setPurchase(found || null);
      
      if (found) {
        const purchasePayments = await getPurchasePayments(found.id);
        setPayments(purchasePayments);
      }
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

  // Compile history events
  const history = [
    {
      date: purchase.createdAt,
      action: 'Purchase created',
      user: 'System',
      details: `Purchase ${purchase.purchaseNumber} created`,
    },
    {
      date: purchase.updatedAt,
      action: 'Last updated',
      user: 'System',
      details: 'Purchase details modified',
    },
    ...payments.map(payment => ({
      date: payment.createdAt,
      action: 'Payment made',
      user: 'System',
      details: `Payment of ${payment.amount} via ${payment.method}`,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/purchases')} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Purchases
        </Button>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Purchase History</CardTitle>
                <p className="text-muted-foreground mt-1">Purchase #{purchase.purchaseNumber}</p>
              </div>
              <Badge variant={purchase.status === 'received' ? 'default' : 'secondary'}>
                {purchase.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                  <div className="flex-shrink-0 w-32 text-sm text-muted-foreground">
                    {new Date(entry.date).toLocaleString()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{entry.action}</p>
                    <p className="text-sm text-muted-foreground">{entry.details}</p>
                    <p className="text-xs text-muted-foreground mt-1">by {entry.user}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
