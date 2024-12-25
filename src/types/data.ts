export interface ParsedData {
    id: number;
    [key: string]: string | number;
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
  
  