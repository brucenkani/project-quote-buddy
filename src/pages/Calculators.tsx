import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calculator, Percent, TrendingUp, DollarSign, Building2, Wrench } from 'lucide-react';

export default function Calculators() {
  const navigate = useNavigate();

  const calculatorCategories = [
    {
      title: "Analytics & Calculators",
      icon: TrendingUp,
      description: "Business insights & professional calculation tools",
      route: "/calculators",
      calculators: [
        "Management accounts & reporting",
        "Financial forecasting & projections",
        "Tax & SARS calculators",
        "Financial planning tools",
        "Accounting calculators",
        "Property & asset tools",
        "Engineering calculators"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Calculator className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Analytics & Calculators</h1>
            </div>
          </div>
          <Button onClick={() => navigate('/auth')} size="lg">
            Sign In / Sign Up
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Analytics & Calculators</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Business insights & professional calculation tools
          </p>
        </div>

        {/* Calculator Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {calculatorCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card key={index} className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                <CardHeader>
                  <Icon className="h-12 w-12 mb-4 text-primary" />
                  <CardTitle>{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.calculators.map((calc, calcIndex) => (
                      <li key={calcIndex} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        {calc}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={() => navigate(category.route)}
                  >
                    Explore Tools
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-12 text-center max-w-2xl mx-auto">
          <div className="p-6 bg-primary/5 rounded-lg border border-primary/20">
            <h3 className="text-xl font-semibold mb-2">More Calculators Coming Soon</h3>
            <p className="text-muted-foreground">
              We're constantly adding new calculators and tools to help you manage your business more effectively. 
              Sign up to get notified when new calculators are available.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
