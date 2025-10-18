import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, LineChart, TrendingUp, PieChart, FileText } from 'lucide-react';

export default function BusinessAnalytics() {
  const navigate = useNavigate();

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
              <h1 className="text-2xl font-bold">Reporting Suite</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
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
                <LineChart className="h-10 w-10 mb-4 text-primary" />
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
              onClick={() => navigate('/analytics/custom-reports')}
            >
              <CardHeader>
                <FileText className="h-10 w-10 mb-4 text-primary" />
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
        </div>
      </main>
    </div>
  );
}
