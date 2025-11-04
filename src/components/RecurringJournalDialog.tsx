import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Trash2, Edit, Calendar, Repeat } from 'lucide-react';
import { RecurringJournal, RecurringJournalLine } from '@/types/recurringJournal';
import { loadChartOfAccounts } from '@/utils/chartOfAccountsStorage';
import { calculateNextGenerationDate } from '@/utils/recurringJournalStorage';
import { useToast } from '@/hooks/use-toast';

interface RecurringJournalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recurringJournals: RecurringJournal[];
  onSave: (journal: RecurringJournal) => void;
  onDelete: (id: string) => void;
}

export function RecurringJournalDialog({
  open,
  onOpenChange,
  recurringJournals,
  onSave,
  onDelete,
}: RecurringJournalDialogProps) {
  const { toast } = useToast();
  const [chartAccounts] = useState(loadChartOfAccounts());
  const [showForm, setShowForm] = useState(false);
  const [editingJournal, setEditingJournal] = useState<RecurringJournal | null>(null);
  
  const [formData, setFormData] = useState({
    description: '',
    frequency: 'monthly' as 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    reference: '',
    status: 'active' as 'active' | 'paused',
  });

  const [lines, setLines] = useState<Omit<RecurringJournalLine, 'id'>[]>([
    { account_id: '', account_name: '', debit: 0, credit: 0 },
    { account_id: '', account_name: '', debit: 0, credit: 0 },
  ]);

  useEffect(() => {
    if (editingJournal) {
      setFormData({
        description: editingJournal.description,
        frequency: editingJournal.frequency,
        startDate: editingJournal.startDate,
        endDate: editingJournal.endDate || '',
        reference: editingJournal.reference || '',
        status: editingJournal.status,
      });
      setLines(editingJournal.lines.map(({ id, ...line }) => line));
      setShowForm(true);
    }
  }, [editingJournal]);

  const addLine = () => {
    setLines([...lines, { account_id: '', account_name: '', debit: 0, credit: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof Omit<RecurringJournalLine, 'id'>, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleSubmit = () => {
    if (!formData.description || !isBalanced) {
      toast({
        title: 'Invalid entry',
        description: !isBalanced ? 'Debits must equal credits' : 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const nextDate = calculateNextGenerationDate(formData.startDate, formData.frequency);

    const journal: RecurringJournal = {
      id: editingJournal?.id || crypto.randomUUID(),
      description: formData.description,
      frequency: formData.frequency,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      nextGenerationDate: editingJournal?.nextGenerationDate || nextDate,
      status: formData.status,
      reference: formData.reference || undefined,
      lines: lines.map(line => ({
        ...line,
        id: crypto.randomUUID(),
      })),
      createdAt: editingJournal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(journal);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      description: '',
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      reference: '',
      status: 'active',
    });
    setLines([
      { account_id: '', account_name: '', debit: 0, credit: 0 },
      { account_id: '', account_name: '', debit: 0, credit: 0 },
    ]);
    setShowForm(false);
    setEditingJournal(null);
  };

  const handleEdit = (journal: RecurringJournal) => {
    setEditingJournal(journal);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Recurring Journals
          </DialogTitle>
        </DialogHeader>

        {!showForm ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Manage recurring journal entries that are automatically generated
              </p>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Recurring Journal
              </Button>
            </div>

            {recurringJournals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No recurring journals</h3>
                  <p className="text-muted-foreground mb-4">Create your first recurring journal entry</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recurringJournals.map((journal) => (
                  <Card key={journal.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{journal.description}</CardTitle>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Frequency: {journal.frequency}</span>
                            <span>Next: {journal.nextGenerationDate}</span>
                            <span className={journal.status === 'active' ? 'text-green-600' : 'text-amber-600'}>
                              {journal.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(journal)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(journal.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Account</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {journal.lines.map((line) => (
                            <TableRow key={line.id}>
                              <TableCell>{line.account_name}</TableCell>
                              <TableCell className="text-right">
                                {line.debit > 0 ? `R${line.debit.toFixed(2)}` : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                {line.credit > 0 ? `R${line.credit.toFixed(2)}` : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Monthly rent payment"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency *</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Reference (Optional)</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="e.g., RENT-MONTHLY"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Journal Lines</h3>
                <Button variant="outline" size="sm" onClick={addLine}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line
                </Button>
              </div>

              <div className="space-y-2">
                {lines.map((line, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-6">
                      <Label className="text-xs">Account</Label>
                      <Select
                        value={line.account_name}
                        onValueChange={(value) => {
                          const account = chartAccounts.find(a => a.accountName === value);
                          if (account) {
                            updateLine(index, 'account_id', account.id);
                            updateLine(index, 'account_name', account.accountName);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {chartAccounts.map((acc) => (
                            <SelectItem key={acc.id} value={acc.accountName}>
                              {acc.accountNumber} - {acc.accountName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Debit</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.debit}
                        onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Credit</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.credit}
                        onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLine(index)}
                        disabled={lines.length <= 2}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-right">
                    <span className="font-semibold">Total Debit:</span>
                    <span className="ml-2">R{totalDebit.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">Total Credit:</span>
                    <span className="ml-2">R{totalCredit.toFixed(2)}</span>
                  </div>
                </div>
                {!isBalanced && (
                  <p className="text-destructive text-sm text-center mt-2">
                    ⚠️ Entry is not balanced. Difference: R{Math.abs(totalDebit - totalCredit).toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!isBalanced}>
                {editingJournal ? 'Update' : 'Create'} Recurring Journal
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
