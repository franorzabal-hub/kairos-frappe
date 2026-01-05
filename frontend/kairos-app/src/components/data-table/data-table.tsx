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
  ArrowUp,
  ArrowDown,
  MoveRight,
  MoveLeft,
  Pencil,
  EyeOff,
  Check,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  /** Callback when column visibility changes */
  onColumnVisibilityChange?: (columnId: string, visible: boolean) => void;
  /** Callback when column order changes */
  onColumnOrderChange?: (columnId: string, direction: "left" | "right") => void;
  /** Callback when column label is edited */
  onColumnLabelEdit?: (columnId: string) => void;
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
  onColumnVisibilityChange,
  onColumnOrderChange,
  onColumnLabelEdit,
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
                {headerGroup.headers.map((header, headerIndex) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();
                  const canResize = header.column.getCanResize();
                  const isFirstColumn = header.index === 0;
                  const isLastColumn = header.index === headerGroup.headers.length - 1;
                  const columnId = header.column.id;

                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        width: header.getSize(),
                        position: isFirstColumn ? "sticky" : "relative",
                        left: isFirstColumn ? 0 : undefined,
                        zIndex: isFirstColumn ? 10 : undefined,
                      }}
                      className={cn(
                        isFirstColumn && "bg-background",
                        isLastColumn && "pr-4"
                      )}
                    >
                      {header.isPlaceholder ? null : isFirstColumn ? (
                        // First column (with checkbox) - no dropdown, just render content
                        <div className="flex items-center gap-2">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </div>
                      ) : (
                        // Other columns - show dropdown menu
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={cn(
                                "flex items-center gap-2 w-full text-left hover:bg-muted/50 -mx-2 px-2 py-1 rounded-sm",
                                canSort && "cursor-pointer"
                              )}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            {canSort && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => header.column.toggleSorting(false)}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <ArrowUp className="h-4 w-4" />
                                    <span>Sort ascending</span>
                                  </div>
                                  {sortDirection === "asc" && (
                                    <Check className="h-4 w-4 text-primary" />
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => header.column.toggleSorting(true)}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <ArrowDown className="h-4 w-4" />
                                    <span>Sort descending</span>
                                  </div>
                                  {sortDirection === "desc" && (
                                    <Check className="h-4 w-4 text-primary" />
                                  )}
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => onColumnOrderChange?.(columnId, "left")}
                              disabled={headerIndex === 1}
                            >
                              <MoveLeft className="h-4 w-4 mr-2" />
                              <span>Move left</span>
                            </DropdownMenuItem>
                            {!isLastColumn && (
                              <DropdownMenuItem
                                onClick={() => onColumnOrderChange?.(columnId, "right")}
                              >
                                <MoveRight className="h-4 w-4 mr-2" />
                                <span>Move right</span>
                              </DropdownMenuItem>
                            )}
                            {(canSort || onColumnLabelEdit || onColumnVisibilityChange) && <DropdownMenuSeparator />}
                            {onColumnLabelEdit && (
                              <DropdownMenuItem
                                onClick={() => onColumnLabelEdit?.(columnId)}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                <span>Edit column label</span>
                              </DropdownMenuItem>
                            )}
                            {onColumnVisibilityChange && (
                              <DropdownMenuItem
                                onClick={() => onColumnVisibilityChange?.(columnId, false)}
                              >
                                <EyeOff className="h-4 w-4 mr-2" />
                                <span>Hide from view</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                        cellIndex === 0 && "bg-background",
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
                        cellIndex === 0 && "bg-background",
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
