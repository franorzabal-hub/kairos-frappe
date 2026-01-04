/**
 * useReportsList Hook
 *
 * Fetches list of available reports from Frappe
 */

import { useFrappeGetCall } from "frappe-react-sdk";

export interface ReportListItem {
  name: string;
  report_name: string;
  ref_doctype?: string;
  report_type: "Query Report" | "Script Report" | "Report Builder";
  is_standard: "Yes" | "No";
  module?: string;
  disabled?: 0 | 1;
}

interface UseReportsListResult {
  reports: ReportListItem[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch list of available reports
 */
export function useReportsList(module?: string): UseReportsListResult {
  const filters: Record<string, unknown> = {
    disabled: 0,
  };

  if (module) {
    filters.module = module;
  }

  const { data, error, isLoading } = useFrappeGetCall<{
    message: ReportListItem[];
  }>(
    "frappe.client.get_list",
    {
      doctype: "Report",
      filters,
      fields: [
        "name",
        "report_name",
        "ref_doctype",
        "report_type",
        "is_standard",
        "module",
      ],
      order_by: "report_name asc",
      limit_page_length: 0,
    },
    `reports_list_${module || "all"}`,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    reports: data?.message || [],
    isLoading,
    error: error ? (error as unknown as Error) : null,
  };
}

/**
 * Group reports by module
 */
export function groupReportsByModule(
  reports: ReportListItem[]
): Map<string, ReportListItem[]> {
  const grouped = new Map<string, ReportListItem[]>();

  for (const report of reports) {
    const module = report.module || "Other";
    if (!grouped.has(module)) {
      grouped.set(module, []);
    }
    grouped.get(module)!.push(report);
  }

  // Sort modules alphabetically
  return new Map(
    [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  );
}
