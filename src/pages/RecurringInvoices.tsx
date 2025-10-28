import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Trash2, Power, PowerOff } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { loadRecurringInvoices, saveRecurringInvoice, deleteRecurringInvoice, calculateNextGenerationDate } from '@/utils/recurringInvoiceStorage';
import { loadSettings } from '@/utils/settingsStorage';
import { RecurringInvoice, Invoice } from '@/types/invoice';
import { useToast } from '@/hooks/use-toast';

export default function RecurringInvoices() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const settings = loadSettings();
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const data = await loadRecurringInvoices();
      setRecurringInvoices(data);
    };
    load();
  }, []);

  const [formData, setFormData] = useState({
    frequency: 'monthly' as RecurringInvoice['frequency'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  const handleCreateRecurring = () => {
    if (!selectedInvoiceId) {
      toast({ title: 'Please select an invoice template', variant: 'destructive' });
      return;
    }

    navigate(`/invoices/recurring/new?templateId=${selectedInvoiceId}`);
  };

  const handleToggleActive = async (recurring: RecurringInvoice) => {
    const updated = { ...recurring, isActive: !recurring.isActive, updatedAt: new Date().toISOString() };
    await saveRecurringInvoice(updated);
    const data = await loadRecurringInvoices();
    setRecurringInvoices(data);
    toast({ title: `Recurring invoice ${updated.isActive ? 'activated' : 'deactivated'}` });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this recurring invoice?')) {
      await deleteRecurringInvoice(id);
      const data = await loadRecurringInvoices();
      setRecurringInvoices(data);
      toast({ title: 'Recurring invoice deleted' });
    }
  };

  const getFrequencyBadge = (frequency: RecurringInvoice['frequency']) => {
    const colors = {
      weekly: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
      monthly: 'bg-green-500/10 text-green-700 dark:text-green-400',
      quarterly: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
      yearly: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
    };
    return colors[frequency];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              Recurring Invoices
            </h1>
            <p className="text-muted-foreground">Automate invoice generation on a schedule</p>
          </div>
          <Button className="gap-2" onClick={() => navigate('/invoices/recurring/new')}>
            <Plus className="h-4 w-4" />
            New Recurring Invoice
          </Button>
        </div>

        {recurringInvoices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No recurring invoices yet</h3>
              <p className="text-muted-foreground mb-4">Create automated invoices that generate on a schedule</p>
              <Button onClick={() => navigate('/invoices/recurring/new')}>
                Create Recurring Invoice
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Next Invoice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurringInvoices
                  .filter(recurring => recurring.invoiceTemplate?.projectDetails?.clientName)
                  .map((recurring) => (
                  <TableRow key={recurring.id}>
                    <TableCell className="font-medium">
                      {recurring.invoiceTemplate.projectDetails.clientName}
                    </TableCell>
                    <TableCell>
                      <Badge className={getFrequencyBadge(recurring.frequency)}>
                        {recurring.frequency}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {settings.currencySymbol}{recurring.invoiceTemplate.total?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell>
                      {new Date(recurring.startDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(recurring.nextGenerationDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={recurring.isActive ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-gray-500/10 text-gray-700 dark:text-gray-400'}>
                        {recurring.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(recurring)}
                        >
                          {recurring.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(recurring.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
