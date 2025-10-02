import { Industry } from '@/types/quote';

export const industryOptions = [
  { value: 'construction', label: 'Construction' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'professional-services', label: 'Professional Services' },
];

export const constructionCategories = [
  'Labor',
  'Materials',
  'Equipment Rental',
  'Permits & Fees',
  'Subcontractor',
  'Site Preparation',
  'Safety Equipment',
  'Waste Disposal',
];

export const plumbingCategories = [
  'Labor',
  'Fixtures',
  'Pipes & Fittings',
  'Tools & Equipment',
  'Permits',
  'Emergency Surcharge',
  'Disposal Fees',
];

export const electricalCategories = [
  'Labor',
  'Wiring & Cable',
  'Panels & Breakers',
  'Fixtures & Outlets',
  'Conduit & Boxes',
  'Permits & Inspection',
  'Testing & Certification',
];

export const professionalServicesCategories = [
  'Consulting Hours',
  'Research & Analysis',
  'Strategy Development',
  'Implementation Support',
  'Training & Documentation',
  'Project Management',
  'Travel & Expenses',
];

export const getCategoriesForIndustry = (industry: Industry): string[] => {
  switch (industry) {
    case 'construction':
      return constructionCategories;
    case 'plumbing':
      return plumbingCategories;
    case 'electrical':
      return electricalCategories;
    case 'professional-services':
      return professionalServicesCategories;
    default:
      return [];
  }
};

export const unitOptions = [
  'hours',
  'each',
  'sq ft',
  'linear ft',
  'cubic yd',
  'ton',
  'load',
  'day',
  'week',
  'month',
  'lot',
];
