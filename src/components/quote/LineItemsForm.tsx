import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineItem, Industry } from '@/types/quote';
import { getCategoriesForIndustry, unitOptions } from '@/utils/industryData';
import { Plus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LineItemsFormProps {
  lineItems: LineItem[];
  industry: Industry;
  onLineItemsChange: (items: LineItem[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const LineItemsForm = ({
  lineItems,
  industry,
  onLineItemsChange,
  onNext,
  onBack,
}: LineItemsFormProps) => {
  const [newItem, setNewItem] = useState<Partial<LineItem>>({
    description: '',
    quantity: 1,
    unit: 'hours',
    unitPrice: 0,
    category: '',
  });

  const categories = getCategoriesForIndustry(industry);

  const addLineItem = () => {
    if (newItem.description && newItem.quantity && newItem.unitPrice) {
      const item: LineItem = {
        id: crypto.randomUUID(),
        description: newItem.description,
        quantity: newItem.quantity,
        unit: newItem.unit || 'hours',
        unitPrice: newItem.unitPrice,
        total: newItem.quantity * newItem.unitPrice,
        category: newItem.category,
      };
      onLineItemsChange([...lineItems, item]);
      setNewItem({
        description: '',
        quantity: 1,
        unit: 'hours',
        unitPrice: 0,
        category: '',
      });
    }
  };

  const removeLineItem = (id: string) => {
    onLineItemsChange(lineItems.filter((item) => item.id !== id));
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Line Items</h2>
        <p className="text-muted-foreground">Add materials, labor, and other costs for your quote</p>
      </div>

      <Card className="p-6 bg-muted/30">
        <h3 className="font-semibold mb-4">Add New Item</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label>Description *</Label>
            <Input
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              placeholder="Item description"
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={newItem.category}
              onValueChange={(value) => setNewItem({ ...newItem, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quantity *</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label>Unit</Label>
            <Select
              value={newItem.unit}
              onValueChange={(value) => setNewItem({ ...newItem, unit: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {unitOptions.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Unit Price *</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={newItem.unitPrice}
              onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
            />
          </div>
        </div>

        <Button
          onClick={addLineItem}
          className="mt-4 bg-primary hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </Card>

      {lineItems.length > 0 && (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.description}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {item.category || 'Uncategorized'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">{item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-semibold">{item.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(item.id)}
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30">
                <TableCell colSpan={5} className="text-right font-bold">
                  Subtotal
                </TableCell>
                <TableCell className="text-right font-bold text-lg">
                  {subtotal.toFixed(2)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={lineItems.length === 0}
          className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity"
        >
          Continue to Preview
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
