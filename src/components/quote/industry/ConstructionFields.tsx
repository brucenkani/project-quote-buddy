import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { IndustrySpecificFields } from '@/types/quote';

interface ConstructionFieldsProps {
  fields?: IndustrySpecificFields['construction'];
  onChange: (fields: IndustrySpecificFields['construction']) => void;
}

export const ConstructionFields = ({ fields, onChange }: ConstructionFieldsProps) => {
  const updateField = (key: string, value: any) => {
    onChange({ ...fields, [key]: value } as IndustrySpecificFields['construction']);
  };

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      <h3 className="font-semibold text-lg">Construction-Specific Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Project Type</Label>
          <Select
            value={fields?.projectType}
            onValueChange={(value) => updateField('projectType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="renovation">Renovation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Square Footage</Label>
          <Input
            type="number"
            value={fields?.squareFootage || ''}
            onChange={(e) => updateField('squareFootage', parseFloat(e.target.value))}
            placeholder="2500"
          />
        </div>

        <div className="space-y-2">
          <Label>Floor Count</Label>
          <Input
            type="number"
            value={fields?.floorCount || ''}
            onChange={(e) => updateField('floorCount', parseInt(e.target.value))}
            placeholder="2"
          />
        </div>

        <div className="space-y-2">
          <Label>Site Accessibility</Label>
          <Select
            value={fields?.siteAccessibility}
            onValueChange={(value) => updateField('siteAccessibility', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select accessibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy Access</SelectItem>
              <SelectItem value="moderate">Moderate Access</SelectItem>
              <SelectItem value="difficult">Difficult Access</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Weather Contingency (%)</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={fields?.weatherContingency || ''}
            onChange={(e) => updateField('weatherContingency', parseFloat(e.target.value))}
            placeholder="10"
          />
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Checkbox
            id="permitRequired"
            checked={fields?.permitRequired}
            onCheckedChange={(checked) => updateField('permitRequired', checked)}
          />
          <Label htmlFor="permitRequired" className="cursor-pointer">
            Permit Required
          </Label>
        </div>
      </div>
    </div>
  );
};
