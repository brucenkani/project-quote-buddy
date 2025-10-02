export type CompanyType = 'trading' | 'manufacturer' | 'contractor' | 'professional-services';

export interface CompanySettings {
  companyName: string;
  companyType: CompanyType;
  email: string;
  phone: string;
  address: string;
  website: string;
  logoUrl?: string;
  primaryColor: string;
  taxRate: number;
  currency: string;
  currencySymbol: string;
  financialYearEndMonth: number; // 1-12, representing January-December
}

export const defaultSettings: CompanySettings = {
  companyName: 'QuoteBuilder Pro',
  companyType: 'contractor',
  email: 'professional@quotebuilder.com',
  phone: '',
  address: '',
  website: '',
  primaryColor: '#3b82f6',
  taxRate: 0.08,
  currency: 'USD',
  currencySymbol: '$',
  financialYearEndMonth: 12, // December
};

export const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
];
