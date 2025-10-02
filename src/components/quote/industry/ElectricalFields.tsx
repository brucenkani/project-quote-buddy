import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { IndustrySpecificFields } from '@/types/quote';

interface ElectricalFieldsProps {
  fields?: IndustrySpecificFields['electrical'];
  onChange: (fields: IndustrySpecificFields['electrical']) => void;
}

export const ElectricalFields = ({ fields, onChange }: ElectricalFieldsProps) => {
  const updateField = (key: string, value: any) => {
    onChange({ ...fields, [key]: value } as IndustrySpecificFields['electrical']);
  };

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      <h3 className="font-semibold text-lg">Electrical-Specific Details</h3>
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
              <SelectItem value="upgrade">Upgrade</SelectItem>
              <SelectItem value="inspection">Inspection</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Voltage</Label>
          <Select
            value={fields?.voltage}
            onValueChange={(value) => updateField('voltage', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select voltage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="110V">110V</SelectItem>
              <SelectItem value="220V">220V</SelectItem>
              <SelectItem value="240V">240V</SelectItem>
              <SelectItem value="480V">480V</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Circuit Count</Label>
          <Input
            type="number"
            value={fields?.circuitCount || ''}
            onChange={(e) => updateField('circuitCount', parseInt(e.target.value))}
            placeholder="12"
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
