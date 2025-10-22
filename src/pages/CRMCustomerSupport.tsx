import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Headphones } from 'lucide-react';
import SalesPipeline from './crm/SalesPipeline';
import TicketSystem from './crm/TicketSystem';

type ActiveSection = 'overview' | 'pipeline' | 'tickets';

export default function CRMCustomerSupport() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');

  if (activeSection === 'pipeline') {
    return <SalesPipeline />;
  }

  if (activeSection === 'tickets') {
    return <TicketSystem />;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">CRM & Customer Support</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Manage your customer relationships, track sales pipeline, and handle support tickets
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setActiveSection('pipeline')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>CRM & Sales Pipeline</CardTitle>
                  <CardDescription>Manage customer relationships and track deals</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Complete contact profiles with status tracking
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Sales pipeline with deal management
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Export customer lists to PDF and Excel
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setActiveSection('tickets')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Headphones className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Support Tickets</CardTitle>
                  <CardDescription>Manage customer support requests</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Multi-channel support tracking
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Priority assignment and SLA management
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Resolution time analytics
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
