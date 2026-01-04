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
import { Plus, Search, RefreshCw, AlertCircle } from "lucide-react";

import { useFrappeDocMeta, getFieldDisplayValue } from "@/hooks/use-frappe-meta";
import { FilterBuilder, ActiveFilters } from "@/components/filters/filter-builder";
import {
  FilterCondition,
  filtersToFrappe,
  getValidFilters,
} from "@/lib/filters";
import { useBulkSelection, usePageSelectionState } from "@/hooks/use-bulk-selection";
import { useNotification } from "@/hooks/use-notification";
import {
  DataTable,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ViewSwitcher, type ViewType } from "@/components/views/view-switcher";
import { CalendarView } from "@/components/views/calendar-view";
import { KanbanView } from "@/components/views/kanban-view";

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

/**
 * Check if DocType has date fields (for calendar view availability)
 */
function hasDateFields(fields: DocTypeField[]): boolean {
  return fields.some(
    (field) => field.fieldtype === "Date" || field.fieldtype === "Datetime"
  );
}

/**
 * Find Select fields that can be used for Kanban grouping
 * Returns the first suitable Select field (typically "status")
 */
function findKanbanField(fields: DocTypeField[]): DocTypeField | null {
  // Priority: look for common status-like fields first
  const priorityNames = ["status", "workflow_state", "state", "stage", "priority"];

  for (const name of priorityNames) {
    const field = fields.find(
      (f) => f.fieldtype === "Select" && f.fieldname.toLowerCase() === name && f.options
    );
    if (field) return field;
  }

  // Fallback: any Select field with options
  return fields.find(
    (f) => f.fieldtype === "Select" && f.options && !f.hidden
  ) || null;
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

  // View state
  const [currentView, setCurrentView] = useState<ViewType>("list");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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

  // Find kanban field for Kanban view
  const kanbanField = useMemo(() => {
    if (!meta?.fields) return null;
    return findKanbanField(meta.fields);
  }, [meta?.fields]);

  // Determine available views based on DocType fields
  const availableViews = useMemo<ViewType[]>(() => {
    const views: ViewType[] = ["list"];
    // Add Kanban if there's a suitable Select field
    if (kanbanField) {
      views.push("kanban");
    }
    // Add Calendar if there are date fields
    if (meta?.fields && hasDateFields(meta.fields)) {
      views.push("calendar");
    }
    return views;
  }, [meta?.fields, kanbanField]);

  // Determine fields to fetch - always include name and title_field
  const fieldsToFetch = useMemo(() => {
    const fields = new Set<string>(["name", "modified", "creation"]);

    // Add title field
    if (titleField && titleField !== "name") {
      fields.add(titleField);
    }

    // Add list view fields
    listViewFields.forEach((field) => {
      fields.add(field.fieldname);
    });

    return Array.from(fields);
  }, [listViewFields, titleField]);

  // Build filters for API - combines search and filter conditions
  const apiFilters = useMemo(() => {
    const allFilters: [string, string, unknown][] = [];

    // Add search filter
    if (debouncedSearch && meta) {
      const searchField = titleField || "name";
      allFilters.push([searchField, "like", "%" + debouncedSearch + "%"]);
    }

    // Add filter conditions
    const validFilters = getValidFilters(filterConditions);
    if (validFilters.length > 0) {
      const frappeFilters = filtersToFrappe(validFilters);
      allFilters.push(...frappeFilters);
    }

    return allFilters.length > 0 ? allFilters : undefined;
  }, [debouncedSearch, meta, titleField, filterConditions]);

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

  // Fetch document list (only when list view is active)
  // Using type assertion to handle dynamic field names
  const {
    data: documents,
    error: listError,
    isLoading: listLoading,
    isValidating,
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
    currentView === "list" && meta ? "doclist_" + doctypeName + "_" + pagination.pageIndex + "_" + pagination.pageSize + "_" + orderBy.field + "_" + orderBy.order + "_" + debouncedSearch + "_" + JSON.stringify(getValidFilters(filterConditions)) : null
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
    currentView === "list" && meta ? "doccount_" + doctypeName + "_" + debouncedSearch + "_" + JSON.stringify(getValidFilters(filterConditions)) : null
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

  // ============================================================================
  // Table Columns
  // ============================================================================

  // Define document type for table
  type DocRecord = Record<string, unknown>;

  const columns = useMemo<ColumnDef<DocRecord, unknown>[]>(() => {
    // Start with checkbox column for selection
    const cols: ColumnDef<DocRecord, unknown>[] = [
      {
        id: "select",
        header: () => (
          <HeaderCheckbox
            isAllSelected={isAllPageSelected}
            isPartiallySelected={isPartiallySelected}
            onToggleSelectAll={() => toggleSelectAll(currentPageIds)}
            disabled={listLoading || currentPageIds.length === 0}
          />
        ),
        cell: ({ row }) => {
          const rowId = row.original.name as string;
          return (
            <RowCheckbox
              rowId={rowId}
              isSelected={isSelected(rowId)}
              onSelectionChange={(id, event) => handleRangeSelection(id, currentPageIds, event)}
              disabled={listLoading}
            />
          );
        },
        enableSorting: false,
        size: 40,
      },
      // Name/title column
      {
        accessorKey: titleField || "name",
        header: titleField
          ? listViewFields.find((f) => f.fieldname === titleField)?.label ||
            "Name"
          : "Name",
        cell: ({ getValue }) => {
          const value = getValue();
          return (
            <span className="font-medium text-primary">
              {value ? String(value) : "-"}
            </span>
          );
        },
        enableSorting: true,
      },
    ];

    // Add list view fields (excluding title field if already added)
    listViewFields.forEach((field) => {
      if (field.fieldname === titleField || field.fieldname === "name") {
        return;
      }

      cols.push({
        accessorKey: field.fieldname,
        header: field.label,
        cell: ({ getValue }) => {
          const value = getValue();
          const formattedValue = formatCellValue(value, field);

          // Special rendering for certain field types
          if (field.fieldtype === "Check") {
            return (
              <span
                className={value ? "text-green-600" : "text-muted-foreground"}
              >
                {formattedValue}
              </span>
            );
          }

          if (field.fieldtype === "Link") {
            return (
              <span className="text-blue-600 hover:underline">
                {formattedValue || "-"}
              </span>
            );
          }

          return formattedValue || "-";
        },
        enableSorting: true,
      });
    });

    // Add modified column if not already present
    if (!listViewFields.some((f) => f.fieldname === "modified")) {
      cols.push({
        accessorKey: "modified",
        header: "Modified",
        cell: ({ getValue }) => {
          const value = getValue();
          if (!value) return "-";
          try {
            return new Date(String(value)).toLocaleDateString();
          } catch {
            return String(value);
          }
        },
        enableSorting: true,
      });
    }

    return cols;
  }, [listViewFields, titleField, isAllPageSelected, isPartiallySelected, toggleSelectAll, currentPageIds, isSelected, handleRangeSelection, listLoading]);

  // ============================================================================
  // Handlers
  // ============================================================================

  // Handle view change
  const handleViewChange = useCallback((view: ViewType) => {
    setCurrentView(view);
    // Clear selection when switching views
    if (hasSelection) {
      clearSelection();
    }
  }, [hasSelection, clearSelection]);

  // Handle search with debounce
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);

      // Reset pagination when searching
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));

      // Debounce the actual search
      const timeoutId = setTimeout(() => {
        setDebouncedSearch(value);
      }, 300);

      return () => clearTimeout(timeoutId);
    },
    []
  );

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
    if (!documents || selectedIds.size === 0) return;

    const selectedDocs = (documents as Record<string, unknown>[]).filter((doc) =>
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
  }, [documents, selectedIds, listViewFields, doctypeName, showSuccess, showInfo]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{doctypeName}</h1>
          <p className="text-muted-foreground">
            Manage {doctypeName.toLowerCase()} records
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Switcher */}
          <ViewSwitcher
            currentView={currentView}
            onViewChange={handleViewChange}
            availableViews={availableViews}
          />
          <Button onClick={handleNewDocument}>
            <Plus className="mr-2 h-4 w-4" />
            New {doctypeName}
          </Button>
        </div>
      </div>

      {/* List View */}
      {currentView === "list" && (
        <>
          {/* Search, Filters, and Actions Bar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={"Search " + doctypeName.toLowerCase() + "..."}
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>
            <FilterBuilder
              fields={visibleFields}
              filters={filterConditions}
              onFiltersChange={(newFilters) => {
                setFilterConditions(newFilters);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetchList()}
              disabled={isValidating}
              aria-label="Refresh list"
            >
              <RefreshCw
                className={"h-4 w-4 " + (isValidating ? "animate-spin" : "")}
              />
            </Button>
          </div>

          {/* Active Filters */}
          {getValidFilters(filterConditions).length > 0 && (
            <ActiveFilters
              filters={filterConditions}
              fields={visibleFields}
              onRemove={(id) =>
                setFilterConditions((prev) => prev.filter((f) => f.id !== id))
              }
              onClearAll={() => setFilterConditions([])}
            />
          )}

          {/* Selection Info */}
          {hasSelection && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">
                  Error loading documents: {listError.message}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={(documents as Record<string, unknown>[]) ?? []}
            isLoading={listLoading}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            onRowClick={handleRowClick}
            emptyMessage={
              debouncedSearch
                ? "No " + doctypeName.toLowerCase() + " found matching \"" + debouncedSearch + "\""
                : "No " + doctypeName.toLowerCase() + " found. Click \"New " + doctypeName + "\" to create one."
            }
            showPageSizeSelector={true}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />

          {/* Total Count Info */}
          {!listLoading && totalCount > 0 && (
            <p className="text-sm text-muted-foreground text-center">
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
        </>
      )}

      {/* Calendar View */}
      {/* Kanban View */}
      {currentView === "kanban" && kanbanField && (
        <KanbanView
          doctype={doctypeName}
          columnField={kanbanField.fieldname}
        />
      )}

      {/* Calendar View */}
      {currentView === "calendar" && (
        <CalendarView
          doctype={doctypeName}
          doctypeSlug={doctypeSlug}
        />
      )}
    </div>
  );
}
