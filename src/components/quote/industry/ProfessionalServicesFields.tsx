import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IndustrySpecificFields } from '@/types/quote';

interface ProfessionalServicesFieldsProps {
  fields?: IndustrySpecificFields['professionalServices'];
  onChange: (fields: IndustrySpecificFields['professionalServices']) => void;
}

export const ProfessionalServicesFields = ({ fields, onChange }: ProfessionalServicesFieldsProps) => {
  const updateField = (key: string, value: any) => {
    onChange({ ...fields, [key]: value } as IndustrySpecificFields['professionalServices']);
  };

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      <h3 className="font-semibold text-lg">Professional Services Details</h3>
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
              <SelectItem value="consulting">Consulting</SelectItem>
              <SelectItem value="strategy">Strategy Development</SelectItem>
              <SelectItem value="implementation">Implementation</SelectItem>
              <SelectItem value="training">Training & Development</SelectItem>
              <SelectItem value="audit">Audit & Assessment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Hourly Rate ($)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={fields?.hourlyRate || ''}
            onChange={(e) => updateField('hourlyRate', parseFloat(e.target.value))}
            placeholder="150.00"
          />
        </div>

        <div className="space-y-2">
          <Label>Estimated Hours</Label>
          <Input
            type="number"
            min="0"
            value={fields?.estimatedHours || ''}
            onChange={(e) => updateField('estimatedHours', parseFloat(e.target.value))}
            placeholder="40"
          />
        </div>

        <div className="space-y-2">
          <Label>Number of Milestones</Label>
          <Input
            type="number"
            min="0"
            value={fields?.milestones || ''}
            onChange={(e) => updateField('milestones', parseInt(e.target.value))}
            placeholder="3"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label>Deliverables (comma-separated)</Label>
          <Input
            value={fields?.deliverables?.join(', ') || ''}
            onChange={(e) => updateField('deliverables', e.target.value.split(',').map(d => d.trim()))}
            placeholder="Final Report, Strategy Document, Implementation Plan"
          />
        </div>
      </div>
    </div>
  );
};
