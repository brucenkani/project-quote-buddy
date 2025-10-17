import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, TrendingUp, Download, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VarianceAnalysis() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [budgetAmount, setBudgetAmount] = useState('');
  const [actualAmount, setActualAmount] = useState('');
  const [varianceResult, setVarianceResult] = useState<any>(null);

  const varianceData = [
    { category: 'Revenue', budget: 1000000, actual: 1125000, variance: 125000, variancePct: 12.5, status: 'favorable' },
    { category: 'Cost of Sales', budget: 500000, actual: 562500, variance: -62500, variancePct: -12.5, status: 'unfavorable' },
    { category: 'Operating Expenses', budget: 300000, actual: 285000, variance: 15000, variancePct: 5.0, status: 'favorable' },
    { category: 'Marketing', budget: 80000, actual: 92000, variance: -12000, variancePct: -15.0, status: 'unfavorable' },
    { category: 'Salaries', budget: 200000, actual: 198000, variance: 2000, variancePct: 1.0, status: 'favorable' },
  ];

  const calculateVariance = () => {
    const budget = parseFloat(budgetAmount);
    const actual = parseFloat(actualAmount);
    
    if (isNaN(budget) || isNaN(actual)) return;

    const variance = actual - budget;
    const variancePct = (variance / budget) * 100;

    setVarianceResult({
      budget,
      actual,
      variance,
      variancePct: variancePct.toFixed(2),
      status: variance >= 0 ? 'favorable' : 'unfavorable'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/calculators')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <TrendingUp className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Variance Analysis</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Budget Variance Tracking</CardTitle>
            <CardDescription>Compare actual performance against budget</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {varianceData.map((item, index) => (
              <div key={index} className={`p-4 border rounded-lg ${item.status === 'favorable' ? 'border-green-500/20 bg-green-50 dark:bg-green-950' : 'border-red-500/20 bg-red-50 dark:bg-red-950'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{item.category}</h3>
                  <span className={`text-sm font-medium ${item.status === 'favorable' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.status === 'favorable' ? '✓ Favorable' : '⚠ Unfavorable'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Budget</p>
                    <p className="font-semibold">R {item.budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Actual</p>
                    <p className="font-semibold">R {item.actual.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Variance</p>
                    <p className={`font-semibold ${item.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R {item.variance.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">% Variance</p>
                    <p className={`font-semibold ${item.variancePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.variancePct > 0 ? '+' : ''}{item.variancePct}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
