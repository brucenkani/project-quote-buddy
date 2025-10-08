import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calculator } from 'lucide-react';

export default function AccountingCalculators() {
  const navigate = useNavigate();

  // Depreciation States
  const [assetCost, setAssetCost] = useState('');
  const [salvageValue, setSalvageValue] = useState('');
  const [usefulLife, setUsefulLife] = useState('');
  const [depreciationMethod, setDepreciationMethod] = useState('straight-line');
  const [depreciationResult, setDepreciationResult] = useState<any>(null);

  // Markup & Margin States
  const [cost, setCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [markupMarginResult, setMarkupMarginResult] = useState<any>(null);

  // Working Capital States
  const [currentAssets, setCurrentAssets] = useState('');
  const [currentLiabilities, setCurrentLiabilities] = useState('');
  const [workingCapitalResult, setWorkingCapitalResult] = useState<any>(null);

  // Profit Margin States
  const [revenue, setRevenue] = useState('');
  const [costOfGoods, setCostOfGoods] = useState('');
  const [operatingExpenses, setOperatingExpenses] = useState('');
  const [profitMarginResult, setProfitMarginResult] = useState<any>(null);

  // Cash Flow States
  const [operatingCash, setOperatingCash] = useState('');
  const [investingCash, setInvestingCash] = useState('');
  const [financingCash, setFinancingCash] = useState('');
  const [beginningCash, setBeginningCash] = useState('');
  const [cashFlowResult, setCashFlowResult] = useState<any>(null);

  const calculateDepreciation = () => {
    const cost = parseFloat(assetCost);
    const salvage = parseFloat(salvageValue);
    const life = parseFloat(usefulLife);
    
    if (isNaN(cost) || isNaN(salvage) || isNaN(life)) return;

    if (depreciationMethod === 'straight-line') {
      const annualDepreciation = (cost - salvage) / life;
      const schedule = [];
      let bookValue = cost;
      
      for (let year = 1; year <= life; year++) {
        bookValue -= annualDepreciation;
        schedule.push({
          year,
          depreciation: annualDepreciation,
          bookValue: Math.max(bookValue, salvage)
        });
      }

      setDepreciationResult({
        method: 'Straight-Line',
        annualDepreciation,
        totalDepreciation: cost - salvage,
        schedule
      });
    } else {
      // Declining balance method (200%)
      const rate = 2 / life;
      const schedule = [];
      let bookValue = cost;
      
      for (let year = 1; year <= life; year++) {
        const depreciation = Math.min(bookValue * rate, bookValue - salvage);
        bookValue -= depreciation;
        schedule.push({
          year,
          depreciation,
          bookValue
        });
      }

      setDepreciationResult({
        method: 'Declining Balance',
        totalDepreciation: cost - salvage,
        schedule
      });
    }
  };

  const calculateMarkupMargin = () => {
    const costVal = parseFloat(cost);
    const priceVal = parseFloat(sellingPrice);
    
    if (isNaN(costVal) || isNaN(priceVal)) return;

    const profit = priceVal - costVal;
    const markup = (profit / costVal) * 100;
    const margin = (profit / priceVal) * 100;

    setMarkupMarginResult({
      cost: costVal,
      sellingPrice: priceVal,
      profit,
      markup: markup.toFixed(2),
      margin: margin.toFixed(2)
    });
  };

  const calculateWorkingCapital = () => {
    const assets = parseFloat(currentAssets);
    const liabilities = parseFloat(currentLiabilities);
    
    if (isNaN(assets) || isNaN(liabilities)) return;

    const workingCapital = assets - liabilities;
    const currentRatio = assets / liabilities;

    setWorkingCapitalResult({
      currentAssets: assets,
      currentLiabilities: liabilities,
      workingCapital,
      currentRatio: currentRatio.toFixed(2),
      health: currentRatio >= 2 ? 'Healthy' : currentRatio >= 1 ? 'Adequate' : 'Poor'
    });
  };

  const calculateProfitMargin = () => {
    const rev = parseFloat(revenue);
    const cogs = parseFloat(costOfGoods);
    const opex = parseFloat(operatingExpenses);
    
    if (isNaN(rev) || isNaN(cogs) || isNaN(opex)) return;

    const grossProfit = rev - cogs;
    const grossMargin = (grossProfit / rev) * 100;
    const netProfit = grossProfit - opex;
    const netMargin = (netProfit / rev) * 100;

    setProfitMarginResult({
      revenue: rev,
      grossProfit,
      grossMargin: grossMargin.toFixed(2),
      netProfit,
      netMargin: netMargin.toFixed(2)
    });
  };

  const calculateCashFlow = () => {
    const operating = parseFloat(operatingCash);
    const investing = parseFloat(investingCash);
    const financing = parseFloat(financingCash);
    const beginning = parseFloat(beginningCash);
    
    if (isNaN(operating) || isNaN(investing) || isNaN(financing) || isNaN(beginning)) return;

    const netCashFlow = operating + investing + financing;
    const endingCash = beginning + netCashFlow;

    setCashFlowResult({
      operating,
      investing,
      financing,
      netCashFlow,
      beginningCash: beginning,
      endingCash,
      status: netCashFlow > 0 ? 'Positive' : 'Negative'
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
          <Calculator className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Accounting Calculators</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 max-w-6xl mx-auto">
          {/* Depreciation Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Depreciation Calculator</CardTitle>
              <CardDescription>Calculate asset depreciation over time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Asset Cost (R)</Label>
                  <Input type="number" value={assetCost} onChange={(e) => setAssetCost(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Salvage Value (R)</Label>
                  <Input type="number" value={salvageValue} onChange={(e) => setSalvageValue(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Useful Life (years)</Label>
                  <Input type="number" value={usefulLife} onChange={(e) => setUsefulLife(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Depreciation Method</Label>
                  <Select value={depreciationMethod} onValueChange={setDepreciationMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="straight-line">Straight-Line</SelectItem>
                      <SelectItem value="declining-balance">Declining Balance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={calculateDepreciation} className="w-full">Calculate</Button>
              {depreciationResult && (
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="font-semibold mb-2">Method: {depreciationResult.method}</p>
                    {depreciationResult.annualDepreciation && (
                      <div className="flex justify-between">
                        <span>Annual Depreciation:</span>
                        <span className="font-bold">R {depreciationResult.annualDepreciation.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-primary/10">
                        <tr>
                          <th className="p-2 text-left">Year</th>
                          <th className="p-2 text-right">Depreciation</th>
                          <th className="p-2 text-right">Book Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {depreciationResult.schedule.map((item: any) => (
                          <tr key={item.year} className="border-b">
                            <td className="p-2">{item.year}</td>
                            <td className="p-2 text-right">R {item.depreciation.toFixed(2)}</td>
                            <td className="p-2 text-right">R {item.bookValue.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Markup & Margin Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Markup & Margin Calculator</CardTitle>
              <CardDescription>Calculate markup and profit margin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cost (R)</Label>
                  <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Selling Price (R)</Label>
                  <Input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} />
                </div>
              </div>
              <Button onClick={calculateMarkupMargin} className="w-full">Calculate</Button>
              {markupMarginResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Profit:</span>
                    <span className="font-semibold">R {markupMarginResult.profit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Markup:</span>
                    <span className="text-primary">{markupMarginResult.markup}%</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Profit Margin:</span>
                    <span className="text-primary">{markupMarginResult.margin}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Working Capital Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Working Capital Calculator</CardTitle>
              <CardDescription>Assess business liquidity and financial health</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Assets (R)</Label>
                  <Input type="number" value={currentAssets} onChange={(e) => setCurrentAssets(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Current Liabilities (R)</Label>
                  <Input type="number" value={currentLiabilities} onChange={(e) => setCurrentLiabilities(e.target.value)} />
                </div>
              </div>
              <Button onClick={calculateWorkingCapital} className="w-full">Calculate</Button>
              {workingCapitalResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Working Capital:</span>
                    <span className={workingCapitalResult.workingCapital >= 0 ? 'text-green-600' : 'text-red-600'}>
                      R {workingCapitalResult.workingCapital.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Ratio:</span>
                    <span className="font-semibold">{workingCapitalResult.currentRatio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Financial Health:</span>
                    <span className={`font-semibold ${
                      workingCapitalResult.health === 'Healthy' ? 'text-green-600' :
                      workingCapitalResult.health === 'Adequate' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {workingCapitalResult.health}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profit Margin Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Profit Margin Calculator</CardTitle>
              <CardDescription>Calculate gross and net profit margins</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Revenue (R)</Label>
                  <Input type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Cost of Goods Sold (R)</Label>
                  <Input type="number" value={costOfGoods} onChange={(e) => setCostOfGoods(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Operating Expenses (R)</Label>
                  <Input type="number" value={operatingExpenses} onChange={(e) => setOperatingExpenses(e.target.value)} />
                </div>
              </div>
              <Button onClick={calculateProfitMargin} className="w-full">Calculate</Button>
              {profitMarginResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-3">
                  <div>
                    <p className="font-semibold mb-2">Gross Profit Analysis:</p>
                    <div className="flex justify-between">
                      <span>Gross Profit:</span>
                      <span>R {profitMarginResult.grossProfit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Gross Margin:</span>
                      <span className="text-primary">{profitMarginResult.grossMargin}%</span>
                    </div>
                  </div>
                  <div className="border-t pt-2">
                    <p className="font-semibold mb-2">Net Profit Analysis:</p>
                    <div className="flex justify-between">
                      <span>Net Profit:</span>
                      <span className={profitMarginResult.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        R {profitMarginResult.netProfit.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Net Margin:</span>
                      <span className={profitMarginResult.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {profitMarginResult.netMargin}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cash Flow Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Calculator</CardTitle>
              <CardDescription>Calculate net cash flow from operations, investing, and financing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Operating Cash Flow (R)</Label>
                  <Input type="number" value={operatingCash} onChange={(e) => setOperatingCash(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Investing Cash Flow (R)</Label>
                  <Input type="number" value={investingCash} onChange={(e) => setInvestingCash(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Financing Cash Flow (R)</Label>
                  <Input type="number" value={financingCash} onChange={(e) => setFinancingCash(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Beginning Cash (R)</Label>
                  <Input type="number" value={beginningCash} onChange={(e) => setBeginningCash(e.target.value)} />
                </div>
              </div>
              <Button onClick={calculateCashFlow} className="w-full">Calculate</Button>
              {cashFlowResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Beginning Cash:</span>
                    <span>R {cashFlowResult.beginningCash.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Net Cash Flow:</span>
                    <span className={cashFlowResult.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                      R {cashFlowResult.netCashFlow.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Ending Cash:</span>
                    <span className="text-primary">R {cashFlowResult.endingCash.toFixed(2)}</span>
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
