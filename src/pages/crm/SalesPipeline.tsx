import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus } from 'lucide-react';
import DealDialog from '@/components/crm/DealDialog';
import { toast } from 'sonner';

interface Deal {
  id: string;
  title: string;
  customer: string;
  value: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed';
  probability: number;
}

const stages = [
  { id: 'lead', name: 'Lead', color: 'bg-gray-500' },
  { id: 'qualified', name: 'Qualified', color: 'bg-blue-500' },
  { id: 'proposal', name: 'Proposal', color: 'bg-purple-500' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-orange-500' },
  { id: 'closed', name: 'Closed', color: 'bg-green-500' },
];

export default function SalesPipeline() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([
    { id: '1', title: 'Enterprise Software Deal', customer: 'Acme Corp', value: 50000, stage: 'proposal', probability: 60 },
    { id: '2', title: 'Consulting Services', customer: 'TechStart Inc', value: 25000, stage: 'negotiation', probability: 80 },
    { id: '3', title: 'Annual Maintenance', customer: 'Global Ltd', value: 15000, stage: 'qualified', probability: 40 },
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const getDealsByStage = (stage: string) => deals.filter(d => d.stage === stage);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  const handleAddDeal = () => {
    setSelectedDeal(null);
    setDialogOpen(true);
  };

  const handleEditDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setDialogOpen(true);
  };

  const handleSaveDeal = (deal: Deal) => {
    setDeals(prevDeals => {
      const existingIndex = prevDeals.findIndex(d => d.id === deal.id);
      if (existingIndex >= 0) {
        const updated = [...prevDeals];
        updated[existingIndex] = deal;
        toast.success('Deal updated successfully');
        return updated;
      } else {
        toast.success('Deal created successfully');
        return [...prevDeals, deal];
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/crm-customer-support')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">Sales Pipeline</h1>
            </div>
            <Button onClick={handleAddDeal}>
              <Plus className="mr-2 h-4 w-4" />
              Add Deal
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-5 gap-4">
          {stages.map((stage) => {
            const stageDeals = getDealsByStage(stage.id);
            const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);

            return (
              <div key={stage.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{stage.name}</h3>
                  <Badge variant="secondary">{stageDeals.length}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(stageValue)}
                </div>
                <div className="space-y-3">
                  {stageDeals.map((deal) => (
                    <Card 
                      key={deal.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleEditDeal(deal)}
                    >
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm">{deal.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2">
                        <p className="text-xs text-muted-foreground">{deal.customer}</p>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm">{formatCurrency(deal.value)}</span>
                          <Badge variant="outline" className="text-xs">{deal.probability}%</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {stageDeals.length === 0 && (
                    <div className="border-2 border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground">
                      No deals
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(deals.reduce((sum, d) => sum + d.value, 0))}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Weighted Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {formatCurrency(deals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">45%</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <DealDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        deal={selectedDeal}
        onSave={handleSaveDeal}
      />
    </div>
  );
}
