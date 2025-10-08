import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Percent } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TaxCalculators() {
  const navigate = useNavigate();

  // Income Tax Calculator State
  const [annualIncome, setAnnualIncome] = useState('');
  const [taxYear, setTaxYear] = useState('2024');
  const [incomeTaxResult, setIncomeTaxResult] = useState<any>(null);

  // VAT Calculator State
  const [amount, setAmount] = useState('');
  const [vatType, setVatType] = useState('add');
  const [vatRate, setVatRate] = useState('15');
  const [vatResult, setVatResult] = useState<any>(null);

  // PAYE Calculator State
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [payeResult, setPayeResult] = useState<any>(null);

  // Capital Gains Tax Calculator State
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [exclusion, setExclusion] = useState('40000');
  const [cgtResult, setCgtResult] = useState<any>(null);

  // Provisional Tax Calculator State
  const [estimatedIncome, setEstimatedIncome] = useState('');
  const [provisionalResult, setProvisionalResult] = useState<any>(null);

  const calculateIncomeTax = () => {
    const income = parseFloat(annualIncome);
    if (isNaN(income)) return;

    // SARS 2024/2025 tax brackets
    let tax = 0;
    if (income <= 237100) {
      tax = income * 0.18;
    } else if (income <= 370500) {
      tax = 42678 + (income - 237100) * 0.26;
    } else if (income <= 512800) {
      tax = 77362 + (income - 370500) * 0.31;
    } else if (income <= 673000) {
      tax = 121475 + (income - 512800) * 0.36;
    } else if (income <= 857900) {
      tax = 179147 + (income - 673000) * 0.39;
    } else if (income <= 1817000) {
      tax = 251258 + (income - 857900) * 0.41;
    } else {
      tax = 644489 + (income - 1817000) * 0.45;
    }

    const primaryRebate = 17235;
    const finalTax = Math.max(0, tax - primaryRebate);

    setIncomeTaxResult({
      grossIncome: income,
      taxableIncome: income,
      taxBeforeRebate: tax,
      primaryRebate: primaryRebate,
      totalTax: finalTax,
      effectiveRate: ((finalTax / income) * 100).toFixed(2),
      netIncome: income - finalTax
    });
  };

  const calculateVAT = () => {
    const amt = parseFloat(amount);
    const rate = parseFloat(vatRate) / 100;
    if (isNaN(amt)) return;

    if (vatType === 'add') {
      const vatAmount = amt * rate;
      setVatResult({
        original: amt,
        vatAmount: vatAmount,
        total: amt + vatAmount
      });
    } else {
      const baseAmount = amt / (1 + rate);
      const vatAmount = amt - baseAmount;
      setVatResult({
        original: amt,
        vatAmount: vatAmount,
        baseAmount: baseAmount
      });
    }
  };

  const calculatePAYE = () => {
    const monthly = parseFloat(monthlyIncome);
    if (isNaN(monthly)) return;

    const annual = monthly * 12;
    let annualTax = 0;

    if (annual <= 237100) {
      annualTax = annual * 0.18;
    } else if (annual <= 370500) {
      annualTax = 42678 + (annual - 237100) * 0.26;
    } else if (annual <= 512800) {
      annualTax = 77362 + (annual - 370500) * 0.31;
    } else if (annual <= 673000) {
      annualTax = 121475 + (annual - 512800) * 0.36;
    } else if (annual <= 857900) {
      annualTax = 179147 + (annual - 673000) * 0.39;
    } else if (annual <= 1817000) {
      annualTax = 251258 + (annual - 857900) * 0.41;
    } else {
      annualTax = 644489 + (annual - 1817000) * 0.45;
    }

    const primaryRebate = 17235;
    const finalAnnualTax = Math.max(0, annualTax - primaryRebate);
    const monthlyPAYE = finalAnnualTax / 12;

    setPayeResult({
      monthlyGross: monthly,
      annualGross: annual,
      monthlyPAYE: monthlyPAYE,
      annualPAYE: finalAnnualTax,
      monthlyNet: monthly - monthlyPAYE
    });
  };

  const calculateCGT = () => {
    const purchase = parseFloat(purchasePrice);
    const selling = parseFloat(sellingPrice);
    const excl = parseFloat(exclusion);
    if (isNaN(purchase) || isNaN(selling)) return;

    const capitalGain = selling - purchase;
    const taxableGain = Math.max(0, capitalGain - excl);
    const inclusionRate = 0.4; // 40% for individuals
    const taxableAmount = taxableGain * inclusionRate;

    // Assuming max tax rate of 45%
    const cgtPayable = taxableAmount * 0.45;

    setCgtResult({
      capitalGain: capitalGain,
      exclusion: excl,
      taxableGain: taxableGain,
      inclusionRate: (inclusionRate * 100),
      taxableAmount: taxableAmount,
      estimatedCGT: cgtPayable,
      netProceeds: selling - cgtPayable
    });
  };

  const calculateProvisionalTax = () => {
    const income = parseFloat(estimatedIncome);
    if (isNaN(income)) return;

    let tax = 0;
    if (income <= 237100) {
      tax = income * 0.18;
    } else if (income <= 370500) {
      tax = 42678 + (income - 237100) * 0.26;
    } else if (income <= 512800) {
      tax = 77362 + (income - 370500) * 0.31;
    } else if (income <= 673000) {
      tax = 121475 + (income - 512800) * 0.36;
    } else if (income <= 857900) {
      tax = 179147 + (income - 673000) * 0.39;
    } else if (income <= 1817000) {
      tax = 251258 + (income - 857900) * 0.41;
    } else {
      tax = 644489 + (income - 1817000) * 0.45;
    }

    const primaryRebate = 17235;
    const finalTax = Math.max(0, tax - primaryRebate);
    const firstPayment = finalTax * 0.5; // 50% due by end Aug
    const secondPayment = finalTax - firstPayment; // Balance due by end Feb

    setProvisionalResult({
      estimatedIncome: income,
      estimatedTax: finalTax,
      firstPayment: firstPayment,
      secondPayment: secondPayment,
      firstDueDate: 'End of August',
      secondDueDate: 'End of February'
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
          <Percent className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Tax Calculators</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 max-w-6xl mx-auto">
          {/* Income Tax Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Income Tax Calculator</CardTitle>
              <CardDescription>Calculate SARS income tax based on 2024/2025 tax tables</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Annual Income (R)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tax Year</Label>
                  <Select value={taxYear} onValueChange={setTaxYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024/2025</SelectItem>
                      <SelectItem value="2023">2023/2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={calculateIncomeTax} className="w-full">Calculate Tax</Button>
              {incomeTaxResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Gross Income:</span>
                    <span className="font-semibold">R {incomeTaxResult.grossIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax Before Rebate:</span>
                    <span>R {incomeTaxResult.taxBeforeRebate.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Primary Rebate:</span>
                    <span>-R {incomeTaxResult.primaryRebate.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total Tax:</span>
                    <span className="text-primary">R {incomeTaxResult.totalTax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Effective Rate:</span>
                    <span>{incomeTaxResult.effectiveRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Income:</span>
                    <span className="font-semibold">R {incomeTaxResult.netIncome.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* VAT Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>VAT Calculator</CardTitle>
              <CardDescription>Add or remove VAT from amounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Amount (R)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Operation</Label>
                  <Select value={vatType} onValueChange={setVatType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">Add VAT</SelectItem>
                      <SelectItem value="remove">Remove VAT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>VAT Rate (%)</Label>
                  <Select value={vatRate} onValueChange={setVatRate}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15%</SelectItem>
                      <SelectItem value="14">14%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={calculateVAT} className="w-full">Calculate VAT</Button>
              {vatResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  {vatType === 'add' ? (
                    <>
                      <div className="flex justify-between">
                        <span>Amount Excluding VAT:</span>
                        <span>R {vatResult.original.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>VAT ({vatRate}%):</span>
                        <span>R {vatResult.vatAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total Including VAT:</span>
                        <span className="text-primary">R {vatResult.total.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Amount Including VAT:</span>
                        <span>R {vatResult.original.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>VAT ({vatRate}%):</span>
                        <span>R {vatResult.vatAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Base Amount:</span>
                        <span className="text-primary">R {vatResult.baseAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* PAYE Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>PAYE Calculator</CardTitle>
              <CardDescription>Calculate monthly Pay As You Earn tax</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Monthly Income (R)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                />
              </div>
              <Button onClick={calculatePAYE} className="w-full">Calculate PAYE</Button>
              {payeResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Monthly Gross:</span>
                    <span>R {payeResult.monthlyGross.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Monthly PAYE:</span>
                    <span className="text-primary">R {payeResult.monthlyPAYE.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Net:</span>
                    <span className="font-semibold">R {payeResult.monthlyNet.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t">
                    <span>Annual PAYE:</span>
                    <span>R {payeResult.annualPAYE.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Capital Gains Tax Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Capital Gains Tax Calculator</CardTitle>
              <CardDescription>Calculate CGT on asset disposal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Purchase Price (R)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Selling Price (R)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Annual Exclusion (R)</Label>
                  <Input
                    type="number"
                    placeholder="40000"
                    value={exclusion}
                    onChange={(e) => setExclusion(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={calculateCGT} className="w-full">Calculate CGT</Button>
              {cgtResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Capital Gain:</span>
                    <span>R {cgtResult.capitalGain.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Annual Exclusion:</span>
                    <span>-R {cgtResult.exclusion.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxable Gain:</span>
                    <span>R {cgtResult.taxableGain.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inclusion Rate:</span>
                    <span>{cgtResult.inclusionRate}%</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Estimated CGT:</span>
                    <span className="text-primary">R {cgtResult.estimatedCGT.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Proceeds:</span>
                    <span className="font-semibold">R {cgtResult.netProceeds.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Provisional Tax Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Provisional Tax Calculator</CardTitle>
              <CardDescription>Calculate provisional tax payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Estimated Annual Income (R)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={estimatedIncome}
                  onChange={(e) => setEstimatedIncome(e.target.value)}
                />
              </div>
              <Button onClick={calculateProvisionalTax} className="w-full">Calculate Provisional Tax</Button>
              {provisionalResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Estimated Income:</span>
                    <span>R {provisionalResult.estimatedIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Tax:</span>
                    <span>R {provisionalResult.estimatedTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>1st Payment ({provisionalResult.firstDueDate}):</span>
                    <span className="text-primary">R {provisionalResult.firstPayment.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>2nd Payment ({provisionalResult.secondDueDate}):</span>
                    <span className="text-primary">R {provisionalResult.secondPayment.toFixed(2)}</span>
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
