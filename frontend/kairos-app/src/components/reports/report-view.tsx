/**
 * Report View Component
 *
 * Renders Frappe Query/Script Reports with:
 * - Dynamic filters based on report metadata
 * - Data table with sortable columns
 * - Export functionality
 * - Optional chart visualization
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import {
  useReport,
  formatReportValue,
  ReportColumn,
  ReportFilter,
} from "@/hooks/use-report";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Play,
  Download,
  Loader2,
  ChevronUp,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

interface ReportViewProps {
  reportName: string;
  className?: string;
}

export function ReportView({ reportName, className }: ReportViewProps) {
  const { meta, data, isLoadingMeta, isRunning, error, runReport } =
    useReport(reportName);

  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Initialize filters with defaults
  useEffect(() => {
    if (meta?.filters) {
      const defaults: Record<string, unknown> = {};
      for (const filter of meta.filters) {
        if (filter.default !== undefined) {
          defaults[filter.fieldname] = filter.default;
        }
      }
      setFilters(defaults);
    }
  }, [meta?.filters]);

  // Handle filter change
  const handleFilterChange = useCallback(
    (fieldname: string, value: unknown) => {
      setFilters((prev) => ({ ...prev, [fieldname]: value }));
    },
    []
  );

  // Handle run report
  const handleRun = useCallback(() => {
    runReport(filters);
  }, [runReport, filters]);

  // Handle sort
  const handleSort = useCallback((columnName: string) => {
    setSortColumn((prev) => {
      if (prev === columnName) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        return columnName;
      }
      setSortDirection("asc");
      return columnName;
    });
  }, []);

  // Sort data
  const sortedData = data?.result
    ? [...data.result].sort((a, b) => {
        if (!sortColumn) return 0;
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        const comparison = aVal < bVal ? -1 : 1;
        return sortDirection === "asc" ? comparison : -comparison;
      })
    : [];

  // Handle export
  const handleExport = useCallback(() => {
    if (!data?.result || !data?.columns) return;

    const headers = data.columns.map((c) => c.label).join(",");
    const rows = data.result.map((row) =>
      data.columns
        .map((col) => {
          const value = row[col.fieldname];
          if (typeof value === "string" && value.includes(",")) {
            return `"${value}"`;
          }
          return value ?? "";
        })
        .join(",")
    );

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [data, reportName]);

  // Loading state
  if (isLoadingMeta) {
    return <ReportViewSkeleton />;
  }

  // Error state
  if (error && !data) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error.message || "Failed to load report"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Filters */}
      {meta?.filters && meta.filters.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {meta.filters.map((filter) => (
                <FilterField
                  key={filter.fieldname}
                  filter={filter}
                  value={filters[filter.fieldname]}
                  onChange={(value) =>
                    handleFilterChange(filter.fieldname, value)
                  }
                />
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleRun} disabled={isRunning}>
                {isRunning ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Run Report
              </Button>
              {data && (
                <Button variant="outline" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No filters - show run button */}
      {(!meta?.filters || meta.filters.length === 0) && (
        <div className="flex gap-2">
          <Button onClick={handleRun} disabled={isRunning}>
            {isRunning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run Report
          </Button>
          {data && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>
      )}

      {/* Summary Cards */}
      {data?.report_summary && data.report_summary.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {data.report_summary.map((item, idx) => (
            <Card key={idx}>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p
                  className={cn(
                    "text-2xl font-bold mt-1",
                    item.indicator === "Green" && "text-green-600",
                    item.indicator === "Red" && "text-red-600",
                    item.indicator === "Orange" && "text-orange-600",
                    item.indicator === "Blue" && "text-blue-600"
                  )}
                >
                  {item.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Data Table */}
      {data?.columns && data.result && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {data.columns.map((column) => (
                      <TableHead
                        key={column.fieldname}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort(column.fieldname)}
                        style={{ minWidth: column.width || 120 }}
                      >
                        <div className="flex items-center gap-1">
                          {column.label}
                          {sortColumn === column.fieldname && (
                            sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={data.columns.length}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedData.map((row, rowIdx) => (
                      <TableRow key={rowIdx}>
                        {data.columns.map((column) => (
                          <TableCell key={column.fieldname}>
                            {formatReportValue(row[column.fieldname], column)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {sortedData.length > 0 && (
              <div className="px-4 py-3 border-t text-sm text-muted-foreground">
                {sortedData.length} row{sortedData.length !== 1 ? "s" : ""}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state before running */}
      {!data && !isRunning && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Click &quot;Run Report&quot; to generate the report
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Filter Field Component
 */
function FilterField({
  filter,
  value,
  onChange,
}: {
  filter: ReportFilter;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {filter.label}
        {filter.reqd === 1 && <span className="text-destructive ml-1">*</span>}
      </Label>

      {filter.fieldtype === "Select" && filter.options ? (
        <Select
          value={String(value || "")}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${filter.label}`} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.split("\n").map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : filter.fieldtype === "Check" ? (
        <Select
          value={value === 1 ? "1" : "0"}
          onValueChange={(v) => onChange(v === "1" ? 1 : 0)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">No</SelectItem>
            <SelectItem value="1">Yes</SelectItem>
          </SelectContent>
        </Select>
      ) : filter.fieldtype === "Date" ? (
        <Input
          type="date"
          value={String(value || "")}
          onChange={handleChange}
        />
      ) : (
        <Input
          type={filter.fieldtype === "Int" || filter.fieldtype === "Float" ? "number" : "text"}
          value={String(value || "")}
          onChange={handleChange}
          placeholder={filter.label}
        />
      )}
    </div>
  );
}

/**
 * Loading Skeleton
 */
function ReportViewSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <Skeleton className="h-5 w-20" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-10 w-32 mt-4" />
        </CardContent>
      </Card>
    </div>
  );
}
