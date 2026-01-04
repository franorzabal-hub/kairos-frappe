/**
 * useKanbanData Hook
 *
 * React hook for managing Kanban board state and data operations.
 * Handles fetching documents, organizing by column, and drag-drop updates.
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { useFrappeGetDocList, useFrappeUpdateDoc } from "frappe-react-sdk";
import { useFrappeDocMeta } from "@/hooks/use-frappe-meta";
import { DocTypeField } from "@/types/frappe";

// ============================================================================
// Types
// ============================================================================

export interface KanbanCard {
  name: string;
  title: string;
  columnValue: string;
  fields: Record<string, unknown>;
  modified: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
  color?: string;
}

interface UseKanbanDataOptions {
  doctype: string;
  columnField?: string;
  enabled?: boolean;
}

interface UseKanbanDataResult {
  columns: KanbanColumn[];
  isLoading: boolean;
  isUpdating: boolean;
  error: Error | null;
  selectFields: DocTypeField[];
  selectedColumnField: DocTypeField | null;
  titleField: string;
  setColumnField: (fieldname: string) => void;
  moveCard: (cardName: string, newColumnValue: string) => Promise<void>;
  refetch: () => void;
}

// ============================================================================
// Status Colors
// ============================================================================

const STATUS_COLORS: Record<string, string> = {
  // Common status colors
  draft: "bg-gray-100 border-gray-300",
  pending: "bg-yellow-50 border-yellow-400",
  open: "bg-blue-50 border-blue-400",
  "in progress": "bg-indigo-50 border-indigo-400",
  in_progress: "bg-indigo-50 border-indigo-400",
  active: "bg-green-50 border-green-400",
  completed: "bg-emerald-50 border-emerald-500",
  closed: "bg-gray-200 border-gray-500",
  cancelled: "bg-red-50 border-red-400",
  approved: "bg-green-50 border-green-500",
  rejected: "bg-red-50 border-red-500",
  submitted: "bg-blue-100 border-blue-500",
  // Default
  default: "bg-slate-50 border-slate-300",
};

function getColumnColor(value: string): string {
  const normalizedValue = value.toLowerCase().replace(/\s+/g, "_");
  return STATUS_COLORS[normalizedValue] || STATUS_COLORS.default;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useKanbanData({
  doctype,
  columnField: initialColumnField,
  enabled = true,
}: UseKanbanDataOptions): UseKanbanDataResult {
  const [columnFieldName, setColumnFieldName] = useState<string | undefined>(
    initialColumnField
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch DocType metadata
  const {
    meta,
    isLoading: metaLoading,
    error: metaError,
    listViewFields,
    titleField,
  } = useFrappeDocMeta({ doctype, enabled });

  // Find all Select fields that could be used for columns
  const selectFields = useMemo(() => {
    if (!meta?.fields) return [];
    return meta.fields.filter(
      (field) =>
        field.fieldtype === "Select" &&
        field.options &&
        field.hidden !== 1
    );
  }, [meta]);

  // Auto-select first Select field if none specified
  const activeColumnFieldName = useMemo(() => {
    if (columnFieldName) return columnFieldName;
    // Look for common status-like fields first
    const statusField = selectFields.find(
      (f) =>
        f.fieldname === "status" ||
        f.fieldname === "workflow_state" ||
        f.fieldname === "docstatus"
    );
    if (statusField) return statusField.fieldname;
    return selectFields[0]?.fieldname;
  }, [columnFieldName, selectFields]);

  // Get the active column field definition
  const selectedColumnField = useMemo(() => {
    return selectFields.find((f) => f.fieldname === activeColumnFieldName) || null;
  }, [selectFields, activeColumnFieldName]);

  // Parse options from the Select field
  const columnOptions = useMemo(() => {
    if (!selectedColumnField?.options) return [];
    return selectedColumnField.options
      .split("\n")
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);
  }, [selectedColumnField]);

  // Determine fields to fetch
  const fieldsToFetch = useMemo(() => {
    const fields = new Set<string>(["name", "modified", "creation"]);

    if (titleField && titleField !== "name") {
      fields.add(titleField);
    }

    if (activeColumnFieldName) {
      fields.add(activeColumnFieldName);
    }

    // Add list view fields for card preview
    listViewFields.slice(0, 5).forEach((field) => {
      fields.add(field.fieldname);
    });

    return Array.from(fields);
  }, [titleField, activeColumnFieldName, listViewFields]);

  // Fetch documents
  const {
    data: documents,
    error: listError,
    isLoading: listLoading,
    mutate: refetchList,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useFrappeGetDocList<any>(
    doctype,
    {
      fields: fieldsToFetch as ["name"],
      orderBy: { field: "modified", order: "desc" },
      limit: 500, // Reasonable limit for kanban
    },
    enabled && meta && activeColumnFieldName
      ? `kanban_${doctype}_${activeColumnFieldName}`
      : null
  );

  // Frappe update doc hook
  const { updateDoc } = useFrappeUpdateDoc();

  // Organize documents into columns
  const columns = useMemo<KanbanColumn[]>(() => {
    if (!documents || !activeColumnFieldName || columnOptions.length === 0) {
      return [];
    }

    // Create column map
    const columnMap = new Map<string, KanbanCard[]>();
    columnOptions.forEach((opt) => columnMap.set(opt, []));

    // Add "Unassigned" column for docs without a value
    columnMap.set("", []);

    // Distribute documents to columns
    documents.forEach((doc: Record<string, unknown>) => {
      const columnValue = String(doc[activeColumnFieldName] ?? "");
      const card: KanbanCard = {
        name: String(doc.name),
        title: String(doc[titleField] || doc.name),
        columnValue,
        fields: doc,
        modified: String(doc.modified || ""),
      };

      const existingCards = columnMap.get(columnValue);
      if (existingCards) {
        existingCards.push(card);
      } else {
        // Document has a value not in options, add to "Other"
        const otherCards = columnMap.get("") || [];
        otherCards.push(card);
        columnMap.set("", otherCards);
      }
    });

    // Convert to column array
    const result: KanbanColumn[] = [];

    // Add defined options first
    columnOptions.forEach((opt) => {
      const cards = columnMap.get(opt) || [];
      result.push({
        id: opt,
        title: opt,
        cards,
        color: getColumnColor(opt),
      });
    });

    // Add "Unassigned" column if there are any unassigned cards
    const unassignedCards = columnMap.get("") || [];
    if (unassignedCards.length > 0) {
      result.unshift({
        id: "__unassigned__",
        title: "Unassigned",
        cards: unassignedCards,
        color: "bg-gray-50 border-gray-200",
      });
    }

    return result;
  }, [documents, activeColumnFieldName, columnOptions, titleField]);

  // Move card to new column
  const moveCard = useCallback(
    async (cardName: string, newColumnValue: string) => {
      if (!activeColumnFieldName) return;

      setIsUpdating(true);
      try {
        // Handle special "unassigned" column
        const actualValue = newColumnValue === "__unassigned__" ? "" : newColumnValue;

        await updateDoc(doctype, cardName, {
          [activeColumnFieldName]: actualValue,
        });

        // Refetch to update UI
        refetchList();
      } catch (err) {
        console.error("Failed to update document:", err);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [doctype, activeColumnFieldName, updateDoc, refetchList]
  );

  // Set column field
  const setColumnField = useCallback((fieldname: string) => {
    setColumnFieldName(fieldname);
  }, []);

  // Combined error
  const error = metaError || (listError ? new Error(String(listError)) : null);

  return {
    columns,
    isLoading: metaLoading || listLoading,
    isUpdating,
    error,
    selectFields,
    selectedColumnField,
    titleField,
    setColumnField,
    moveCard,
    refetch: refetchList,
  };
}
