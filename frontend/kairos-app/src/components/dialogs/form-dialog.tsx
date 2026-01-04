/**
 * Form Dialog Component
 *
 * A dialog that renders a DynamicForm inside for creating/editing documents.
 * Supports "Quick Entry" mode with minimal required fields.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { FieldValues } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DynamicForm } from "@/components/forms/dynamic-form";
import { useFrappeDocMeta } from "@/hooks/use-frappe-meta";
import { DocTypeMeta, DocTypeField } from "@/types/frappe";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface FormDialogProps<T extends FieldValues = FieldValues> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctype: string;
  title?: string;
  description?: string;
  initialData?: Partial<T>;
  quickEntry?: boolean;
  onSubmit: (data: T) => void | Promise<T | void>;
  onCancel?: () => void;
  /** Child DocType metadata map for Table fields */
  childDocMetas?: Record<string, DocTypeMeta>;
  submitLabel?: string;
  cancelLabel?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeClasses: Record<string, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  full: "sm:max-w-4xl",
};

/**
 * Filter fields for quick entry mode
 * Returns only required fields and commonly used fields
 */
function filterQuickEntryFields(fields: DocTypeField[]): DocTypeField[] {
  const layoutTypes = ["Section Break", "Column Break", "Tab Break"];
  
  return fields.filter((field) => {
    // Always include layout fields to maintain structure
    if (layoutTypes.includes(field.fieldtype)) {
      return true;
    }
    // Include required fields
    if (field.reqd === 1) {
      return true;
    }
    // Include fields marked for quick entry (in_list_view often indicates important fields)
    if (field.in_list_view === 1) {
      return true;
    }
    return false;
  });
}

export function FormDialog<T extends FieldValues = FieldValues>({
  open,
  onOpenChange,
  doctype,
  title,
  description,
  initialData,
  quickEntry = false,
  onSubmit,
  onCancel,
  childDocMetas = {},
  submitLabel = "Save",
  cancelLabel = "Cancel",
  size = "lg",
}: FormDialogProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formId = `form-dialog-${doctype}`;

  const { meta, isLoading, error } = useFrappeDocMeta({
    doctype,
    enabled: open,
  });

  // Create a modified meta for quick entry mode
  const effectiveMeta: DocTypeMeta | null = meta
    ? quickEntry
      ? {
          ...meta,
          fields: filterQuickEntryFields(meta.fields),
        }
      : meta
    : null;

  const handleSubmit = useCallback(
    async (data: T): Promise<void> => {
      setIsSubmitting(true);
      try {
        await onSubmit(data);
        onOpenChange(false);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, onOpenChange]
  );

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const dialogTitle = title || (initialData ? `Edit ${doctype}` : `New ${doctype}`);
  const dialogDescription =
    description ||
    (quickEntry
      ? `Quick entry for ${doctype}. Fill in the required fields.`
      : undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("flex flex-col max-h-[90vh]", sizeClasses[size])}
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          {dialogDescription && (
            <DialogDescription>{dialogDescription}</DialogDescription>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading form...</span>
            </div>
          )}

          {error && (
            <div className="py-4 text-center text-destructive">
              <p>Failed to load form metadata</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error.message}
              </p>
            </div>
          )}

          {effectiveMeta && !isLoading && (
            <div className="py-4">
              <DynamicForm<T>
                docMeta={effectiveMeta}
                initialData={initialData}
                onSubmit={handleSubmit}
                isLoading={isSubmitting}
                formId={formId}
                childDocMetas={childDocMetas}
              />
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={isSubmitting || isLoading || !!error}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
