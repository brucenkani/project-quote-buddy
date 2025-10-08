import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Building2 } from 'lucide-react';

export default function PropertyCalculators() {
  const navigate = useNavigate();
  const [transferDuty, setTransferDuty] = useState({ price: '', result: null as any });

  const calculateTransferDuty = () => {
    const price = parseFloat(transferDuty.price);
    if (isNaN(price)) return;
    let duty = 0;
    if (price <= 1100000) duty = 0;
    else if (price <= 1512500) duty = (price - 1100000) * 0.03;
    else if (price <= 2117500) duty = 12375 + (price - 1512500) * 0.06;
    else if (price <= 2722500) duty = 48675 + (price - 2117500) * 0.08;
    else if (price <= 12100000) duty = 97075 + (price - 2722500) * 0.11;
    else duty = 1128600 + (price - 12100000) * 0.13;
    setTransferDuty({...transferDuty, result: { duty: duty.toFixed(2) }});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/calculators')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Property & Asset Calculators</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Property Transfer Duty Calculator</CardTitle>
            <CardDescription>Calculate South African transfer duty</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Property Price (R)</Label>
              <Input type="number" value={transferDuty.price} onChange={(e) => setTransferDuty({...transferDuty, price: e.target.value})} />
            </div>
            <Button onClick={calculateTransferDuty} className="w-full">Calculate</Button>
            {transferDuty.result && (
              <div className="p-4 bg-primary/5 rounded-lg">
                <div className="flex justify-between text-lg font-bold">
                  <span>Transfer Duty:</span>
                  <span className="text-primary">R {transferDuty.result.duty}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
