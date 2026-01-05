/**
 * DocType List View Page
 *
 * Dynamic page that displays a list of documents for any DocType.
 * Uses the doctype parameter to fetch appropriate metadata and data.
 *
 * Features:
 * - Server-side pagination
 * - Server-side sorting
 * - Search functionality
 * - Dynamic columns based on DocType metadata
 * - Navigation to document detail view
 * - Bulk selection with Shift+click range selection
 * - Bulk operations: delete, export CSV, update field
 * - Calendar view for DocTypes with date fields
 */

"use client";

import { useState, useMemo, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useFrappeGetDocList, useFrappeDeleteDoc, useFrappeUpdateDoc } from "frappe-react-sdk";
import {
  Plus,
  AlertCircle,
  ChevronDown,
  Download,
  Upload,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  GripVertical,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useFrappeDocMeta, getFieldDisplayValue } from "@/hooks/use-frappe-meta";
import { useSavedViews, SavedView, SavedViewFilter } from "@/hooks/use-saved-views";
import { useFavoriteFolders } from "@/hooks/use-favorite-folders";
import { ViewsDropdown, ViewSettingsPanel } from "@/components/views";
import { CreateViewDialog } from "@/components/dialogs/create-view-dialog";
import { ViewType, VisibleColumn } from "@/hooks/use-saved-views";
import { RenameViewDialog } from "@/components/dialogs/rename-view-dialog";
import { ActiveFilters } from "@/components/filters/filter-builder";
import {
  FilterCondition,
  filtersToFrappe,
  getValidFilters,
  createEmptyFilter,
} from "@/lib/filters";
import { useBulkSelection, usePageSelectionState } from "@/hooks/use-bulk-selection";
import { useLinkedFieldResolver } from "@/hooks/use-linked-field-resolver";
import { useNotification } from "@/hooks/use-notification";
import {
  DataTable,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HeaderCheckbox, RowCheckbox } from "@/components/list/selection-checkbox";
import { BulkActionsBar, exportToCSV } from "@/components/list/bulk-actions-bar";
import { DocTypeField } from "@/types/frappe";

// ============================================================================
// Types
// ============================================================================

interface DocTypeListPageProps {
  params: Promise<{
    doctype: string;
  }>;
}

// Page size options
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert URL slug to Frappe DocType name
 * e.g., "sales-invoice" -> "Sales Invoice"
 */
function slugToDocType(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Format field value for display in table cell
 */
function formatCellValue(value: unknown, field: DocTypeField): string {
  return getFieldDisplayValue(value, field);
}

// ============================================================================
// Main Component
// ============================================================================

export default function DocTypeListPage({ params }: DocTypeListPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const doctypeSlug = resolvedParams.doctype;
  const doctypeName = slugToDocType(doctypeSlug);
  const { showSuccess, showError, showInfo } = useNotification();

  // ============================================================================
  // State
  // ============================================================================

  // Filter state
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([]);

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>([
    { id: "modified", desc: true },
  ]);

  // Bulk selection state
  const bulkSelection = useBulkSelection<string>();
  const {
    selectedIds,
    selectedCount,
    hasSelection,
    isSelected,
    toggleSelectAll,
    handleRangeSelection,
    clearSelection,
  } = bulkSelection;

  // Bulk operations loading state
  const [isBulkOperating, setIsBulkOperating] = useState(false);

  // Column order state (stores column IDs in display order)
  const [columnOrder, setColumnOrder] = useState<string[]>([]);

  // Visible columns state (for ViewSettingsPanel)
  const [visibleColumnsConfig, setVisibleColumnsConfig] = useState<VisibleColumn[]>([]);

  // Views state
  const [currentViewId, setCurrentViewId] = useState<string | null>(null);
  const [createViewDialogOpen, setCreateViewDialogOpen] = useState(false);
  const [renameViewDialogOpen, setRenameViewDialogOpen] = useState(false);
  const [viewToRename, setViewToRename] = useState<SavedView | null>(null);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  // Fetch DocType metadata
  const {
    meta,
    isLoading: metaLoading,
    error: metaError,
    listViewFields,
    visibleFields,
    titleField,
  } = useFrappeDocMeta({ doctype: doctypeName });

  // Fetch saved views for this doctype
  const {
    views: savedViews,
    isLoading: viewsLoading,
    createView,
    updateView,
    deleteView,
    duplicateView,
    addToFavorites,
    removeFromFavorites,
    refresh: refreshViews,
  } = useSavedViews({ doctype: doctypeName, enabled: !!meta });

  // Fetch favorite folders
  const { folders: favoriteFolders } = useFavoriteFolders();

  // Determine fields to fetch - include visible columns from config
  const fieldsToFetch = useMemo(() => {
    const fields = new Set<string>(["name", "modified", "creation"]);

    // Add title field
    if (titleField && titleField !== "name") {
      fields.add(titleField);
    }

    // Add list view fields (for default view)
    listViewFields.forEach((field) => {
      fields.add(field.fieldname);
    });

    // Add fields from visible columns config (when user adds columns via View Settings)
    visibleColumnsConfig.forEach((col) => {
      // For nested fields like "director.full_name", add the base link field "director"
      if (col.fieldname.includes(".")) {
        const baseLinkField = col.fieldname.split(".")[0];
        console.log(`[fieldsToFetch] Adding base link field "${baseLinkField}" for nested field "${col.fieldname}"`);
        fields.add(baseLinkField);
      } else {
        fields.add(col.fieldname);
      }
    });

    const result = Array.from(fields);
    console.log("[fieldsToFetch] Final fields:", result);
    return result;
  }, [listViewFields, titleField, visibleColumnsConfig]);

  // Build filters for API
  const apiFilters = useMemo(() => {
    const validFilters = getValidFilters(filterConditions);
    if (validFilters.length > 0) {
      return filtersToFrappe(validFilters);
    }
    return undefined;
  }, [filterConditions]);

  // Determine sort field and order
  const orderBy = useMemo(() => {
    if (sorting.length === 0) {
      return { field: "modified", order: "desc" as const };
    }
    const [sort] = sorting;
    return {
      field: sort.id,
      order: (sort.desc ? "desc" : "asc") as "asc" | "desc",
    };
  }, [sorting]);

  // Fetch document list
  // Using type assertion to handle dynamic field names
  const {
    data: documents,
    error: listError,
    isLoading: listLoading,
    mutate: refetchList,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useFrappeGetDocList<any>(
    doctypeName,
    {
      fields: fieldsToFetch as ["name"],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filters: apiFilters as any,
      orderBy,
      limit_start: pagination.pageIndex * pagination.pageSize,
      limit: pagination.pageSize,
    },
    // Include fieldsToFetch in cache key so query re-runs when columns change
    meta ? "doclist_" + doctypeName + "_" + pagination.pageIndex + "_" + pagination.pageSize + "_" + orderBy.field + "_" + orderBy.order + "_" + JSON.stringify(getValidFilters(filterConditions)) + "_" + JSON.stringify(fieldsToFetch) : null
  );

  // Fetch total count for pagination
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: countData } = useFrappeGetDocList<any>(
    doctypeName,
    {
      fields: ["count(name) as count"] as unknown as ["name"],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filters: apiFilters as any,
    },
    meta ? "doccount_" + doctypeName + "_" + JSON.stringify(getValidFilters(filterConditions)) : null
  );

  // Calculate total count and page count
  const totalCount = useMemo(() => {
    if (!countData || countData.length === 0) return 0;
    // The count query returns an object with count property
    const firstResult = countData[0] as unknown as { count: number };
    return firstResult?.count ?? 0;
  }, [countData]);

  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  // Get current page document IDs for selection
  const currentPageIds = useMemo(() => {
    if (!documents) return [];
    return (documents as Record<string, unknown>[]).map((doc) => doc.name as string);
  }, [documents]);

  // Compute page selection state
  const { isAllPageSelected, isPartiallySelected } = usePageSelectionState(
    selectedIds,
    currentPageIds
  );

  // Frappe mutations for bulk operations
  const { deleteDoc } = useFrappeDeleteDoc();
  const { updateDoc } = useFrappeUpdateDoc();

  // Build a map of link field names to their target DocTypes
  const linkFieldMap = useMemo(() => {
    const map = new Map<string, string>();
    visibleFields.forEach((field) => {
      if (field.fieldtype === "Link" && field.options) {
        map.set(field.fieldname, field.options);
      }
    });
    // Add standard link fields
    map.set("owner", "User");
    map.set("modified_by", "User");
    console.log("[linkFieldMap] Built map:", Object.fromEntries(map));
    console.log("[linkFieldMap] visibleFields Link fields:", visibleFields.filter(f => f.fieldtype === "Link").map(f => ({ fieldname: f.fieldname, options: f.options })));
    return map;
  }, [visibleFields]);

  // Resolve linked field values
  const { resolvedDocuments, isResolving } = useLinkedFieldResolver({
    documents: documents as Record<string, unknown>[] | undefined,
    visibleColumns: visibleColumnsConfig,
    linkFieldMap,
    enabled: !!documents && visibleColumnsConfig.some((col) => col.fieldname.includes(".")),
  });

  // ============================================================================
  // Table Columns
  // ============================================================================

  // Get fields that can be used for Kanban grouping (Select and Link fields)
  const kanbanGroupFields = useMemo(() => {
    return visibleFields.filter(
      (f) => f.fieldtype === "Select" || f.fieldtype === "Link"
    );
  }, [visibleFields]);

  // Get default visible columns (what the table shows by default)
  const defaultVisibleColumns = useMemo<VisibleColumn[]>(() => {
    const columns: VisibleColumn[] = [];

    // Add title field first
    if (titleField) {
      columns.push({ fieldname: titleField });
    } else {
      columns.push({ fieldname: "name" });
    }

    // Add list view fields (excluding title)
    listViewFields.forEach((field) => {
      if (field.fieldname !== titleField && field.fieldname !== "name") {
        columns.push({ fieldname: field.fieldname });
      }
    });

    // Add modified if not already present
    if (!listViewFields.some((f) => f.fieldname === "modified")) {
      columns.push({ fieldname: "modified" });
    }

    return columns;
  }, [listViewFields, titleField]);

  // All available fields for View Settings (includes standard fields)
  const allAvailableFields = useMemo<DocTypeField[]>(() => {
    const standardFields: DocTypeField[] = [
      { fieldname: "name", fieldtype: "Data", label: "ID" },
      { fieldname: "modified", fieldtype: "Datetime", label: "Modified" },
      { fieldname: "creation", fieldtype: "Datetime", label: "Created" },
      { fieldname: "owner", fieldtype: "Link", label: "Created By", options: "User" },
      { fieldname: "modified_by", fieldtype: "Link", label: "Modified By", options: "User" },
    ];

    // Combine visible fields with standard fields (avoid duplicates)
    const fieldMap = new Map<string, DocTypeField>();
    visibleFields.forEach((f) => fieldMap.set(f.fieldname, f));
    standardFields.forEach((f) => {
      if (!fieldMap.has(f.fieldname)) {
        fieldMap.set(f.fieldname, f);
      }
    });

    return Array.from(fieldMap.values());
  }, [visibleFields]);

  // Define document type for table
  type DocRecord = Record<string, unknown>;

  // Get the active visible columns (from config or default)
  const activeVisibleColumns = useMemo(() => {
    return visibleColumnsConfig.length > 0 ? visibleColumnsConfig : defaultVisibleColumns;
  }, [visibleColumnsConfig, defaultVisibleColumns]);

  // Build a map of all available fields for quick lookup
  const allFieldsMap = useMemo(() => {
    const map = new Map<string, DocTypeField>();
    allAvailableFields.forEach((f) => map.set(f.fieldname, f));
    return map;
  }, [allAvailableFields]);

  // Build base columns based on activeVisibleColumns
  const baseColumns = useMemo<ColumnDef<DocRecord, unknown>[]>(() => {
    const cols: ColumnDef<DocRecord, unknown>[] = [];

    activeVisibleColumns.forEach((visCol, index) => {
      const field = allFieldsMap.get(visCol.fieldname);
      const fieldname = visCol.fieldname;
      const label = visCol.label || field?.label || fieldname;
      const isFirstColumn = index === 0;

      if (isFirstColumn) {
        // First column has checkbox integrated
        cols.push({
          id: fieldname,
          accessorKey: fieldname,
          header: () => (
            <div className="flex items-center gap-3">
              <HeaderCheckbox
                isAllSelected={isAllPageSelected}
                isPartiallySelected={isPartiallySelected}
                onToggleSelectAll={() => toggleSelectAll(currentPageIds)}
                disabled={listLoading || currentPageIds.length === 0}
              />
              <span>{label}</span>
            </div>
          ),
          cell: ({ row, getValue }) => {
            const rowId = row.original.name as string;
            const value = getValue();
            return (
              <div className="flex items-center gap-3">
                <RowCheckbox
                  rowId={rowId}
                  isSelected={isSelected(rowId)}
                  onSelectionChange={(id, event) => handleRangeSelection(id, currentPageIds, event)}
                  disabled={listLoading}
                />
                <span className="font-medium text-primary truncate">
                  {value ? String(value) : "-"}
                </span>
              </div>
            );
          },
          enableSorting: true,
          minSize: 150,
        });
      } else {
        // Other columns
        cols.push({
          id: fieldname,
          accessorKey: fieldname,
          header: label,
          cell: ({ getValue }) => {
            const value = getValue();

            // Format based on field type
            if (field) {
              const formattedValue = formatCellValue(value, field);

              if (field.fieldtype === "Check") {
                return (
                  <span className={`truncate ${value ? "text-green-600" : "text-muted-foreground"}`}>
                    {formattedValue}
                  </span>
                );
              }

              if (field.fieldtype === "Link") {
                return (
                  <span className="truncate text-blue-600 hover:underline">
                    {formattedValue || "-"}
                  </span>
                );
              }

              if (field.fieldtype === "Datetime" || field.fieldtype === "Date") {
                if (!value) return <span className="truncate">-</span>;
                try {
                  return <span className="truncate">{new Date(String(value)).toLocaleDateString()}</span>;
                } catch {
                  return <span className="truncate">{String(value)}</span>;
                }
              }

              return <span className="truncate">{formattedValue || "-"}</span>;
            }

            // Fallback for fields not in allFieldsMap
            if (!value) return <span className="truncate">-</span>;
            return <span className="truncate">{String(value)}</span>;
          },
          enableSorting: true,
          minSize: 100,
        });
      }
    });

    return cols;
  }, [activeVisibleColumns, allFieldsMap, isAllPageSelected, isPartiallySelected, toggleSelectAll, currentPageIds, isSelected, handleRangeSelection, listLoading]);

  // Apply column order to get final columns
  const columns = useMemo<ColumnDef<DocRecord, unknown>[]>(() => {
    if (columnOrder.length === 0) {
      return baseColumns;
    }

    // First column (with checkbox) always stays first
    const firstColumn = baseColumns[0];
    const otherColumns = baseColumns.slice(1);

    // Sort other columns based on columnOrder
    const orderedOtherColumns = [...otherColumns].sort((a, b) => {
      const aIndex = columnOrder.indexOf(a.id as string);
      const bIndex = columnOrder.indexOf(b.id as string);

      // If both are in the order, sort by their position
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // If only one is in the order, it comes first
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      // If neither is in the order, keep original order
      return 0;
    });

    return [firstColumn, ...orderedOtherColumns];
  }, [baseColumns, columnOrder]);

  // Handle column order change
  const handleColumnOrderChange = useCallback((columnId: string, direction: "left" | "right") => {
    setColumnOrder((prevOrder) => {
      // Get current column IDs (excluding first column)
      const currentIds = prevOrder.length > 0
        ? prevOrder
        : baseColumns.slice(1).map(col => col.id as string);

      const currentIndex = currentIds.indexOf(columnId);
      if (currentIndex === -1) return prevOrder;

      const newIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= currentIds.length) return prevOrder;

      // Swap positions
      const newOrder = [...currentIds];
      [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];

      return newOrder;
    });
  }, [baseColumns]);

  // ============================================================================
  // Handlers
  // ============================================================================

  // Handle row click - navigate to document detail (only if not clicking checkbox)
  const handleRowClick = useCallback(
    (row: Record<string, unknown>) => {
      const docName = row.name as string;
      router.push("/" + doctypeSlug + "/" + encodeURIComponent(docName));
    },
    [router, doctypeSlug]
  );

  // Handle new document
  const handleNewDocument = useCallback(() => {
    router.push("/" + doctypeSlug + "/new");
  }, [router, doctypeSlug]);

  // Handle sorting change
  const handleSortingChange = useCallback((newSorting: SortingState) => {
    setSorting(newSorting);
    // Reset to first page when sorting changes
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  // Handle pagination change
  const handlePaginationChange = useCallback(
    (newPagination: PaginationState) => {
      // Warn about selection when changing pages
      if (hasSelection && newPagination.pageIndex !== pagination.pageIndex) {
        showInfo("Selection is preserved across pages. Clear selection to reset.");
      }
      setPagination(newPagination);
    },
    [hasSelection, pagination.pageIndex, showInfo]
  );

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    const selectedArray = Array.from(selectedIds);
    if (selectedArray.length === 0) return;

    setIsBulkOperating(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const docName of selectedArray) {
        try {
          await deleteDoc(doctypeName, docName);
          successCount++;
        } catch (error) {
          console.error("Failed to delete " + docName + ":", error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        showSuccess("Deleted " + successCount + " " + doctypeName.toLowerCase() + (successCount !== 1 ? "s" : ""));
        clearSelection();
        refetchList();
      }

      if (errorCount > 0) {
        showError("Failed to delete " + errorCount + " item" + (errorCount !== 1 ? "s" : ""));
      }
    } finally {
      setIsBulkOperating(false);
    }
  }, [selectedIds, doctypeName, deleteDoc, showSuccess, showError, clearSelection, refetchList]);

  // Handle bulk export to CSV
  const handleBulkExport = useCallback(() => {
    if (resolvedDocuments.length === 0 || selectedIds.size === 0) return;

    const selectedDocs = resolvedDocuments.filter((doc) =>
      selectedIds.has(doc.name as string)
    );

    // If selected docs are not all on current page, show info
    if (selectedDocs.length < selectedIds.size) {
      showInfo("Exporting " + selectedDocs.length + " items from current page. Selected items on other pages are not included.");
    }

    // Build column definitions for export
    const exportColumns = [
      { key: "name" as keyof typeof selectedDocs[0], header: "Name" },
      ...listViewFields.map((field) => ({
        key: field.fieldname as keyof typeof selectedDocs[0],
        header: field.label,
      })),
    ];

    const timestamp = new Date().toISOString().split("T")[0];
    exportToCSV(selectedDocs, doctypeName.toLowerCase() + "-export-" + timestamp, exportColumns);
    showSuccess("Exported " + selectedDocs.length + " " + doctypeName.toLowerCase() + (selectedDocs.length !== 1 ? "s" : "") + " to CSV");
  }, [resolvedDocuments, selectedIds, listViewFields, doctypeName, showSuccess, showInfo]);

  // Handle bulk field update
  const handleBulkUpdate = useCallback(
    async (fieldName: string, value: unknown) => {
      const selectedArray = Array.from(selectedIds);
      if (selectedArray.length === 0) return;

      setIsBulkOperating(true);
      let successCount = 0;
      let errorCount = 0;

      try {
        for (const docName of selectedArray) {
          try {
            await updateDoc(doctypeName, docName, { [fieldName]: value });
            successCount++;
          } catch (error) {
            console.error("Failed to update " + docName + ":", error);
            errorCount++;
          }
        }

        if (successCount > 0) {
          showSuccess("Updated " + successCount + " " + doctypeName.toLowerCase() + (successCount !== 1 ? "s" : ""));
          clearSelection();
          refetchList();
        }

        if (errorCount > 0) {
          showError("Failed to update " + errorCount + " item" + (errorCount !== 1 ? "s" : ""));
        }
      } finally {
        setIsBulkOperating(false);
      }
    },
    [selectedIds, doctypeName, updateDoc, showSuccess, showError, clearSelection, refetchList]
  );

  // ============================================================================
  // View Handlers
  // ============================================================================

  // Fetch fields of a related DocType (for View Settings navigation)
  const fetchRelatedFields = useCallback(
    async (doctype: string): Promise<DocTypeField[]> => {
      try {
        const params = new URLSearchParams({
          doctype,
          with_parent: "0",
        });
        const response = await fetch(
          `/api/frappe/api/method/frappe.desk.form.load.getdoctype?${params.toString()}`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();

        // Try different response structures
        const meta = data?.message?.docs?.[0] || data?.docs?.[0] || data?.message;
        if (!meta?.fields) return [];

        // Filter out layout fields
        const layoutTypes = ["Section Break", "Column Break", "Tab Break", "HTML", "Table", "Table MultiSelect"];
        return meta.fields.filter(
          (f: DocTypeField) => !layoutTypes.includes(f.fieldtype) && f.hidden !== 1
        );
      } catch (error) {
        console.error("Failed to fetch related fields for", doctype, error);
        return [];
      }
    },
    []
  );

  // Handle view selection
  const handleViewSelect = useCallback(
    (viewId: string | null) => {
      setCurrentViewId(viewId);

      if (viewId === null) {
        // Reset to default "All" view
        setFilterConditions([]);
        setSorting([{ id: "modified", desc: true }]);
        setColumnOrder([]);
        setVisibleColumnsConfig([]);
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      } else {
        // Find and apply the selected view
        const view = savedViews.find((v) => v.name === viewId);
        if (view) {
          // Convert SavedViewFilter to FilterCondition
          const filters = (view.filters || []).map((f: SavedViewFilter) => ({
            id: crypto.randomUUID(),
            fieldname: f.fieldname,
            operator: f.operator as FilterCondition["operator"],
            value: f.value,
          }));
          setFilterConditions(filters);
          setSorting(view.sorting || [{ id: "modified", desc: true }]);
          setColumnOrder(view.column_order || []);
          setVisibleColumnsConfig(view.visible_columns || []);
          setPagination((prev) => ({
            ...prev,
            pageIndex: 0,
            pageSize: view.page_size || DEFAULT_PAGE_SIZE,
          }));
        }
      }
    },
    [savedViews]
  );

  // Handle create view
  const handleCreateView = useCallback(
    async (title: string, viewType: ViewType, kanbanField?: string) => {
      const validFilters = getValidFilters(filterConditions);
      // Convert FilterCondition to SavedViewFilter (handle array values)
      const filtersToSave: SavedViewFilter[] = validFilters.map((f) => ({
        fieldname: f.fieldname,
        operator: f.operator,
        value: Array.isArray(f.value) ? f.value.join(",") : f.value,
      }));

      const newView = await createView({
        title,
        for_doctype: doctypeName,
        view_type: viewType,
        kanban_field: kanbanField,
        filters: filtersToSave,
        sorting,
        column_order: columnOrder,
        visible_columns: visibleColumnsConfig,
        page_size: pagination.pageSize,
        is_default: false,
      });

      setCurrentViewId(newView.name);
      showSuccess(`View "${title}" created`);
    },
    [filterConditions, sorting, columnOrder, visibleColumnsConfig, pagination.pageSize, doctypeName, createView, showSuccess]
  );

  // Handle rename view
  const handleRenameView = useCallback(
    (viewId: string) => {
      const view = savedViews.find((v) => v.name === viewId);
      if (view) {
        setViewToRename(view);
        setRenameViewDialogOpen(true);
      }
    },
    [savedViews]
  );

  // Handle rename confirm
  const handleRenameConfirm = useCallback(
    async (newName: string) => {
      if (!viewToRename) return;
      await updateView(viewToRename.name, { title: newName });
      showSuccess(`View renamed to "${newName}"`);
    },
    [viewToRename, updateView, showSuccess]
  );

  // Handle duplicate view
  const handleDuplicateView = useCallback(
    async (view: SavedView) => {
      const newView = await duplicateView(view, `${view.title} (copy)`);
      setCurrentViewId(newView.name);
      showSuccess(`View duplicated as "${newView.title}"`);
    },
    [duplicateView, showSuccess]
  );

  // Handle delete view
  const handleDeleteView = useCallback(
    async (viewId: string) => {
      const view = savedViews.find((v) => v.name === viewId);
      await deleteView(viewId);

      // If we deleted the current view, go back to "All"
      if (currentViewId === viewId) {
        handleViewSelect(null);
      }

      showSuccess(`View "${view?.title}" deleted`);
    },
    [savedViews, deleteView, currentViewId, handleViewSelect, showSuccess]
  );

  // Handle add to favorites
  const handleAddToFavorites = useCallback(
    async (viewId: string, folderId?: string) => {
      await addToFavorites(viewId, folderId);
      showSuccess("Added to favorites");
    },
    [addToFavorites, showSuccess]
  );

  // Handle remove from favorites
  const handleRemoveFromFavorites = useCallback(
    async (viewId: string) => {
      await removeFromFavorites(viewId);
      showSuccess("Removed from favorites");
    },
    [removeFromFavorites, showSuccess]
  );

  // Handle columns change - auto-save to current view if one is selected
  const handleColumnsChange = useCallback(
    async (columns: VisibleColumn[]) => {
      console.log("[handleColumnsChange] Called with columns:", columns);
      console.log("[handleColumnsChange] currentViewId:", currentViewId);
      setVisibleColumnsConfig(columns);

      // Auto-save to current view if one is selected
      if (currentViewId) {
        try {
          console.log("[handleColumnsChange] Saving to view:", currentViewId);
          await updateView(currentViewId, { visible_columns: columns });
          console.log("[handleColumnsChange] Save successful");
        } catch (error) {
          console.error("Failed to auto-save columns:", error);
        }
      } else {
        console.log("[handleColumnsChange] No currentViewId, not saving");
      }
    },
    [currentViewId, updateView]
  );

  // ============================================================================
  // Loading State
  // ============================================================================

  if (metaLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        {/* Search skeleton */}
        <Skeleton className="h-9 w-80" />

        {/* Table skeleton */}
        <div className="rounded-md border">
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Error State
  // ============================================================================

  if (metaError || !meta) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            DocType Not Found
          </CardTitle>
          <CardDescription>
            The DocType &quot;{doctypeName}&quot; could not be loaded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This could mean:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
            <li>The DocType does not exist</li>
            <li>You do not have permission to access this DocType</li>
            <li>There was a network error</li>
          </ul>
          {metaError && (
            <p className="text-sm text-destructive">
              Error: {metaError.message}
            </p>
          )}
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/")}
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  // Get current sort field label
  const currentSortField = sorting.length > 0 ? sorting[0] : null;
  const currentSortFieldLabel = currentSortField
    ? (listViewFields.find((f) => f.fieldname === currentSortField.id)?.label ||
       (currentSortField.id === "modified" ? "Modified" :
        currentSortField.id === "creation" ? "Created" :
        currentSortField.id === "name" ? "Name" :
        currentSortField.id === titleField ? (listViewFields.find((f) => f.fieldname === titleField)?.label || "Name") :
        currentSortField.id))
    : null;

  return (
    <div className="h-full flex flex-col -m-6">
      {/* Sub-header toolbar (Attio style) */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-background">
        <div className="flex items-center gap-2">
          {/* Views dropdown */}
          <ViewsDropdown
            doctype={doctypeName}
            doctypeLabel={doctypeName}
            views={savedViews}
            currentViewId={currentViewId}
            onViewSelect={handleViewSelect}
            onCreateView={() => setCreateViewDialogOpen(true)}
            onRenameView={handleRenameView}
            onDuplicateView={handleDuplicateView}
            onDeleteView={handleDeleteView}
            onAddToFavorites={handleAddToFavorites}
            onRemoveFromFavorites={handleRemoveFromFavorites}
            folders={favoriteFolders}
            isLoading={viewsLoading}
          />

          {/* View settings panel with drag-and-drop columns */}
          <ViewSettingsPanel
            fields={allAvailableFields}
            visibleColumns={
              visibleColumnsConfig.length > 0
                ? visibleColumnsConfig
                : defaultVisibleColumns
            }
            onColumnsChange={handleColumnsChange}
            onFetchRelatedFields={fetchRelatedFields}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Import / Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-4 w-4" />
                Import / Export
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleBulkExport}>
                <Download className="mr-2 h-4 w-4" />
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Upload className="mr-2 h-4 w-4" />
                Import from CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* New document button */}
          <Button size="sm" onClick={handleNewDocument}>
            <Plus className="mr-2 h-4 w-4" />
            New {doctypeName}
          </Button>
        </div>
      </div>

      {/* Secondary toolbar: Sort indicator + Filter (Attio style) */}
      <div className="flex items-center gap-2 px-6 py-2 border-b bg-background">
        {/* Sort indicator with dropdown */}
        <div className="rounded-md border border-border/50 bg-muted/50">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 h-7 px-2 text-muted-foreground hover:text-foreground">
              {currentSortField?.desc ? (
                <ArrowDown className="h-4 w-4" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
              Sorted by {currentSortFieldLabel || "Modified"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-3 border-b">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={currentSortField?.id || "modified"}
                  onValueChange={(value) => {
                    const isDesc = currentSortField?.desc ?? true;
                    setSorting([{ id: value, desc: isDesc }]);
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }}
                >
                  <SelectTrigger className="flex-1 h-8">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {listViewFields.map((field) => (
                      <SelectItem key={field.fieldname} value={field.fieldname}>
                        {field.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="modified">Modified</SelectItem>
                    <SelectItem value="creation">Created</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={currentSortField?.desc ? "desc" : "asc"}
                  onValueChange={(value) => {
                    const fieldId = currentSortField?.id || "modified";
                    setSorting([{ id: fieldId, desc: value === "desc" }]);
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }}
                >
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setSorting([{ id: "modified", desc: true }]);
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-2">
              <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Add sort
              </Button>
              <p className="text-xs text-muted-foreground px-2 py-1">
                Learn about sorting
              </p>
            </div>
          </PopoverContent>
          </Popover>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-border/30" />

        {/* Filter button with attribute search */}
        <div className="rounded-md border border-border/50 bg-muted/50">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 h-7 px-2 text-muted-foreground hover:text-foreground">
                <SlidersHorizontal className="h-4 w-4" />
                Filter
                {getValidFilters(filterConditions).length > 0 && (
                  <span className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {getValidFilters(filterConditions).length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search attributes..." />
              <CommandList>
                <CommandEmpty>No attributes found.</CommandEmpty>
                <CommandGroup>
                  {visibleFields.slice(0, 10).map((field) => (
                    <CommandItem
                      key={field.fieldname}
                      onSelect={() => {
                        // Add a new filter for this field
                        const newFilter = createEmptyFilter(field);
                        setFilterConditions((prev) => [...prev, newFilter]);
                      }}
                    >
                      <span className="text-sm">{field.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto">
          {/* Active Filters */}
          {getValidFilters(filterConditions).length > 0 && (
            <div className="px-6 pt-4">
              <ActiveFilters
                filters={filterConditions}
                fields={visibleFields}
                onRemove={(id) =>
                  setFilterConditions((prev) => prev.filter((f) => f.id !== id))
                }
                onClearAll={() => setFilterConditions([])}
              />
            </div>
          )}

          {/* Selection Info */}
          {hasSelection && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-6 py-2">
              <span>{selectedCount} item{selectedCount !== 1 ? "s" : ""} selected</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="h-auto py-1 px-2"
              >
                Clear
              </Button>
            </div>
          )}

          {/* List Error */}
          {listError && (
            <div className="px-6 py-4">
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <p className="text-sm text-destructive">
                    Error loading documents: {listError.message}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={resolvedDocuments}
            isLoading={listLoading || isResolving}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            onRowClick={handleRowClick}
            onColumnOrderChange={handleColumnOrderChange}
            emptyMessage={"No " + doctypeName.toLowerCase() + " found. Click \"New " + doctypeName + "\" to create one."}
            showPageSizeSelector={true}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />

          {/* Total Count Info */}
          {!listLoading && totalCount > 0 && (
            <p className="text-sm text-muted-foreground text-center px-6 py-4">
              Total: {totalCount.toLocaleString()} {doctypeName.toLowerCase()}
              {totalCount !== 1 ? "s" : ""}
            </p>
          )}

        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedCount={selectedCount}
          hasSelection={hasSelection}
          onClearSelection={clearSelection}
          onBulkDelete={handleBulkDelete}
          onBulkExport={handleBulkExport}
          onBulkUpdate={handleBulkUpdate}
          updateableFields={visibleFields}
          doctypeName={doctypeName}
          isLoading={isBulkOperating}
        />
      </div>

      {/* View Dialogs */}
      <CreateViewDialog
        open={createViewDialogOpen}
        onOpenChange={setCreateViewDialogOpen}
        doctype={doctypeName}
        doctypeLabel={doctypeName}
        selectFields={kanbanGroupFields}
        onConfirm={handleCreateView}
      />

      <RenameViewDialog
        open={renameViewDialogOpen}
        onOpenChange={setRenameViewDialogOpen}
        currentName={viewToRename?.title || ""}
        onConfirm={handleRenameConfirm}
      />
    </div>
  );
}
