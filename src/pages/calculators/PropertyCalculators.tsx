import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Building2 } from 'lucide-react';

export default function PropertyCalculators() {
  const navigate = useNavigate();

  // Property Transfer Duty States
  const [propertyPrice, setPropertyPrice] = useState('');
  const [transferDutyResult, setTransferDutyResult] = useState<any>(null);

  // Rental Yield States
  const [annualRent, setAnnualRent] = useState('');
  const [propertyValue, setPropertyValue] = useState('');
  const [rentalYieldResult, setRentalYieldResult] = useState<any>(null);

  // Bond Calculator States
  const [bondAmount, setBondAmount] = useState('');
  const [bondRate, setBondRate] = useState('');
  const [bondTerm, setBondTerm] = useState('');
  const [bondResult, setBondResult] = useState<any>(null);

  // Asset Valuation States
  const [assetPurchasePrice, setAssetPurchasePrice] = useState('');
  const [assetAge, setAssetAge] = useState('');
  const [assetLifespan, setAssetLifespan] = useState('');
  const [assetValuationResult, setAssetValuationResult] = useState<any>(null);

  // Property Investment ROI States
  const [purchasePrice, setPurchasePrice] = useState('');
  const [renovationCost, setRenovationCost] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [investmentRoiResult, setInvestmentRoiResult] = useState<any>(null);

  const calculateTransferDuty = () => {
    const price = parseFloat(propertyPrice);
    if (isNaN(price)) return;

    let duty = 0;
    // SA 2024/2025 Transfer Duty rates
    if (price <= 1100000) {
      duty = 0;
    } else if (price <= 1512500) {
      duty = (price - 1100000) * 0.03;
    } else if (price <= 2117500) {
      duty = 12375 + (price - 1512500) * 0.06;
    } else if (price <= 2722500) {
      duty = 48675 + (price - 2117500) * 0.08;
    } else if (price <= 12100000) {
      duty = 97075 + (price - 2722500) * 0.11;
    } else {
      duty = 1128600 + (price - 12100000) * 0.13;
    }

    setTransferDutyResult({
      propertyPrice: price,
      transferDuty: duty.toFixed(2),
      totalCost: (price + duty).toFixed(2),
      dutyPercentage: ((duty / price) * 100).toFixed(2)
    });
  };

  const calculateRentalYield = () => {
    const rent = parseFloat(annualRent);
    const value = parseFloat(propertyValue);
    if (isNaN(rent) || isNaN(value) || value === 0) return;

    const grossYield = (rent / value) * 100;

    setRentalYieldResult({
      annualRent: rent,
      propertyValue: value,
      grossYield: grossYield.toFixed(2),
      monthlyRent: (rent / 12).toFixed(2),
      quality: grossYield > 8 ? 'Excellent' : grossYield > 6 ? 'Good' : grossYield > 4 ? 'Average' : 'Poor'
    });
  };

  const calculateBond = () => {
    const P = parseFloat(bondAmount);
    const r = parseFloat(bondRate) / 100 / 12;
    const n = parseFloat(bondTerm) * 12;
    
    if (isNaN(P) || isNaN(r) || isNaN(n) || r === 0) return;

    const monthlyPayment = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = monthlyPayment * n;
    const totalInterest = totalPayment - P;

    setBondResult({
      bondAmount: P,
      monthlyPayment: monthlyPayment.toFixed(2),
      totalPayment: totalPayment.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
      interestPercentage: ((totalInterest / P) * 100).toFixed(2)
    });
  };

  const calculateAssetValuation = () => {
    const purchase = parseFloat(assetPurchasePrice);
    const age = parseFloat(assetAge);
    const lifespan = parseFloat(assetLifespan);
    
    if (isNaN(purchase) || isNaN(age) || isNaN(lifespan) || lifespan === 0) return;

    const annualDepreciation = purchase / lifespan;
    const totalDepreciation = annualDepreciation * age;
    const currentValue = Math.max(0, purchase - totalDepreciation);
    const remainingLife = Math.max(0, lifespan - age);

    setAssetValuationResult({
      purchasePrice: purchase,
      currentValue: currentValue.toFixed(2),
      totalDepreciation: totalDepreciation.toFixed(2),
      remainingLife: remainingLife.toFixed(1),
      depreciationRate: ((totalDepreciation / purchase) * 100).toFixed(2)
    });
  };

  const calculateInvestmentROI = () => {
    const purchase = parseFloat(purchasePrice);
    const renovation = parseFloat(renovationCost) || 0;
    const current = parseFloat(currentValue);
    
    if (isNaN(purchase) || isNaN(current)) return;

    const totalInvestment = purchase + renovation;
    const profit = current - totalInvestment;
    const roi = (profit / totalInvestment) * 100;

    setInvestmentRoiResult({
      totalInvestment: totalInvestment.toFixed(2),
      currentValue: current.toFixed(2),
      profit: profit.toFixed(2),
      roi: roi.toFixed(2),
      status: roi > 0 ? 'Profitable' : roi < 0 ? 'Loss' : 'Break-even'
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
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Property & Asset Calculators</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 max-w-6xl mx-auto">
          {/* Property Transfer Duty Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Property Transfer Duty Calculator</CardTitle>
              <CardDescription>Calculate South African transfer duty based on 2024/2025 rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Property Price (R)</Label>
                <Input type="number" value={propertyPrice} onChange={(e) => setPropertyPrice(e.target.value)} />
              </div>
              <Button onClick={calculateTransferDuty} className="w-full">Calculate Transfer Duty</Button>
              {transferDutyResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Property Price:</span>
                    <span>R {transferDutyResult.propertyPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Transfer Duty:</span>
                    <span className="text-primary">R {transferDutyResult.transferDuty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duty Percentage:</span>
                    <span>{transferDutyResult.dutyPercentage}%</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total Cost:</span>
                    <span>R {transferDutyResult.totalCost}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rental Yield Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Rental Yield Calculator</CardTitle>
              <CardDescription>Calculate the return on your rental property investment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Annual Rental Income (R)</Label>
                  <Input type="number" value={annualRent} onChange={(e) => setAnnualRent(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Property Value (R)</Label>
                  <Input type="number" value={propertyValue} onChange={(e) => setPropertyValue(e.target.value)} />
                </div>
              </div>
              <Button onClick={calculateRentalYield} className="w-full">Calculate Yield</Button>
              {rentalYieldResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Monthly Rental Income:</span>
                    <span>R {rentalYieldResult.monthlyRent}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Gross Rental Yield:</span>
                    <span className="text-primary">{rentalYieldResult.grossYield}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Investment Quality:</span>
                    <span className={`font-semibold ${
                      rentalYieldResult.quality === 'Excellent' ? 'text-green-600' :
                      rentalYieldResult.quality === 'Good' ? 'text-blue-600' :
                      rentalYieldResult.quality === 'Average' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {rentalYieldResult.quality}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bond Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Bond Calculator</CardTitle>
              <CardDescription>Calculate monthly bond repayments and total interest</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Bond Amount (R)</Label>
                  <Input type="number" value={bondAmount} onChange={(e) => setBondAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Interest Rate (% per year)</Label>
                  <Input type="number" step="0.1" value={bondRate} onChange={(e) => setBondRate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Bond Term (years)</Label>
                  <Input type="number" value={bondTerm} onChange={(e) => setBondTerm(e.target.value)} />
                </div>
              </div>
              <Button onClick={calculateBond} className="w-full">Calculate Bond</Button>
              {bondResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Monthly Payment:</span>
                    <span className="text-primary">R {bondResult.monthlyPayment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Payment:</span>
                    <span>R {bondResult.totalPayment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Interest:</span>
                    <span>R {bondResult.totalInterest}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interest as % of Bond:</span>
                    <span>{bondResult.interestPercentage}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Asset Valuation */}
          <Card>
            <CardHeader>
              <CardTitle>Asset Valuation Calculator</CardTitle>
              <CardDescription>Calculate current value of depreciating assets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Purchase Price (R)</Label>
                  <Input type="number" value={assetPurchasePrice} onChange={(e) => setAssetPurchasePrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Asset Age (years)</Label>
                  <Input type="number" value={assetAge} onChange={(e) => setAssetAge(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Total Lifespan (years)</Label>
                  <Input type="number" value={assetLifespan} onChange={(e) => setAssetLifespan(e.target.value)} />
                </div>
              </div>
              <Button onClick={calculateAssetValuation} className="w-full">Calculate Value</Button>
              {assetValuationResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Original Purchase Price:</span>
                    <span>R {assetValuationResult.purchasePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Depreciation:</span>
                    <span>R {assetValuationResult.totalDepreciation}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Current Value:</span>
                    <span className="text-primary">R {assetValuationResult.currentValue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining Useful Life:</span>
                    <span>{assetValuationResult.remainingLife} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Depreciation Rate:</span>
                    <span>{assetValuationResult.depreciationRate}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Investment ROI */}
          <Card>
            <CardHeader>
              <CardTitle>Property Investment ROI</CardTitle>
              <CardDescription>Calculate return on investment for property purchases</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Purchase Price (R)</Label>
                  <Input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Renovation Cost (R)</Label>
                  <Input type="number" value={renovationCost} onChange={(e) => setRenovationCost(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Current Value (R)</Label>
                  <Input type="number" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} />
                </div>
              </div>
              <Button onClick={calculateInvestmentROI} className="w-full">Calculate ROI</Button>
              {investmentRoiResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Total Investment:</span>
                    <span>R {investmentRoiResult.totalInvestment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Value:</span>
                    <span>R {investmentRoiResult.currentValue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profit/Loss:</span>
                    <span className={parseFloat(investmentRoiResult.profit) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      R {investmentRoiResult.profit}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>ROI:</span>
                    <span className={parseFloat(investmentRoiResult.roi) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {investmentRoiResult.roi}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-semibold ${
                      investmentRoiResult.status === 'Profitable' ? 'text-green-600' :
                      investmentRoiResult.status === 'Loss' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {investmentRoiResult.status}
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
