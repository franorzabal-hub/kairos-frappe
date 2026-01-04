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
 */

"use client";

import { useState, useMemo, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { Plus, Search, RefreshCw, AlertCircle } from "lucide-react";

import { useFrappeDocMeta, getFieldDisplayValue } from "@/hooks/use-frappe-meta";
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
 * Convert Frappe DocType name to URL slug
 * e.g., "Sales Invoice" -> "sales-invoice"
 */
function docTypeToSlug(doctype: string): string {
  return doctype.toLowerCase().replace(/\s+/g, "-");
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

  // ============================================================================
  // State
  // ============================================================================

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>([
    { id: "modified", desc: true },
  ]);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  // Fetch DocType metadata
  const {
    meta,
    isLoading: metaLoading,
    error: metaError,
    listViewFields,
    titleField,
  } = useFrappeDocMeta({ doctype: doctypeName });

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

  // Build filters for search - use title field for simple search
  const filters = useMemo(() => {
    if (!debouncedSearch || !meta) return undefined;

    // Search by title field (frappe-react-sdk doesn't support OR filters well)
    const searchField = titleField || "name";
    return [[searchField, "like", `%${debouncedSearch}%`]] as [string, string, string][];
  }, [debouncedSearch, meta, titleField]);

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
    isValidating,
    mutate: refetchList,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useFrappeGetDocList<any>(
    doctypeName,
    {
      fields: fieldsToFetch as ["name"],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filters: filters as any,
      orderBy,
      limit_start: pagination.pageIndex * pagination.pageSize,
      limit: pagination.pageSize,
    },
    meta ? `doclist_${doctypeName}_${pagination.pageIndex}_${pagination.pageSize}_${orderBy.field}_${orderBy.order}_${debouncedSearch}` : null
  );

  // Fetch total count for pagination
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: countData } = useFrappeGetDocList<any>(
    doctypeName,
    {
      fields: ["count(name) as count"] as unknown as ["name"],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filters: filters as any,
    },
    meta ? `doccount_${doctypeName}_${debouncedSearch}` : null
  );

  // Calculate total count and page count
  const totalCount = useMemo(() => {
    if (!countData || countData.length === 0) return 0;
    // The count query returns an object with count property
    const firstResult = countData[0] as unknown as { count: number };
    return firstResult?.count ?? 0;
  }, [countData]);

  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  // ============================================================================
  // Table Columns
  // ============================================================================

  // Define document type for table
  type DocRecord = Record<string, unknown>;

  const columns = useMemo<ColumnDef<DocRecord, unknown>[]>(() => {
    // Always start with name/title column
    const cols: ColumnDef<DocRecord, unknown>[] = [
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
  }, [listViewFields, titleField]);

  // ============================================================================
  // Handlers
  // ============================================================================

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

  // Handle row click - navigate to document detail
  const handleRowClick = useCallback(
    (row: Record<string, unknown>) => {
      const docName = row.name as string;
      router.push(`/${doctypeSlug}/${encodeURIComponent(docName)}`);
    },
    [router, doctypeSlug]
  );

  // Handle new document
  const handleNewDocument = useCallback(() => {
    router.push(`/${doctypeSlug}/new`);
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
      setPagination(newPagination);
    },
    []
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
          <Skeleton className="h-9 w-32" />
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
        <Button onClick={handleNewDocument}>
          <Plus className="mr-2 h-4 w-4" />
          New {doctypeName}
        </Button>
      </div>

      {/* Search and Actions Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`Search ${doctypeName.toLowerCase()}...`}
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetchList()}
          disabled={isValidating}
          aria-label="Refresh list"
        >
          <RefreshCw
            className={`h-4 w-4 ${isValidating ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

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
            ? `No ${doctypeName.toLowerCase()} found matching "${debouncedSearch}"`
            : `No ${doctypeName.toLowerCase()} found. Click "New ${doctypeName}" to create one.`
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
    </div>
  );
}
