"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast"
import Papa from 'papaparse'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {  Download } from 'lucide-react'
import { ParsedData, PapaParseResult, ColumnStatistics } from '@/types/data'
import { calculateStatistics, detectOutliers, calculateCorrelation, isNumericColumn, getNumericColumns, formatValue, imputeMissingValues, scaleValues, encodeCategorial, calculateFeatureImportance } from '@/utils/dataProcessing'


export default function AdvancedDataExplorer() {
  const [data, setData] = useState<ParsedData[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [numericColumns, setNumericColumns] = useState<string[]>([])
  const [selectedColumn, setSelectedColumn] = useState('')
  const [selectedScatterX, setSelectedScatterX] = useState('')
  const [selectedScatterY, setSelectedScatterY] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [statistics, setStatistics] = useState<ColumnStatistics | null>(null)
  const [outliers, setOutliers] = useState<ParsedData[]>([])
  const [correlation, setCorrelation] = useState<number | null>(null)
  const [showOutliers, setShowOutliers] = useState(false)
  const [dataPreview, setDataPreview] = useState<ParsedData[]>([])
  const [toast, setToast] = useState<{ title: string; description: string, variant: string } | null>(null)
  const [imputationMethod, setImputationMethod] = useState<string>('mean')
  const [isProcessing, setIsProcessing] = useState(false);
  const [scaleMethod, setScaleMethod] = useState<'minmax' | 'standard' | 'robust'>('minmax');
  const [encodeMethod, setEncodeMethod] = useState<'label' | 'onehot'>('label');
  const [targetColumn, setTargetColumn] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [featureImportance, setFeatureImportance] = useState<Array<{ feature: string; importance: number }>>([]);
  const [loadingActions, setLoadingActions] = useState<{
    scaling: boolean;
    encoding: boolean;
    featureImportance: boolean;
  }>({
    scaling: false,
    encoding: false,
    featureImportance: false,
  });

  const handleColumnDrop = (column: string) => {
    const newData = data.map(row => {
      const { [column]: removed, ...rest } = row;
      return rest;
    });
    const newColumns = columns.filter(col => col !== column);
    
    updateDataState(newData, newColumns);
  };
 // Update handlers with loading states
const handleScaling = async () => {
  if (!selectedColumn) return;
  setLoadingActions(prev => ({ ...prev, scaling: true }));
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  const scaledData = scaleValues(data, selectedColumn, scaleMethod);
  updateDataState(scaledData, columns);
  
  setLoadingActions(prev => ({ ...prev, scaling: false }));
};

const handleEncoding = async () => {
  if (!selectedColumn) return;
  setLoadingActions(prev => ({ ...prev, encoding: true }));
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  const encodedData = encodeCategorial(data, selectedColumn, encodeMethod);
  const cleanData = encodedData.map(row => {
    const { _imputed, [selectedColumn]: original, ...rest } = row;
    return encodeMethod === 'onehot' ? rest : row;
  });
  
  updateDataState(cleanData, Object.keys(cleanData[0]));
  setLoadingActions(prev => ({ ...prev, encoding: false }));
};

const handleFeatureImportance = async () => {
  if (!targetColumn || selectedFeatures.length === 0) return;
  setLoadingActions(prev => ({ ...prev, featureImportance: true }));
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  const importance = calculateFeatureImportance(data, targetColumn, selectedFeatures);
  setFeatureImportance(importance);
  
  setLoadingActions(prev => ({ ...prev, featureImportance: false }));
};
  
  // Helper function to update all data-dependent states
  const updateDataState = (newData: ParsedData[], newColumns: string[]) => {
    setData(newData);
    setColumns(newColumns);
    setDataPreview(newData.slice(0, 5));
    
    // Update numeric columns
    const numCols = getNumericColumns(newData, newColumns);
    setNumericColumns(numCols);
    
    // Update statistics if needed
    if (selectedColumn && isNumericColumn(newData, selectedColumn)) {
      setStatistics(calculateStatistics(newData, selectedColumn));
      setOutliers(detectOutliers(newData, selectedColumn));
    }
    
    // Update correlation if needed
    if (selectedScatterX && selectedScatterY && 
        isNumericColumn(newData, selectedScatterX) && 
        isNumericColumn(newData, selectedScatterY)) {
      setCorrelation(calculateCorrelation(newData, selectedScatterX, selectedScatterY));
    }
    
    setToast({ 
      title: "Data Updated", 
      description: "All visualizations and statistics have been refreshed." ,
      variant: "success"
    });
  };  

  useEffect(() => {
    if (selectedColumn && isNumericColumn(data, selectedColumn)) {
      setStatistics(calculateStatistics(data, selectedColumn));
      setOutliers(detectOutliers(data, selectedColumn));
    } else {
      setStatistics(null);
      setOutliers([]);
    }
  }, [selectedColumn, data]);

  useEffect(() => {
    if (selectedScatterX && selectedScatterY && 
        isNumericColumn(data, selectedScatterX) && 
        isNumericColumn(data, selectedScatterY)) {
      setCorrelation(calculateCorrelation(data, selectedScatterX, selectedScatterY));
    } else {
      setCorrelation(null);
    }
  }, [selectedScatterX, selectedScatterY, data]);

  const tableColumns: ColumnDef<ParsedData>[] = columns.map(column => ({
    accessorKey: column,
    header: column,
    cell: ({ row }) => {
      const value = row.getValue(column);
      const formattedValue = formatValue(value as string | number | null | undefined);
      const isSpecial = formattedValue === 'N/A' || formattedValue === 'Invalid';
      const wasImputed = row.original._imputed?.[column];
      return (
        <span className={`
          ${isSpecial ? 'text-red-500 font-bold' : ''} 
          ${wasImputed ? 'bg-green-100 px-2 py-1 rounded' : ''}
        `}>
          {formattedValue}
          {wasImputed && (
            <span className="ml-1 text-xs text-green-600">(imputed)</span>
          )}
        </span>
      );
    },
  }))

  const table = useReactTable({
    data: showOutliers ? outliers : data,
    columns: tableColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })


  const renderBarChart = () => {
    if (!selectedColumn || !isNumericColumn(data, selectedColumn)) return null;

    const chartData = data.map(row => ({
      id: row.id,
      [selectedColumn]: parseFloat(row[selectedColumn] as string)
    })).filter(row => !isNaN(row[selectedColumn]));

    return (
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="id" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={selectedColumn} fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderScatterPlot = () => {
    if (!selectedScatterX || !selectedScatterY || 
        !isNumericColumn(data, selectedScatterX) || 
        !isNumericColumn(data, selectedScatterY)) return null;

    const chartData = data.map(row => ({
      x: parseFloat(row[selectedScatterX] as string),
      y: parseFloat(row[selectedScatterY] as string),
    })).filter(row => !isNaN(row.x) && !isNaN(row.y));

    const colors = {
      x: '#8884d8',  // Color for X-axis column
      y: '#82ca9d',  // Color for Y-axis column
    };

    return (
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid />
            <XAxis 
              type="number" 
              dataKey="x" 
              name={selectedScatterX}
              label={{ value: selectedScatterX, position: 'bottom' }} 
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name={selectedScatterY}
              label={{ value: selectedScatterY, angle: -90, position: 'left' }}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ payload }) => {
                if (!payload || !payload[0]) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-2 border rounded shadow">
                    <p className="text-sm">{`${selectedScatterX}: ${data.x.toFixed(2)}`}</p>
                    <p className="text-sm">{`${selectedScatterY}: ${data.y.toFixed(2)}`}</p>
                  </div>
                );
              }}
            />
            <Legend />
            <Scatter name={selectedScatterX} data={chartData} fill={colors.x}>
              {chartData.map((entry, index) => (
                <circle key={`x-${index}`} cx={0} cy={0} r={4} fill={colors.x} />
              ))}
            </Scatter>
            <Scatter name={selectedScatterY} data={chartData} fill={colors.y}>
              {chartData.map((entry, index) => (
                <circle key={`y-${index}`} cx={0} cy={0} r={4} fill={colors.y} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderHeatMap = () => {
    if (numericColumns.length < 2) return null;

    const correlationMatrix = numericColumns.map(col1 => 
      numericColumns.map(col2 => {
        const corr = calculateCorrelation(data, col1, col2);
        return corr === null ? 0 : corr;
      })
    );

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2"></th>
                {numericColumns.map(col => (
                  <th key={col} className="p-2 text-xs rotate-45 origin-bottom-left">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {numericColumns.map((row, i) => (
                <tr key={row}>
                  <th className="p-2 text-left text-xs">{row}</th>
                  {correlationMatrix[i].map((correlation, j) => (
                    <td 
                      key={`${row}-${numericColumns[j]}`}
                      className="p-0"
                    >
                      <div 
                        className="w-12 h-12 flex items-center justify-center text-xs"
                        style={{
                          backgroundColor: `rgba(${correlation >= 0 
                            ? '0, 0, 255,' 
                            : '255, 0, 0,'}${Math.abs(correlation)})`,
                          color: Math.abs(correlation) > 0.5 ? 'white' : 'black'
                        }}
                      >
                        {correlation.toFixed(2)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMissingValues = () => {
    const missingData = columns.map(column => {
      const totalRows = data.length;
      const missingCount = data.filter(row => 
        row[column] === null || 
        row[column] === undefined || 
        row[column] === '' || 
        row[column] === 'N/A'
      ).length;
      return {
        column,
        missing: missingCount,
        percentage: (missingCount / totalRows) * 100
      };
    }).sort((a, b) => b.percentage - a.percentage);
  
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Missing Values Distribution</h3>
        {missingData.map(({ column, missing, percentage }) => (
          <div key={column} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{column}</span>
              <span>{missing} rows ({percentage.toFixed(1)}%)</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        ))}
      </div>
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (result: PapaParseResult) => {
        const headers = result.data[0] as string[];
        const parsedData: ParsedData[] = result.data.slice(1).map((row, index) => {
          const rowData: ParsedData = { id: index };
          headers.forEach((header, i) => {
            rowData[header] = row[i];
          });
          return rowData;
        });
        setData(parsedData);
        setColumns(headers);
        const numCols = getNumericColumns(parsedData, headers);
        setNumericColumns(numCols);
        setSelectedColumn(numCols[0] || '');
        setSelectedScatterX(numCols[0] || '');
        setSelectedScatterY(numCols[1] || numCols[0] || '');
        setDataPreview(parsedData.slice(0, 5));
        setToast({ title: "Data Loaded", description: `Successfully loaded ${parsedData.length} rows of data.`, variant: "success" });
      },
      header: false
    });
  }

  const handleDownload = () => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'processed_data.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setToast({ title: "Data Exported", description: "Your data has been successfully exported as a CSV file.", variant: "success" });
  }

  const handleMissingValues = async () => {
    if (!selectedColumn) {
      setToast({ title: "Error", description: "Please select a column for imputation.", variant: "error" });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const originalData = [...data];
      const updatedData = imputeMissingValues(originalData, selectedColumn, imputationMethod);
      
      const newData = updatedData.map((row, idx) => {
        const originalValue = originalData[idx][selectedColumn];
        const isImputed = (originalValue === null || originalValue === undefined || originalValue === '' || originalValue === 'N/A') && 
                         row[selectedColumn] !== originalValue;
        
        return {
          ...row,
          _imputed: {
            ...(row._imputed || {}),
            [selectedColumn]: isImputed
          }
        };
      });
      
      setData(newData);
      setDataPreview(newData.slice(0, 5));
      setToast({ 
        title: "Missing Values Handled", 
        description: `Missing values in ${selectedColumn} have been imputed using ${imputationMethod} method.` ,
        variant: "success"
      });
    } catch (error) {
      console.error('Imputation error:', error);
      setToast({ 
        title: "Error", 
        description: "An error occurred while processing the data.",
        variant: "error" 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOutlierRemoval = () => {
    if (!selectedColumn || !isNumericColumn(data, selectedColumn)) {
      setToast({ title: "Error", description: "Please select a numeric column for outlier removal.", variant: "error" });
      return;
    }
    const nonOutliers = data.filter(row => !outliers.includes(row));
    setData(nonOutliers);
    setToast({ title: "Outliers Removed", description: `${outliers.length} outliers have been removed from the dataset.`, variant: "success" });
  }

  const toggleColumnType = (column: string) => {
    const updatedNumericColumns = numericColumns.includes(column) 
      ? numericColumns.filter(col => col !== column)
      : [...numericColumns, column];
    
    setNumericColumns(updatedNumericColumns);
    setToast({ title: "Column Type Updated", description: `${column} is now treated as a ${updatedNumericColumns.includes(column) ? 'numeric' : 'non-numeric'} column.`, variant: "success" });
  }

  return (
    <ToastProvider>
          <div className="space-y-6">
          <h1 className="text-3xl font-bold">Explorateur de données CSV (En anglais désolé apprend aussi mdrr)</h1>
        
        <Card className="bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Data Import and Preview</CardTitle>
            <CardDescription>Upload your CSV file to begin analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Input type="file" accept=".csv" onChange={handleFileUpload} className="flex-grow" />
              <Button onClick={handleDownload} disabled={data.length === 0}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
            {dataPreview.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Data Preview</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column}>{column}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataPreview.map((row, index) => (
                      <TableRow key={index}>
                        {columns.map((column) => (
                          <TableCell key={column}>{formatValue(row[column] as string | number | null | undefined)}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
 
        {data.length > 0 && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="visualization">Visualization</TabsTrigger>
              <TabsTrigger value="preprocessing">Preprocessing</TabsTrigger>
            </TabsList>
 
            <TabsContent value="overview">
              <Card className="bg-white/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Data Overview</CardTitle>
                  <CardDescription>Quick insights into your dataset</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Dataset Information</h3>
                      <p>Total Rows: {data.length}</p>
                      <p>Total Columns: {columns.length}</p>
                      <p>Numeric Columns: {numericColumns.length}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Column Types</h3>
                      <div className="space-y-2">
                        {columns.map(column => (
                          <div key={column} className="flex items-center justify-between">
                            <Badge 
                              variant={numericColumns.includes(column) ? "default" : "secondary"}
                              className="cursor-pointer"
                              onClick={() => toggleColumnType(column)}
                            >
                              {column} ({numericColumns.includes(column) ? "Numeric" : "Non-Numeric"})
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => toggleColumnType(column)}
                            >
                              Toggle Type
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
 
            <TabsContent value="analysis">
              <Card className="bg-white/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Data Analysis</CardTitle>
                  <CardDescription>Explore statistics and correlations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Column Statistics</h3>
                      <Select onValueChange={setSelectedColumn} value={selectedColumn}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select a column" />
                        </SelectTrigger>
                        <SelectContent>
                          {numericColumns.map((column) => (
                            <SelectItem key={column} value={column}>{column}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {statistics && (
                        <div className="mt-4 space-y-2">
                          <p>Mean: {statistics.mean.toFixed(2)}</p>
                          <p>Median: {statistics.median.toFixed(2)}</p>
                          <p>Min: {statistics.min.toFixed(2)}</p>
                          <p>Max: {statistics.max.toFixed(2)}</p>
                          <p>Standard Deviation: {statistics.stdDev.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Correlation Analysis</h3>
                      <div className="flex space-x-2">
                        <Select onValueChange={setSelectedScatterX} value={selectedScatterX}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="X Axis" />
                          </SelectTrigger>
                          <SelectContent>
                            {numericColumns.map((column) => (
                              <SelectItem key={column} value={column}>{column}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select onValueChange={setSelectedScatterY} value={selectedScatterY}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Y Axis" />
                          </SelectTrigger>
                          <SelectContent>
                            {numericColumns.map((column) => (
                              <SelectItem key={column} value={column}>{column}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {correlation === null ? (
                        <p className="text-muted-foreground">No correlation available</p>
                      ) : (
                        <div className="mt-4">
                          <p>Correlation: {correlation.toFixed(4)}</p>
                          <Progress value={Math.abs(correlation) * 100} className="mt-2" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
 
            <TabsContent value="visualization">
              <Card className="bg-white/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Data Visualization</CardTitle>
                  <CardDescription>Visualize your data with charts</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="bar">
                    <TabsList>
                      <TabsTrigger value="bar">Bar Chart</TabsTrigger>
                      <TabsTrigger value="scatter">Scatter Plot</TabsTrigger>
                      <TabsTrigger value="heatmap">Correlation Heatmap</TabsTrigger>
                      <TabsTrigger value="missing">Missing Values</TabsTrigger>
                    </TabsList>
                    <TabsContent value="bar">
                      <div className="space-y-4">
                        <Select onValueChange={setSelectedColumn} value={selectedColumn}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select a column" />
                          </SelectTrigger>
                          <SelectContent>
                            {numericColumns.map((column) => (
                              <SelectItem key={column} value={column}>{column}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {renderBarChart()}
                      </div>
                    </TabsContent>
                    <TabsContent value="scatter">
                      <div className="space-y-4">
                        <div className="flex space-x-2">
                          <Select onValueChange={setSelectedScatterX} value={selectedScatterX}>
                            <SelectTrigger className="w-[150px]">
                              <SelectValue placeholder="X Axis" />
                            </SelectTrigger>
                            <SelectContent>
                              {numericColumns.map((column) => (
                                <SelectItem key={column} value={column}>{column}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select onValueChange={setSelectedScatterY} value={selectedScatterY}>
                            <SelectTrigger className="w-[150px]">
                              <SelectValue placeholder="Y Axis" />
                            </SelectTrigger>
                            <SelectContent>
                              {numericColumns.map((column) => (
                                <SelectItem key={column} value={column}>{column}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {renderScatterPlot()}
                      </div>
                    </TabsContent>
                    <TabsContent value="heatmap">
                      {renderHeatMap()}
                    </TabsContent>
                    <TabsContent value="missing">
                      {renderMissingValues()}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
 
            <TabsContent value="preprocessing">
              <Card className="bg-white/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Data Preprocessing</CardTitle>
                  <CardDescription>Prepare your data for analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="basic">
                    <TabsList>
                      <TabsTrigger value="basic">Basic</TabsTrigger>
                      <TabsTrigger value="transform">Transform</TabsTrigger>
                      <TabsTrigger value="encode">Encode</TabsTrigger>
                      <TabsTrigger value="importance">Feature Importance</TabsTrigger>
                    </TabsList>
 
                    <TabsContent value="basic">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch id="outliers" checked={showOutliers} onCheckedChange={setShowOutliers} />
                          <Label htmlFor="outliers">Show Outliers</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Select onValueChange={setSelectedColumn} value={selectedColumn}>
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select a column" />
                            </SelectTrigger>
                            <SelectContent>
                              {columns.map((column) => (
                                <SelectItem key={column} value={column}>{column}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select onValueChange={setImputationMethod} value={imputationMethod}>
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select imputation method" />
                            </SelectTrigger>
                            <SelectContent>
                              {isNumericColumn(data, selectedColumn) ? (
                                <>
                                  <SelectItem value="mean">Mean</SelectItem>
                                  <SelectItem value="median">Median</SelectItem>
                                  <SelectItem value="mode">Mode</SelectItem>
                                  <SelectItem value="gaussian">Gaussian</SelectItem>
                                </>
                              ) : (
                                <SelectItem value="mode">Mode</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={handleMissingValues}
                            disabled={isProcessing}
                            className="relative"
                          >
                            {isProcessing ? (
                              <>
                                <span className="absolute inset-0 flex items-center justify-center bg-primary/90 rounded-md">
                                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                </span>
                                <span className="opacity-0">Handle Missing Values</span>
                              </>
                            ) : (
                              'Handle Missing Values'
                            )}
                          </Button>
                        </div>
                        <Button onClick={handleOutlierRemoval} disabled={!isNumericColumn(data, selectedColumn)}>
                          Remove Outliers
                        </Button>
                      </div>
                    </TabsContent>
 
                    <TabsContent value="transform">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              {columns.map(column => (
                                <SelectItem key={column} value={column}>{column}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
 
                          <Select value={scaleMethod} onValueChange={(value) => setScaleMethod(value as 'minmax' | 'standard' | 'robust')}>
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select scaling method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minmax">Min-Max Scaling</SelectItem>
                              <SelectItem value="standard">Standard Scaling</SelectItem>
                              <SelectItem value="robust">Robust Scaling</SelectItem>
                            </SelectContent>
                          </Select>
 
                          <Button 
                            onClick={handleScaling} 
                            disabled={loadingActions.scaling}
                            className="relative"
                          >
                            {loadingActions.scaling ? (
                              <>
                                <span className="absolute inset-0 flex items-center justify-center bg-primary/90 rounded-md">
                                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                </span>
                                <span className="opacity-0">Scale Values</span>
                              </>
                            ) : (
                              'Scale Values'
                            )}
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={() => handleColumnDrop(selectedColumn)}
                          >
                            Drop Column
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
 
                    <TabsContent value="encode">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              {columns.map(column => (
                                <SelectItem key={column} value={column}>{column}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
 
                          <Select value={encodeMethod} onValueChange={(value) => setEncodeMethod(value as 'label' | 'onehot')}>
                          <SelectTrigger className="w-[200px]">
                             <SelectValue placeholder="Select encoding method" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="label">Label Encoding</SelectItem>
                             <SelectItem value="onehot">One-Hot Encoding</SelectItem>
                           </SelectContent>
                         </Select>

                         <Button onClick={handleEncoding} disabled={loadingActions.encoding} className="relative">
                           {loadingActions.encoding ? (
                             <>
                               <span className="absolute inset-0 flex items-center justify-center bg-primary/90 rounded-md">
                                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                 </svg>
                               </span>
                               <span className="opacity-0">Encode Categorical</span>
                             </>
                           ) : (
                             'Encode Categorical'
                           )}
                          </Button>
                       </div>
                     </div>
                   </TabsContent>

                   <TabsContent value="importance">
                     <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <Select value={targetColumn} onValueChange={setTargetColumn}>
                             <SelectTrigger>
                               <SelectValue placeholder="Select target column" />
                             </SelectTrigger>
                             <SelectContent>
                               {columns.map(column => (
                                 <SelectItem key={column} value={column}>{column}</SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </div>
                         <div className="flex flex-wrap gap-2">
                           {columns
                             .filter(col => col !== targetColumn)
                             .map(feature => (
                               <Badge
                                 key={feature}
                                 variant={selectedFeatures.includes(feature) ? "default" : "outline"}
                                 className="cursor-pointer"
                                 onClick={() => {
                                   setSelectedFeatures(prev =>
                                     prev.includes(feature)
                                       ? prev.filter(f => f !== feature)
                                       : [...prev, feature]
                                   );
                                 }}
                               >
                                 {feature}
                               </Badge>
                             ))}
                         </div>
                       </div>
                       <Button onClick={handleFeatureImportance} disabled={loadingActions.featureImportance} className="relative">
                          {loadingActions.featureImportance ? (
                            <>
                              <span className="absolute inset-0 flex items-center justify-center bg-primary/90 rounded-md">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </span>
                              <span className="opacity-0">Calculate Importance</span>
                            </>
                          ) : (
                            'Calculate Feature Importance'
                          )}
                        </Button>

                       {featureImportance.length > 0 && (
                         <div className="mt-4">
                           <h3 className="text-lg font-semibold mb-2">Feature Importance</h3>
                           <div className="space-y-2">
                             {featureImportance.map(({ feature, importance }) => (
                               <div key={feature} className="flex items-center space-x-2">
                                 <span className="w-32 truncate">{feature}</span>
                                 <Progress value={importance * 100} className="flex-1" />
                                 <span className="w-16 text-right">{(importance * 100).toFixed(1)}%</span>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}
                     </div>
                   </TabsContent>
                 </Tabs>

                 <div className="rounded-md border mt-4">
                   <Table>
                     <TableHeader>
                       {table.getHeaderGroups().map((headerGroup) => (
                         <TableRow key={headerGroup.id}>
                           {headerGroup.headers.map((header) => (
                             <TableHead key={header.id}>
                               {header.isPlaceholder
                                 ? null
                                 : flexRender(
                                     header.column.columnDef.header,
                                     header.getContext()
                                   )}
                             </TableHead>
                           ))}
                         </TableRow>
                       ))}
                     </TableHeader>
                     <TableBody>
                       {table.getRowModel().rows?.length ? (
                         table.getRowModel().rows.map((row) => (
                           <TableRow
                             key={row.id}
                             data-state={row.getIsSelected() && "selected"}
                           >
                             {row.getVisibleCells().map((cell) => (
                               <TableCell key={cell.id}>
                                 {flexRender(cell.column.columnDef.cell, cell.getContext())}
                               </TableCell>
                             ))}
                           </TableRow>
                         ))
                       ) : (
                         <TableRow>
                           <TableCell colSpan={columns.length} className="h-24 text-center">
                             No results.
                           </TableCell>
                         </TableRow>
                       )}
                     </TableBody>
                   </Table>
                 </div>
                 <div className="flex items-center justify-end space-x-2 py-4">
                   <div className="flex-1 text-sm text-muted-foreground">
                     {table.getFilteredSelectedRowModel().rows.length} of{" "}
                     {table.getFilteredRowModel().rows.length} row(s) selected.
                   </div>
                   <div className="space-x-2">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => table.previousPage()}
                       disabled={!table.getCanPreviousPage()}
                     >
                       Previous
                     </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => table.nextPage()}
                       disabled={!table.getCanNextPage()}
                     >
                       Next
                     </Button>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </TabsContent>
         </Tabs>
       )}
     </div>
     {toast && (
       <Toast>
         <ToastTitle>{toast.title}</ToastTitle>
         <ToastDescription>{toast.description}</ToastDescription>
         <ToastClose onClick={() => setToast(null)} />
       </Toast>
     )}
     <ToastViewport />
   </ToastProvider>
 )
}

