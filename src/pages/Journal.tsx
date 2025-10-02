import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, BookOpen, Trash2, X } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { loadJournalEntries, saveJournalEntry, deleteJournalEntry } from '@/utils/accountingStorage';
import { loadSettings } from '@/utils/settingsStorage';
import { JournalEntry, JournalEntryLine, AccountType } from '@/types/accounting';
import { useToast } from '@/hooks/use-toast';

export default function Journal() {
  const { toast } = useToast();
  const settings = loadSettings();
  const [entries, setEntries] = useState<JournalEntry[]>(loadJournalEntries());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
  });

  const [lines, setLines] = useState<Omit<JournalEntryLine, 'id'>[]>([
    { account: '', accountType: 'asset' as AccountType, debit: 0, credit: 0, description: '' },
    { account: '', accountType: 'asset' as AccountType, debit: 0, credit: 0, description: '' },
  ]);

  const addLine = () => {
    setLines([...lines, { account: '', accountType: 'asset', debit: 0, credit: 0, description: '' }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof Omit<JournalEntryLine, 'id'>, value: any) => {
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
        variant: 'destructive' 
      });
      return;
    }

    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      date: formData.date,
      reference: formData.reference || `JE-${Date.now()}`,
      description: formData.description,
      entries: lines.map(line => ({ ...line, id: crypto.randomUUID() })),
      totalDebit,
      totalCredit,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveJournalEntry(entry);
    setEntries(loadJournalEntries());
    setIsDialogOpen(false);
    
    // Reset form
    setFormData({ date: new Date().toISOString().split('T')[0], reference: '', description: '' });
    setLines([
      { account: '', accountType: 'asset', debit: 0, credit: 0, description: '' },
      { account: '', accountType: 'asset', debit: 0, credit: 0, description: '' },
    ]);
    
    toast({ title: 'Journal entry added successfully' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this journal entry?')) {
      deleteJournalEntry(id);
      setEntries(loadJournalEntries());
      toast({ title: 'Journal entry deleted' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              Journal Entries
            </h1>
            <p className="text-muted-foreground">Record double-entry accounting transactions</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Journal Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference">Reference</Label>
                    <Input
                      id="reference"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
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
                        <div className="col-span-3">
                          <Label className="text-xs">Account</Label>
                          <Input
                            value={line.account}
                            onChange={(e) => updateLine(index, 'account', e.target.value)}
                            placeholder="Account name"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={line.accountType}
                            onValueChange={(value: AccountType) => updateLine(index, 'accountType', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="asset">Asset</SelectItem>
                              <SelectItem value="liability">Liability</SelectItem>
                              <SelectItem value="equity">Equity</SelectItem>
                              <SelectItem value="revenue">Revenue</SelectItem>
                              <SelectItem value="expense">Expense</SelectItem>
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
                          <Label className="text-xs">Note</Label>
                          <Input
                            value={line.description}
                            onChange={(e) => updateLine(index, 'description', e.target.value)}
                            placeholder="Optional"
                          />
                        </div>
                        <div className="col-span-1">
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
                        <span className="ml-2">{settings.currencySymbol}{totalDebit.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">Total Credit:</span>
                        <span className="ml-2">{settings.currencySymbol}{totalCredit.toFixed(2)}</span>
                      </div>
                    </div>
                    {!isBalanced && (
                      <p className="text-destructive text-sm text-center mt-2">
                        ⚠️ Entry is not balanced. Difference: {settings.currencySymbol}{Math.abs(totalDebit - totalCredit).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={!isBalanced}>Post Entry</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {entries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No journal entries</h3>
              <p className="text-muted-foreground mb-4">Create your first journal entry</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="shadow-[var(--shadow-elegant)] border-border/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{entry.description}</CardTitle>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Date:</strong> {new Date(entry.date).toLocaleDateString()}</p>
                        <p><strong>Reference:</strong> {entry.reference}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">
                        {settings.currencySymbol}{entry.totalDebit.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2">Account</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-right p-2">Debit</th>
                          <th className="text-right p-2">Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.entries.map((line) => (
                          <tr key={line.id} className="border-t">
                            <td className="p-2">{line.account}</td>
                            <td className="p-2 capitalize">{line.accountType}</td>
                            <td className="p-2 text-right">
                              {line.debit > 0 ? `${settings.currencySymbol}${line.debit.toFixed(2)}` : '-'}
                            </td>
                            <td className="p-2 text-right">
                              {line.credit > 0 ? `${settings.currencySymbol}${line.credit.toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
