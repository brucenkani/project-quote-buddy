import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProjectDetails, IndustrySpecificFields, Industry } from '@/types/quote';
import { industryOptions } from '@/utils/industryData';
import { ContactSelector } from '@/components/ContactSelector';
import { Contact } from '@/types/contacts';
import { ConstructionFields } from './industry/ConstructionFields';
import { PlumbingFields } from './industry/PlumbingFields';
import { ElectricalFields } from './industry/ElectricalFields';
import { ProfessionalServicesFields } from './industry/ProfessionalServicesFields';
import { ArrowRight } from 'lucide-react';

interface ProjectDetailsFormProps {
  projectDetails: ProjectDetails;
  industryFields: IndustrySpecificFields;
  onProjectDetailsChange: (details: ProjectDetails) => void;
  onIndustryFieldsChange: (fields: IndustrySpecificFields) => void;
  onNext: () => void;
}

export const ProjectDetailsForm = ({
  projectDetails,
  industryFields,
  onProjectDetailsChange,
  onIndustryFieldsChange,
  onNext,
}: ProjectDetailsFormProps) => {
  const updateField = (field: keyof ProjectDetails, value: string) => {
    onProjectDetailsChange({ ...projectDetails, [field]: value });
  };

  const isFormValid = () => {
    return (
      projectDetails.clientName &&
      projectDetails.clientEmail &&
      projectDetails.projectName &&
      projectDetails.industry
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Project Information</h2>
        <p className="text-muted-foreground">Enter the basic details about your project and client</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="clientName">Client Name *</Label>
          <ContactSelector
            type="client"
            value=""
            onSelect={(contact: Contact) => {
              updateField('clientName', contact.name);
              updateField('clientEmail', contact.email);
              updateField('clientPhone', contact.phone);
            }}
            placeholder="Select or add client"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientEmail">Client Email *</Label>
          <Input
            id="clientEmail"
            type="email"
            value={projectDetails.clientEmail}
            onChange={(e) => updateField('clientEmail', e.target.value)}
            placeholder="john@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientPhone">Client Phone</Label>
          <Input
            id="clientPhone"
            type="tel"
            value={projectDetails.clientPhone}
            onChange={(e) => updateField('clientPhone', e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry *</Label>
          <Select
            value={projectDetails.industry}
            onValueChange={(value: Industry) => updateField('industry', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {industryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectName">Project Name *</Label>
          <Input
            id="projectName"
            value={projectDetails.projectName}
            onChange={(e) => updateField('projectName', e.target.value)}
            placeholder="Kitchen Renovation"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectAddress">Project Address</Label>
          <Input
            id="projectAddress"
            value={projectDetails.projectAddress}
            onChange={(e) => updateField('projectAddress', e.target.value)}
            placeholder="123 Main St, City, State"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Estimated Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={projectDetails.startDate}
            onChange={(e) => updateField('startDate', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedDuration">Estimated Duration</Label>
          <Input
            id="estimatedDuration"
            value={projectDetails.estimatedDuration}
            onChange={(e) => updateField('estimatedDuration', e.target.value)}
            placeholder="2 weeks"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="additionalNotes">Additional Notes</Label>
        <Textarea
          id="additionalNotes"
          value={projectDetails.additionalNotes}
          onChange={(e) => updateField('additionalNotes', e.target.value)}
          placeholder="Any special requirements or notes about the project..."
          rows={4}
        />
      </div>

      {projectDetails.industry === 'construction' && (
        <ConstructionFields
          fields={industryFields.construction}
          onChange={(fields) => onIndustryFieldsChange({ ...industryFields, construction: fields })}
        />
      )}

      {projectDetails.industry === 'plumbing' && (
        <PlumbingFields
          fields={industryFields.plumbing}
          onChange={(fields) => onIndustryFieldsChange({ ...industryFields, plumbing: fields })}
        />
      )}

      {projectDetails.industry === 'electrical' && (
        <ElectricalFields
          fields={industryFields.electrical}
          onChange={(fields) => onIndustryFieldsChange({ ...industryFields, electrical: fields })}
        />
      )}

      {projectDetails.industry === 'professional-services' && (
        <ProfessionalServicesFields
          fields={industryFields.professionalServices}
          onChange={(fields) => onIndustryFieldsChange({ ...industryFields, professionalServices: fields })}
        />
      )}

      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          disabled={!isFormValid()}
          className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity"
        >
          Continue to Line Items
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
