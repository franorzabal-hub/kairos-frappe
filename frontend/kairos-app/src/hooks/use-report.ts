/**
 * useReport Hook
 *
 * Hook for running Frappe reports (Query Reports and Script Reports)
 * Uses frappe.desk.query_report.run API
 */

import { useFrappePostCall, useFrappeGetCall } from "frappe-react-sdk";
import { useState, useCallback } from "react";

/**
 * Report column definition
 */
export interface ReportColumn {
  fieldname: string;
  label: string;
  fieldtype: string;
  width?: number;
  options?: string;
}

/**
 * Report filter definition
 */
export interface ReportFilter {
  fieldname: string;
  label: string;
  fieldtype: string;
  options?: string;
  default?: string | number | boolean;
  reqd?: 0 | 1;
  depends_on?: string;
  get_query?: string;
  on_change?: string;
}

/**
 * Report metadata
 */
export interface ReportMeta {
  name: string;
  report_name: string;
  ref_doctype?: string;
  report_type: "Query Report" | "Script Report" | "Report Builder";
  is_standard: "Yes" | "No";
  module?: string;
  filters?: ReportFilter[];
}

/**
 * Report result from API
 */
export interface ReportResult {
  columns: ReportColumn[];
  result: Record<string, unknown>[];
  message?: string;
  chart?: {
    data: {
      labels: string[];
      datasets: { name: string; values: number[] }[];
    };
    type: "bar" | "line" | "pie" | "donut";
  };
  report_summary?: {
    label: string;
    value: string | number;
    indicator?: string;
  }[];
}

interface UseReportResult {
  /** Report metadata including filters */
  meta: ReportMeta | null;
  /** Report data after running */
  data: ReportResult | null;
  /** Whether report metadata is loading */
  isLoadingMeta: boolean;
  /** Whether report is currently running */
  isRunning: boolean;
  /** Error if any */
  error: Error | null;
  /** Run the report with given filters */
  runReport: (filters?: Record<string, unknown>) => Promise<void>;
}

/**
 * Hook to fetch report metadata and run reports
 */
export function useReport(reportName: string): UseReportResult {
  const [data, setData] = useState<ReportResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<Error | null>(null);

  // Fetch report metadata
  const {
    data: metaResponse,
    error: metaError,
    isLoading: isLoadingMeta,
  } = useFrappeGetCall<{ message: ReportMeta }>(
    "frappe.desk.query_report.get_report_doc",
    { report_name: reportName },
    `report_meta_${reportName}`,
    {
      revalidateOnFocus: false,
    }
  );

  // API call for running report
  const { call: runReportCall } = useFrappePostCall<{ message: ReportResult }>(
    "frappe.desk.query_report.run"
  );

  // Run the report
  const runReport = useCallback(
    async (filters?: Record<string, unknown>) => {
      setIsRunning(true);
      setRunError(null);

      try {
        const response = await runReportCall({
          report_name: reportName,
          filters: filters || {},
        });

        if (response?.message) {
          setData(response.message);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to run report");
        setRunError(error);
        console.error("Report error:", err);
      } finally {
        setIsRunning(false);
      }
    },
    [reportName, runReportCall]
  );

  return {
    meta: metaResponse?.message || null,
    data,
    isLoadingMeta,
    isRunning,
    error: metaError ? (metaError as unknown as Error) : runError,
    runReport,
  };
}

/**
 * Format report cell value based on fieldtype
 */
export function formatReportValue(
  value: unknown,
  column: ReportColumn
): string {
  if (value === null || value === undefined) return "";

  switch (column.fieldtype) {
    case "Currency":
      return typeof value === "number"
        ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(value)
        : String(value);

    case "Float":
    case "Percent":
      return typeof value === "number" ? value.toFixed(2) : String(value);

    case "Int":
      return typeof value === "number"
        ? new Intl.NumberFormat().format(value)
        : String(value);

    case "Date":
      if (typeof value === "string") {
        const date = new Date(value);
        return date.toLocaleDateString();
      }
      return String(value);

    case "Datetime":
      if (typeof value === "string") {
        const date = new Date(value);
        return date.toLocaleString();
      }
      return String(value);

    case "Check":
      return value ? "Yes" : "No";

    default:
      return String(value);
  }
}
