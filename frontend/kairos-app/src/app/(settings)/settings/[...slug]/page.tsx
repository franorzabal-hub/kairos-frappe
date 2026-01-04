/**
 * Settings DocType Page (Catch-all)
 *
 * Handles all settings sub-routes like /settings/User, /settings/Role, etc.
 * Renders DocType list views within the settings layout.
 */

"use client";

import { useState, useMemo, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useFrappeGetDocList, useFrappeDeleteDoc } from "frappe-react-sdk";
import {
  Plus,
  AlertCircle,
  ArrowUpDown,
  Download,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useFrappeDocMeta, getFieldDisplayValue } from "@/hooks/use-frappe-meta";
import { useBulkSelection, usePageSelectionState } from "@/hooks/use-bulk-selection";
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

interface SettingsSubPageProps {
  params: Promise<{
    slug: string[];
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
 * e.g., "User-Permission" -> "User Permission"
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

export default function SettingsSubPage({ params }: SettingsSubPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  // First slug segment is the DocType, rest are for detail views
  const doctypeSlug = slug[0];
  const docId = slug.length > 1 ? slug.slice(1).join("/") : null;
  const doctypeName = slugToDocType(doctypeSlug);

  const { showSuccess, showError, showInfo } = useNotification();

  // ============================================================================
  // State
  // ============================================================================

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

  // Determine fields to fetch
  const fieldsToFetch = useMemo(() => {
    const fields = new Set<string>(["name", "modified", "creation"]);

    if (titleField && titleField !== "name") {
      fields.add(titleField);
    }

    listViewFields.forEach((field) => {
      fields.add(field.fieldname);
    });

    return Array.from(fields);
  }, [listViewFields, titleField]);

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
      orderBy,
      limit_start: pagination.pageIndex * pagination.pageSize,
      limit: pagination.pageSize,
    },
    meta ? "settings_doclist_" + doctypeName + "_" + pagination.pageIndex + "_" + pagination.pageSize + "_" + orderBy.field + "_" + orderBy.order : null
  );

  // Fetch total count for pagination
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: countData } = useFrappeGetDocList<any>(
    doctypeName,
    {
      fields: ["count(name) as count"] as unknown as ["name"],
    },
    meta ? "settings_doccount_" + doctypeName : null
  );

  // Calculate total count and page count
  const totalCount = useMemo(() => {
    if (!countData || countData.length === 0) return 0;
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

  // Frappe mutations
  const { deleteDoc } = useFrappeDeleteDoc();

  // ============================================================================
  // Table Columns
  // ============================================================================

  type DocRecord = Record<string, unknown>;

  const columns = useMemo<ColumnDef<DocRecord, unknown>[]>(() => {
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
      {
        accessorKey: titleField || "name",
        header: titleField
          ? listViewFields.find((f) => f.fieldname === titleField)?.label || "Name"
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

          if (field.fieldtype === "Check") {
            return (
              <span className={value ? "text-green-600" : "text-muted-foreground"}>
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

  // Handle row click - navigate to document detail within settings
  const handleRowClick = useCallback(
    (row: Record<string, unknown>) => {
      const docName = row.name as string;
      router.push("/settings/" + doctypeSlug + "/" + encodeURIComponent(docName));
    },
    [router, doctypeSlug]
  );

  // Handle new document - stay within settings
  const handleNewDocument = useCallback(() => {
    router.push("/settings/" + doctypeSlug + "/new");
  }, [router, doctypeSlug]);

  // Handle sorting change
  const handleSortingChange = useCallback((newSorting: SortingState) => {
    setSorting(newSorting);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  // Handle pagination change
  const handlePaginationChange = useCallback(
    (newPagination: PaginationState) => {
      if (hasSelection && newPagination.pageIndex !== pagination.pageIndex) {
        showInfo("Selection is preserved across pages.");
      }
      setPagination(newPagination);
    },
    [hasSelection, pagination.pageIndex, showInfo]
  );

  // ============================================================================
  // Bulk Operations
  // ============================================================================

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
        showSuccess("Deleted " + successCount + " item" + (successCount !== 1 ? "s" : ""));
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

  const handleBulkExport = useCallback(() => {
    if (!documents || selectedIds.size === 0) return;

    const selectedDocs = (documents as Record<string, unknown>[]).filter((doc) =>
      selectedIds.has(doc.name as string)
    );

    const exportColumns = [
      { key: "name" as keyof typeof selectedDocs[0], header: "Name" },
      ...listViewFields.map((field) => ({
        key: field.fieldname as keyof typeof selectedDocs[0],
        header: field.label,
      })),
    ];

    const timestamp = new Date().toISOString().split("T")[0];
    exportToCSV(selectedDocs, doctypeName.toLowerCase().replace(/ /g, "-") + "-export-" + timestamp, exportColumns);
    showSuccess("Exported " + selectedDocs.length + " item" + (selectedDocs.length !== 1 ? "s" : "") + " to CSV");
  }, [documents, selectedIds, listViewFields, doctypeName, showSuccess]);

  // ============================================================================
  // Loading State
  // ============================================================================

  if (metaLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
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
            onClick={() => router.push("/settings")}
          >
            Back to Settings
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // Detail View (if docId is provided)
  // ============================================================================

  if (docId) {
    // For now, show a placeholder for detail views
    // TODO: Implement detail view component
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{decodeURIComponent(docId)}</h1>
            <p className="text-muted-foreground">{doctypeName}</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/settings/" + doctypeSlug)}>
            Back to List
          </Button>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Detail view coming soon. For now, use Frappe Desk to edit this document.
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // Main Render - List View
  // ============================================================================

  const currentSortField = sorting.length > 0 ? sorting[0] : null;
  const currentSortFieldLabel = currentSortField
    ? (listViewFields.find((f) => f.fieldname === currentSortField.id)?.label ||
       (currentSortField.id === "modified" ? "Modified" : currentSortField.id))
    : "Modified";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{doctypeName}</h1>
          <p className="text-muted-foreground">
            {totalCount.toLocaleString()} record{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={handleNewDocument}>
          <Plus className="mr-2 h-4 w-4" />
          New {doctypeName}
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        {/* Sort dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <ArrowUpDown className="h-4 w-4" />
              Sort: {currentSortFieldLabel}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {listViewFields.map((field) => (
              <DropdownMenuItem
                key={field.fieldname}
                onClick={() => {
                  setSorting([{ id: field.fieldname, desc: true }]);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
              >
                {field.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              onClick={() => {
                setSorting([{ id: "modified", desc: true }]);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
            >
              Modified
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort order */}
        <Select
          value={currentSortField?.desc ? "desc" : "asc"}
          onValueChange={(value) => {
            const fieldId = currentSortField?.id || "modified";
            setSorting([{ id: fieldId, desc: value === "desc" }]);
          }}
        >
          <SelectTrigger className="w-32 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Descending</SelectItem>
            <SelectItem value="asc">Ascending</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        {/* Export */}
        <Button variant="outline" size="sm" onClick={handleBulkExport} disabled={selectedIds.size === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

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
        emptyMessage={"No " + doctypeName.toLowerCase() + " found."}
        showPageSizeSelector={true}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
      />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedCount}
        hasSelection={hasSelection}
        onClearSelection={clearSelection}
        onBulkDelete={handleBulkDelete}
        onBulkExport={handleBulkExport}
        updateableFields={visibleFields}
        doctypeName={doctypeName}
        isLoading={isBulkOperating}
      />
    </div>
  );
}
