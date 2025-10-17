import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, LineChart, TrendingUp, PieChart, BarChart3, Calculator, DollarSign, Home, Briefcase, Wrench } from 'lucide-react';

export default function BusinessAnalytics() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analytics');

  const calculatorCategories = [
    {
      title: "Tax Calculators",
      description: "South African tax and compliance calculators",
      icon: DollarSign,
      route: "/calculators/tax",
      calculators: [
        "SARS Income Tax Calculator",
        "VAT Calculator",
        "PAYE Calculator",
        "UIF Calculator"
      ]
    },
    {
      title: "Financial Calculators",
      description: "Business finance and investment tools",
      icon: TrendingUp,
      route: "/calculators/financial",
      calculators: [
        "ROI Calculator",
        "Loan & Interest Calculator",
        "Break-Even Analysis",
        "Cash Flow Projection"
      ]
    },
    {
      title: "Property Calculators",
      description: "Real estate and asset calculations",
      icon: Home,
      route: "/calculators/property",
      calculators: [
        "Property Valuation",
        "Rental Yield Calculator",
        "Bond Repayment Calculator",
        "Depreciation Calculator"
      ]
    },
    {
      title: "Business Metrics",
      description: "Performance and efficiency metrics",
      icon: Briefcase,
      route: "/calculators/business-metrics",
      calculators: [
        "Profit Margin Calculator",
        "Productivity Metrics",
        "Customer Lifetime Value",
        "Inventory Turnover"
      ]
    },
    {
      title: "Engineering Calculators",
      description: "Technical and engineering tools",
      icon: Wrench,
      route: "/calculators/engineering",
      calculators: [
        "Material Estimator",
        "Unit Converter",
        "Project Cost Calculator",
        "Resource Planning"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <h1 className="text-2xl font-bold">Business Analytics & Calculators</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="analytics" className="gap-2">
              <LineChart className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="calculators" className="gap-2">
              <Calculator className="h-4 w-4" />
              Calculators
            </TabsTrigger>
          </TabsList>

          {/* Business Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Business Analytics & Insights</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Strategic insights and data-driven decision making for business growth
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card 
                className="group border-2 hover:border-primary/50 transition-all cursor-pointer"
                onClick={() => navigate('/analytics/management-accounts')}
              >
                <CardHeader>
                  <BarChart3 className="h-10 w-10 mb-4 text-primary" />
                  <CardTitle>Management Accounts</CardTitle>
                  <CardDescription>Comprehensive financial reporting</CardDescription>
                </CardHeader>
                <CardContent className="hidden group-hover:block">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Income statements</li>
                    <li>• Balance sheets</li>
                    <li>• Cash flow statements</li>
                    <li>• Management reports</li>
                  </ul>
                </CardContent>
              </Card>

              <Card 
                className="group border-2 hover:border-primary/50 transition-all cursor-pointer"
                onClick={() => navigate('/analytics/financial-forecasting')}
              >
                <CardHeader>
                  <TrendingUp className="h-10 w-10 mb-4 text-primary" />
                  <CardTitle>Financial Forecasting</CardTitle>
                  <CardDescription>Projections and planning tools</CardDescription>
                </CardHeader>
                <CardContent className="hidden group-hover:block">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Revenue forecasts</li>
                    <li>• Expense projections</li>
                    <li>• Scenario analysis</li>
                    <li>• Budget planning</li>
                  </ul>
                </CardContent>
              </Card>

              <Card 
                className="group border-2 hover:border-primary/50 transition-all cursor-pointer"
                onClick={() => navigate('/analytics/performance-metrics')}
              >
                <CardHeader>
                  <PieChart className="h-10 w-10 mb-4 text-primary" />
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="hidden group-hover:block">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• KPI dashboards</li>
                    <li>• Profitability analysis</li>
                    <li>• Efficiency metrics</li>
                    <li>• Growth indicators</li>
                  </ul>
                </CardContent>
              </Card>

              <Card 
                className="group border-2 hover:border-primary/50 transition-all cursor-pointer"
                onClick={() => navigate('/analytics/variance-analysis')}
              >
                <CardHeader>
                  <LineChart className="h-10 w-10 mb-4 text-primary" />
                  <CardTitle>Variance Analysis</CardTitle>
                  <CardDescription>Budget vs actual comparisons</CardDescription>
                </CardHeader>
                <CardContent className="hidden group-hover:block">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Budget variance tracking</li>
                    <li>• Cost analysis</li>
                    <li>• Performance gaps</li>
                    <li>• Corrective action insights</li>
                  </ul>
                </CardContent>
              </Card>

              <Card 
                className="group border-2 hover:border-primary/50 transition-all cursor-pointer"
                onClick={() => navigate('/analytics/strategic-planning')}
              >
                <CardHeader>
                  <BarChart3 className="h-10 w-10 mb-4 text-primary" />
                  <CardTitle>Strategic Planning</CardTitle>
                  <CardDescription>Long-term business insights</CardDescription>
                </CardHeader>
                <CardContent className="hidden group-hover:block">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Market trend analysis</li>
                    <li>• Competitive positioning</li>
                    <li>• Growth opportunities</li>
                    <li>• Risk assessment</li>
                  </ul>
                </CardContent>
              </Card>

              <Card 
                className="group border-2 hover:border-primary/50 transition-all cursor-pointer"
                onClick={() => navigate('/analytics/custom-reports')}
              >
                <CardHeader>
                  <PieChart className="h-10 w-10 mb-4 text-primary" />
                  <CardTitle>Custom Reports</CardTitle>
                  <CardDescription>Tailored business intelligence</CardDescription>
                </CardHeader>
                <CardContent className="hidden group-hover:block">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Custom dashboards</li>
                    <li>• Ad-hoc reports</li>
                    <li>• Data visualization</li>
                    <li>• Export capabilities</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-center">Coming Soon</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                <p>Advanced analytics features are currently under development.</p>
                <p className="mt-2">Contact us if you'd like early access or have specific reporting requirements.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Calculators Tab */}
          <TabsContent value="calculators" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Professional Business Calculators</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Comprehensive suite of calculators for accounting, tax, finance, and engineering needs
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {calculatorCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Card 
                    key={category.title}
                    className="border-2 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(category.route)}
                  >
                    <CardHeader>
                      <Icon className="h-10 w-10 mb-4 text-primary" />
                      <CardTitle>{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {category.calculators.map((calc, index) => (
                          <li key={index}>• {calc}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="bg-primary/5">
              <CardHeader>
                <CardTitle className="text-center">More Calculators Coming Soon</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                <p>We're constantly adding new calculators and tools to help you manage your business more effectively.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
