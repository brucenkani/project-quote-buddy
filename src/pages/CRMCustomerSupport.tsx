import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Users, TrendingUp, MessageSquare } from 'lucide-react';
import CustomerDatabase from './crm/CustomerDatabase';
import SalesPipeline from './crm/SalesPipeline';
import TicketSystem from './crm/TicketSystem';

export default function CRMCustomerSupport() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'overview' | 'crm' | 'tickets'>('overview');

  // For now, CRM section defaults to Customer Database
  // In future, this could be a tabbed interface within CRM
  if (activeSection === 'crm') {
    return <CustomerDatabase />;
  }

  if (activeSection === 'tickets') {
    return <TicketSystem />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold">CRM & Customer Support</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Customer Relationship Management</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Manage your customer relationships, track sales pipeline, and handle support tickets
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card 
            className="border-2 hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg"
            onClick={() => setActiveSection('crm')}
          >
            <CardHeader>
              <div className="flex gap-3 mb-4">
                <Users className="h-10 w-10 text-primary" />
                <TrendingUp className="h-10 w-10 text-primary" />
              </div>
              <CardTitle>CRM & Sales Pipeline</CardTitle>
              <CardDescription>Customer database and visual sales tracking system</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Complete contact profiles</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Interaction history tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Customer segmentation</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Lead tracking & management</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Deal stage visualization</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Conversion rate analysis</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline">Open</Button>
            </CardContent>
          </Card>

          <Card 
            className="border-2 hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg"
            onClick={() => setActiveSection('tickets')}
          >
            <CardHeader>
              <MessageSquare className="h-10 w-10 mb-4 text-primary" />
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>Ticket management system</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Multi-channel support</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Priority assignment</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Resolution tracking</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline">Open</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
