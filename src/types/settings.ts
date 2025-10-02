export interface CompanySettings {
  companyName: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  logoUrl?: string;
  primaryColor: string;
  taxRate: number;
}

export const defaultSettings: CompanySettings = {
  companyName: 'QuoteBuilder Pro',
  email: 'professional@quotebuilder.com',
  phone: '',
  address: '',
  website: '',
  primaryColor: '#3b82f6',
  taxRate: 0.08,
};
