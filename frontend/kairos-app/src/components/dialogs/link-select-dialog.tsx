/**
 * Link Select Dialog Component
 *
 * A dialog that displays a searchable list of documents for Link field selection.
 * Shows more details than the inline dropdown and supports advanced filtering.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFrappeDocMeta } from "@/hooks/use-frappe-meta";
import { useFrappeGetCall } from "frappe-react-sdk";
import { Search, Loader2, Check, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormDialog } from "./form-dialog";

export interface LinkSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctype: string;
  title?: string;
  description?: string;
  /** Current selected value */
  value?: string;
  /** Callback when a document is selected */
  onSelect: (value: string) => void;
  /** Additional filters for the list */
  filters?: Record<string, unknown>;
  /** Allow creating new documents from the dialog */
  allowCreate?: boolean;
  /** Callback when a new document is created */
  onCreate?: (docName: string) => void;
}

interface ListResult {
  name: string;
  [key: string]: unknown;
}

const PAGE_SIZE = 10;

export function LinkSelectDialog({
  open,
  onOpenChange,
  doctype,
  title,
  description,
  value,
  onSelect,
  filters = {},
  allowCreate = true,
  onCreate,
}: LinkSelectDialogProps) {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
      setPage(0); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedValue(value || null);
      setSearchText("");
      setDebouncedSearch("");
      setPage(0);
    }
  }, [open, value]);

  // Fetch DocType metadata for list columns
  const { listViewFields, titleField, isLoading: metaLoading } = useFrappeDocMeta({
    doctype,
    enabled: open,
  });

  // Build fields to fetch - include name, title field, and list view fields
  const fieldsToFetch = ["name"];
  if (titleField && titleField !== "name") {
    fieldsToFetch.push(titleField);
  }
  listViewFields.forEach((f) => {
    if (!fieldsToFetch.includes(f.fieldname)) {
      fieldsToFetch.push(f.fieldname);
    }
  });

  // Build filters for API call
  const apiFilters: [string, string, string][] = [];
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      apiFilters.push([key, "=", String(val)]);
    }
  });

  // Add search filter if searching
  if (debouncedSearch) {
    // Search in title field or name
    const searchField = titleField || "name";
    apiFilters.push([searchField, "like", `%${debouncedSearch}%`]);
  }

  // Fetch documents
  const { data, error, isLoading: dataLoading } = useFrappeGetCall<{
    message: ListResult[];
  }>(
    "frappe.client.get_list",
    {
      doctype,
      fields: JSON.stringify(fieldsToFetch),
      filters: JSON.stringify(apiFilters),
      limit_start: page * PAGE_SIZE,
      limit_page_length: PAGE_SIZE + 1, // Fetch one extra to check if there are more
      order_by: `${titleField || "name"} asc`,
    },
    open ? `link_select_${doctype}_${debouncedSearch}_${page}` : null
  );

  const results = data?.message?.slice(0, PAGE_SIZE) || [];
  const hasMore = (data?.message?.length || 0) > PAGE_SIZE;
  const isLoading = metaLoading || dataLoading;

  // Display columns - limit to 4 for readability
  const displayColumns = listViewFields.slice(0, 4);

  const handleSelect = useCallback(
    (docName: string) => {
      setSelectedValue(docName);
    },
    []
  );

  const handleConfirm = useCallback(() => {
    if (selectedValue) {
      onSelect(selectedValue);
      onOpenChange(false);
    }
  }, [selectedValue, onSelect, onOpenChange]);

  const handleDoubleClick = useCallback(
    (docName: string) => {
      onSelect(docName);
      onOpenChange(false);
    },
    [onSelect, onOpenChange]
  );

  const handleCreate = useCallback(
    async (data: Record<string, unknown>) => {
      // The FormDialog will handle the actual creation
      // We just need to select the created document
      const newName = data.name as string;
      if (newName) {
        onCreate?.(newName);
        onSelect(newName);
        onOpenChange(false);
      }
    },
    [onCreate, onSelect, onOpenChange]
  );

  const dialogTitle = title || `Select ${doctype}`;
  const dialogDescription = description || `Search and select a ${doctype} document`;

  return (
    <>
      <Dialog open={open && !showCreateDialog} onOpenChange={onOpenChange}>
        <DialogContent className="flex flex-col max-h-[85vh] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${doctype}...`}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Results table */}
          <ScrollArea className="flex-1 border rounded-md">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center text-destructive">
                <p>Failed to load documents</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {String(error)}
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {debouncedSearch
                  ? `No results found for "${debouncedSearch}"`
                  : `No ${doctype} documents found`}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Name</TableHead>
                    {displayColumns.map((col) => (
                      <TableHead key={col.fieldname}>{col.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((row) => {
                    const isSelected = selectedValue === row.name;
                    return (
                      <TableRow
                        key={row.name}
                        className={cn(
                          "cursor-pointer",
                          isSelected && "bg-primary/10"
                        )}
                        onClick={() => handleSelect(row.name)}
                        onDoubleClick={() => handleDoubleClick(row.name)}
                      >
                        <TableCell>
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {String(row[titleField] || row.name)}
                        </TableCell>
                        {displayColumns.map((col) => (
                          <TableCell key={col.fieldname}>
                            {formatCellValue(row[col.fieldname], col.fieldtype)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </ScrollArea>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              {results.length > 0 && (
                <span>
                  Showing {page * PAGE_SIZE + 1} -{" "}
                  {page * PAGE_SIZE + results.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>Page {page + 1}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogFooter className="flex-row justify-between sm:justify-between">
            <div>
              {allowCreate && (
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={!selectedValue}>
                Select
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Dialog */}
      {allowCreate && (
        <FormDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          doctype={doctype}
          title={`New ${doctype}`}
          quickEntry={true}
          onSubmit={handleCreate}
          size="lg"
        />
      )}
    </>
  );
}

/**
 * Format cell value for display
 */
function formatCellValue(value: unknown, fieldtype: string): string {
  if (value === null || value === undefined) return "";

  switch (fieldtype) {
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
    default:
      return String(value);
  }
}
