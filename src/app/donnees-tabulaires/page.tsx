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
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction } from "@/components/ui/toast"
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Download, Upload } from 'lucide-react'
import { ParsedData, PapaParseResult, ColumnStatistics } from '@/types/data'
import { calculateStatistics, detectOutliers, calculateCorrelation, isNumericColumn, getNumericColumns, formatValue } from '@/utils/dataProcessing'

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
  const [toast, setToast] = useState<{ title: string; description: string } | null>(null)

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
        setToast({ title: "Data Loaded", description: `Successfully loaded ${parsedData.length} rows of data.` });
      },
      header: false
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
      const formattedValue = formatValue(value);
      const isSpecial = formattedValue === 'N/A' || formattedValue === 'Invalid';
      return (
        <span className={isSpecial ? 'text-red-500 font-bold' : ''}>
          {formattedValue}
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
    if (!selectedColumn || !isNumericColumn(data, selectedColumn)) return null

    const chartData = data.map(row => ({
      id: row.id,
      [selectedColumn]: parseFloat(row[selectedColumn] as string)
    })).filter(row => !isNaN(row[selectedColumn]))

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
    )
  }

  const renderScatterPlot = () => {
    if (!selectedScatterX || !selectedScatterY || 
        !isNumericColumn(data, selectedScatterX) || 
        !isNumericColumn(data, selectedScatterY)) return null

    const chartData = data.map(row => ({
      x: parseFloat(row[selectedScatterX] as string),
      y: parseFloat(row[selectedScatterY] as string)
    })).filter(row => !isNaN(row.x) && !isNaN(row.y))

    return (
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid />
            <XAxis type="number" dataKey="x" name={selectedScatterX} />
            <YAxis type="number" dataKey="y" name={selectedScatterY} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Data" data={chartData} fill="#8884d8" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    )
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
    setToast({ title: "Data Exported", description: "Your data has been successfully exported as a CSV file." });
  }

  const handleMissingValues = () => {
    const updatedData = data.map(row => {
      const newRow = { ...row };
      columns.forEach(column => {
        if (newRow[column] === '' || newRow[column] === null || newRow[column] === undefined) {
          newRow[column] = 'N/A';
        }
      });
      return newRow;
    });
    setData(updatedData);
    setToast({ title: "Missing Values Handled", description: "All missing values have been replaced with 'N/A'." });
  }

  const handleOutlierRemoval = () => {
    if (!selectedColumn || !isNumericColumn(data, selectedColumn)) {
      setToast({ title: "Error", description: "Please select a numeric column for outlier removal." });
      return;
    }
    const nonOutliers = data.filter(row => !outliers.includes(row));
    setData(nonOutliers);
    setToast({ title: "Outliers Removed", description: `${outliers.length} outliers have been removed from the dataset.` });
  }

  return (
    <ToastProvider>
      <div className="space-y-6 p-6  min-h-screen">
        <h1 className="text-4xl font-bold text-center text-blue-800">Advanced Data Explorer</h1>
        
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
                          <TableCell key={column}>{formatValue(row[column])}</TableCell>
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
                          <Badge key={column} variant={numericColumns.includes(column) ? "default" : "secondary"}>
                            {column} ({numericColumns.includes(column) ? "Numeric" : "Non-Numeric"})
                          </Badge>
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
                      {correlation !== null && (
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
                          {numericColumns.map((column) => (
                            <SelectItem key={column} value={column}>{column}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleOutlierRemoval}>
                        Remove Outliers
                      </Button>
                    </div>
                    <Button onClick={handleMissingValues}>
                      Handle Missing Values
                    </Button>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                              {headerGroup.headers.map((header) => {
                                return (
                                  <TableHead key={header.id}>
                                    {header.isPlaceholder
                                      ? null
                                      : flexRender(
                                          header.column.columnDef.header,
                                          header.getContext()
                                        )}
                                  </TableHead>
                                )
                              })}
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

