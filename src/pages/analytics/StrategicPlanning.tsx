import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Target, TrendingUp, Users, Zap, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function StrategicPlanning() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const marketTrends = [
    { trend: 'Digital Transformation', growth: 25, impact: 'High', opportunity: 'R 2.5M potential' },
    { trend: 'Sustainability Focus', growth: 18, impact: 'Medium', opportunity: 'R 1.8M potential' },
    { trend: 'AI Integration', growth: 35, impact: 'High', opportunity: 'R 3.2M potential' },
  ];

  const competitors = [
    { name: 'Competitor A', marketShare: 28, strength: 'Brand recognition', weakness: 'High prices' },
    { name: 'Competitor B', marketShare: 22, strength: 'Innovation', weakness: 'Limited reach' },
    { name: 'Your Company', marketShare: 15, strength: 'Customer service', weakness: 'Market presence' },
  ];

  const opportunities = [
    { area: 'Market Expansion', value: 3500000, timeline: '12 months', risk: 'Medium' },
    { area: 'Product Development', value: 2200000, timeline: '18 months', risk: 'Low' },
    { area: 'Strategic Partnerships', value: 1800000, timeline: '6 months', risk: 'Low' },
  ];

  const risks = [
    { risk: 'Economic Downturn', probability: 'Medium', impact: 'High', mitigation: 'Diversify revenue streams' },
    { risk: 'Supply Chain Disruption', probability: 'Low', impact: 'High', mitigation: 'Multi-source suppliers' },
    { risk: 'Regulatory Changes', probability: 'High', impact: 'Medium', mitigation: 'Compliance monitoring' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/business-analytics')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Target className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Strategic Planning</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="trends" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="trends">Market Trends</TabsTrigger>
              <TabsTrigger value="competitive">Competitive Position</TabsTrigger>
              <TabsTrigger value="opportunities">Growth Opportunities</TabsTrigger>
              <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
            </TabsList>

            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Market Trend Analysis</CardTitle>
                  <CardDescription>Industry trends and their business impact</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {marketTrends.map((trend, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex justify-between mb-2">
                        <h3 className="font-semibold">{trend.trend}</h3>
                        <span className="text-sm text-green-600 font-medium">+{trend.growth}% growth</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Impact:</span> <span className="font-semibold">{trend.impact}</span></div>
                        <div><span className="text-muted-foreground">Opportunity:</span> <span className="font-semibold">{trend.opportunity}</span></div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="competitive" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Competitive Positioning</CardTitle>
                  <CardDescription>Market share and competitive analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {competitors.map((comp, i) => (
                    <div key={i} className={`p-4 border rounded-lg ${comp.name === 'Your Company' ? 'border-primary bg-primary/5' : ''}`}>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold">{comp.name}</h3>
                        <span className="text-xl font-bold">{comp.marketShare}%</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Strength:</span> <span>{comp.strength}</span></div>
                        <div><span className="text-muted-foreground">Weakness:</span> <span>{comp.weakness}</span></div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="opportunities" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Growth Opportunities</CardTitle>
                  <CardDescription>Strategic initiatives and expansion paths</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {opportunities.map((opp, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">{opp.area}</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Value:</span> <span className="font-semibold">R {(opp.value / 1000000).toFixed(1)}M</span></div>
                        <div><span className="text-muted-foreground">Timeline:</span> <span>{opp.timeline}</span></div>
                        <div><span className="text-muted-foreground">Risk:</span> <span className={opp.risk === 'Low' ? 'text-green-600' : 'text-yellow-600'}>{opp.risk}</span></div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risk" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Assessment</CardTitle>
                  <CardDescription>Strategic risks and mitigation strategies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {risks.map((risk, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">{risk.risk}</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                        <div><span className="text-muted-foreground">Probability:</span> <span>{risk.probability}</span></div>
                        <div><span className="text-muted-foreground">Impact:</span> <span>{risk.impact}</span></div>
                      </div>
                      <div className="p-2 bg-muted rounded text-sm"><strong>Mitigation:</strong> {risk.mitigation}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
