/**
 * useCalendarEvents Hook
 *
 * React hook for fetching and transforming DocType data for calendar display.
 * Detects date fields from DocType metadata and transforms documents into calendar events.
 */

"use client";

import { useMemo } from "react";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { useFrappeDocMeta } from "@/hooks/use-frappe-meta";
import { DocTypeField } from "@/types/frappe";

// ============================================================================
// Types
// ============================================================================

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    doctype: string;
    docname: string;
    status?: string;
    [key: string]: unknown;
  };
}

export interface DateFieldInfo {
  fieldname: string;
  fieldtype: "Date" | "Datetime";
  label: string;
}

export interface UseCalendarEventsOptions {
  doctype: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  enabled?: boolean;
}

export interface UseCalendarEventsResult {
  events: CalendarEvent[];
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
  dateFields: DateFieldInfo[];
  primaryDateField: DateFieldInfo | null;
  titleField: string;
  hasDateFields: boolean;
}

// ============================================================================
// Constants
// ============================================================================

// Status-based color mapping for events
const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  // Common statuses
  draft: { bg: "hsl(var(--muted))", border: "hsl(var(--muted-foreground))", text: "hsl(var(--muted-foreground))" },
  pending: { bg: "hsl(48, 96%, 89%)", border: "hsl(48, 96%, 53%)", text: "hsl(48, 96%, 20%)" },
  open: { bg: "hsl(210, 100%, 95%)", border: "hsl(210, 100%, 50%)", text: "hsl(210, 100%, 30%)" },
  "in progress": { bg: "hsl(210, 100%, 95%)", border: "hsl(210, 100%, 50%)", text: "hsl(210, 100%, 30%)" },
  completed: { bg: "hsl(142, 76%, 95%)", border: "hsl(142, 76%, 36%)", text: "hsl(142, 76%, 20%)" },
  approved: { bg: "hsl(142, 76%, 95%)", border: "hsl(142, 76%, 36%)", text: "hsl(142, 76%, 20%)" },
  cancelled: { bg: "hsl(0, 84%, 95%)", border: "hsl(0, 84%, 60%)", text: "hsl(0, 84%, 30%)" },
  rejected: { bg: "hsl(0, 84%, 95%)", border: "hsl(0, 84%, 60%)", text: "hsl(0, 84%, 30%)" },
  closed: { bg: "hsl(220, 9%, 94%)", border: "hsl(220, 9%, 46%)", text: "hsl(220, 9%, 30%)" },
  expired: { bg: "hsl(0, 84%, 95%)", border: "hsl(0, 84%, 60%)", text: "hsl(0, 84%, 30%)" },
  // Default
  default: { bg: "hsl(var(--primary))", border: "hsl(var(--primary))", text: "hsl(var(--primary-foreground))" },
};

// Type-based color mapping for DocTypes
const DOCTYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "sales invoice": { bg: "hsl(142, 76%, 95%)", border: "hsl(142, 76%, 36%)", text: "hsl(142, 76%, 20%)" },
  "purchase invoice": { bg: "hsl(0, 84%, 95%)", border: "hsl(0, 84%, 60%)", text: "hsl(0, 84%, 30%)" },
  "sales order": { bg: "hsl(210, 100%, 95%)", border: "hsl(210, 100%, 50%)", text: "hsl(210, 100%, 30%)" },
  "purchase order": { bg: "hsl(280, 100%, 95%)", border: "hsl(280, 100%, 50%)", text: "hsl(280, 100%, 30%)" },
  task: { bg: "hsl(48, 96%, 89%)", border: "hsl(48, 96%, 53%)", text: "hsl(48, 96%, 20%)" },
  event: { bg: "hsl(210, 100%, 95%)", border: "hsl(210, 100%, 50%)", text: "hsl(210, 100%, 30%)" },
  "guardian invite": { bg: "hsl(280, 100%, 95%)", border: "hsl(280, 100%, 50%)", text: "hsl(280, 100%, 30%)" },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get date fields from DocType fields
 */
function getDateFields(fields: DocTypeField[]): DateFieldInfo[] {
  return fields
    .filter((field) => field.fieldtype === "Date" || field.fieldtype === "Datetime")
    .map((field) => ({
      fieldname: field.fieldname,
      fieldtype: field.fieldtype as "Date" | "Datetime",
      label: field.label,
    }));
}

/**
 * Get the primary date field for calendar events
 * Priority: date, start_date, posting_date, transaction_date, creation
 */
function getPrimaryDateField(dateFields: DateFieldInfo[]): DateFieldInfo | null {
  if (dateFields.length === 0) return null;

  const priorityFields = [
    "date",
    "start_date",
    "posting_date",
    "transaction_date",
    "schedule_date",
    "event_date",
    "due_date",
    "expires_on",
  ];

  for (const fieldName of priorityFields) {
    const field = dateFields.find((f) => f.fieldname === fieldName);
    if (field) return field;
  }

  // Return first date field as fallback
  return dateFields[0];
}

/**
 * Get color for an event based on status or DocType
 */
function getEventColor(
  status: string | undefined,
  doctype: string
): { bg: string; border: string; text: string } {
  // First try to match by status
  if (status) {
    const normalizedStatus = status.toLowerCase();
    if (STATUS_COLORS[normalizedStatus]) {
      return STATUS_COLORS[normalizedStatus];
    }
  }

  // Then try to match by DocType
  const normalizedDoctype = doctype.toLowerCase();
  if (DOCTYPE_COLORS[normalizedDoctype]) {
    return DOCTYPE_COLORS[normalizedDoctype];
  }

  // Default color
  return STATUS_COLORS.default;
}

/**
 * Get status field from document
 */
function getStatusValue(doc: Record<string, unknown>, fields: DocTypeField[]): string | undefined {
  // Common status field names
  const statusFieldNames = ["status", "workflow_state", "docstatus", "state"];

  for (const fieldName of statusFieldNames) {
    const field = fields.find((f) => f.fieldname === fieldName);
    if (field && doc[fieldName] !== undefined) {
      // Handle docstatus specially
      if (fieldName === "docstatus") {
        const docstatus = doc[fieldName] as number;
        if (docstatus === 0) return "Draft";
        if (docstatus === 1) return "Submitted";
        if (docstatus === 2) return "Cancelled";
      }
      return String(doc[fieldName]);
    }
  }

  return undefined;
}

/**
 * Build cache key for calendar data
 */
function buildCacheKey(doctype: string, dateRange?: { start: Date; end: Date }): string {
  if (!dateRange) {
    return "calendar_" + doctype;
  }
  const startStr = dateRange.start.toISOString();
  const endStr = dateRange.end.toISOString();
  return "calendar_" + doctype + "_" + startStr + "_" + endStr;
}

// ============================================================================
// Main Hook
// ============================================================================

export function useCalendarEvents({
  doctype,
  dateRange,
  enabled = true,
}: UseCalendarEventsOptions): UseCalendarEventsResult {
  // Fetch DocType metadata
  const {
    meta,
    isLoading: metaLoading,
    error: metaError,
    titleField,
  } = useFrappeDocMeta({ doctype, enabled });

  // Extract date fields from metadata
  const dateFields = useMemo(() => {
    if (!meta?.fields) return [];
    return getDateFields(meta.fields);
  }, [meta?.fields]);

  // Get primary date field
  const primaryDateField = useMemo(() => {
    return getPrimaryDateField(dateFields);
  }, [dateFields]);

  // Determine fields to fetch
  const fieldsToFetch = useMemo(() => {
    const fields = new Set<string>(["name", "modified", "creation"]);

    // Add title field
    if (titleField && titleField !== "name") {
      fields.add(titleField);
    }

    // Add all date fields
    dateFields.forEach((df) => fields.add(df.fieldname));

    // Add status field if exists
    if (meta?.fields) {
      const statusField = meta.fields.find(
        (f) => f.fieldname === "status" || f.fieldname === "workflow_state"
      );
      if (statusField) {
        fields.add(statusField.fieldname);
      }
    }

    return Array.from(fields);
  }, [dateFields, titleField, meta?.fields]);

  // Build filters for date range
  const filters = useMemo(() => {
    if (!primaryDateField || !dateRange) return undefined;

    return [
      [primaryDateField.fieldname, ">=", dateRange.start.toISOString().split("T")[0]],
      [primaryDateField.fieldname, "<=", dateRange.end.toISOString().split("T")[0]],
    ] as [string, string, string][];
  }, [primaryDateField, dateRange]);

  // Build cache key
  const cacheKey = useMemo(() => {
    if (!enabled || !meta || !primaryDateField) return null;
    return buildCacheKey(doctype, dateRange);
  }, [enabled, meta, primaryDateField, doctype, dateRange]);

  // Fetch documents
  const {
    data: documents,
    error: listError,
    isLoading: listLoading,
    mutate,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useFrappeGetDocList<any>(
    doctype,
    {
      fields: fieldsToFetch as ["name"],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filters: filters as any,
      limit: 500, // Reasonable limit for calendar view
      orderBy: primaryDateField
        ? { field: primaryDateField.fieldname, order: "asc" }
        : { field: "modified", order: "desc" },
    },
    cacheKey
  );

  // Transform documents to calendar events
  const events = useMemo<CalendarEvent[]>(() => {
    if (!documents || !primaryDateField || !meta?.fields) return [];

    return (documents as Record<string, unknown>[]).map((doc) => {
      const docName = doc.name as string;
      const title = titleField && doc[titleField]
        ? String(doc[titleField])
        : docName;

      const dateValue = doc[primaryDateField.fieldname];
      const startDate = dateValue ? String(dateValue) : new Date().toISOString();

      // Check if it's a datetime field
      const allDay = primaryDateField.fieldtype === "Date";

      // Get status for color
      const status = getStatusValue(doc, meta.fields);
      const colors = getEventColor(status, doctype);

      return {
        id: docName,
        title,
        start: startDate,
        allDay,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
        extendedProps: {
          doctype,
          docname: docName,
          status,
          ...doc,
        },
      };
    });
  }, [documents, primaryDateField, titleField, doctype, meta?.fields]);

  // Combine loading states
  const isLoading = metaLoading || listLoading;

  // Combine errors
  const error = metaError || (listError ? new Error(String(listError)) : null);

  return {
    events,
    isLoading,
    error,
    mutate,
    dateFields,
    primaryDateField,
    titleField,
    hasDateFields: dateFields.length > 0,
  };
}
