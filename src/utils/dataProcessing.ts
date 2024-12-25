import { ParsedData } from "../types/data";

export function calculateStatistics(data: ParsedData[], column: string) {
  const numericData = data
    .map(row => parseFloat(row[column] as string))
    .filter(value => !isNaN(value));

  const sum = numericData.reduce((acc, val) => acc + val, 0);
  const mean = sum / numericData.length;
  const sortedData = [...numericData].sort((a, b) => a - b);
  const median = sortedData[Math.floor(sortedData.length / 2)];
  const min = sortedData[0];
  const max = sortedData[sortedData.length - 1];

  const variance = numericData.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numericData.length;
  const stdDev = Math.sqrt(variance);

  return { mean, median, min, max, stdDev };
}

export function detectOutliers(data: ParsedData[], column: string) {
  const { mean, stdDev } = calculateStatistics(data, column);
  const threshold = 3; // Number of standard deviations to consider as outlier

  return data.filter(row => {
    const value = parseFloat(row[column] as string);
    return Math.abs(value - mean) > threshold * stdDev;
  });
}

export function calculateCorrelation(data: ParsedData[], columnX: string, columnY: string) {
  const xValues = data.map(row => parseFloat(row[columnX] as string)).filter(x => !isNaN(x));
  const yValues = data.map(row => parseFloat(row[columnY] as string)).filter(y => !isNaN(y));

  if (xValues.length === 0 || yValues.length === 0) {
    return null;
  }

  const n = Math.min(xValues.length, yValues.length);
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((a, b, i) => a + b * yValues[i], 0);
  const sumX2 = xValues.reduce((a, b) => a + b * b, 0);
  const sumY2 = yValues.reduce((a, b) => a + b * b, 0);

  const correlation = (n * sumXY - sumX * sumY) / 
    (Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)));

  return isNaN(correlation) ? null : correlation;
}

export function isNumericColumn(data: ParsedData[], column: string): boolean {
  return data.some(row => !isNaN(parseFloat(row[column] as string)));
}

export function getNumericColumns(data: ParsedData[], columns: string[]): string[] {
  return columns.filter(column => isNumericColumn(data, column));
}

export function formatValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }
  if (typeof value === 'number' && !isFinite(value)) {
    return 'Invalid';
  }
  return String(value);
}

export function imputeMissingValues(data: ParsedData[], column: string, method: string): ParsedData[] {
  if (!data?.length) return data;
  
  const hasNumericValues = data.some(row => {
    const val = row[column];
    return val !== null && val !== undefined && val !== '' && !isNaN(parseFloat(val as string));
  });

  if (!hasNumericValues) {
    return imputeMode(data, column);
  }

  switch (method) {
    case 'mean':
      return imputeMean(data, column);
    case 'median':
      return imputeMedian(data, column);
    case 'mode':
      return imputeMode(data, column);
    case 'gaussian':
      return imputeGaussian(data, column);
    default:
      return data;
  }
}

function imputeMean(data: ParsedData[], column: string): ParsedData[] {
  const values = data
    .map(row => row[column])
    .filter(val => val !== null && val !== undefined && val !== '' && val !== 'N/A')
    .map(val => parseFloat(val as string))
    .filter(val => !isNaN(val));
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  return data.map(row => {
    const currentValue = row[column];
    const shouldImpute = currentValue === null || currentValue === undefined || 
                        currentValue === '' || currentValue === 'N/A' || 
                        isNaN(parseFloat(currentValue as string));
    return {
      ...row,
      [column]: shouldImpute ? mean.toFixed(2) : currentValue
    };
  });
}

function imputeMedian(data: ParsedData[], column: string): ParsedData[] {
  const values = data
    .map(row => row[column])
    .filter(val => val !== null && val !== undefined && val !== '' && val !== 'N/A')
    .map(val => parseFloat(val as string))
    .filter(val => !isNaN(val))
    .sort((a, b) => a - b);
  
  const median = values[Math.floor(values.length / 2)];
  
  return data.map(row => {
    const currentValue = row[column];
    const shouldImpute = currentValue === null || currentValue === undefined || 
                        currentValue === '' || currentValue === 'N/A' || 
                        isNaN(parseFloat(currentValue as string));
    return {
      ...row,
      [column]: shouldImpute ? median.toFixed(2) : currentValue
    };
  });
}

function imputeMode(data: ParsedData[], column: string): ParsedData[] {
  const valueCount = new Map();
  data.forEach(row => {
    const value = row[column];
    if (value !== null && value !== undefined && value !== '' && value !== 'N/A') {
      valueCount.set(value, (valueCount.get(value) || 0) + 1);
    }
  });
  
  const mode = [...valueCount.entries()]
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
    
  return data.map(row => {
    const currentValue = row[column];
    const shouldImpute = currentValue === null || currentValue === undefined || 
                        currentValue === '' || currentValue === 'N/A';
    return {
      ...row,
      [column]: shouldImpute ? mode : currentValue
    };
  });
}

function imputeGaussian(data: ParsedData[], column: string): ParsedData[] {
  const values = data
    .map(row => row[column])
    .filter(val => val !== null && val !== undefined && val !== '' && val !== 'N/A')
    .map(val => parseFloat(val as string))
    .filter(val => !isNaN(val));
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return data.map(row => {
    const currentValue = row[column];
    const shouldImpute = currentValue === null || currentValue === undefined || 
                        currentValue === '' || currentValue === 'N/A' || 
                        isNaN(parseFloat(currentValue as string));
                        
    if (shouldImpute) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const imputedValue = mean + z * stdDev;
      return { ...row, [column]: imputedValue.toFixed(2) };
    }
    return row;
  });
}
