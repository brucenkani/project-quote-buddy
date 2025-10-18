import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, Calculator, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FinancialForecasting() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Revenue Forecast States
  const [currentRevenue, setCurrentRevenue] = useState('');
  const [growthRate, setGrowthRate] = useState('');
  const [forecastPeriods, setForecastPeriods] = useState('12');
  const [revenueForecast, setRevenueForecast] = useState<any>(null);

  // Expense Projection States
  const [fixedCosts, setFixedCosts] = useState('');
  const [variableCostRate, setVariableCostRate] = useState('');
  const [inflationRate, setInflationRate] = useState('');
  const [expenseProjection, setExpenseProjection] = useState<any>(null);

  // Scenario Analysis States
  const [baseCase, setBaseCase] = useState('');
  const [optimisticVar, setOptimisticVar] = useState('');
  const [pessimisticVar, setPessimisticVar] = useState('');
  const [scenarioResults, setScenarioResults] = useState<any>(null);

  // Budget Planning States
  const [totalBudget, setTotalBudget] = useState('');
  const [budgetCategories, setBudgetCategories] = useState([
    { name: 'Operations', percentage: 40 },
    { name: 'Marketing', percentage: 20 },
    { name: 'R&D', percentage: 15 },
    { name: 'Admin', percentage: 15 },
    { name: 'Other', percentage: 10 },
  ]);

  const calculateRevenueForecast = () => {
    const revenue = parseFloat(currentRevenue);
    const growth = parseFloat(growthRate) / 100;
    const periods = parseInt(forecastPeriods);

    if (isNaN(revenue) || isNaN(growth) || isNaN(periods)) return;

    const forecast = [];
    for (let i = 1; i <= periods; i++) {
      const periodRevenue = revenue * Math.pow(1 + growth, i);
      forecast.push({
        period: i,
        revenue: periodRevenue,
        growth: growth * 100,
        cumulativeGrowth: ((periodRevenue - revenue) / revenue * 100).toFixed(2)
      });
    }

    setRevenueForecast({
      startingRevenue: revenue,
      endingRevenue: forecast[forecast.length - 1].revenue,
      totalGrowth: ((forecast[forecast.length - 1].revenue - revenue) / revenue * 100).toFixed(2),
      forecast
    });
  };

  const calculateExpenseProjection = () => {
    const fixed = parseFloat(fixedCosts);
    const variableRate = parseFloat(variableCostRate) / 100;
    const inflation = parseFloat(inflationRate) / 100;

    if (isNaN(fixed) || isNaN(variableRate) || isNaN(inflation)) return;

    const projections = [];
    const baseRevenue = revenueForecast?.startingRevenue || 100000;

    for (let i = 1; i <= 12; i++) {
      const projectedRevenue = baseRevenue * Math.pow(1.05, i);
      const variableCost = projectedRevenue * variableRate;
      const inflatedFixed = fixed * Math.pow(1 + inflation, i);
      const totalExpense = inflatedFixed + variableCost;

      projections.push({
        period: i,
        fixedCost: inflatedFixed,
        variableCost: variableCost,
        totalExpense: totalExpense,
        expenseRatio: (totalExpense / projectedRevenue * 100).toFixed(2)
      });
    }

    setExpenseProjection({ projections });
  };

  const calculateScenarioAnalysis = () => {
    const base = parseFloat(baseCase);
    const optimistic = parseFloat(optimisticVar) / 100;
    const pessimistic = parseFloat(pessimisticVar) / 100;

    if (isNaN(base) || isNaN(optimistic) || isNaN(pessimistic)) return;

    const scenarios = {
      pessimistic: base * (1 + pessimistic),
      base: base,
      optimistic: base * (1 + optimistic),
      range: base * optimistic - base * pessimistic
    };

    setScenarioResults(scenarios);
  };

  const handleDownload = (reportType: string) => {
    toast({
      title: "Downloading Forecast",
      description: `${reportType} is being generated...`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/business-analytics')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Financial Forecasting</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="revenue" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="revenue">Revenue Forecasts</TabsTrigger>
              <TabsTrigger value="expenses">Expense Projections</TabsTrigger>
              <TabsTrigger value="scenario">Scenario Analysis</TabsTrigger>
              <TabsTrigger value="budget">Budget Planning</TabsTrigger>
            </TabsList>

            {/* Revenue Forecasts */}
            <TabsContent value="revenue" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Forecast Calculator</CardTitle>
                  <CardDescription>Project future revenue based on growth assumptions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Current Revenue (R)</Label>
                      <Input 
                        type="number" 
                        value={currentRevenue} 
                        onChange={(e) => setCurrentRevenue(e.target.value)}
                        placeholder="e.g., 1000000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Annual Growth Rate (%)</Label>
                      <Input 
                        type="number" 
                        value={growthRate} 
                        onChange={(e) => setGrowthRate(e.target.value)}
                        placeholder="e.g., 15"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Forecast Periods (months)</Label>
                      <Select value={forecastPeriods} onValueChange={setForecastPeriods}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 months</SelectItem>
                          <SelectItem value="12">12 months</SelectItem>
                          <SelectItem value="24">24 months</SelectItem>
                          <SelectItem value="36">36 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={calculateRevenueForecast} className="w-full">
                    <Calculator className="h-4 w-4 mr-2" />
                    Generate Forecast
                  </Button>

                  {revenueForecast && (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Starting Revenue</p>
                          <p className="text-xl font-bold">R {revenueForecast.startingRevenue.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Ending Revenue</p>
                          <p className="text-xl font-bold text-green-600">R {revenueForecast.endingRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Total Growth</p>
                          <p className="text-xl font-bold text-primary">{revenueForecast.totalGrowth}%</p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-primary/10">
                            <tr>
                              <th className="p-2 text-left">Period</th>
                              <th className="p-2 text-right">Projected Revenue</th>
                              <th className="p-2 text-right">Cumulative Growth</th>
                            </tr>
                          </thead>
                          <tbody>
                            {revenueForecast.forecast.map((item: any) => (
                              <tr key={item.period} className="border-b">
                                <td className="p-2">Month {item.period}</td>
                                <td className="p-2 text-right font-semibold">R {item.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                <td className="p-2 text-right text-green-600">{item.cumulativeGrowth}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <Button variant="outline" className="w-full" onClick={() => handleDownload('Revenue Forecast')}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Forecast
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Expense Projections */}
            <TabsContent value="expenses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Expense Projection Calculator</CardTitle>
                  <CardDescription>Project future expenses with inflation and variable costs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Fixed Costs (R/month)</Label>
                      <Input 
                        type="number" 
                        value={fixedCosts} 
                        onChange={(e) => setFixedCosts(e.target.value)}
                        placeholder="e.g., 50000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Variable Cost Rate (%)</Label>
                      <Input 
                        type="number" 
                        value={variableCostRate} 
                        onChange={(e) => setVariableCostRate(e.target.value)}
                        placeholder="e.g., 35"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Annual Inflation Rate (%)</Label>
                      <Input 
                        type="number" 
                        value={inflationRate} 
                        onChange={(e) => setInflationRate(e.target.value)}
                        placeholder="e.g., 4.5"
                      />
                    </div>
                  </div>

                  <Button onClick={calculateExpenseProjection} className="w-full">
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate Projections
                  </Button>

                  {expenseProjection && (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-primary/10">
                            <tr>
                              <th className="p-2 text-left">Period</th>
                              <th className="p-2 text-right">Fixed Costs</th>
                              <th className="p-2 text-right">Variable Costs</th>
                              <th className="p-2 text-right">Total Expense</th>
                              <th className="p-2 text-right">% of Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {expenseProjection.projections.slice(0, 12).map((item: any) => (
                              <tr key={item.period} className="border-b">
                                <td className="p-2">Month {item.period}</td>
                                <td className="p-2 text-right">R {item.fixedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                <td className="p-2 text-right">R {item.variableCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                <td className="p-2 text-right font-semibold">R {item.totalExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                <td className="p-2 text-right">{item.expenseRatio}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <Button variant="outline" className="w-full" onClick={() => handleDownload('Expense Projections')}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Projections
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Scenario Analysis */}
            <TabsContent value="scenario" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Scenario Analysis</CardTitle>
                  <CardDescription>Compare best case, base case, and worst case scenarios</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Base Case Value (R)</Label>
                      <Input 
                        type="number" 
                        value={baseCase} 
                        onChange={(e) => setBaseCase(e.target.value)}
                        placeholder="e.g., 1000000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Optimistic Variance (%)</Label>
                      <Input 
                        type="number" 
                        value={optimisticVar} 
                        onChange={(e) => setOptimisticVar(e.target.value)}
                        placeholder="e.g., 25"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pessimistic Variance (%)</Label>
                      <Input 
                        type="number" 
                        value={pessimisticVar} 
                        onChange={(e) => setPessimisticVar(e.target.value)}
                        placeholder="e.g., -15"
                      />
                    </div>
                  </div>

                  <Button onClick={calculateScenarioAnalysis} className="w-full">
                    <Calculator className="h-4 w-4 mr-2" />
                    Analyze Scenarios
                  </Button>

                  {scenarioResults && (
                    <div className="space-y-4">
                      <div className="grid gap-4">
                        <div className="p-6 border-2 border-red-500/20 bg-red-50 dark:bg-red-950 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-red-700 dark:text-red-300">Pessimistic Scenario</span>
                            <span className="text-sm text-red-600 dark:text-red-400">Worst Case</span>
                          </div>
                          <p className="text-3xl font-bold text-red-700 dark:text-red-300">R {scenarioResults.pessimistic.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        </div>

                        <div className="p-6 border-2 border-primary/50 bg-primary/5 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">Base Case Scenario</span>
                            <span className="text-sm text-muted-foreground">Expected</span>
                          </div>
                          <p className="text-3xl font-bold">R {scenarioResults.base.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        </div>

                        <div className="p-6 border-2 border-green-500/20 bg-green-50 dark:bg-green-950 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-green-700 dark:text-green-300">Optimistic Scenario</span>
                            <span className="text-sm text-green-600 dark:text-green-400">Best Case</span>
                          </div>
                          <p className="text-3xl font-bold text-green-700 dark:text-green-300">R {scenarioResults.optimistic.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Scenario Range:</span>
                          <span className="text-lg font-bold">R {scenarioResults.range.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          This represents the total variance between best and worst case scenarios
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Budget Planning */}
            <TabsContent value="budget" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Planning Tool</CardTitle>
                  <CardDescription>Allocate resources across business categories</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Total Annual Budget (R)</Label>
                    <Input 
                      type="number" 
                      value={totalBudget} 
                      onChange={(e) => setTotalBudget(e.target.value)}
                      placeholder="e.g., 5000000"
                    />
                  </div>

                  {totalBudget && (
                    <div className="space-y-4">
                      <div className="p-4 bg-primary/5 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">Total Budget</p>
                        <p className="text-3xl font-bold">R {parseFloat(totalBudget).toLocaleString()}</p>
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-semibold">Budget Allocation</h3>
                        {budgetCategories.map((category, index) => {
                          const allocation = (parseFloat(totalBudget) * category.percentage / 100);
                          return (
                            <div key={index} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{category.name}</span>
                                <span className="text-sm text-muted-foreground">{category.percentage}%</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex-1 bg-muted rounded-full h-2 mr-4">
                                  <div 
                                    className="bg-primary h-2 rounded-full" 
                                    style={{ width: `${category.percentage}%` }}
                                  />
                                </div>
                                <span className="font-bold">R {allocation.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <Button variant="outline" className="w-full" onClick={() => handleDownload('Budget Plan')}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Budget Plan
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
