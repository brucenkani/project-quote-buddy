import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, FileDown, FileSpreadsheet } from 'lucide-react';
import DealDialog from '@/components/crm/DealDialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Deal {
  id: string;
  title: string;
  customer: string;
  value: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed';
  probability: number;
}

interface Customer {
  name: string;
  totalDeals: number;
  closedDeals: number;
  totalValue: number;
  status: 'Active' | 'Prospect';
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
  const { activeCompany } = useCompany();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeCompany) {
      fetchDeals();
    }
  }, [activeCompany]);

  const fetchDeals = async () => {
    if (!activeCompany) return;
    
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('company_id', activeCompany.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals((data || []) as Deal[]);
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  const getCustomerList = (): Customer[] => {
    const customerMap = new Map<string, Customer>();
    
    deals.forEach(deal => {
      const existing = customerMap.get(deal.customer);
      const isClosed = deal.stage === 'closed';
      
      if (existing) {
        existing.totalDeals += 1;
        existing.closedDeals += isClosed ? 1 : 0;
        existing.totalValue += deal.value;
        if (isClosed) existing.status = 'Active';
      } else {
        customerMap.set(deal.customer, {
          name: deal.customer,
          totalDeals: 1,
          closedDeals: isClosed ? 1 : 0,
          totalValue: deal.value,
          status: isClosed ? 'Active' : 'Prospect',
        });
      }
    });
    
    return Array.from(customerMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  const exportCustomersToPDF = () => {
    const customers = getCustomerList();
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Customer List', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const tableData = customers.map(c => [
      c.name,
      c.status,
      c.totalDeals.toString(),
      c.closedDeals.toString(),
      formatCurrency(c.totalValue),
    ]);
    
    (doc as any).autoTable({
      head: [['Customer Name', 'Status', 'Total Deals', 'Closed Deals', 'Total Value']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    doc.save('customer-list.pdf');
    toast.success('Customer list exported to PDF');
  };

  const exportCustomersToExcel = () => {
    const customers = getCustomerList();
    
    const data = customers.map(c => ({
      'Customer Name': c.name,
      'Status': c.status,
      'Total Deals': c.totalDeals,
      'Closed Deals': c.closedDeals,
      'Total Value': c.totalValue,
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    
    XLSX.writeFile(wb, 'customer-list.xlsx');
    toast.success('Customer list exported to Excel');
  };

  const getDealsByStage = (stage: string) => deals.filter(d => d.stage === stage);

  const handleAddDeal = () => {
    setSelectedDeal(null);
    setDialogOpen(true);
  };

  const handleEditDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setDialogOpen(true);
  };

  const handleSaveDeal = async (deal: Deal) => {
    if (!activeCompany) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const dealData = {
        title: deal.title,
        customer: deal.customer,
        value: deal.value,
        stage: deal.stage,
        probability: deal.probability,
        company_id: activeCompany.id,
        user_id: user.id,
      };

      if (deal.id !== 'new') {
        // Update existing deal
        const { error } = await supabase
          .from('deals')
          .update(dealData)
          .eq('id', deal.id);

        if (error) throw error;
        toast.success('Deal updated successfully');
      } else {
        // Insert new deal
        const { error } = await supabase
          .from('deals')
          .insert([dealData]);

        if (error) throw error;
        toast.success('Deal created successfully');
      }

      await fetchDeals();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving deal:', error);
      toast.error('Failed to save deal');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  console.log('Navigating to /crm-customer-support');
                  navigate('/crm-customer-support');
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold">CRM & Sales Pipeline</h1>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddDeal}>
                <Plus className="mr-2 h-4 w-4" />
                Add Deal
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="pipeline" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="pipeline">Sales Pipeline</TabsTrigger>
            <TabsTrigger value="customers">Customer List</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading deals...</p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </TabsContent>

          <TabsContent value="customers">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Customer List</h2>
                  <p className="text-muted-foreground">Active customers and prospects</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={exportCustomersToPDF} variant="outline">
                    <FileDown className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button onClick={exportCustomersToExcel} variant="outline">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export Excel
                  </Button>
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="text-left p-4 font-semibold">Customer Name</th>
                          <th className="text-left p-4 font-semibold">Status</th>
                          <th className="text-right p-4 font-semibold">Total Deals</th>
                          <th className="text-right p-4 font-semibold">Closed Deals</th>
                          <th className="text-right p-4 font-semibold">Total Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getCustomerList().map((customer, index) => (
                          <tr key={index} className="border-b hover:bg-muted/50">
                            <td className="p-4 font-medium">{customer.name}</td>
                            <td className="p-4">
                              <Badge variant={customer.status === 'Active' ? 'default' : 'secondary'}>
                                {customer.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-right">{customer.totalDeals}</td>
                            <td className="p-4 text-right">{customer.closedDeals}</td>
                            <td className="p-4 text-right font-semibold">
                              {formatCurrency(customer.totalValue)}
                            </td>
                          </tr>
                        ))}
                        {getCustomerList().length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-muted-foreground">
                              No customers yet. Create deals to see customers here.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
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
