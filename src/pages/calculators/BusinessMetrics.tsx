import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, TrendingUp } from 'lucide-react';

export default function BusinessMetrics() {
  const navigate = useNavigate();
  const [revenueGrowth, setRevenueGrowth] = useState({ previous: '', current: '', result: null as any });
  const [cac, setCAC] = useState({ marketingCost: '', newCustomers: '', result: null as any });
  const [ltv, setLTV] = useState({ avgRevenue: '', avgLifespan: '', result: null as any });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/calculators')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <TrendingUp className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Business Metrics Calculators</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Growth Calculator</CardTitle>
              <CardDescription>Calculate your revenue growth rate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Previous Period Revenue (R)</Label>
                  <Input type="number" value={revenueGrowth.previous} onChange={(e) => setRevenueGrowth({...revenueGrowth, previous: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Current Period Revenue (R)</Label>
                  <Input type="number" value={revenueGrowth.current} onChange={(e) => setRevenueGrowth({...revenueGrowth, current: e.target.value})} />
                </div>
              </div>
              <Button onClick={() => {
                const prev = parseFloat(revenueGrowth.previous);
                const curr = parseFloat(revenueGrowth.current);
                if (!isNaN(prev) && !isNaN(curr)) {
                  const growth = ((curr - prev) / prev) * 100;
                  setRevenueGrowth({...revenueGrowth, result: { growth: growth.toFixed(2), increase: curr - prev }});
                }
              }} className="w-full">Calculate</Button>
              {revenueGrowth.result && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Growth Rate:</span>
                    <span className={revenueGrowth.result.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {revenueGrowth.result.growth}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
