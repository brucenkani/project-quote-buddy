import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { IndustrySpecificFields } from '@/types/quote';

interface PlumbingFieldsProps {
  fields?: IndustrySpecificFields['plumbing'];
  onChange: (fields: IndustrySpecificFields['plumbing']) => void;
}

export const PlumbingFields = ({ fields, onChange }: PlumbingFieldsProps) => {
  const updateField = (key: string, value: any) => {
    onChange({ ...fields, [key]: value } as IndustrySpecificFields['plumbing']);
  };

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      <h3 className="font-semibold text-lg">Plumbing-Specific Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Service Type</Label>
          <Select
            value={fields?.serviceType}
            onValueChange={(value) => updateField('serviceType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="installation">Installation</SelectItem>
              <SelectItem value="repair">Repair</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="remodel">Remodel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Number of Fixtures</Label>
          <Input
            type="number"
            value={fields?.fixtures || ''}
            onChange={(e) => updateField('fixtures', parseInt(e.target.value))}
            placeholder="5"
          />
        </div>

        <div className="space-y-2">
          <Label>Warranty Period</Label>
          <Select
            value={fields?.warrantyPeriod}
            onValueChange={(value) => updateField('warrantyPeriod', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select warranty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30-days">30 Days</SelectItem>
              <SelectItem value="90-days">90 Days</SelectItem>
              <SelectItem value="1-year">1 Year</SelectItem>
              <SelectItem value="2-years">2 Years</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Checkbox
            id="emergencyService"
            checked={fields?.emergencyService}
            onCheckedChange={(checked) => updateField('emergencyService', checked)}
          />
          <Label htmlFor="emergencyService" className="cursor-pointer">
            Emergency Service
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="inspectionRequired"
            checked={fields?.inspectionRequired}
            onCheckedChange={(checked) => updateField('inspectionRequired', checked)}
          />
          <Label htmlFor="inspectionRequired" className="cursor-pointer">
            Inspection Required
          </Label>
        </div>
      </div>
    </div>
  );
};
