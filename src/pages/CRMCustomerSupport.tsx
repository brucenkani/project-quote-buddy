import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, UserCircle, Users, TrendingUp, Headset, Ticket, MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function CRMCustomerSupport() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('crm');

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
              <h1 className="text-2xl font-bold">CRM & Customer Support</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="crm" className="gap-2">
              <UserCircle className="h-4 w-4" />
              CRM & Sales
            </TabsTrigger>
            <TabsTrigger value="support" className="gap-2">
              <Headset className="h-4 w-4" />
              Customer Support
            </TabsTrigger>
            <TabsTrigger value="tickets" className="gap-2">
              <Ticket className="h-4 w-4" />
              Ticketing
            </TabsTrigger>
          </TabsList>

          {/* CRM & Sales Pipeline Tab */}
          <TabsContent value="crm" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Customer Relationship Management</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Manage your customer relationships and track your sales pipeline effectively
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <Users className="h-10 w-10 mb-4 text-primary" />
                  <CardTitle>Customer Database</CardTitle>
                  <CardDescription>Centralize all customer information</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Complete contact profiles</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Interaction history tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Customer segmentation</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <TrendingUp className="h-10 w-10 mb-4 text-primary" />
                  <CardTitle>Sales Pipeline</CardTitle>
                  <CardDescription>Visual sales tracking system</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Lead tracking & management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Deal stage visualization</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Conversion rate analysis</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <MessageSquare className="h-10 w-10 mb-4 text-primary" />
                  <CardTitle>Communication Hub</CardTitle>
                  <CardDescription>Centralized customer communications</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Email integration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Call logs & notes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Activity timeline</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-center">Coming Soon</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                <p>This feature is currently under development and will be available soon.</p>
                <p className="mt-2">Contact us if you'd like early access or have specific requirements.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customer Support Tab */}
          <TabsContent value="support" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Customer Support System</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Deliver exceptional customer service with our comprehensive support tools
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <Headset className="h-10 w-10 mb-4 text-primary" />
                  <CardTitle>Support Channels</CardTitle>
                  <CardDescription>Multi-channel support management</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Email support integration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Live chat system</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Phone support logging</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <Clock className="h-10 w-10 mb-4 text-primary" />
                  <CardTitle>Response Management</CardTitle>
                  <CardDescription>Track and optimize response times</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>SLA monitoring</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Automated responses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Response templates</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <TrendingUp className="h-10 w-10 mb-4 text-primary" />
                  <CardTitle>Support Analytics</CardTitle>
                  <CardDescription>Insights and performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Customer satisfaction scores</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Resolution time tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Team performance reports</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-center">Coming Soon</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                <p>This feature is currently under development and will be available soon.</p>
                <p className="mt-2">Contact us if you'd like early access or have specific requirements.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ticketing Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Ticket Management System</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Efficiently manage and resolve customer queries and service requests
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <Ticket className="h-10 w-10 mb-4 text-primary" />
                  <CardTitle>Ticket Creation</CardTitle>
                  <CardDescription>Create and categorize support tickets</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Multi-channel ticket creation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Priority assignment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Category & tag management</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <AlertCircle className="h-10 w-10 mb-4 text-primary" />
                  <CardTitle>Ticket Workflow</CardTitle>
                  <CardDescription>Streamlined ticket processing</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Status tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Assignment & routing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Escalation management</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CheckCircle className="h-10 w-10 mb-4 text-primary" />
                  <CardTitle>Resolution Tracking</CardTitle>
                  <CardDescription>Monitor ticket resolution progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Resolution time metrics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Customer feedback collection</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Knowledge base integration</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-center">Coming Soon</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                <p>This feature is currently under development and will be available soon.</p>
                <p className="mt-2">Contact us if you'd like early access or have specific requirements.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
