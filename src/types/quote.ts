export type Industry = 'construction' | 'plumbing' | 'electrical' | 'professional-services';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category?: string;
}

export interface ProjectDetails {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  projectName: string;
  projectAddress: string;
  industry: Industry;
  startDate: string;
  estimatedDuration: string;
  additionalNotes: string;
}

export interface IndustrySpecificFields {
  construction?: {
    projectType: string;
    squareFootage: number;
    floorCount: number;
    permitRequired: boolean;
    siteAccessibility: string;
    weatherContingency: number;
  };
  plumbing?: {
    serviceType: string;
    fixtures: number;
    emergencyService: boolean;
    warrantyPeriod: string;
    inspectionRequired: boolean;
  };
  electrical?: {
    serviceType: string;
    voltage: string;
    circuitCount: number;
    permitRequired: boolean;
    inspectionRequired: boolean;
  };
  professionalServices?: {
    serviceType: string;
    hourlyRate: number;
    estimatedHours: number;
    deliverables: string[];
    milestones: number;
  };
}

export interface Quote {
  id: string;
  projectDetails: ProjectDetails;
  industryFields: IndustrySpecificFields;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  validUntil: string;
  createdAt: string;
}
