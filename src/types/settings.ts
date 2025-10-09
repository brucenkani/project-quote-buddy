export type CompanyType = 'trading' | 'manufacturer' | 'contractor' | 'professional-services';
export type Country = 'ZA' | 'ZW' | 'ZM';

export interface CompanySettings {
  companyName: string;
  companyType: CompanyType;
  country: Country;
  email: string;
  phone: string;
  address: string;
  website: string;
  logoUrl?: string;
  primaryColor: string;
  taxRate: number;
  currency: string;
  currencySymbol: string;
  financialYearEndMonth: number;
  vatNumber?: string; // VAT registration number (country-specific)
  incomeTaxNumber?: string; // Income tax number (country-specific)
  companyRegistrationNumber?: string; // Company registration number (country-specific)
  bankName?: string; // Bank name for invoices
  accountNumber?: string; // Bank account number
  branchCode?: string; // Bank branch code
}

export const defaultSettings: CompanySettings = {
  companyName: 'QuoteBuilder Pro',
  companyType: 'contractor',
  country: 'ZA',
  email: 'professional@quotebuilder.com',
  phone: '',
  address: '',
  website: '',
  primaryColor: '#3b82f6',
  taxRate: 0.15,
  currency: 'ZAR',
  currencySymbol: 'R',
  financialYearEndMonth: 12, // December
};

export const countries = [
  { 
    code: 'ZA' as Country, 
    name: 'South Africa', 
    currency: 'ZAR', 
    symbol: 'R',
    vatLabel: 'VAT Number',
    incomeTaxLabel: 'Income Tax Reference Number',
    companyRegLabel: 'Company Registration Number (CK/CIPC)'
  },
  { 
    code: 'ZW' as Country, 
    name: 'Zimbabwe', 
    currency: 'ZWL', 
    symbol: 'Z$',
    vatLabel: 'VAT Registration Number',
    incomeTaxLabel: 'TIN (Tax Identification Number)',
    companyRegLabel: 'Company Registration Number'
  },
  { 
    code: 'ZM' as Country, 
    name: 'Zambia', 
    currency: 'ZMW', 
    symbol: 'ZK',
    vatLabel: 'VAT Registration Number',
    incomeTaxLabel: 'TPIN (Taxpayer Identification Number)',
    companyRegLabel: 'PACRA Registration Number'
  },
];

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
