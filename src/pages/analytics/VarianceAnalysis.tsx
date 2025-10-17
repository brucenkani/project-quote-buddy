import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, Download, AlertCircle, Target } from 'lucide-react';
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
    { category: 'Rent & Utilities', budget: 50000, actual: 51500, variance: -1500, variancePct: -3.0, status: 'unfavorable' },
  ];

  const costAnalysisData = [
    { department: 'Production', budget: 450000, actual: 478000, variance: -28000, efficiency: 94.2 },
    { department: 'Sales', budget: 180000, actual: 165000, variance: 15000, efficiency: 109.1 },
    { department: 'Administration', budget: 120000, actual: 118500, variance: 1500, efficiency: 101.3 },
    { department: 'IT', budget: 85000, actual: 92000, variance: -7000, efficiency: 92.4 },
  ];

  const performanceGaps = [
    { 
      metric: 'Revenue Target', 
      target: 1000000, 
      actual: 1125000, 
      gap: 125000, 
      impact: 'High',
      action: 'Maintain current sales strategies and expand to new markets'
    },
    { 
      metric: 'Cost Control', 
      target: 500000, 
      actual: 562500, 
      gap: -62500, 
      impact: 'High',
      action: 'Review supplier contracts and implement cost reduction initiatives'
    },
    { 
      metric: 'Marketing ROI', 
      target: 80000, 
      actual: 92000, 
      gap: -12000, 
      impact: 'Medium',
      action: 'Optimize marketing channels and improve campaign efficiency'
    },
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

  const handleDownload = (reportType: string) => {
    toast({
      title: "Downloading Report",
      description: `${reportType} is being generated...`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/calculators')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <TrendingUp className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Variance Analysis</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Quick Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Variance Calculator</CardTitle>
              <CardDescription>Calculate variance for any budget item</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Budget Amount (R)</Label>
                  <Input 
                    type="number" 
                    value={budgetAmount} 
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    placeholder="e.g., 100000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Actual Amount (R)</Label>
                  <Input 
                    type="number" 
                    value={actualAmount} 
                    onChange={(e) => setActualAmount(e.target.value)}
                    placeholder="e.g., 95000"
                  />
                </div>
              </div>
              <Button onClick={calculateVariance} className="w-full">Calculate Variance</Button>
              
              {varianceResult && (
                <div className={`p-4 border-2 rounded-lg ${varianceResult.status === 'favorable' ? 'border-green-500/20 bg-green-50 dark:bg-green-950' : 'border-red-500/20 bg-red-50 dark:bg-red-950'}`}>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="text-lg font-bold">R {varianceResult.budget.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Actual</p>
                      <p className="text-lg font-bold">R {varianceResult.actual.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Variance</p>
                      <p className={`text-lg font-bold ${varianceResult.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R {varianceResult.variance.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">% Variance</p>
                      <p className={`text-lg font-bold ${varianceResult.variancePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {varianceResult.variancePct}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="budget" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="budget">Budget Variance</TabsTrigger>
              <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
              <TabsTrigger value="gaps">Performance Gaps</TabsTrigger>
              <TabsTrigger value="actions">Corrective Actions</TabsTrigger>
            </TabsList>

            {/* Budget Variance Tracking */}
            <TabsContent value="budget" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Budget Variance Tracking</CardTitle>
                      <CardDescription>Comprehensive budget vs actual comparison</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => handleDownload('Budget Variance Report')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {varianceData.map((item, index) => (
                    <div key={index} className={`p-4 border rounded-lg ${item.status === 'favorable' ? 'border-green-500/20 bg-green-50 dark:bg-green-950' : 'border-red-500/20 bg-red-50 dark:bg-red-950'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{item.category}</h3>
                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${item.status === 'favorable' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                          {item.status === 'favorable' ? '✓ Favorable' : '⚠ Unfavorable'}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Budget</p>
                          <p className="font-semibold">R {item.budget.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Actual</p>
                          <p className="font-semibold">R {item.actual.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Variance</p>
                          <p className={`font-semibold ${item.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R {item.variance.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">% Variance</p>
                          <p className={`font-semibold ${item.variancePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.variancePct > 0 ? '+' : ''}{item.variancePct}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="grid md:grid-cols-3 gap-4 pt-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Total Favorable</p>
                      <p className="text-2xl font-bold text-green-600">R 143,000</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Total Unfavorable</p>
                      <p className="text-2xl font-bold text-red-600">R 76,000</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Net Variance</p>
                      <p className="text-2xl font-bold text-green-600">R 67,000</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cost Analysis */}
            <TabsContent value="cost" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Department Cost Analysis</CardTitle>
                      <CardDescription>Detailed cost breakdown by department</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => handleDownload('Cost Analysis Report')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {costAnalysisData.map((dept, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">{dept.department}</h3>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Efficiency</p>
                          <p className={`text-lg font-bold ${dept.efficiency >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                            {dept.efficiency}%
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Budget</p>
                          <p className="font-semibold">R {dept.budget.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Actual</p>
                          <p className="font-semibold">R {dept.actual.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Variance</p>
                          <p className={`font-semibold ${dept.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R {dept.variance.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${dept.efficiency >= 100 ? 'bg-green-600' : 'bg-red-600'}`}
                              style={{ width: `${Math.min(dept.efficiency, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{dept.efficiency}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Gaps */}
            <TabsContent value="gaps" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Performance Gap Analysis</CardTitle>
                      <CardDescription>Identify and prioritize performance gaps</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => handleDownload('Gap Analysis Report')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {performanceGaps.map((gap, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{gap.metric}</h3>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              gap.impact === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
                              gap.impact === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300' :
                              'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                            }`}>
                              {gap.impact} Impact
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${gap.gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R {Math.abs(gap.gap).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {gap.gap >= 0 ? 'Above' : 'Below'} Target
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Target</p>
                          <p className="font-semibold">R {gap.target.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Actual</p>
                          <p className="font-semibold">R {gap.actual.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Recommended Action</p>
                        <p className="text-sm">{gap.action}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Corrective Actions */}
            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Corrective Action Plan</CardTitle>
                  <CardDescription>Strategic initiatives to address variances</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-950 rounded">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">Priority: High - Cost of Sales Overrun</h3>
                          <p className="text-sm mb-2">R 62,500 over budget (-12.5%)</p>
                          <div className="space-y-1 text-sm">
                            <p className="font-medium">Actions:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                              <li>Renegotiate supplier contracts immediately</li>
                              <li>Implement inventory optimization</li>
                              <li>Review pricing strategy</li>
                              <li>Target: Reduce by R 40,000 in Q2</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950 rounded">
                      <div className="flex items-start gap-3">
                        <Target className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">Priority: Medium - Marketing Efficiency</h3>
                          <p className="text-sm mb-2">R 12,000 over budget (-15%)</p>
                          <div className="space-y-1 text-sm">
                            <p className="font-medium">Actions:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                              <li>Analyze campaign ROI by channel</li>
                              <li>Shift budget to high-performing channels</li>
                              <li>Reduce low-conversion ad spend</li>
                              <li>Target: Improve ROI by 20% in 60 days</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-950 rounded">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">Success: Revenue Growth</h3>
                          <p className="text-sm mb-2">R 125,000 above budget (+12.5%)</p>
                          <div className="space-y-1 text-sm">
                            <p className="font-medium">Actions:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                              <li>Document successful strategies</li>
                              <li>Scale winning initiatives</li>
                              <li>Share best practices across teams</li>
                              <li>Target: Maintain 10%+ growth rate</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
