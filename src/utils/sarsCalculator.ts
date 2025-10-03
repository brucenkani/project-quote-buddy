// SARS Tax Calculation Utilities for South Africa

export interface SARSTaxBracket {
  year: number;
  age_group: 'under_65' | '65_to_75' | 'over_75';
  bracket_min: number;
  bracket_max: number | null;
  rate: number;
  threshold: number;
  rebate: number;
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

// Determine age group for tax purposes
export const getAgeGroup = (age: number): 'under_65' | '65_to_75' | 'over_75' => {
  if (age < 65) return 'under_65';
  if (age >= 65 && age < 75) return '65_to_75';
  return 'over_75';
};

// Calculate annual PAYE (Pay As You Earn) tax
export const calculateAnnualPAYE = (
  annualIncome: number,
  age: number,
  taxBrackets: SARSTaxBracket[]
): number => {
  const ageGroup = getAgeGroup(age);
  const currentYear = new Date().getFullYear();
  
  // Get applicable tax brackets for the age group
  const applicableBrackets = taxBrackets
    .filter(b => b.year === currentYear && b.age_group === ageGroup)
    .sort((a, b) => a.bracket_min - b.bracket_min);

  if (applicableBrackets.length === 0) {
    return 0; // No tax brackets configured
  }

  let tax = 0;
  
  for (let i = 0; i < applicableBrackets.length; i++) {
    const bracket = applicableBrackets[i];
    const bracketMin = bracket.bracket_min;
    const bracketMax = bracket.bracket_max || Infinity;
    
    if (annualIncome > bracketMin) {
      const taxableInBracket = Math.min(annualIncome, bracketMax) - bracketMin;
      tax += bracket.threshold + (taxableInBracket * bracket.rate);
      
      if (annualIncome <= bracketMax) {
        break;
      }
    }
  }

  // Apply rebate
  const rebate = applicableBrackets[0]?.rebate || 0;
  tax = Math.max(0, tax - rebate);
  
  return tax;
};

// Calculate monthly PAYE
export const calculateMonthlyPAYE = (
  monthlySalary: number,
  age: number,
  taxBrackets: SARSTaxBracket[]
): number => {
  const annualIncome = monthlySalary * 12;
  const annualTax = calculateAnnualPAYE(annualIncome, age, taxBrackets);
  return annualTax / 12;
};

// Calculate UIF (Unemployment Insurance Fund)
// Employee contributes 1% of gross salary (capped at R17,712 per month)
export const calculateUIF = (grossSalary: number): number => {
  const maxUifSalary = 17712;
  const uifRate = 0.01;
  const cappedSalary = Math.min(grossSalary, maxUifSalary);
  return cappedSalary * uifRate;
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

// Calculate net salary
export const calculateNetSalary = (
  grossSalary: number,
  paye: number,
  uif: number,
  otherDeductions: number = 0
): number => {
  return grossSalary - paye - uif - otherDeductions;
};

// Default SARS tax brackets for 2024/2025 (example data)
// Admins should configure these in the system
export const defaultTaxBrackets2024: SARSTaxBracket[] = [
  // Under 65
  { year: 2024, age_group: 'under_65', bracket_min: 0, bracket_max: 237100, rate: 0.18, threshold: 0, rebate: 17235 },
  { year: 2024, age_group: 'under_65', bracket_min: 237100, bracket_max: 370500, rate: 0.26, threshold: 42678, rebate: 17235 },
  { year: 2024, age_group: 'under_65', bracket_min: 370500, bracket_max: 512800, rate: 0.31, threshold: 77362, rebate: 17235 },
  { year: 2024, age_group: 'under_65', bracket_min: 512800, bracket_max: 673000, rate: 0.36, threshold: 121475, rebate: 17235 },
  { year: 2024, age_group: 'under_65', bracket_min: 673000, bracket_max: 857900, rate: 0.39, threshold: 179147, rebate: 17235 },
  { year: 2024, age_group: 'under_65', bracket_min: 857900, bracket_max: 1817000, rate: 0.41, threshold: 251258, rebate: 17235 },
  { year: 2024, age_group: 'under_65', bracket_min: 1817000, bracket_max: null, rate: 0.45, threshold: 644489, rebate: 17235 },
  
  // Age 65 to 75
  { year: 2024, age_group: '65_to_75', bracket_min: 0, bracket_max: 370500, rate: 0.18, threshold: 0, rebate: 26679 },
  { year: 2024, age_group: '65_to_75', bracket_min: 370500, bracket_max: 512800, rate: 0.26, threshold: 24012, rebate: 26679 },
  { year: 2024, age_group: '65_to_75', bracket_min: 512800, bracket_max: 673000, rate: 0.31, threshold: 61110, rebate: 26679 },
  { year: 2024, age_group: '65_to_75', bracket_min: 673000, bracket_max: 857900, rate: 0.36, threshold: 110772, rebate: 26679 },
  { year: 2024, age_group: '65_to_75', bracket_min: 857900, bracket_max: 1817000, rate: 0.39, threshold: 177336, rebate: 26679 },
  { year: 2024, age_group: '65_to_75', bracket_min: 1817000, bracket_max: null, rate: 0.41, threshold: 570567, rebate: 26679 },
  
  // Over 75
  { year: 2024, age_group: 'over_75', bracket_min: 0, bracket_max: 512800, rate: 0.18, threshold: 0, rebate: 29861 },
  { year: 2024, age_group: 'over_75', bracket_min: 512800, bracket_max: 673000, rate: 0.26, threshold: 37008, rebate: 29861 },
  { year: 2024, age_group: 'over_75', bracket_min: 673000, bracket_max: 857900, rate: 0.31, threshold: 78660, rebate: 29861 },
  { year: 2024, age_group: 'over_75', bracket_min: 857900, bracket_max: 1817000, rate: 0.36, threshold: 136979, rebate: 29861 },
  { year: 2024, age_group: 'over_75', bracket_min: 1817000, bracket_max: null, rate: 0.39, threshold: 482256, rebate: 29861 },
];
