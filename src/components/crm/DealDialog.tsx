import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Deal {
  id: string;
  title: string;
  customer: string;
  value: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed';
  probability: number;
}

interface DealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal | null;
  onSave: (deal: Deal) => void;
}

export default function DealDialog({ open, onOpenChange, deal, onSave }: DealDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    customer: '',
    value: 0,
    stage: 'lead' as Deal['stage'],
    probability: 0,
  });

  useEffect(() => {
    if (deal) {
      setFormData({
        title: deal.title,
        customer: deal.customer,
        value: deal.value,
        stage: deal.stage,
        probability: deal.probability,
      });
    } else {
      setFormData({
        title: '',
        customer: '',
        value: 0,
        stage: 'lead',
        probability: 0,
      });
    }
  }, [deal, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dealData: Deal = {
      id: deal?.id || crypto.randomUUID(),
      ...formData,
    };
    onSave(dealData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{deal ? 'Edit Deal' : 'Add New Deal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Deal Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter deal title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <Input
              id="customer"
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              placeholder="Enter customer name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Deal Value (ZAR)</Label>
            <Input
              id="value"
              type="number"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value as Deal['stage'] })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="probability">Win Probability (%)</Label>
            <Input
              id="probability"
              type="number"
              min="0"
              max="100"
              value={formData.probability}
              onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) || 0 })}
              placeholder="0"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {deal ? 'Update Deal' : 'Create Deal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
