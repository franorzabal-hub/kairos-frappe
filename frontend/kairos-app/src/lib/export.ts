/**
 * Export Utilities
 *
 * Provides functionality for exporting data to CSV and Excel formats.
 * Handles data formatting, date/number conversion, and file download.
 */

import * as XLSX from "xlsx";
import { DocTypeField } from "@/types/frappe";

// ============================================================================
// Types
// ============================================================================

export type ExportFormat = "csv" | "xlsx";

export interface ExportColumn {
  key: string;
  header: string;
  fieldtype?: string;
}

export interface ExportOptions {
  filename: string;
  format: ExportFormat;
  columns: ExportColumn[];
  sheetName?: string;
}

// ============================================================================
// Value Formatting
// ============================================================================

/**
 * Format a cell value for export based on its field type
 */
export function formatExportValue(
  value: unknown,
  fieldtype?: string
): string | number | boolean | null {
  if (value === null || value === undefined) {
    return "";
  }

  switch (fieldtype) {
    case "Check":
      return value ? "Yes" : "No";

    case "Date":
      if (typeof value === "string" && value) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            // Format as YYYY-MM-DD for Excel compatibility
            return date.toISOString().split("T")[0];
          }
        } catch {
          return String(value);
        }
      }
      return String(value);

    case "Datetime":
      if (typeof value === "string" && value) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            // Format as YYYY-MM-DD HH:MM:SS
            return date.toISOString().replace("T", " ").slice(0, 19);
          }
        } catch {
          return String(value);
        }
      }
      return String(value);

    case "Time":
      return String(value);

    case "Int":
      if (typeof value === "number") {
        return Math.round(value);
      }
      if (typeof value === "string") {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? value : parsed;
      }
      return String(value);

    case "Float":
    case "Currency":
      if (typeof value === "number") {
        return value;
      }
      if (typeof value === "string") {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? value : parsed;
      }
      return String(value);

    default:
      // For text fields, ensure we return a string
      return String(value);
  }
}

/**
 * Convert DocTypeField array to ExportColumn array
 */
export function fieldsToExportColumns(fields: DocTypeField[]): ExportColumn[] {
  return fields.map((field) => ({
    key: field.fieldname,
    header: field.label,
    fieldtype: field.fieldtype,
  }));
}

// ============================================================================
// Data Transformation
// ============================================================================

/**
 * Transform raw data into export-ready format
 */
export function transformDataForExport(
  data: Record<string, unknown>[],
  columns: ExportColumn[]
): (string | number | boolean | null)[][] {
  // Create header row
  const headers = columns.map((col) => col.header);

  // Transform data rows
  const rows = data.map((row) =>
    columns.map((col) => formatExportValue(row[col.key], col.fieldtype))
  );

  return [headers, ...rows];
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export data to CSV format and trigger download
 */
export function exportToCsv(
  data: Record<string, unknown>[],
  options: ExportOptions
): void {
  const { filename, columns } = options;

  // Transform data
  const rows = transformDataForExport(data, columns);

  // Create worksheet from data
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Generate CSV and trigger download
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  downloadFile(csvContent, `${filename}.csv`, "text/csv;charset=utf-8;");
}

/**
 * Export data to Excel (.xlsx) format and trigger download
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  options: ExportOptions
): void {
  const { filename, columns, sheetName = "Data" } = options;

  // Transform data
  const rows = transformDataForExport(data, columns);

  // Create worksheet from data
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Auto-size columns based on content
  const columnWidths = calculateColumnWidths(rows);
  worksheet["!cols"] = columnWidths.map((width) => ({ wch: width }));

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate Excel file and trigger download
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  downloadBlob(blob, `${filename}.xlsx`);
}

/**
 * Main export function that handles both formats
 */
export function exportData(
  data: Record<string, unknown>[],
  options: ExportOptions
): void {
  if (options.format === "csv") {
    exportToCsv(data, options);
  } else {
    exportToExcel(data, options);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate optimal column widths based on content
 */
function calculateColumnWidths(
  rows: (string | number | boolean | null)[][]
): number[] {
  if (rows.length === 0) return [];

  const columnCount = rows[0].length;
  const widths: number[] = new Array(columnCount).fill(10);

  rows.forEach((row) => {
    row.forEach((cell, colIndex) => {
      const cellLength = String(cell ?? "").length;
      // Cap at 50 characters, minimum 10
      widths[colIndex] = Math.min(50, Math.max(widths[colIndex], cellLength + 2));
    });
  });

  return widths;
}

/**
 * Download a string as a file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

/**
 * Download a Blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Batch Export (for large datasets)
// ============================================================================

/**
 * Options for paginated export
 */
export interface PaginatedExportOptions extends ExportOptions {
  pageSize?: number;
  fetchPage: (page: number, pageSize: number) => Promise<Record<string, unknown>[]>;
  totalCount: number;
  onProgress?: (progress: number) => void;
}

/**
 * Export large datasets by fetching data in batches
 * Useful for datasets that exceed the initial page load
 */
export async function exportPaginated(
  options: PaginatedExportOptions
): Promise<void> {
  const {
    pageSize = 100,
    fetchPage,
    totalCount,
    onProgress,
    ...exportOptions
  } = options;

  const totalPages = Math.ceil(totalCount / pageSize);
  const allData: Record<string, unknown>[] = [];

  // Fetch all pages
  for (let page = 0; page < totalPages; page++) {
    const pageData = await fetchPage(page, pageSize);
    allData.push(...pageData);

    // Report progress
    if (onProgress) {
      const progress = Math.round(((page + 1) / totalPages) * 100);
      onProgress(progress);
    }
  }

  // Export the complete dataset
  exportData(allData, exportOptions);
}

/**
 * Generate a filename based on doctype and current date
 */
export function generateExportFilename(doctype: string): string {
  const date = new Date().toISOString().split("T")[0];
  const sanitizedDoctype = doctype.replace(/\s+/g, "_").toLowerCase();
  return sanitizedDoctype + "_export_" + date;
}
