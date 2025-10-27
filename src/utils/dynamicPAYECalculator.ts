// Dynamic PAYE Calculator for Multiple Countries
// Supports South Africa, Zambia, Zimbabwe, and other countries

import { supabase } from '@/integrations/supabase/client';

export interface TaxBracket {
  id: string;
  year: number;
  country: string;
  age_group: 'under_65' | '65_to_75' | 'over_75';
  bracket_min: number;
  bracket_max: number | null;
  rate: number;
  threshold: number;
  rebate: number;
}

export interface PayrollSettings {
  country: string;
  currency: string;
  currency_symbol: string;
  current_tax_year: number;
}

// Calculate age from date of birth
export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Determine age group for tax purposes (primarily for South Africa)
export const getAgeGroup = (age: number): 'under_65' | '65_to_75' | 'over_75' => {
  if (age < 65) return 'under_65';
  if (age >= 65 && age < 75) return '65_to_75';
  return 'over_75';
};

// Fetch tax brackets from database
export const fetchTaxBrackets = async (
  country: string,
  year: number
): Promise<TaxBracket[]> => {
  const { data, error } = await supabase
    .from('tax_brackets')
    .select('*')
    .eq('country', country)
    .eq('year', year)
    .order('bracket_min');

  if (error) {
    console.error('Error fetching tax brackets:', error);
    return [];
  }

  return (data || []) as TaxBracket[];
};

// Calculate annual PAYE based on country and tax brackets
export const calculateAnnualPAYE = (
  annualIncome: number,
  age: number,
  taxBrackets: TaxBracket[],
  country: string
): number => {
  if (taxBrackets.length === 0) {
    return 0; // No tax brackets configured
  }

  // For South Africa, filter by age group
  let applicableBrackets = taxBrackets;
  if (country === 'ZA') {
    const ageGroup = getAgeGroup(age);
    applicableBrackets = taxBrackets
      .filter(b => b.age_group === ageGroup)
      .sort((a, b) => a.bracket_min - b.bracket_min);
  } else {
    // For other countries, use all brackets for the standard age group
    applicableBrackets = taxBrackets
      .filter(b => b.age_group === 'under_65')
      .sort((a, b) => a.bracket_min - b.bracket_min);
  }

  if (applicableBrackets.length === 0) {
    return 0;
  }

  let tax = 0;

  // Calculate tax based on progressive brackets
  for (let i = 0; i < applicableBrackets.length; i++) {
    const bracket = applicableBrackets[i];
    const bracketMin = bracket.bracket_min;
    const bracketMax = bracket.bracket_max || Infinity;

    if (annualIncome > bracketMin) {
      // Calculate taxable amount in this bracket
      const taxableInBracket = Math.min(annualIncome, bracketMax) - bracketMin;
      
      // Add threshold (base amount) and calculate tax on income in this bracket
      if (i === 0 && annualIncome <= bracketMax) {
        // First bracket
        tax = taxableInBracket * (bracket.rate / 100);
      } else {
        // Subsequent brackets: add base amount + percentage of income above minimum
        tax = bracket.threshold + (taxableInBracket * (bracket.rate / 100));
      }

      if (annualIncome <= bracketMax) {
        break;
      }
    }
  }

  // Apply rebate (primarily for South Africa)
  if (country === 'ZA') {
    const rebate = applicableBrackets[0]?.rebate || 0;
    tax = Math.max(0, tax - rebate);
  }

  return tax;
};

// Calculate monthly PAYE
export const calculateMonthlyPAYE = (
  monthlySalary: number,
  age: number,
  taxBrackets: TaxBracket[],
  country: string
): number => {
  const annualIncome = monthlySalary * 12;
  const annualTax = calculateAnnualPAYE(annualIncome, age, taxBrackets, country);
  return annualTax / 12;
};

// Calculate UIF (Unemployment Insurance Fund) - South Africa specific
export const calculateUIF = (grossSalary: number, country: string): number => {
  if (country !== 'ZA') {
    return 0; // UIF is South Africa specific
  }
  
  const maxUifSalary = 17712;
  const uifRate = 0.01;
  const cappedSalary = Math.min(grossSalary, maxUifSalary);
  return cappedSalary * uifRate;
};

// Calculate NAPSA (Zambia) - 5% employee contribution
export const calculateNAPSA = (grossSalary: number, country: string): number => {
  if (country !== 'ZM') {
    return 0; // NAPSA is Zambia specific
  }
  
  return grossSalary * 0.05;
};

// Calculate NHIMA (Zambia) - 1% employee contribution
export const calculateNHIMA = (grossSalary: number, country: string): number => {
  if (country !== 'ZM') {
    return 0; // NHIMA is Zambia specific
  }
  
  return grossSalary * 0.01;
};

// Calculate NSSA (Zimbabwe) - National Social Security Authority
export const calculateNSSA = (grossSalary: number, country: string): number => {
  if (country !== 'ZW') {
    return 0; // NSSA is Zimbabwe specific
  }
  
  // Zimbabwe NSSA: 3.5% employee contribution (capped)
  const maxNSSASalary = 700; // USD or local currency equivalent
  const nssaRate = 0.035;
  const cappedSalary = Math.min(grossSalary, maxNSSASalary);
  return cappedSalary * nssaRate;
};

// Calculate gross salary
export const calculateGrossSalary = (
  basicSalary: number,
  allowances: number = 0,
  overtime: number = 0,
  bonuses: number = 0
): number => {
  return basicSalary + allowances + overtime + bonuses;
};

// Calculate net salary with country-specific deductions
export const calculateNetSalary = (
  grossSalary: number,
  paye: number,
  country: string,
  otherDeductions: number = 0
): number => {
  let statutoryDeductions = paye;

  // Add country-specific statutory deductions
  if (country === 'ZA') {
    statutoryDeductions += calculateUIF(grossSalary, country);
  } else if (country === 'ZM') {
    statutoryDeductions += calculateNAPSA(grossSalary, country);
    statutoryDeductions += calculateNHIMA(grossSalary, country);
  } else if (country === 'ZW') {
    statutoryDeductions += calculateNSSA(grossSalary, country);
  }

  return grossSalary - statutoryDeductions - otherDeductions;
};

// Get all statutory deductions for display
export const getStatutoryDeductions = (
  grossSalary: number,
  paye: number,
  country: string
): { name: string; amount: number }[] => {
  const deductions: { name: string; amount: number }[] = [
    { name: 'PAYE', amount: paye }
  ];

  if (country === 'ZA') {
    deductions.push({ name: 'UIF', amount: calculateUIF(grossSalary, country) });
  } else if (country === 'ZM') {
    deductions.push({ name: 'NAPSA', amount: calculateNAPSA(grossSalary, country) });
    deductions.push({ name: 'NHIMA', amount: calculateNHIMA(grossSalary, country) });
  } else if (country === 'ZW') {
    deductions.push({ name: 'NSSA', amount: calculateNSSA(grossSalary, country) });
  }

  return deductions;
};
