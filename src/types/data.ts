export interface ParsedData {
  id: number;
  _imputed?: {
    [key: string]: boolean;
  };
  [key: string]: string | number | undefined | { [key: string]: boolean };
}

export interface PapaParseResult {
  data: string[][];
}

export interface ColumnStatistics {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
}

