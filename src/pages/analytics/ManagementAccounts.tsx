import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BarChart3, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ManagementAccounts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [periodType, setPeriodType] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState('2024');
  
  // Sample data for demonstration
  const incomeStatement = {
    revenue: 1250000,
    costOfSales: 625000,
    grossProfit: 625000,
    operatingExpenses: 325000,
    ebitda: 300000,
    depreciation: 50000,
    ebit: 250000,
    interestExpense: 25000,
    taxExpense: 56250,
    netIncome: 168750,
  };

  const balanceSheet = {
    assets: {
      currentAssets: 450000,
      fixedAssets: 850000,
      totalAssets: 1300000,
    },
    liabilities: {
      currentLiabilities: 180000,
      longTermDebt: 420000,
      totalLiabilities: 600000,
    },
    equity: {
      shareCapital: 500000,
      retainedEarnings: 200000,
      totalEquity: 700000,
    },
  };

  const cashFlowStatement = {
    operatingActivities: 185000,
    investingActivities: -125000,
    financingActivities: -35000,
    netCashFlow: 25000,
    openingCash: 75000,
    closingCash: 100000,
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
              <Button variant="ghost" size="sm" onClick={() => navigate('/knowledge')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Management Accounts</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Reporting Controls</CardTitle>
              <CardDescription>Select period and format for comprehensive financial reporting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Period Type</Label>
                  <Select value={periodType} onValueChange={setPeriodType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quick Actions</Label>
                  <Button className="w-full" onClick={() => handleDownload('Complete Report Package')}>
                    <Download className="h-4 w-4 mr-2" />
                    Download All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Statements Tabs */}
          <Tabs defaultValue="income" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="income">Income Statement</TabsTrigger>
              <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
              <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
              <TabsTrigger value="management">Management Report</TabsTrigger>
            </TabsList>

            {/* Income Statement */}
            <TabsContent value="income" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Income Statement</CardTitle>
                      <CardDescription>Comprehensive profit and loss analysis</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => handleDownload('Income Statement')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="font-semibold">Revenue</span>
                        <span className="font-semibold">R {incomeStatement.revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 pl-4">
                        <span>Cost of Sales</span>
                        <span className="text-red-600">(R {incomeStatement.costOfSales.toLocaleString()})</span>
                      </div>
                      <div className="flex justify-between items-center py-2 bg-primary/5 px-4 rounded">
                        <span className="font-semibold">Gross Profit</span>
                        <span className="font-semibold text-green-600">R {incomeStatement.grossProfit.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 pl-4">
                        <span>Operating Expenses</span>
                        <span className="text-red-600">(R {incomeStatement.operatingExpenses.toLocaleString()})</span>
                      </div>
                      <div className="flex justify-between items-center py-2 bg-primary/5 px-4 rounded">
                        <span className="font-semibold">EBITDA</span>
                        <span className="font-semibold">R {incomeStatement.ebitda.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 pl-4">
                        <span>Depreciation & Amortization</span>
                        <span className="text-red-600">(R {incomeStatement.depreciation.toLocaleString()})</span>
                      </div>
                      <div className="flex justify-between items-center py-2 bg-primary/5 px-4 rounded">
                        <span className="font-semibold">EBIT</span>
                        <span className="font-semibold">R {incomeStatement.ebit.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 pl-4">
                        <span>Interest Expense</span>
                        <span className="text-red-600">(R {incomeStatement.interestExpense.toLocaleString()})</span>
                      </div>
                      <div className="flex justify-between items-center py-2 pl-4">
                        <span>Tax Expense</span>
                        <span className="text-red-600">(R {incomeStatement.taxExpense.toLocaleString()})</span>
                      </div>
                      <div className="flex justify-between items-center py-3 bg-primary/10 px-4 rounded font-bold text-lg">
                        <span>Net Income</span>
                        <span className="text-green-600">R {incomeStatement.netIncome.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Gross Margin</p>
                        <p className="text-2xl font-bold">50.0%</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Operating Margin</p>
                        <p className="text-2xl font-bold">20.0%</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Net Margin</p>
                        <p className="text-2xl font-bold">13.5%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Balance Sheet */}
            <TabsContent value="balance" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Balance Sheet</CardTitle>
                      <CardDescription>Financial position snapshot</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => handleDownload('Balance Sheet')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Assets */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg border-b pb-2">Assets</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between py-1">
                          <span>Current Assets</span>
                          <span>R {balanceSheet.assets.currentAssets.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>Fixed Assets</span>
                          <span>R {balanceSheet.assets.fixedAssets.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-2 bg-primary/5 px-3 rounded font-semibold">
                          <span>Total Assets</span>
                          <span>R {balanceSheet.assets.totalAssets.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Liabilities & Equity */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg border-b pb-2">Liabilities & Equity</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between py-1">
                          <span>Current Liabilities</span>
                          <span>R {balanceSheet.liabilities.currentLiabilities.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>Long-term Debt</span>
                          <span>R {balanceSheet.liabilities.longTermDebt.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>Share Capital</span>
                          <span>R {balanceSheet.equity.shareCapital.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>Retained Earnings</span>
                          <span>R {balanceSheet.equity.retainedEarnings.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-2 bg-primary/5 px-3 rounded font-semibold">
                          <span>Total Liab. & Equity</span>
                          <span>R {balanceSheet.assets.totalAssets.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Current Ratio</p>
                      <p className="text-2xl font-bold">2.5</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Debt-to-Equity</p>
                      <p className="text-2xl font-bold">0.86</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Working Capital</p>
                      <p className="text-2xl font-bold">R 270k</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cash Flow */}
            <TabsContent value="cashflow" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Cash Flow Statement</CardTitle>
                      <CardDescription>Cash movement analysis</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => handleDownload('Cash Flow Statement')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 bg-green-50 dark:bg-green-950 px-4 rounded">
                        <span className="font-semibold">Operating Activities</span>
                        <span className="font-semibold text-green-600">R {cashFlowStatement.operatingActivities.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 bg-red-50 dark:bg-red-950 px-4 rounded">
                        <span className="font-semibold">Investing Activities</span>
                        <span className="font-semibold text-red-600">R {cashFlowStatement.investingActivities.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 bg-red-50 dark:bg-red-950 px-4 rounded">
                        <span className="font-semibold">Financing Activities</span>
                        <span className="font-semibold text-red-600">R {cashFlowStatement.financingActivities.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex justify-between items-center py-2">
                        <span className="font-semibold">Net Cash Flow</span>
                        <span className="font-semibold text-green-600">R {cashFlowStatement.netCashFlow.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span>Opening Cash Balance</span>
                        <span>R {cashFlowStatement.openingCash.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 bg-primary/10 px-4 rounded font-bold text-lg">
                        <span>Closing Cash Balance</span>
                        <span className="text-green-600">R {cashFlowStatement.closingCash.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Cash Conversion Cycle</p>
                        <p className="text-2xl font-bold">32 days</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Free Cash Flow</p>
                        <p className="text-2xl font-bold">R 60k</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Management Report */}
            <TabsContent value="management" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Management Report</CardTitle>
                      <CardDescription>Executive summary and key insights</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => handleDownload('Management Report')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Revenue Growth</span>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold">+12.5%</p>
                        <p className="text-xs text-muted-foreground mt-1">vs previous period</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Expense Ratio</span>
                          <TrendingDown className="h-4 w-4 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold">26.0%</p>
                        <p className="text-xs text-muted-foreground mt-1">improved efficiency</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Return on Assets</span>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold">13.0%</p>
                        <p className="text-xs text-muted-foreground mt-1">strong performance</p>
                      </div>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold mb-3">Key Highlights</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Revenue increased by 12.5% compared to the previous period, driven by strong sales growth</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Operating expenses remained controlled at 26% of revenue, showing improved efficiency</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Cash flow from operations remained positive, ensuring healthy liquidity position</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-600 mt-1">⚠</span>
                          <span>Working capital management requires attention to optimize cash conversion cycle</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold mb-3">Recommendations</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">→</span>
                          <span>Focus on maintaining gross margin while scaling operations</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">→</span>
                          <span>Consider strategic investments in growth opportunities</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">→</span>
                          <span>Monitor cash flow closely and optimize working capital</span>
                        </li>
                      </ul>
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
