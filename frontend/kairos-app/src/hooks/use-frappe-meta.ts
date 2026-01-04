/**
 * useFrappeDocMeta Hook
 *
 * React hook for fetching DocType metadata (field definitions, permissions, etc.)
 * Uses frappe-react-sdk's useFrappeGetCall to fetch metadata from Frappe backend
 */

"use client";

import { useFrappeGetCall } from "frappe-react-sdk";
import { DocTypeMeta, DocTypeField } from "@/types/frappe";

// ============================================================================
// Types
// ============================================================================

interface UseFrappeDocMetaOptions {
  /** The DocType name to fetch metadata for */
  doctype: string;
  /** Whether to skip fetching (useful for conditional fetching) */
  enabled?: boolean;
}

interface UseFrappeDocMetaResult {
  /** The DocType metadata */
  meta: DocTypeMeta | null;
  /** Whether the request is currently loading */
  isLoading: boolean;
  /** Whether the request is validating/revalidating */
  isValidating: boolean;
  /** Any error that occurred during fetch */
  error: Error | null;
  /** Function to manually refetch the metadata */
  mutate: () => void;
  /** Helper: Fields that should appear in list view */
  listViewFields: DocTypeField[];
  /** Helper: All visible fields (not hidden and not layout fields) */
  visibleFields: DocTypeField[];
  /** Helper: Required fields */
  requiredFields: DocTypeField[];
  /** Helper: Title field name */
  titleField: string;
}

// Layout field types that don't contain data
const LAYOUT_FIELD_TYPES = [
  "Section Break",
  "Column Break",
  "Tab Break",
  "HTML",
];

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook to fetch DocType metadata from Frappe
 *
 * @example
 * ```tsx
 * const { meta, isLoading, error, listViewFields } = useFrappeDocMeta({
 *   doctype: "User"
 * });
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 *
 * // Use listViewFields for table columns
 * const columns = listViewFields.map(field => ({
 *   accessorKey: field.fieldname,
 *   header: field.label,
 * }));
 * ```
 */
export function useFrappeDocMeta({
  doctype,
  enabled = true,
}: UseFrappeDocMetaOptions): UseFrappeDocMetaResult {
  // Fetch metadata using Frappe's get_meta method
  const { data, error, isLoading, isValidating, mutate } = useFrappeGetCall<{
    message: DocTypeMeta;
  }>(
    "frappe.desk.form.utils.get_meta",
    { doctype },
    enabled ? `doctype_meta_${doctype}` : null // SWR key, null to disable
  );

  // Extract meta from response
  const meta = data?.message ?? null;

  // Compute helper values
  const fields = meta?.fields ?? [];

  // Fields marked for list view display
  const listViewFields = fields.filter(
    (field) =>
      field.in_list_view === 1 && !LAYOUT_FIELD_TYPES.includes(field.fieldtype)
  );

  // All visible fields (excluding hidden and layout fields)
  const visibleFields = fields.filter(
    (field) =>
      field.hidden !== 1 && !LAYOUT_FIELD_TYPES.includes(field.fieldtype)
  );

  // Required fields
  const requiredFields = fields.filter(
    (field) =>
      field.reqd === 1 && !LAYOUT_FIELD_TYPES.includes(field.fieldtype)
  );

  // Title field (defaults to "name")
  const titleField = meta?.title_field || "name";

  return {
    meta,
    isLoading,
    isValidating,
    error: error ? new Error(String(error)) : null,
    mutate,
    listViewFields,
    visibleFields,
    requiredFields,
    titleField,
  };
}

/**
 * Hook to fetch multiple DocType metadata at once
 * Useful when you need metadata for linked DocTypes
 *
 * @example
 * ```tsx
 * const { metas, isLoading } = useFrappeDocMetas({
 *   doctypes: ["User", "Role", "Module Def"]
 * });
 * ```
 */
export function useFrappeDocMetas({
  doctypes,
  enabled = true,
}: {
  doctypes: string[];
  enabled?: boolean;
}): {
  metas: Record<string, DocTypeMeta | null>;
  isLoading: boolean;
  errors: Record<string, Error | null>;
} {
  // This is a simplified implementation
  // For production, consider using SWR's useSWRInfinite or parallel fetching
  const results = doctypes.map((doctype) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useFrappeDocMeta({ doctype, enabled })
  );

  const metas: Record<string, DocTypeMeta | null> = {};
  const errors: Record<string, Error | null> = {};

  doctypes.forEach((doctype, index) => {
    metas[doctype] = results[index].meta;
    errors[doctype] = results[index].error;
  });

  const isLoading = results.some((r) => r.isLoading);

  return {
    metas,
    isLoading,
    errors,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the display value for a field based on its type
 */
export function getFieldDisplayValue(
  value: unknown,
  field: DocTypeField
): string {
  if (value === null || value === undefined) {
    return "";
  }

  switch (field.fieldtype) {
    case "Check":
      return value ? "Yes" : "No";
    case "Date":
      if (typeof value === "string" && value) {
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return String(value);
        }
      }
      return String(value);
    case "Datetime":
      if (typeof value === "string" && value) {
        try {
          return new Date(value).toLocaleString();
        } catch {
          return String(value);
        }
      }
      return String(value);
    case "Currency":
    case "Float":
      if (typeof value === "number") {
        return value.toLocaleString();
      }
      return String(value);
    case "Int":
      return String(value);
    default:
      return String(value);
  }
}

/**
 * Build default columns for a DataTable from DocType fields
 */
export function buildTableColumns(
  fields: DocTypeField[]
): Array<{
  accessorKey: string;
  header: string;
  fieldtype: string;
}> {
  return fields.map((field) => ({
    accessorKey: field.fieldname,
    header: field.label,
    fieldtype: field.fieldtype,
  }));
}
