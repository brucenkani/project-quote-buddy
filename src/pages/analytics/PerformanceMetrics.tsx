import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, PieChart, TrendingUp, TrendingDown, Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PerformanceMetrics() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const kpiData = {
    revenue: { value: 1250000, change: 12.5, trend: 'up' },
    profit: { value: 168750, change: 15.3, trend: 'up' },
    customers: { value: 1840, change: 8.7, trend: 'up' },
    retention: { value: 92.5, change: 2.1, trend: 'up' },
  };

  const profitabilityMetrics = [
    { name: 'Gross Profit Margin', value: 50.0, benchmark: 45.0, status: 'good' },
    { name: 'Operating Profit Margin', value: 20.0, benchmark: 18.0, status: 'good' },
    { name: 'Net Profit Margin', value: 13.5, benchmark: 12.0, status: 'good' },
    { name: 'Return on Assets (ROA)', value: 13.0, benchmark: 10.0, status: 'good' },
    { name: 'Return on Equity (ROE)', value: 24.1, benchmark: 20.0, status: 'good' },
    { name: 'Return on Investment (ROI)', value: 28.5, benchmark: 25.0, status: 'good' },
  ];

  const efficiencyMetrics = [
    { name: 'Asset Turnover', value: 0.96, benchmark: 0.85, unit: 'x' },
    { name: 'Inventory Turnover', value: 8.5, benchmark: 7.0, unit: 'x' },
    { name: 'Days Sales Outstanding', value: 32, benchmark: 35, unit: 'days', inverse: true },
    { name: 'Operating Expense Ratio', value: 26.0, benchmark: 28.0, unit: '%', inverse: true },
    { name: 'Employee Productivity', value: 125000, benchmark: 110000, unit: 'R' },
  ];

  const growthMetrics = [
    { name: 'Revenue Growth Rate', value: 12.5, benchmark: 10.0 },
    { name: 'Customer Growth Rate', value: 8.7, benchmark: 7.0 },
    { name: 'Market Share Growth', value: 2.3, benchmark: 1.5 },
    { name: 'Product Line Expansion', value: 15.0, benchmark: 12.0 },
  ];

  const handleRefresh = () => {
    toast({
      title: "Refreshing Data",
      description: "Performance metrics are being updated...",
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
              <Button variant="ghost" size="sm" onClick={() => navigate('/calculators')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <PieChart className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Performance Metrics</h1>
              </div>
            </div>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* KPI Dashboard Overview */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold">R {(kpiData.revenue.value / 1000).toFixed(0)}k</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">{kpiData.revenue.change}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Net Profit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold">R {(kpiData.profit.value / 1000).toFixed(0)}k</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">{kpiData.profit.change}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Active Customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold">{kpiData.customers.value.toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">{kpiData.customers.change}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Retention Rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold">{kpiData.retention.value}%</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">{kpiData.retention.change}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics Tabs */}
          <Tabs defaultValue="profitability" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profitability">Profitability</TabsTrigger>
              <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
              <TabsTrigger value="growth">Growth Indicators</TabsTrigger>
            </TabsList>

            {/* Profitability Analysis */}
            <TabsContent value="profitability" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Profitability Analysis</CardTitle>
                      <CardDescription>Comprehensive profit margin and return metrics</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => handleDownload('Profitability Report')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profitabilityMetrics.map((metric, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{metric.name}</h3>
                            <p className="text-sm text-muted-foreground">Industry Benchmark: {metric.benchmark}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{metric.value}%</p>
                            <div className="flex items-center gap-1 justify-end">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600">Above Benchmark</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all" 
                              style={{ width: `${Math.min((metric.value / metric.benchmark) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{((metric.value / metric.benchmark - 1) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Key Insights</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>All profitability metrics exceed industry benchmarks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>Strong ROE indicates efficient use of shareholder capital</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>Healthy gross margin provides cushion for operational expenses</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Efficiency Metrics */}
            <TabsContent value="efficiency" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Efficiency Metrics</CardTitle>
                      <CardDescription>Operational efficiency and productivity indicators</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => handleDownload('Efficiency Report')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {efficiencyMetrics.map((metric, index) => {
                      const isGood = metric.inverse 
                        ? metric.value < metric.benchmark 
                        : metric.value > metric.benchmark;
                      
                      return (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold">{metric.name}</h3>
                              <p className="text-sm text-muted-foreground">Benchmark: {metric.benchmark} {metric.unit}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold">{metric.value.toLocaleString()} {metric.unit}</p>
                              <div className="flex items-center gap-1 justify-end">
                                {isGood ? (
                                  <>
                                    <TrendingUp className="h-3 w-3 text-green-600" />
                                    <span className="text-xs text-green-600">Good</span>
                                  </>
                                ) : (
                                  <>
                                    <TrendingDown className="h-3 w-3 text-yellow-600" />
                                    <span className="text-xs text-yellow-600">Fair</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Efficiency Summary</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>Strong inventory turnover indicates effective stock management</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>Operating expenses well-controlled relative to revenue</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>Employee productivity exceeds industry averages</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Growth Indicators */}
            <TabsContent value="growth" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Growth Indicators</CardTitle>
                      <CardDescription>Business expansion and development metrics</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => handleDownload('Growth Report')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {growthMetrics.map((metric, index) => {
                      const variance = ((metric.value - metric.benchmark) / metric.benchmark * 100);
                      return (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{metric.name}</h3>
                              <p className="text-sm text-muted-foreground">Target: {metric.benchmark}%</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">{metric.value}%</p>
                              <div className="flex items-center gap-1 justify-end">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600">+{variance.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full transition-all" 
                                style={{ width: `${(metric.value / metric.benchmark) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Compound Annual Growth</p>
                      <p className="text-2xl font-bold">18.3%</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Market Position</p>
                      <p className="text-2xl font-bold">Top 10%</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Growth Trajectory</p>
                      <p className="text-2xl font-bold text-green-600">Accelerating</p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Growth Analysis</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>All growth indicators exceed strategic targets</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>Customer base expanding faster than market average</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>Product diversification strategy showing positive results</span>
                      </li>
                    </ul>
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
