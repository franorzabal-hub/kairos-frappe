/**
 * useRelatedRecords Hook
 *
 * Fetches related DocTypes and their record counts for a given document.
 * Used to generate dynamic tabs in the record view.
 */

"use client";

import { useMemo } from "react";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { DocTypeField, DocTypeMeta } from "@/types/frappe";

// ============================================================================
// Types
// ============================================================================

export interface RelatedDocType {
  /** The DocType name (e.g., "Student") */
  doctype: string;
  /** Display label for the tab */
  label: string;
  /** The field name that links to this DocType */
  fieldname: string;
  /** The field in the related DocType that links back */
  linkField: string;
  /** Number of related records */
  count: number;
  /** Whether this is a child table */
  isChildTable: boolean;
}

interface UseRelatedRecordsOptions {
  /** Current document's DocType metadata */
  meta: DocTypeMeta | null;
  /** Current document's name */
  docname: string;
  /** Current document's DocType name */
  doctype: string;
  /** Whether to enable fetching */
  enabled?: boolean;
}

interface UseRelatedRecordsResult {
  /** List of related DocTypes with counts */
  relatedDocTypes: RelatedDocType[];
  /** Loading state */
  isLoading: boolean;
  /** Error if any */
  error: Error | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract child tables from DocType metadata
 */
function getChildTables(meta: DocTypeMeta): RelatedDocType[] {
  return meta.fields
    .filter((field): field is DocTypeField & { options: string } =>
      field.fieldtype === "Table" && !!field.options
    )
    .map((field) => ({
      doctype: field.options,
      label: field.label,
      fieldname: field.fieldname,
      linkField: "parent",
      count: 0,
      isChildTable: true,
    }));
}

/**
 * Format DocType name for display
 */
function formatDocTypeLabel(doctype: string): string {
  // Add "s" for plural, handle special cases
  if (doctype.endsWith("s")) {
    return doctype;
  }
  if (doctype.endsWith("y")) {
    return doctype.slice(0, -1) + "ies";
  }
  return doctype + "s";
}

// ============================================================================
// Hook
// ============================================================================

export function useRelatedRecords({
  meta,
  docname,
  doctype,
  enabled = true,
}: UseRelatedRecordsOptions): UseRelatedRecordsResult {
  // Get child tables from metadata
  const childTables = useMemo(() => {
    if (!meta) return [];
    return getChildTables(meta);
  }, [meta]);

  // For now, we'll just return child tables
  // In the future, we could also detect reverse Link relationships
  const relatedDocTypes = useMemo(() => {
    return childTables.map((ct) => ({
      ...ct,
      label: formatDocTypeLabel(ct.doctype),
    }));
  }, [childTables]);

  // Fetch counts for each related DocType (simplified - counts are embedded in doc)
  // Child table data comes from the main document, so we don't need separate fetches

  return {
    relatedDocTypes,
    isLoading: false,
    error: null,
  };
}

/**
 * Hook to fetch records for a specific related DocType
 */
export function useRelatedDocTypeRecords({
  doctype,
  linkField,
  linkValue,
  enabled = true,
}: {
  doctype: string;
  linkField: string;
  linkValue: string;
  enabled?: boolean;
}) {
  const { data, error, isLoading, mutate } = useFrappeGetDocList(
    doctype,
    {
      fields: ["name", "creation", "modified"],
      filters: [[linkField, "=", linkValue]],
      limit: 100,
    },
    enabled ? `related_${doctype}_${linkValue}` : null
  );

  return {
    records: data ?? [],
    isLoading,
    error: error ? new Error(String(error)) : null,
    refresh: mutate,
  };
}
