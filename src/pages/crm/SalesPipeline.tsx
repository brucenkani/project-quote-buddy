import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, FileDown, FileSpreadsheet, MoreVertical } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { DataTableFilters } from '@/components/ui/data-table-filters';
import { SortableTableHeader } from '@/components/ui/sortable-table-header';
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

export default function SalesPipeline({ onBack }: { onBack?: () => void }) {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');

  // Sort state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'created_at',
    direction: 'desc',
  });

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

  // Get unique customers for filter
  const uniqueCustomers = useMemo(() => {
    const customers = new Set(deals.map(d => d.customer));
    return Array.from(customers).sort();
  }, [deals]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  // Handle sort
  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setStageFilter('all');
    setCustomerFilter('all');
  };

  // Filter and sort deals
  const displayDeals = useMemo(() => {
    let filtered = deals;

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(deal =>
        deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.customer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply stage filter
    if (stageFilter !== 'all') {
      filtered = filtered.filter(deal => deal.stage === stageFilter);
    }

    // Apply customer filter
    if (customerFilter !== 'all') {
      filtered = filtered.filter(deal => deal.customer === customerFilter);
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'customer':
          aValue = a.customer.toLowerCase();
          bValue = b.customer.toLowerCase();
          break;
        case 'value':
          aValue = a.value;
          bValue = b.value;
          break;
        case 'stage':
          aValue = a.stage;
          bValue = b.stage;
          break;
        case 'probability':
          aValue = a.probability;
          bValue = b.probability;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [deals, searchQuery, stageFilter, customerFilter, sortConfig]);

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

  const getStageColor = (stage: string) => {
    const stageInfo = stages.find(s => s.id === stage);
    return stageInfo?.color || 'bg-gray-500';
  };

  const getStageLabel = (stage: string) => {
    const stageInfo = stages.find(s => s.id === stage);
    return stageInfo?.name || stage;
  };

  const handleMoveDeal = async (dealId: string, newStage: string) => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;

    try {
      const { error } = await supabase
        .from('deals')
        .update({ stage: newStage })
        .eq('id', dealId);

      if (error) throw error;
      
      await fetchDeals();
      toast.success(`Deal moved to ${getStageLabel(newStage)}`);
    } catch (error) {
      console.error('Error moving deal:', error);
      toast.error('Failed to move deal');
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', dealId);

      if (error) throw error;
      
      await fetchDeals();
      toast.success('Deal deleted successfully');
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast.error('Failed to delete deal');
    }
  };

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
                  if (onBack) return onBack();
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
            <DataTableFilters
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search deals by title or customer..."
              filters={[
                {
                  label: 'Stage',
                  value: stageFilter,
                  onValueChange: setStageFilter,
                  options: stages.map(s => ({ label: s.name, value: s.id })),
                },
                {
                  label: 'Customer',
                  value: customerFilter,
                  onValueChange: setCustomerFilter,
                  options: uniqueCustomers.map(c => ({ label: c, value: c })),
                },
              ]}
              onClearFilters={handleClearFilters}
            />

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading deals...</p>
              </div>
            ) : displayDeals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <h3 className="text-lg font-semibold mb-2">No deals found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || stageFilter !== 'all' || customerFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Create your first deal to get started'}
                  </p>
                  <Button onClick={handleAddDeal}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Deal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="mb-6">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <SortableTableHeader
                            sortKey="title"
                            currentSort={sortConfig}
                            onSort={handleSort}
                          >
                            Deal Title
                          </SortableTableHeader>
                          <SortableTableHeader
                            sortKey="customer"
                            currentSort={sortConfig}
                            onSort={handleSort}
                          >
                            Customer
                          </SortableTableHeader>
                          <SortableTableHeader
                            sortKey="value"
                            currentSort={sortConfig}
                            onSort={handleSort}
                            className="text-right"
                          >
                            Value
                          </SortableTableHeader>
                          <SortableTableHeader
                            sortKey="stage"
                            currentSort={sortConfig}
                            onSort={handleSort}
                          >
                            Stage
                          </SortableTableHeader>
                          <SortableTableHeader
                            sortKey="probability"
                            currentSort={sortConfig}
                            onSort={handleSort}
                            className="text-center"
                          >
                            Probability
                          </SortableTableHeader>
                          <TableHead className="text-right">Weighted Value</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayDeals.map((deal) => (
                          <TableRow key={deal.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell className="font-medium">{deal.title}</TableCell>
                            <TableCell>{deal.customer}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(deal.value)}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStageColor(deal.stage)}>
                                {getStageLabel(deal.stage)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{deal.probability}%</Badge>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatCurrency(deal.value * deal.probability / 100)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => handleEditDeal(deal)}>
                                    Edit Deal
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {stages.map((stage) => (
                                    deal.stage !== stage.id && (
                                      <DropdownMenuItem
                                        key={stage.id}
                                        onClick={() => handleMoveDeal(deal.id, stage.id)}
                                      >
                                        Move to {stage.name}
                                      </DropdownMenuItem>
                                    )
                                  ))}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteDeal(deal.id)}
                                    className="text-destructive"
                                  >
                                    Delete Deal
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pipeline Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{formatCurrency(displayDeals.reduce((sum, d) => sum + d.value, 0))}</p>
                      <p className="text-sm text-muted-foreground mt-1">{displayDeals.length} deals</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Weighted Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        {formatCurrency(displayDeals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0))}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">Expected revenue</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Win Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        {deals.length > 0 
                          ? Math.round((deals.filter(d => d.stage === 'closed').length / deals.length) * 100)
                          : 0}%
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {deals.filter(d => d.stage === 'closed').length} closed deals
                      </p>
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
