/**
 * useExport Hook
 *
 * React hook for handling data export functionality in list views.
 * Provides methods for exporting current view data or all data with filters.
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { useFrappePostCall } from "frappe-react-sdk";
import {
  ExportFormat,
  ExportColumn,
  exportData,
  exportPaginated,
  generateExportFilename,
  fieldsToExportColumns,
} from "@/lib/export";
import { DocTypeField } from "@/types/frappe";

// ============================================================================
// Types
// ============================================================================

export type ExportScope = "current" | "selected" | "all";

export interface UseExportOptions {
  doctype: string;
  fields: string[];
  listViewFields: DocTypeField[];
  titleField?: string;
  filters?: unknown[];
  orderBy?: { field: string; order: "asc" | "desc" };
}

export interface UseExportResult {
  isExporting: boolean;
  progress: number;
  exportCurrentView: (
    data: Record<string, unknown>[],
    format: ExportFormat
  ) => void;
  exportSelected: (
    selectedData: Record<string, unknown>[],
    format: ExportFormat
  ) => void;
  exportAll: (format: ExportFormat, totalCount: number) => Promise<void>;
  error: Error | null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useExport({
  doctype,
  fields,
  listViewFields,
  titleField,
  filters,
  orderBy,
}: UseExportOptions): UseExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  // Build export columns from list view fields
  const exportColumns = useMemo(
    () => buildExportColumns(listViewFields, titleField),
    [listViewFields, titleField]
  );

  // Frappe API call for fetching paginated data
  const { call } = useFrappePostCall<{ message: Record<string, unknown>[] }>(
    "frappe.client.get_list"
  );

  /**
   * Export the current view data (already loaded in the table)
   */
  const exportCurrentView = useCallback(
    (data: Record<string, unknown>[], format: ExportFormat) => {
      if (data.length === 0) {
        setError(new Error("No data to export"));
        return;
      }

      setIsExporting(true);
      setError(null);

      try {
        const filename = generateExportFilename(doctype);
        exportData(data, {
          filename,
          format,
          columns: exportColumns,
          sheetName: doctype,
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Export failed"));
      } finally {
        setIsExporting(false);
        setProgress(0);
      }
    },
    [doctype, exportColumns]
  );

  /**
   * Export selected items only
   */
  const exportSelected = useCallback(
    (selectedData: Record<string, unknown>[], format: ExportFormat) => {
      if (selectedData.length === 0) {
        setError(new Error("No items selected for export"));
        return;
      }

      setIsExporting(true);
      setError(null);

      try {
        const filename = generateExportFilename(doctype) + "_selected";
        exportData(selectedData, {
          filename,
          format,
          columns: exportColumns,
          sheetName: doctype,
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Export failed"));
      } finally {
        setIsExporting(false);
        setProgress(0);
      }
    },
    [doctype, exportColumns]
  );

  /**
   * Export all data (fetches in batches for large datasets)
   */
  const exportAll = useCallback(
    async (format: ExportFormat, totalCount: number) => {
      if (totalCount === 0) {
        setError(new Error("No data to export"));
        return;
      }

      setIsExporting(true);
      setError(null);
      setProgress(0);

      try {
        const filename = generateExportFilename(doctype) + "_all";

        // Function to fetch a page of data
        const fetchPage = async (
          page: number,
          pageSize: number
        ): Promise<Record<string, unknown>[]> => {
          const orderByStr = orderBy
            ? orderBy.field + " " + orderBy.order
            : "modified desc";

          const response = await call({
            doctype,
            fields,
            filters,
            order_by: orderByStr,
            limit_start: page * pageSize,
            limit_page_length: pageSize,
          });

          return (response?.message as Record<string, unknown>[]) || [];
        };

        await exportPaginated({
          filename,
          format,
          columns: exportColumns,
          sheetName: doctype,
          pageSize: 100,
          fetchPage,
          totalCount,
          onProgress: setProgress,
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Export failed"));
      } finally {
        setIsExporting(false);
        setProgress(0);
      }
    },
    [doctype, fields, filters, orderBy, exportColumns, call]
  );

  return {
    isExporting,
    progress,
    exportCurrentView,
    exportSelected,
    exportAll,
    error,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build export columns from list view fields
 */
function buildExportColumns(
  listViewFields: DocTypeField[],
  titleField?: string
): ExportColumn[] {
  const columns: ExportColumn[] = [];

  // Always include name column first
  columns.push({
    key: "name",
    header: "ID",
    fieldtype: "Data",
  });

  // Add title field if different from name
  if (titleField && titleField !== "name") {
    const titleFieldDef = listViewFields.find(
      (f) => f.fieldname === titleField
    );
    if (titleFieldDef) {
      columns.push({
        key: titleField,
        header: titleFieldDef.label || "Title",
        fieldtype: titleFieldDef.fieldtype,
      });
    }
  }

  // Add remaining list view fields
  const addedFields = new Set(columns.map((c) => c.key));
  listViewFields.forEach((field) => {
    if (!addedFields.has(field.fieldname)) {
      columns.push({
        key: field.fieldname,
        header: field.label,
        fieldtype: field.fieldtype,
      });
      addedFields.add(field.fieldname);
    }
  });

  // Always include modified column if not present
  if (!addedFields.has("modified")) {
    columns.push({
      key: "modified",
      header: "Modified",
      fieldtype: "Datetime",
    });
  }

  return columns;
}

export { fieldsToExportColumns };
