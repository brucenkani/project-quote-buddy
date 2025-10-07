import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Users, FileText, TrendingUp, Clock, Shield, CheckCircle } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">QuoteBuilder ERP</h1>
          </div>
          <Button onClick={() => navigate('/auth')} size="lg">
            Sign In / Sign Up
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Complete Business Management Platform
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Streamline your accounting and HR operations with our comprehensive ERP solution. 
          100% free for business owners, with optional professional accounting services.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate('/auth')} size="lg" className="gap-2">
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Everything You Need to Run Your Business</h3>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Calculator className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Accounting System</CardTitle>
              <CardDescription>Complete financial management at your fingertips</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Professional invoice & quote generation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Expense tracking & management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Inventory control & tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Financial reports & analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Journal entries & double-entry bookkeeping</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Users className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Payroll & HR System</CardTitle>
              <CardDescription>Simplify employee management and payroll</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Employee records & management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>SARS-compliant payroll processing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Leave management system</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Automated payslip generation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>HR dashboard & analytics</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Additional Benefits */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <Clock className="h-10 w-10 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Save Time</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              Automate repetitive tasks and focus on growing your business
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Shield className="h-10 w-10 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Stay Compliant</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              Built-in SARS compliance and financial best practices
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <TrendingUp className="h-10 w-10 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Grow Efficiently</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              Scale your operations with powerful insights and reporting
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30 rounded-lg my-16">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-6">100% Free for Business Owners</h3>
          <p className="text-lg text-muted-foreground mb-8">
            QuoteBuilder ERP is completely free to use. We generate revenue by offering optional 
            professional accounting services to help you manage your finances even better.
          </p>
          
          <Card className="border-2 border-primary/50">
            <CardHeader>
              <CardTitle className="text-2xl">Optional Professional Support</CardTitle>
              <CardDescription>Need an expert accountant?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                While the platform is free to use, you can hire our team of professional accountants 
                to manage your books, ensure compliance, and provide strategic financial guidance.
              </p>
              <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Custom pricing based on your business needs</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h3 className="text-4xl font-bold mb-6">Ready to Streamline Your Business?</h3>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join hundreds of businesses already using QuoteBuilder ERP to manage their operations efficiently.
        </p>
        <Button onClick={() => navigate('/auth')} size="lg" className="gap-2">
          Start Using QuoteBuilder ERP Free
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 QuoteBuilder ERP. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
