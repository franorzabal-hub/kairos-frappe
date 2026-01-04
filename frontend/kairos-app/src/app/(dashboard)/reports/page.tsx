/**
 * Reports List Page
 *
 * Displays all available reports grouped by module
 */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useReportsList,
  groupReportsByModule,
  ReportListItem,
} from "@/hooks/use-reports-list";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Search, FileText, ChevronRight, AlertCircle } from "lucide-react";

export default function ReportsListPage() {
  const { reports, isLoading, error } = useReportsList();
  const [search, setSearch] = useState("");

  // Filter reports by search
  const filteredReports = useMemo(() => {
    if (!search.trim()) return reports;

    const searchLower = search.toLowerCase();
    return reports.filter(
      (report) =>
        report.report_name.toLowerCase().includes(searchLower) ||
        report.ref_doctype?.toLowerCase().includes(searchLower) ||
        report.module?.toLowerCase().includes(searchLower)
    );
  }, [reports, search]);

  // Group filtered reports by module
  const groupedReports = useMemo(
    () => groupReportsByModule(filteredReports),
    [filteredReports]
  );

  if (isLoading) {
    return <ReportsListSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Header search={search} onSearchChange={setSearch} />
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load reports</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header search={search} onSearchChange={setSearch} />

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>{reports.length} reports available</span>
        {search && (
          <span>
            {filteredReports.length} matching &quot;{search}&quot;
          </span>
        )}
      </div>

      {/* Reports grouped by module */}
      {groupedReports.size === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {search ? "No reports match your search" : "No reports available"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {Array.from(groupedReports.entries()).map(([module, moduleReports]) => (
            <Card key={module}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {module}
                  <Badge variant="secondary" className="font-normal">
                    {moduleReports.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-1">
                  {moduleReports.map((report) => (
                    <ReportItem key={report.name} report={report} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Header with search
 */
function Header({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          View and run available reports
        </p>
      </div>

      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search reports..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}

/**
 * Single report item
 */
function ReportItem({ report }: { report: ReportListItem }) {
  const reportTypeColors: Record<string, string> = {
    "Query Report": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "Script Report": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    "Report Builder": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };

  return (
    <Link
      href={`/report/${encodeURIComponent(report.name)}`}
      className="group flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
    >
      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <FileText className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate group-hover:text-primary">
          {report.report_name}
        </p>
        {report.ref_doctype && (
          <p className="text-sm text-muted-foreground truncate">
            Based on {report.ref_doctype}
          </p>
        )}
      </div>

      <Badge
        variant="outline"
        className={cn(
          "text-xs font-normal hidden sm:inline-flex",
          reportTypeColors[report.report_type]
        )}
      >
        {report.report_type.replace(" Report", "")}
      </Badge>

      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

/**
 * Loading skeleton
 */
function ReportsListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-10 w-64" />
      </div>

      <Skeleton className="h-5 w-32" />

      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3 p-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
