import { ParsedData } from "@/types/data";

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

  const n = Math.min(xValues.length, yValues.length);
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((a, b, i) => a + b * yValues[i], 0);
  const sumX2 = xValues.reduce((a, b) => a + b * b, 0);
  const sumY2 = yValues.reduce((a, b) => a + b * b, 0);

  const correlation = (n * sumXY - sumX * sumY) / 
    (Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)));

  return correlation;
}

export function isNumericColumn(data: ParsedData[], column: string): boolean {
  return data.some(row => !isNaN(parseFloat(row[column] as string)));
}

export function getNumericColumns(data: ParsedData[], columns: string[]): string[] {
  return columns.filter(column => isNumericColumn(data, column));
}

export function formatValue(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }
  if (typeof value === 'number' && !isFinite(value)) {
    return 'Invalid';
  }
  return String(value);
}
