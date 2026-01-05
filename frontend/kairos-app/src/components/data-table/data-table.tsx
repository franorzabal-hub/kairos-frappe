/**
 * Data Table Component
 *
 * Reusable table component for displaying DocType lists
 * Uses @tanstack/react-table for functionality with shadcn UI components
 */

"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  PaginationState,
  ColumnResizeMode,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface DataTableProps<TData, TValue> {
  /** Column definitions for the table */
  columns: ColumnDef<TData, TValue>[];
  /** Data to display in the table */
  data: TData[];
  /** Whether the data is currently loading */
  isLoading?: boolean;
  /** Total number of pages (for server-side pagination) */
  pageCount?: number;
  /** Current pagination state (controlled) */
  pagination?: PaginationState;
  /** Callback when pagination changes */
  onPaginationChange?: (pagination: PaginationState) => void;
  /** Current sorting state (controlled) */
  sorting?: SortingState;
  /** Callback when sorting changes */
  onSortingChange?: (sorting: SortingState) => void;
  /** Callback when a row is clicked */
  onRowClick?: (row: TData) => void;
  /** Message to display when there's no data */
  emptyMessage?: string;
  /** Whether to show page size selector */
  showPageSizeSelector?: boolean;
  /** Available page sizes */
  pageSizeOptions?: number[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  pageCount,
  pagination,
  onPaginationChange,
  sorting: controlledSorting,
  onSortingChange,
  onRowClick,
  emptyMessage = "No results found.",
  showPageSizeSelector = true,
  pageSizeOptions = [10, 20, 30, 50, 100],
}: DataTableProps<TData, TValue>) {
  // Internal sorting state (when uncontrolled)
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([]);

  // Internal pagination state (when uncontrolled)
  const [internalPagination, setInternalPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Use controlled or internal state
  const sorting = controlledSorting ?? internalSorting;
  const currentPagination = pagination ?? internalPagination;

  // Handle sorting change
  const handleSortingChange = React.useCallback(
    (updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => {
      const newSorting = typeof updaterOrValue === "function"
        ? updaterOrValue(sorting)
        : updaterOrValue;

      if (onSortingChange) {
        onSortingChange(newSorting);
      } else {
        setInternalSorting(newSorting);
      }
    },
    [sorting, onSortingChange]
  );

  // Handle pagination change
  const handlePaginationChange = React.useCallback(
    (updaterOrValue: PaginationState | ((old: PaginationState) => PaginationState)) => {
      const newPagination = typeof updaterOrValue === "function"
        ? updaterOrValue(currentPagination)
        : updaterOrValue;

      if (onPaginationChange) {
        onPaginationChange(newPagination);
      } else {
        setInternalPagination(newPagination);
      }
    },
    [currentPagination, onPaginationChange]
  );

  // Determine if pagination is server-side
  const isServerSide = pageCount !== undefined && onPaginationChange !== undefined;

  const [columnResizeMode] = React.useState<ColumnResizeMode>("onChange");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: isServerSide ? undefined : getPaginationRowModel(),
    manualPagination: isServerSide,
    manualSorting: !!onSortingChange,
    pageCount: pageCount ?? -1,
    columnResizeMode,
    enableColumnResizing: true,
    state: {
      sorting,
      pagination: currentPagination,
    },
    onSortingChange: handleSortingChange,
    onPaginationChange: handlePaginationChange,
  });

  // Calculate displayed row range
  const startRow = currentPagination.pageIndex * currentPagination.pageSize + 1;
  const endRow = Math.min(
    (currentPagination.pageIndex + 1) * currentPagination.pageSize,
    isServerSide ? (pageCount ?? 0) * currentPagination.pageSize : data.length
  );
  const totalRows = isServerSide ? (pageCount ?? 0) * currentPagination.pageSize : data.length;

  return (
    <div className="space-y-4">
      <div className="border-b overflow-x-auto">
        <Table style={{ minWidth: "100%", width: Math.max(table.getCenterTotalSize(), 0) || "100%" }} className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();

                  const canResize = header.column.getCanResize();

                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        width: header.getSize(),
                        position: header.index === 0 ? "sticky" : "relative",
                        left: header.index === 0 ? 0 : undefined,
                        zIndex: header.index === 0 ? 10 : undefined,
                      }}
                      className={cn(
                        canSort && "cursor-pointer select-none hover:bg-muted/50",
                        header.index === 0 && "border-r-0 bg-background !px-3 !w-[40px]",
                        header.index === headerGroup.headers.length - 1 && "pr-4"
                      )}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-2">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {canSort && (
                            <span className="ml-auto">
                              {sortDirection === "asc" ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : sortDirection === "desc" ? (
                                <ArrowDown className="h-4 w-4" />
                              ) : (
                                <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                      {/* Resize handle */}
                      {canResize && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-primary/50",
                            header.column.getIsResizing() && "bg-primary"
                          )}
                        />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: currentPagination.pageSize }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {columns.map((_, cellIndex) => (
                    <TableCell
                      key={`skeleton-cell-${cellIndex}`}
                      style={{
                        position: cellIndex === 0 ? "sticky" : undefined,
                        left: cellIndex === 0 ? 0 : undefined,
                        zIndex: cellIndex === 0 ? 10 : undefined,
                      }}
                      className={cn(
                        cellIndex === 0 && "border-r-0 bg-background !px-3 !w-[40px]",
                        cellIndex === columns.length - 1 && "pr-4"
                      )}
                    >
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              // Data rows
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        width: cell.column.getSize(),
                        position: cellIndex === 0 ? "sticky" : undefined,
                        left: cellIndex === 0 ? 0 : undefined,
                        zIndex: cellIndex === 0 ? 10 : undefined,
                      }}
                      className={cn(
                        cellIndex === 0 && "border-r-0 bg-background !px-3 !w-[40px]",
                        cellIndex === row.getVisibleCells().length - 1 && "pr-4"
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              // Empty state
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground px-4"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {!isLoading && data.length > 0 && (
            <span>
              Showing {startRow} to {endRow} of {totalRows} results
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Page Size Selector */}
          {showPageSizeSelector && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page</span>
              <Select
                value={String(currentPagination.pageSize)}
                onValueChange={(value) => {
                  handlePaginationChange({
                    pageIndex: 0,
                    pageSize: Number(value),
                  });
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={currentPagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map((pageSize) => (
                    <SelectItem key={pageSize} value={String(pageSize)}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Page Info */}
          <div className="flex items-center gap-1 text-sm font-medium">
            Page {currentPagination.pageIndex + 1} of{" "}
            {(pageCount ?? table.getPageCount()) || 1}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => handlePaginationChange({ ...currentPagination, pageIndex: 0 })}
              disabled={!table.getCanPreviousPage()}
              aria-label="Go to first page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Go to previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Go to next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() =>
                handlePaginationChange({
                  ...currentPagination,
                  pageIndex: (pageCount ?? table.getPageCount()) - 1
                })
              }
              disabled={!table.getCanNextPage()}
              aria-label="Go to last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Re-export types for convenience
export type { ColumnDef, SortingState, PaginationState };
