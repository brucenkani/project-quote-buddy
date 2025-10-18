import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, Calculator, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { calculateFormula, formatFormulaResult } from '@/utils/formulaCalculations';

export default function FinancialForecasting() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Data source states
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<string>('');
  const [dataColumns, setDataColumns] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<any[]>([]);

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

  // Financial Formula States
  const [fvRate, setFvRate] = useState('');
  const [fvNper, setFvNper] = useState('');
  const [fvPmt, setFvPmt] = useState('');
  const [fvPv, setFvPv] = useState('');
  const [fvFrequency, setFvFrequency] = useState('1');
  const [fvResult, setFvResult] = useState<number | null>(null);

  const [pvRate, setPvRate] = useState('');
  const [pvNper, setPvNper] = useState('');
  const [pvPmt, setPvPmt] = useState('');
  const [pvFv, setPvFv] = useState('');
  const [pvFrequency, setPvFrequency] = useState('1');
  const [pvResult, setPvResult] = useState<number | null>(null);

  const [pmtRate, setPmtRate] = useState('');
  const [pmtNper, setPmtNper] = useState('');
  const [pmtPv, setPmtPv] = useState('');
  const [pmtFv, setPmtFv] = useState('');
  const [pmtFrequency, setPmtFrequency] = useState('1');
  const [pmtResult, setPmtResult] = useState<number | null>(null);

  const [rateNper, setRateNper] = useState('');
  const [ratePmt, setRatePmt] = useState('');
  const [ratePv, setRatePv] = useState('');
  const [rateFv, setRateFv] = useState('');
  const [rateFrequency, setRateFrequency] = useState('1');
  const [rateResult, setRateResult] = useState<number | null>(null);

  // Budget Planning States
  const [totalBudget, setTotalBudget] = useState('');
  const [budgetCategories, setBudgetCategories] = useState([
    { name: 'Operations', percentage: 40 },
    { name: 'Marketing', percentage: 20 },
    { name: 'R&D', percentage: 15 },
    { name: 'Admin', percentage: 15 },
    { name: 'Other', percentage: 10 },
  ]);

  // Load data sources
  useEffect(() => {
    loadDataSources();
  }, []);

  // Load data when data source is selected
  useEffect(() => {
    if (selectedDataSource) {
      loadDataSourceContent(selectedDataSource);
    }
  }, [selectedDataSource]);

  const loadDataSources = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('data_sources')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDataSources(data);
    }
  };

  const loadDataSourceContent = async (dataSourceId: string) => {
    const source = dataSources.find(ds => ds.id === dataSourceId);
    if (!source) return;

    const columns = source.columns || [];
    const data = source.data || [];

    setDataColumns(columns);
    setDataRows(data);
  };

  const getColumnValue = (columnName: string, rowIndex: number = 0): number => {
    if (!dataRows.length || !columnName) return 0;
    const value = dataRows[rowIndex]?.[columnName];
    return parseFloat(value) || 0;
  };

  const calculateFV = () => {
    if (!dataRows.length) {
      toast({
        title: "No Data",
        description: "Please select a data source first",
        variant: "destructive"
      });
      return;
    }

    const rate = getColumnValue(fvRate) / 100;
    const nper = getColumnValue(fvNper);
    const pmt = fvPmt ? getColumnValue(fvPmt) : 0;
    const pv = fvPv ? getColumnValue(fvPv) : 0;
    const frequency = parseInt(fvFrequency);

    const result = calculateFormula('FV', [], '', {
      rate,
      nper,
      pmt,
      pv,
      frequency
    });

    setFvResult(result);
  };

  const calculatePV = () => {
    if (!dataRows.length) {
      toast({
        title: "No Data",
        description: "Please select a data source first",
        variant: "destructive"
      });
      return;
    }

    const rate = getColumnValue(pvRate) / 100;
    const nper = getColumnValue(pvNper);
    const pmt = pvPmt ? getColumnValue(pvPmt) : 0;
    const fv = pvFv ? getColumnValue(pvFv) : 0;
    const frequency = parseInt(pvFrequency);

    const result = calculateFormula('PV', [], '', {
      rate,
      nper,
      pmt,
      fv,
      frequency
    });

    setPvResult(result);
  };

  const calculatePMT = () => {
    if (!dataRows.length) {
      toast({
        title: "No Data",
        description: "Please select a data source first",
        variant: "destructive"
      });
      return;
    }

    const rate = getColumnValue(pmtRate) / 100;
    const nper = getColumnValue(pmtNper);
    const pv = getColumnValue(pmtPv);
    const fv = pmtFv ? getColumnValue(pmtFv) : 0;
    const frequency = parseInt(pmtFrequency);

    const result = calculateFormula('PMT', [], '', {
      rate,
      nper,
      pv,
      fv,
      frequency
    });

    setPmtResult(result);
  };

  const calculateRATE = () => {
    if (!dataRows.length) {
      toast({
        title: "No Data",
        description: "Please select a data source first",
        variant: "destructive"
      });
      return;
    }

    const nper = getColumnValue(rateNper);
    const pmt = ratePmt ? getColumnValue(ratePmt) : 0;
    const pv = getColumnValue(ratePv);
    const fv = rateFv ? getColumnValue(rateFv) : 0;
    const frequency = parseInt(rateFrequency);

    const result = calculateFormula('RATE', [], '', {
      nper,
      pmt,
      pv,
      fv,
      frequency
    });

    setRateResult(result);
  };

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
              {/* Data Source Selector */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Data Source</CardTitle>
                  <CardDescription>Choose a data source to use column values in financial formulas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Data Source</Label>
                    <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a data source..." />
                      </SelectTrigger>
                      <SelectContent>
                        {dataSources.map((ds) => (
                          <SelectItem key={ds.id} value={ds.id}>
                            {ds.name} ({ds.row_count} rows)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {dataColumns.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Available columns: {dataColumns.join(', ')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Functions (Excel-style)</CardTitle>
                  <CardDescription>Select data columns to use in financial formulas. The frequency divides the annual interest rate accordingly.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* FV Calculator */}
                  <div className="p-4 border rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg">FV - Future Value</h3>
                    <p className="text-sm text-muted-foreground">Formula: =FV(rate, nper, pmt, [pv])</p>
                    <p className="text-xs text-muted-foreground">Select columns containing: annual interest rate, number of periods, payment amount, present value</p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label>Rate Column (Annual %)</Label>
                        <Select value={fvRate} onValueChange={setFvRate} disabled={!dataColumns.length}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select column..." />
                          </SelectTrigger>
                          <SelectContent>
                            {dataColumns.map((col) => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Nper Column (Years)</Label>
                        <Select value={fvNper} onValueChange={setFvNper} disabled={!dataColumns.length}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select column..." />
                          </SelectTrigger>
                          <SelectContent>
                            {dataColumns.map((col) => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Pmt Column (Payment)</Label>
                        <Select value={fvPmt} onValueChange={setFvPmt} disabled={!dataColumns.length}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select column..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {dataColumns.map((col) => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>PV Column (Present Value)</Label>
                        <Select value={fvPv} onValueChange={setFvPv} disabled={!dataColumns.length}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select column..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {dataColumns.map((col) => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Frequency (divides rate)</Label>
                        <Select value={fvFrequency} onValueChange={setFvFrequency}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Annual (÷1)</SelectItem>
                            <SelectItem value="2">Semi-Annual (÷2)</SelectItem>
                            <SelectItem value="4">Quarterly (÷4)</SelectItem>
                            <SelectItem value="12">Monthly (÷12)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={calculateFV} className="w-full" disabled={!fvRate || !fvNper}>
                      <Calculator className="h-4 w-4 mr-2" />Calculate FV
                    </Button>
                    {fvResult !== null && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Future Value Result</p>
                        <p className="text-2xl font-bold">R {fvResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    )}
                  </div>

                  {/* PV Calculator */}
                  <div className="p-4 border rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg">PV - Present Value</h3>
                    <p className="text-sm text-muted-foreground">Formula: =PV(rate, nper, pmt, [fv])</p>
                    <p className="text-xs text-muted-foreground">Select columns containing: annual interest rate, number of periods, payment amount, future value</p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label>Rate Column (Annual %)</Label>
                        <Select value={pvRate} onValueChange={setPvRate} disabled={!dataColumns.length}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select column..." />
                          </SelectTrigger>
                          <SelectContent>
                            {dataColumns.map((col) => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Nper Column (Years)</Label>
                        <Select value={pvNper} onValueChange={setPvNper} disabled={!dataColumns.length}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select column..." />
                          </SelectTrigger>
                          <SelectContent>
                            {dataColumns.map((col) => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Pmt Column (Payment)</Label>
                        <Select value={pvPmt} onValueChange={setPvPmt} disabled={!dataColumns.length}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select column..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {dataColumns.map((col) => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>FV Column (Future Value)</Label>
                        <Select value={pvFv} onValueChange={setPvFv} disabled={!dataColumns.length}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select column..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {dataColumns.map((col) => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Frequency (divides rate)</Label>
                        <Select value={pvFrequency} onValueChange={setPvFrequency}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Annual (÷1)</SelectItem>
                            <SelectItem value="2">Semi-Annual (÷2)</SelectItem>
                            <SelectItem value="4">Quarterly (÷4)</SelectItem>
                            <SelectItem value="12">Monthly (÷12)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={calculatePV} className="w-full" disabled={!pvRate || !pvNper}>
                      <Calculator className="h-4 w-4 mr-2" />Calculate PV
                    </Button>
                    {pvResult !== null && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Present Value Result</p>
                        <p className="text-2xl font-bold">R {pvResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    )}
                  </div>

                  {/* PMT Calculator */}
                  <div className="p-4 border rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg">PMT - Payment</h3>
                    <p className="text-sm text-muted-foreground">Formula: =PMT(rate, nper, pv, [fv])</p>
                    <p className="text-xs text-muted-foreground">Select columns containing: annual interest rate, number of periods, present value (loan amount), future value</p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label>Rate Column (Annual %)</Label>
                        <Select value={pmtRate} onValueChange={setPmtRate} disabled={!dataColumns.length}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select column..." />
                          </SelectTrigger>
                          <SelectContent>
                            {dataColumns.map((col) => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Nper Column (Years)</Label>
                        <Select value={pmtNper} onValueChange={setPmtNper} disabled={!dataColumns.length}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select column..." />
                          </SelectTrigger>
                          <SelectContent>
                            {dataColumns.map((col) => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>PV Column (Loan Amount)</Label>
                        <Select value={pmtPv} onValueChange={setPmtPv} disabled={!dataColumns.length}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select column..." />
                          </SelectTrigger>
                          <SelectContent>
                            {dataColumns.map((col) => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>FV Column (Future Value)</Label>
                        <Select value={pmtFv} onValueChange={setPmtFv} disabled={!dataColumns.length}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select column..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {dataColumns.map((col) => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Frequency (divides rate)</Label>
                        <Select value={pmtFrequency} onValueChange={setPmtFrequency}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Annual (÷1)</SelectItem>
                            <SelectItem value="2">Semi-Annual (÷2)</SelectItem>
                            <SelectItem value="4">Quarterly (÷4)</SelectItem>
                            <SelectItem value="12">Monthly (÷12)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={calculatePMT} className="w-full" disabled={!pmtRate || !pmtNper || !pmtPv}>
                      <Calculator className="h-4 w-4 mr-2" />Calculate PMT
                    </Button>
                    {pmtResult !== null && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Payment Result</p>
                        <p className="text-2xl font-bold">R {pmtResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    )}
                  </div>

                  {/* RATE Calculator */}
                  <div className="p-4 border rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg">RATE - Interest Rate</h3>
                    <p className="text-sm text-muted-foreground">Formula: =RATE(nper, pmt, pv, [fv])</p>
                    <p className="text-xs text-muted-foreground">Select columns containing: number of periods, payment amount, present value (loan amount), future value</p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label>Nper Column (Years)</Label>
                        <Select value={rateNper} onValueChange={setRateNper} disabled={!dataColumns.length}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select column..." />
                          </SelectTrigger>
                          <SelectContent>
                            {dataColumns.map((col) => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Pmt Column (Payment)</Label>
                        <Select value={ratePmt} onValueChange={setRatePmt} disabled={!dataColumns.length}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select column..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {dataColumns.map((col) => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>PV Column (Loan Amount)</Label>
                        <Select value={ratePv} onValueChange={setRatePv} disabled={!dataColumns.length}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select column..." />
                          </SelectTrigger>
                          <SelectContent>
                            {dataColumns.map((col) => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>FV Column (Future Value)</Label>
                        <Select value={rateFv} onValueChange={setRateFv} disabled={!dataColumns.length}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select column..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {dataColumns.map((col) => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Frequency (divides rate)</Label>
                        <Select value={rateFrequency} onValueChange={setRateFrequency}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Annual (÷1)</SelectItem>
                            <SelectItem value="2">Semi-Annual (÷2)</SelectItem>
                            <SelectItem value="4">Quarterly (÷4)</SelectItem>
                            <SelectItem value="12">Monthly (÷12)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={calculateRATE} className="w-full" disabled={!rateNper || !ratePv}>
                      <Calculator className="h-4 w-4 mr-2" />Calculate RATE
                    </Button>
                    {rateResult !== null && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Interest Rate Result (Annual)</p>
                        <p className="text-2xl font-bold">{(rateResult * 100).toFixed(2)}%</p>
                      </div>
                    )}
                  </div>
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
