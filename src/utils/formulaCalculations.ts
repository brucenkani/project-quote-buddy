// Financial and mathematical formula calculations

export const formulaFunctions = {
  // Math functions
  SUM: 'Sum all values',
  AVERAGE: 'Average of values',
  COUNT: 'Count non-empty values',
  COUNTA: 'Count all non-blank values',
  COUNTIF: 'Count values matching criteria',
  SUMIF: 'Sum values matching criteria',
  MIN: 'Minimum value',
  MAX: 'Maximum value',
  MEDIAN: 'Median value',
  
  // Financial functions
  PV: 'Present Value',
  FV: 'Future Value',
  PMT: 'Payment',
  NPV: 'Net Present Value',
  IRR: 'Internal Rate of Return',
  RATE: 'Interest Rate',
};

export function calculateFormula(
  formulaType: string,
  data: any[],
  column: string,
  params?: any
): number {
  // Handle IFS formulas (SUMIFS, COUNTIFS, AVERAGEIFS)
  if (formulaType === 'SUMIFS' || formulaType === 'COUNTIFS' || formulaType === 'AVERAGEIFS') {
    const criteriaCol = params?.criteriaCol1 || params?.criteriaColumn;
    const criteriaVal = params?.criteriaVal1 || params?.criteria;
    
    if (!criteriaCol || criteriaVal === undefined) {
      return 0;
    }
    
    const filteredData = data.filter(row => {
      const cellValue = String(row[criteriaCol] || '');
      const criteriaValue = String(criteriaVal);
      return cellValue.toLowerCase().includes(criteriaValue.toLowerCase());
    });
    
    if (formulaType === 'COUNTIFS') {
      return filteredData.length;
    }
    
    const values = filteredData.map(row => Number(row[column]) || 0);
    const sum = values.reduce((acc, val) => acc + val, 0);
    
    if (formulaType === 'SUMIFS') {
      return sum;
    }
    
    if (formulaType === 'AVERAGEIFS') {
      return values.length > 0 ? sum / values.length : 0;
    }
  }
  
  const values = data
    .map(row => parseFloat(row[column]))
    .filter(val => !isNaN(val));

  switch (formulaType) {
    case 'SUM':
      return values.reduce((sum, val) => sum + val, 0);
    
    case 'AVERAGE':
      return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    
    case 'COUNT':
      return values.length;
    
    case 'COUNTA':
      return data.filter(row => row[column] != null && row[column] !== '').length;
    
    case 'COUNTIF':
      const countifCriteriaCol = params?.criteriaCol1 || params?.criteriaColumn || column;
      const countifCriteria = params?.criteriaVal1 || params?.criteria;
      if (!countifCriteria) return 0;
      
      return data.filter(row => {
        const val = row[countifCriteriaCol];
        if (countifCriteria.startsWith('>')) {
          return parseFloat(val) > parseFloat(countifCriteria.substring(1));
        } else if (countifCriteria.startsWith('<')) {
          return parseFloat(val) < parseFloat(countifCriteria.substring(1));
        } else if (countifCriteria.startsWith('=')) {
          return val == countifCriteria.substring(1);
        }
        return String(val).toLowerCase().includes(String(countifCriteria).toLowerCase());
      }).length;
    
    case 'SUMIF':
      const sumifCriteriaCol = params?.criteriaCol1 || params?.criteriaColumn || column;
      const sumifCriteria = params?.criteriaVal1 || params?.criteria;
      if (!sumifCriteria) return 0;
      
      return data.reduce((sum, row) => {
        const criteriaValue = row[sumifCriteriaCol];
        const numVal = parseFloat(row[column]);
        if (isNaN(numVal)) return sum;
        
        let matches = false;
        if (sumifCriteria.startsWith('>')) {
          matches = parseFloat(criteriaValue) > parseFloat(sumifCriteria.substring(1));
        } else if (sumifCriteria.startsWith('<')) {
          matches = parseFloat(criteriaValue) < parseFloat(sumifCriteria.substring(1));
        } else if (sumifCriteria.startsWith('=')) {
          matches = criteriaValue == sumifCriteria.substring(1);
        } else {
          matches = String(criteriaValue).toLowerCase().includes(String(sumifCriteria).toLowerCase());
        }
        
        return matches ? sum + numVal : sum;
      }, 0);
    
    case 'MIN':
      return values.length > 0 ? Math.min(...values) : 0;
    
    case 'MAX':
      return values.length > 0 ? Math.max(...values) : 0;
    
    case 'MEDIAN':
      if (values.length === 0) return 0;
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    
    // Financial Functions
    case 'PV':
      // PV = FV / (1 + rate)^periods
      const { rate: pvRate = 0.1, periods: pvPeriods = 1, fv = 0 } = params || {};
      return fv / Math.pow(1 + pvRate, pvPeriods);
    
    case 'FV':
      // FV = PV * (1 + rate)^periods
      const { rate: fvRate = 0.1, periods: fvPeriods = 1, pv = 0 } = params || {};
      return pv * Math.pow(1 + fvRate, fvPeriods);
    
    case 'PMT':
      // PMT = PV * (rate * (1 + rate)^periods) / ((1 + rate)^periods - 1)
      const { rate: pmtRate = 0.1, periods: pmtPeriods = 1, pv: pmtPv = 0 } = params || {};
      if (pmtRate === 0) return pmtPv / pmtPeriods;
      const factor = Math.pow(1 + pmtRate, pmtPeriods);
      return pmtPv * (pmtRate * factor) / (factor - 1);
    
    case 'NPV':
      // NPV = sum of (cashflow / (1 + rate)^period) for each period
      const { rate: npvRate = 0.1, cashflows = values } = params || {};
      return cashflows.reduce((npv: number, cf: number, i: number) => {
        return npv + cf / Math.pow(1 + npvRate, i + 1);
      }, 0);
    
    case 'IRR':
      // Simplified IRR calculation using Newton-Raphson method
      const irrCashflows = params?.cashflows || values;
      if (irrCashflows.length < 2) return 0;
      
      let rate = 0.1;
      const maxIterations = 100;
      const tolerance = 0.0001;
      
      for (let i = 0; i < maxIterations; i++) {
        let npv = 0;
        let dnpv = 0;
        
        for (let j = 0; j < irrCashflows.length; j++) {
          const power = Math.pow(1 + rate, j);
          npv += irrCashflows[j] / power;
          dnpv -= j * irrCashflows[j] / (power * (1 + rate));
        }
        
        const newRate = rate - npv / dnpv;
        if (Math.abs(newRate - rate) < tolerance) return newRate;
        rate = newRate;
      }
      return rate;
    
    case 'RATE':
      // Simplified rate calculation
      const { periods: ratePeriods = 1, pv: ratePv = 0, fv: rateFv = 0 } = params || {};
      if (ratePv === 0 || ratePeriods === 0) return 0;
      return Math.pow(rateFv / ratePv, 1 / ratePeriods) - 1;
    
    default:
      return 0;
  }
}

export function formatFormulaResult(value: number, formulaType: string): string {
  if (formulaType === 'IRR' || formulaType === 'RATE') {
    return `${(value * 100).toFixed(2)}%`;
  }
  
  if (formulaType === 'COUNT' || formulaType === 'COUNTA' || formulaType === 'COUNTIF' || formulaType === 'COUNTIFS') {
    return Math.round(value).toString();
  }
  
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
