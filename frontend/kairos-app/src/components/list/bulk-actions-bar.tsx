/**
 * Bulk Actions Bar Component
 *
 * Floating action bar that appears when items are selected in a list view.
 * Provides bulk operations:
 * - Delete selected items
 * - Export selected to CSV
 * - Update field value for all selected
 */

"use client";

import * as React from "react";
import { X, Trash2, Download, Edit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DocTypeField } from "@/types/frappe";

// ============================================================================
// Types
// ============================================================================

export interface BulkActionsBarProps {
  /** Number of selected items */
  selectedCount: number;
  /** Whether any items are selected */
  hasSelection: boolean;
  /** Callback to clear selection */
  onClearSelection: () => void;
  /** Callback for bulk delete */
  onBulkDelete: () => Promise<void>;
  /** Callback for bulk export */
  onBulkExport: () => void;
  /** Callback for bulk field update */
  onBulkUpdate?: (fieldName: string, value: unknown) => Promise<void>;
  /** Available fields for bulk update */
  updateableFields?: DocTypeField[];
  /** DocType name for display */
  doctypeName: string;
  /** Whether bulk operations are in progress */
  isLoading?: boolean;
  /** Additional class names */
  className?: string;
}

interface UpdateFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: DocTypeField[];
  onUpdate: (fieldName: string, value: unknown) => Promise<void>;
  isLoading: boolean;
  selectedCount: number;
}

// ============================================================================
// Update Field Dialog
// ============================================================================

function UpdateFieldDialog({
  open,
  onOpenChange,
  fields,
  onUpdate,
  isLoading,
  selectedCount,
}: UpdateFieldDialogProps) {
  const [selectedField, setSelectedField] = React.useState<string>("");
  const [fieldValue, setFieldValue] = React.useState<string>("");

  // Get the selected field definition
  const fieldDef = React.useMemo(
    () => fields.find((f) => f.fieldname === selectedField),
    [fields, selectedField]
  );

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSelectedField("");
      setFieldValue("");
    }
  }, [open]);

  const handleSubmit = React.useCallback(async () => {
    if (!selectedField || !fieldDef) return;

    // Convert value based on field type
    let convertedValue: unknown = fieldValue;
    if (fieldDef.fieldtype === "Int") {
      convertedValue = parseInt(fieldValue, 10) || 0;
    } else if (fieldDef.fieldtype === "Float" || fieldDef.fieldtype === "Currency") {
      convertedValue = parseFloat(fieldValue) || 0;
    } else if (fieldDef.fieldtype === "Check") {
      convertedValue = fieldValue === "1" || fieldValue === "true" ? 1 : 0;
    }

    await onUpdate(selectedField, convertedValue);
    onOpenChange(false);
  }, [selectedField, fieldValue, fieldDef, onUpdate, onOpenChange]);

  // Render input based on field type
  const renderValueInput = () => {
    if (!fieldDef) {
      return (
        <Input
          id="field-value"
          placeholder="Select a field first"
          disabled
        />
      );
    }

    switch (fieldDef.fieldtype) {
      case "Select":
        const options = (fieldDef.options || "").split("\n").filter(Boolean);
        return (
          <Select value={fieldValue} onValueChange={setFieldValue}>
            <SelectTrigger id="field-value">
              <SelectValue placeholder="Select a value" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "Check":
        return (
          <Select value={fieldValue} onValueChange={setFieldValue}>
            <SelectTrigger id="field-value">
              <SelectValue placeholder="Select a value" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Yes</SelectItem>
              <SelectItem value="0">No</SelectItem>
            </SelectContent>
          </Select>
        );

      case "Int":
        return (
          <Input
            id="field-value"
            type="number"
            step="1"
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
            placeholder="Enter integer value"
          />
        );

      case "Float":
      case "Currency":
        return (
          <Input
            id="field-value"
            type="number"
            step="0.01"
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
            placeholder="Enter numeric value"
          />
        );

      default:
        return (
          <Input
            id="field-value"
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
            placeholder="Enter value"
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Field Value</DialogTitle>
          <DialogDescription>
            Update a field value for {selectedCount} selected item
            {selectedCount !== 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="field-select">Field</Label>
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger id="field-select">
                <SelectValue placeholder="Select a field to update" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((field) => (
                  <SelectItem key={field.fieldname} value={field.fieldname}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="field-value">New Value</Label>
            {renderValueInput()}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedField || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Bulk Actions Bar
// ============================================================================

export function BulkActionsBar({
  selectedCount,
  hasSelection,
  onClearSelection,
  onBulkDelete,
  onBulkExport,
  onBulkUpdate,
  updateableFields = [],
  doctypeName,
  isLoading = false,
  className,
}: BulkActionsBarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Handle bulk delete with confirmation
  const handleDelete = React.useCallback(async () => {
    setIsDeleting(true);
    try {
      await onBulkDelete();
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }, [onBulkDelete]);

  // Handle bulk update
  const handleUpdate = React.useCallback(
    async (fieldName: string, value: unknown) => {
      if (!onBulkUpdate) return;
      setIsUpdating(true);
      try {
        await onBulkUpdate(fieldName, value);
      } finally {
        setIsUpdating(false);
      }
    },
    [onBulkUpdate]
  );

  // Filter fields that can be bulk updated
  const bulkUpdateableFields = React.useMemo(() => {
    return updateableFields.filter(
      (field) =>
        !field.read_only &&
        !field.hidden &&
        ["Data", "Select", "Check", "Int", "Float", "Currency", "Date", "Link"].includes(
          field.fieldtype
        )
    );
  }, [updateableFields]);

  if (!hasSelection) {
    return null;
  }

  return (
    <>
      {/* Floating Action Bar */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
          "flex items-center gap-3 px-4 py-3 rounded-lg",
          "bg-background border shadow-lg",
          "animate-in slide-in-from-bottom-4 fade-in-0 duration-200",
          className
        )}
      >
        {/* Selection Count */}
        <div className="flex items-center gap-2 pr-3 border-r">
          <span className="text-sm font-medium">
            {selectedCount} selected
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClearSelection}
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkExport}
            disabled={isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

          {/* Update Button */}
          {onBulkUpdate && bulkUpdateableFields.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUpdateDialogOpen(true)}
              disabled={isLoading}
            >
              <Edit className="mr-2 h-4 w-4" />
              Update Field
            </Button>
          )}

          {/* Delete Button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} items?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              {selectedCount} {doctypeName.toLowerCase()}
              {selectedCount !== 1 ? "s" : ""} and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update Field Dialog */}
      {onBulkUpdate && (
        <UpdateFieldDialog
          open={updateDialogOpen}
          onOpenChange={setUpdateDialogOpen}
          fields={bulkUpdateableFields}
          onUpdate={handleUpdate}
          isLoading={isUpdating}
          selectedCount={selectedCount}
        />
      )}
    </>
  );
}

// ============================================================================
// CSV Export Utility
// ============================================================================

/**
 * Export data to CSV and trigger download
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; header: string }[]
): void {
  if (data.length === 0) return;

  // Determine columns from first row if not provided
  const cols =
    columns ||
    Object.keys(data[0]).map((key) => ({
      key: key as keyof T,
      header: key,
    }));

  // Build CSV content
  const headers = cols.map((col) => `"${col.header}"`).join(",");
  const rows = data.map((row) =>
    cols
      .map((col) => {
        const value = row[col.key];
        if (value === null || value === undefined) return '""';
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      })
      .join(",")
  );

  const csvContent = [headers, ...rows].join("\n");

  // Create and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default BulkActionsBar;
