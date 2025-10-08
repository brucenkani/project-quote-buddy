import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, DollarSign } from 'lucide-react';

export default function FinancialCalculators() {
  const navigate = useNavigate();

  // Loan Repayment States
  const [loanAmount, setLoanAmount] = useState('');
  const [loanRate, setLoanRate] = useState('');
  const [loanTerm, setLoanTerm] = useState('');
  const [loanResult, setLoanResult] = useState<any>(null);

  // Interest Rate States
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [timePeriod, setTimePeriod] = useState('');
  const [interestResult, setInterestResult] = useState<any>(null);

  // ROI States
  const [initialInvestment, setInitialInvestment] = useState('');
  const [finalValue, setFinalValue] = useState('');
  const [roiResult, setRoiResult] = useState<any>(null);

  // Break-Even States
  const [fixedCosts, setFixedCosts] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [variableCostPerUnit, setVariableCostPerUnit] = useState('');
  const [breakEvenResult, setBreakEvenResult] = useState<any>(null);

  // NPV States
  const [initialInvestmentNPV, setInitialInvestmentNPV] = useState('');
  const [cashFlows, setCashFlows] = useState('');
  const [discountRate, setDiscountRate] = useState('');
  const [npvResult, setNpvResult] = useState<any>(null);

  const calculateLoan = () => {
    const P = parseFloat(loanAmount);
    const r = parseFloat(loanRate) / 100 / 12;
    const n = parseFloat(loanTerm) * 12;
    
    if (isNaN(P) || isNaN(r) || isNaN(n)) return;

    const monthlyPayment = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = monthlyPayment * n;
    const totalInterest = totalPayment - P;

    setLoanResult({
      monthlyPayment,
      totalPayment,
      totalInterest,
      loanAmount: P
    });
  };

  const calculateInterest = () => {
    const P = parseFloat(principal);
    const r = parseFloat(interestRate) / 100;
    const t = parseFloat(timePeriod);
    
    if (isNaN(P) || isNaN(r) || isNaN(t)) return;

    const simpleInterest = P * r * t;
    const compoundInterest = P * (Math.pow(1 + r, t) - 1);
    const totalSimple = P + simpleInterest;
    const totalCompound = P + compoundInterest;

    setInterestResult({
      principal: P,
      simpleInterest,
      compoundInterest,
      totalSimple,
      totalCompound
    });
  };

  const calculateROI = () => {
    const initial = parseFloat(initialInvestment);
    const final = parseFloat(finalValue);
    
    if (isNaN(initial) || isNaN(final)) return;

    const gain = final - initial;
    const roi = (gain / initial) * 100;

    setRoiResult({
      initialInvestment: initial,
      finalValue: final,
      gain,
      roi: roi.toFixed(2)
    });
  };

  const calculateBreakEven = () => {
    const fixed = parseFloat(fixedCosts);
    const price = parseFloat(pricePerUnit);
    const variable = parseFloat(variableCostPerUnit);
    
    if (isNaN(fixed) || isNaN(price) || isNaN(variable)) return;

    const breakEvenUnits = fixed / (price - variable);
    const breakEvenRevenue = breakEvenUnits * price;

    setBreakEvenResult({
      breakEvenUnits: breakEvenUnits.toFixed(0),
      breakEvenRevenue: breakEvenRevenue.toFixed(2),
      fixedCosts: fixed
    });
  };

  const calculateNPV = () => {
    const initial = parseFloat(initialInvestmentNPV);
    const flows = cashFlows.split(',').map(f => parseFloat(f.trim())).filter(f => !isNaN(f));
    const rate = parseFloat(discountRate) / 100;
    
    if (isNaN(initial) || flows.length === 0 || isNaN(rate)) return;

    let npv = -initial;
    flows.forEach((flow, index) => {
      npv += flow / Math.pow(1 + rate, index + 1);
    });

    setNpvResult({
      npv: npv.toFixed(2),
      initialInvestment: initial,
      profitable: npv > 0
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
          <DollarSign className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Financial Calculators</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 max-w-6xl mx-auto">
          {/* Loan Repayment Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Repayment Calculator</CardTitle>
              <CardDescription>Calculate monthly loan payments and total interest</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Loan Amount (R)</Label>
                  <Input type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Interest Rate (% per year)</Label>
                  <Input type="number" step="0.1" value={loanRate} onChange={(e) => setLoanRate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Loan Term (years)</Label>
                  <Input type="number" value={loanTerm} onChange={(e) => setLoanTerm(e.target.value)} />
                </div>
              </div>
              <Button onClick={calculateLoan} className="w-full">Calculate</Button>
              {loanResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Monthly Payment:</span>
                    <span className="text-primary">R {loanResult.monthlyPayment.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Payment:</span>
                    <span>R {loanResult.totalPayment.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Interest:</span>
                    <span>R {loanResult.totalInterest.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interest Rate Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Interest Rate Calculator</CardTitle>
              <CardDescription>Calculate simple and compound interest</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Principal (R)</Label>
                  <Input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Interest Rate (% per year)</Label>
                  <Input type="number" step="0.1" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Time Period (years)</Label>
                  <Input type="number" value={timePeriod} onChange={(e) => setTimePeriod(e.target.value)} />
                </div>
              </div>
              <Button onClick={calculateInterest} className="w-full">Calculate</Button>
              {interestResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-3">
                  <div>
                    <p className="font-semibold mb-2">Simple Interest:</p>
                    <div className="flex justify-between">
                      <span>Interest Earned:</span>
                      <span>R {interestResult.simpleInterest.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span className="font-bold">R {interestResult.totalSimple.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="border-t pt-2">
                    <p className="font-semibold mb-2">Compound Interest:</p>
                    <div className="flex justify-between">
                      <span>Interest Earned:</span>
                      <span>R {interestResult.compoundInterest.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span className="font-bold text-primary">R {interestResult.totalCompound.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ROI Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Return on Investment (ROI)</CardTitle>
              <CardDescription>Calculate investment returns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Initial Investment (R)</Label>
                  <Input type="number" value={initialInvestment} onChange={(e) => setInitialInvestment(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Final Value (R)</Label>
                  <Input type="number" value={finalValue} onChange={(e) => setFinalValue(e.target.value)} />
                </div>
              </div>
              <Button onClick={calculateROI} className="w-full">Calculate ROI</Button>
              {roiResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Investment Gain:</span>
                    <span className={roiResult.gain >= 0 ? 'text-green-600' : 'text-red-600'}>
                      R {roiResult.gain.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>ROI:</span>
                    <span className={`${roiResult.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {roiResult.roi}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Break-Even Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Break-Even Analysis</CardTitle>
              <CardDescription>Calculate break-even point for your business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Fixed Costs (R)</Label>
                  <Input type="number" value={fixedCosts} onChange={(e) => setFixedCosts(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Price per Unit (R)</Label>
                  <Input type="number" value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Variable Cost per Unit (R)</Label>
                  <Input type="number" value={variableCostPerUnit} onChange={(e) => setVariableCostPerUnit(e.target.value)} />
                </div>
              </div>
              <Button onClick={calculateBreakEven} className="w-full">Calculate</Button>
              {breakEvenResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Break-Even Units:</span>
                    <span className="text-primary">{breakEvenResult.breakEvenUnits} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Break-Even Revenue:</span>
                    <span>R {breakEvenResult.breakEvenRevenue}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* NPV Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Net Present Value (NPV)</CardTitle>
              <CardDescription>Calculate the present value of future cash flows</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Initial Investment (R)</Label>
                  <Input type="number" value={initialInvestmentNPV} onChange={(e) => setInitialInvestmentNPV(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Discount Rate (% per year)</Label>
                  <Input type="number" step="0.1" value={discountRate} onChange={(e) => setDiscountRate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cash Flows (comma separated by year)</Label>
                <Input 
                  placeholder="e.g., 10000, 12000, 15000" 
                  value={cashFlows} 
                  onChange={(e) => setCashFlows(e.target.value)} 
                />
              </div>
              <Button onClick={calculateNPV} className="w-full">Calculate NPV</Button>
              {npvResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Net Present Value:</span>
                    <span className={npvResult.profitable ? 'text-green-600' : 'text-red-600'}>
                      R {npvResult.npv}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {npvResult.profitable 
                      ? '✓ This investment is profitable (NPV > 0)' 
                      : '✗ This investment is not profitable (NPV < 0)'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
