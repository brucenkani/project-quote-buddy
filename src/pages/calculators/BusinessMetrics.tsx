import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, TrendingUp } from 'lucide-react';

export default function BusinessMetrics() {
  const navigate = useNavigate();

  // Revenue Growth States
  const [previousRevenue, setPreviousRevenue] = useState('');
  const [currentRevenue, setCurrentRevenue] = useState('');
  const [revenueGrowthResult, setRevenueGrowthResult] = useState<any>(null);

  // Customer Acquisition Cost States
  const [marketingCost, setMarketingCost] = useState('');
  const [salesCost, setSalesCost] = useState('');
  const [newCustomers, setNewCustomers] = useState('');
  const [cacResult, setCacResult] = useState<any>(null);

  // Lifetime Value States
  const [avgPurchaseValue, setAvgPurchaseValue] = useState('');
  const [avgPurchaseFrequency, setAvgPurchaseFrequency] = useState('');
  const [avgCustomerLifespan, setAvgCustomerLifespan] = useState('');
  const [ltvResult, setLtvResult] = useState<any>(null);

  // Burn Rate States
  const [monthlyCashSpent, setMonthlyCashSpent] = useState('');
  const [cashReserves, setCashReserves] = useState('');
  const [burnRateResult, setBurnRateResult] = useState<any>(null);

  // Gross Profit Margin States
  const [totalRevenue, setTotalRevenue] = useState('');
  const [cogs, setCogs] = useState('');
  const [grossProfitResult, setGrossProfitResult] = useState<any>(null);

  const calculateRevenueGrowth = () => {
    const prev = parseFloat(previousRevenue);
    const curr = parseFloat(currentRevenue);
    if (isNaN(prev) || isNaN(curr)) return;

    const growth = ((curr - prev) / prev) * 100;
    const increase = curr - prev;

    setRevenueGrowthResult({
      previousRevenue: prev,
      currentRevenue: curr,
      growth: growth.toFixed(2),
      increase: increase.toFixed(2),
      status: growth > 0 ? 'Growth' : growth < 0 ? 'Decline' : 'Stagnant'
    });
  };

  const calculateCAC = () => {
    const marketing = parseFloat(marketingCost);
    const sales = parseFloat(salesCost);
    const customers = parseFloat(newCustomers);
    if (isNaN(marketing) || isNaN(sales) || isNaN(customers) || customers === 0) return;

    const totalCost = marketing + sales;
    const cac = totalCost / customers;

    setCacResult({
      totalCost,
      newCustomers: customers,
      cac: cac.toFixed(2),
      recommendation: cac < 100 ? 'Excellent' : cac < 500 ? 'Good' : cac < 1000 ? 'Moderate' : 'High'
    });
  };

  const calculateLTV = () => {
    const purchaseValue = parseFloat(avgPurchaseValue);
    const frequency = parseFloat(avgPurchaseFrequency);
    const lifespan = parseFloat(avgCustomerLifespan);
    if (isNaN(purchaseValue) || isNaN(frequency) || isNaN(lifespan)) return;

    const customerValue = purchaseValue * frequency;
    const ltv = customerValue * lifespan;

    setLtvResult({
      avgPurchaseValue: purchaseValue,
      customerValue: customerValue.toFixed(2),
      ltv: ltv.toFixed(2),
      monthlyValue: (ltv / (lifespan * 12)).toFixed(2)
    });
  };

  const calculateBurnRate = () => {
    const monthlyBurn = parseFloat(monthlyCashSpent);
    const reserves = parseFloat(cashReserves);
    if (isNaN(monthlyBurn) || isNaN(reserves)) return;

    const runwayMonths = monthlyBurn > 0 ? reserves / monthlyBurn : 0;

    setBurnRateResult({
      monthlyBurnRate: monthlyBurn.toFixed(2),
      cashReserves: reserves.toFixed(2),
      runwayMonths: runwayMonths.toFixed(1),
      status: runwayMonths > 12 ? 'Healthy' : runwayMonths > 6 ? 'Moderate' : 'Critical'
    });
  };

  const calculateGrossProfitMargin = () => {
    const revenue = parseFloat(totalRevenue);
    const costOfGoods = parseFloat(cogs);
    if (isNaN(revenue) || isNaN(costOfGoods)) return;

    const grossProfit = revenue - costOfGoods;
    const margin = (grossProfit / revenue) * 100;

    setGrossProfitResult({
      revenue,
      cogs: costOfGoods,
      grossProfit: grossProfit.toFixed(2),
      margin: margin.toFixed(2),
      quality: margin > 70 ? 'Excellent' : margin > 50 ? 'Good' : margin > 30 ? 'Average' : 'Low'
    });
  };

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
          {/* Revenue Growth Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Growth Calculator</CardTitle>
              <CardDescription>Calculate your revenue growth rate period over period</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Previous Period Revenue (R)</Label>
                  <Input type="number" value={previousRevenue} onChange={(e) => setPreviousRevenue(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Current Period Revenue (R)</Label>
                  <Input type="number" value={currentRevenue} onChange={(e) => setCurrentRevenue(e.target.value)} />
                </div>
              </div>
              <Button onClick={calculateRevenueGrowth} className="w-full">Calculate Growth</Button>
              {revenueGrowthResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Revenue Increase:</span>
                    <span className={parseFloat(revenueGrowthResult.increase) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      R {revenueGrowthResult.increase}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Growth Rate:</span>
                    <span className={parseFloat(revenueGrowthResult.growth) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {revenueGrowthResult.growth}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-semibold">{revenueGrowthResult.status}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Acquisition Cost */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Acquisition Cost (CAC)</CardTitle>
              <CardDescription>Calculate the cost to acquire each new customer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Marketing Costs (R)</Label>
                  <Input type="number" value={marketingCost} onChange={(e) => setMarketingCost(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Sales Costs (R)</Label>
                  <Input type="number" value={salesCost} onChange={(e) => setSalesCost(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>New Customers</Label>
                  <Input type="number" value={newCustomers} onChange={(e) => setNewCustomers(e.target.value)} />
                </div>
              </div>
              <Button onClick={calculateCAC} className="w-full">Calculate CAC</Button>
              {cacResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Total Acquisition Cost:</span>
                    <span>R {cacResult.totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>CAC per Customer:</span>
                    <span className="text-primary">R {cacResult.cac}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rating:</span>
                    <span className={`font-semibold ${
                      cacResult.recommendation === 'Excellent' ? 'text-green-600' :
                      cacResult.recommendation === 'Good' ? 'text-blue-600' :
                      cacResult.recommendation === 'Moderate' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {cacResult.recommendation}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lifetime Value Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Lifetime Value (LTV)</CardTitle>
              <CardDescription>Calculate the total value a customer brings over their lifetime</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Avg Purchase Value (R)</Label>
                  <Input type="number" value={avgPurchaseValue} onChange={(e) => setAvgPurchaseValue(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Avg Purchase Frequency (per year)</Label>
                  <Input type="number" value={avgPurchaseFrequency} onChange={(e) => setAvgPurchaseFrequency(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Avg Customer Lifespan (years)</Label>
                  <Input type="number" value={avgCustomerLifespan} onChange={(e) => setAvgCustomerLifespan(e.target.value)} />
                </div>
              </div>
              <Button onClick={calculateLTV} className="w-full">Calculate LTV</Button>
              {ltvResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Annual Customer Value:</span>
                    <span>R {ltvResult.customerValue}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Lifetime Value:</span>
                    <span className="text-primary">R {ltvResult.ltv}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Value:</span>
                    <span>R {ltvResult.monthlyValue}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Burn Rate Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Burn Rate Calculator</CardTitle>
              <CardDescription>Calculate how long your cash reserves will last</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monthly Cash Spent (R)</Label>
                  <Input type="number" value={monthlyCashSpent} onChange={(e) => setMonthlyCashSpent(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Total Cash Reserves (R)</Label>
                  <Input type="number" value={cashReserves} onChange={(e) => setCashReserves(e.target.value)} />
                </div>
              </div>
              <Button onClick={calculateBurnRate} className="w-full">Calculate Burn Rate</Button>
              {burnRateResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Monthly Burn Rate:</span>
                    <span>R {burnRateResult.monthlyBurnRate}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Runway (months):</span>
                    <span className="text-primary">{burnRateResult.runwayMonths} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-semibold ${
                      burnRateResult.status === 'Healthy' ? 'text-green-600' :
                      burnRateResult.status === 'Moderate' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {burnRateResult.status}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gross Profit Margin */}
          <Card>
            <CardHeader>
              <CardTitle>Gross Profit Margin</CardTitle>
              <CardDescription>Calculate your gross profit margin percentage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Revenue (R)</Label>
                  <Input type="number" value={totalRevenue} onChange={(e) => setTotalRevenue(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Cost of Goods Sold (R)</Label>
                  <Input type="number" value={cogs} onChange={(e) => setCogs(e.target.value)} />
                </div>
              </div>
              <Button onClick={calculateGrossProfitMargin} className="w-full">Calculate Margin</Button>
              {grossProfitResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Gross Profit:</span>
                    <span>R {grossProfitResult.grossProfit}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Gross Profit Margin:</span>
                    <span className="text-primary">{grossProfitResult.margin}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quality:</span>
                    <span className={`font-semibold ${
                      grossProfitResult.quality === 'Excellent' ? 'text-green-600' :
                      grossProfitResult.quality === 'Good' ? 'text-blue-600' :
                      grossProfitResult.quality === 'Average' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {grossProfitResult.quality}
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
