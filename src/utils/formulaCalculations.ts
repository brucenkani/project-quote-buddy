// Financial and mathematical formula calculations

export const formulaFunctions = {
  // Math functions
  SUM: 'Sum all values',
  AVERAGE: 'Average of values',
  COUNT: 'Count non-empty values',
  COUNTA: 'Count all non-blank values',
  COUNTIFS: 'Count values matching multiple criteria',
  SUMIFS: 'Sum values matching multiple criteria',
  AVERAGEIFS: 'Average values matching multiple criteria',
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
  // Handle IFS formulas (SUMIFS, COUNTIFS, AVERAGEIFS) with multiple criteria
  if (formulaType === 'SUMIFS' || formulaType === 'COUNTIFS' || formulaType === 'AVERAGEIFS') {
    const criteria = params?.criteria || [];
    
    if (!Array.isArray(criteria) || criteria.length === 0) {
      return 0;
    }
    
    const filteredData = data.filter(row => {
      // All criteria must match
      return criteria.every((crit: any) => {
        if (!crit.column || crit.value === undefined || crit.value === '') {
          return true; // Skip empty criteria
        }
        
        const cellValue = row[crit.column];
        const criteriaValue = crit.value;
        
        // Handle comparison operators
        if (typeof criteriaValue === 'string') {
          if (criteriaValue.startsWith('>=')) {
            return parseFloat(cellValue) >= parseFloat(criteriaValue.substring(2));
          } else if (criteriaValue.startsWith('<=')) {
            return parseFloat(cellValue) <= parseFloat(criteriaValue.substring(2));
          } else if (criteriaValue.startsWith('>')) {
            return parseFloat(cellValue) > parseFloat(criteriaValue.substring(1));
          } else if (criteriaValue.startsWith('<')) {
            return parseFloat(cellValue) < parseFloat(criteriaValue.substring(1));
          } else if (criteriaValue.startsWith('=')) {
            return String(cellValue) === criteriaValue.substring(1);
          } else if (criteriaValue.startsWith('!=') || criteriaValue.startsWith('<>')) {
            return String(cellValue) !== criteriaValue.substring(2);
          }
        }
        
        // Text matching (case-insensitive contains)
        return String(cellValue || '').toLowerCase().includes(String(criteriaValue).toLowerCase());
      });
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
      // PV(rate, nper, pmt, [fv], [type]) - Excel format
      const { 
        rate: pvRate = 0, 
        nper: pvNper = 1, 
        pmt: pvPmt = 0,
        fv: pvFv = 0,
        type: pvType = 0,
        frequency: pvFreq = 1 
      } = params || {};
      const pvPerRate = pvRate / pvFreq;
      const pvTotalPer = pvNper * pvFreq;
      
      if (pvPmt === 0) {
        // Lump sum calculation
        return pvFv / Math.pow(1 + pvPerRate, pvTotalPer);
      }
      // Annuity calculation
      const pvFactor = Math.pow(1 + pvPerRate, pvTotalPer);
      let pv = (pvPmt * (1 - 1 / pvFactor) / pvPerRate) + (pvFv / pvFactor);
      
      // Adjust for payment timing
      if (pvType === 1) {
        pv = pv * (1 + pvPerRate);
      }
      
      return pv;
    
    case 'FV':
      // FV(rate, nper, pmt, [pv], [type]) - Excel format
      const { 
        rate: fvRate = 0, 
        nper: fvNper = 1, 
        pmt: fvPmt = 0,
        pv: fvPv = 0,
        type: fvType = 0,
        frequency: fvFreq = 1 
      } = params || {};
      const fvPerRate = fvRate / fvFreq;
      const fvTotalPer = fvNper * fvFreq;
      
      if (fvPmt === 0) {
        // Lump sum calculation
        return fvPv * Math.pow(1 + fvPerRate, fvTotalPer);
      }
      // Annuity calculation
      const fvFactor = Math.pow(1 + fvPerRate, fvTotalPer);
      let fv = (fvPmt * (fvFactor - 1) / fvPerRate) + (fvPv * fvFactor);
      
      // Adjust for payment timing
      if (fvType === 1) {
        fv = fv * (1 + fvPerRate);
      }
      
      return fv;
    
    case 'PMT':
      // PMT(rate, nper, pv, [fv], [type]) - Excel format
      const { 
        rate: pmtRate = 0, 
        nper: pmtNper = 1, 
        pv: pmtPv = 0,
        fv: pmtFv = 0,
        type: pmtType = 0,
        frequency: pmtFreq = 1 
      } = params || {};
      const pmtPerRate = pmtRate / pmtFreq;
      const pmtTotalPer = pmtNper * pmtFreq;
      
      if (pmtPerRate === 0) return -(pmtPv + pmtFv) / pmtTotalPer;
      const pmtFactor = Math.pow(1 + pmtPerRate, pmtTotalPer);
      let payment = -(pmtPv * pmtFactor + pmtFv) * pmtPerRate / (pmtFactor - 1);
      
      // Adjust for payment timing (type: 0 = end of period, 1 = beginning)
      if (pmtType === 1) {
        payment = payment / (1 + pmtPerRate);
      }
      
      console.log('PMT Calculation:', { pmtRate, pmtNper, pmtPv, pmtFv, pmtType, pmtPerRate, pmtTotalPer, pmtFactor, payment });
      return payment;
    
    case 'NPV':
      // NPV(rate, value1, [value2], ...) - Excel format
      const { 
        rate: npvRate = 0, 
        cashflows = values,
        frequency: npvFreq = 1 
      } = params || {};
      const npvPerRate = npvRate / npvFreq;
      return cashflows.reduce((npv: number, cf: number, i: number) => {
        return npv + cf / Math.pow(1 + npvPerRate, i + 1);
      }, 0);
    
    case 'IRR':
      // IRR(values, [guess]) - Excel format
      const irrCashflows = params?.cashflows || values;
      const irrFreq = params?.frequency || 1;
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
        if (Math.abs(newRate - rate) < tolerance) return newRate * irrFreq; // Annualize
        rate = newRate;
      }
      return rate * irrFreq;
    
    case 'RATE':
      // RATE(nper, pmt, pv, [fv], [type]) - Excel format
      const { 
        nper: rateNper = 1, 
        pmt: ratePmt = 0,
        pv: ratePv = 0, 
        fv: rateFv = 0,
        frequency: rateFreq = 1 
      } = params || {};
      
      if (ratePmt === 0) {
        // Simple rate calculation for lump sum
        if (ratePv === 0 || rateNper === 0) return 0;
        const totalPer = rateNper * rateFreq;
        return (Math.pow(Math.abs(rateFv / ratePv), 1 / totalPer) - 1) * rateFreq;
      }
      
      // Newton-Raphson for annuity
      let r = 0.1 / rateFreq;
      for (let i = 0; i < 100; i++) {
        const totalPer = rateNper * rateFreq;
        const factor = Math.pow(1 + r, totalPer);
        const pv_calc = (ratePmt * (1 - 1 / factor) / r) + (rateFv / factor);
        const error = pv_calc + ratePv;
        
        if (Math.abs(error) < 0.0001) return r * rateFreq;
        
        const derivative = -totalPer * ratePmt / (r * r * factor) - 
                          ratePmt * (1 - 1 / factor) / (r * r) -
                          totalPer * rateFv / (r * factor);
        r = r - error / derivative;
      }
      return r * rateFreq;
    
    default:
      return 0;
  }
}

export function formatFormulaResult(value: number, formulaType: string): string {
  // Handle invalid numbers
  if (!isFinite(value) || isNaN(value)) {
    return '0';
  }
  
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
