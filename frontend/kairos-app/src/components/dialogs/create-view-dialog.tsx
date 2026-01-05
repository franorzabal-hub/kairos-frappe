/**
 * Create View Dialog
 *
 * Dialog for creating a new saved view.
 * Features:
 * - View type selector (Table/Kanban)
 * - Status attribute selector for Kanban views
 * - Title input
 * - Set as default option
 */

"use client";

import { useState, useCallback } from "react";
import { Loader2, LayoutGrid, Columns3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ViewType } from "@/hooks/use-saved-views";
import { DocTypeField } from "@/types/frappe";

// ============================================================================
// Types
// ============================================================================

interface CreateViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctype: string;
  doctypeLabel: string;
  /** Fields that can be used for Kanban grouping (Select/Link fields) */
  selectFields: DocTypeField[];
  onConfirm: (
    title: string,
    viewType: ViewType,
    kanbanField?: string
  ) => Promise<void>;
}

// ============================================================================
// Component
// ============================================================================

export function CreateViewDialog({
  open,
  onOpenChange,
  doctype,
  doctypeLabel,
  selectFields,
  onConfirm,
}: CreateViewDialogProps) {
  const [title, setTitle] = useState("");
  const [viewType, setViewType] = useState<ViewType>("Table");
  const [kanbanField, setKanbanField] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        setError("View name is required");
        return;
      }

      if (viewType === "Kanban" && !kanbanField) {
        setError("Please select a status attribute for Kanban view");
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        await onConfirm(
          trimmedTitle,
          viewType,
          viewType === "Kanban" ? kanbanField : undefined
        );
        // Reset form
        setTitle("");
        setViewType("Table");
        setKanbanField("");
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create view");
      } finally {
        setIsSubmitting(false);
      }
    },
    [title, viewType, kanbanField, onConfirm, onOpenChange]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setTitle("");
        setViewType("Table");
        setKanbanField("");
        setError(null);
      }
      onOpenChange(open);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create view</DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            {/* View Type Selector */}
            <div className="grid gap-2">
              <Label className="text-muted-foreground text-xs font-medium">View type</Label>
              <div className="grid grid-cols-2 gap-3">
                {/* Table Option */}
                <button
                  type="button"
                  onClick={() => setViewType("Table")}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
                    viewType === "Table"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-md",
                    viewType === "Table" ? "bg-primary/10" : "bg-muted"
                  )}>
                    <LayoutGrid className={cn(
                      "h-5 w-5",
                      viewType === "Table" ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <p className="font-medium">Table</p>
                    <p className="text-xs text-muted-foreground">
                      Organize your records on a table
                    </p>
                  </div>
                </button>

                {/* Kanban Option */}
                <button
                  type="button"
                  onClick={() => setViewType("Kanban")}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
                    viewType === "Kanban"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-md",
                    viewType === "Kanban" ? "bg-primary/10" : "bg-muted"
                  )}>
                    <Columns3 className={cn(
                      "h-5 w-5",
                      viewType === "Kanban" ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <p className="font-medium">Kanban</p>
                    <p className="text-xs text-muted-foreground">
                      Organize your records on a pipeline
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Title Input */}
            <div className="grid gap-2">
              <Label htmlFor="view-title" className="text-muted-foreground text-xs font-medium">
                Title
              </Label>
              <Input
                id="view-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for this view"
                className="h-10"
              />
            </div>

            {/* Status Attribute (only for Kanban) */}
            {viewType === "Kanban" && (
              <div className="grid gap-2">
                <Label className="text-muted-foreground text-xs font-medium">
                  Status attribute
                </Label>
                <Select value={kanbanField} onValueChange={setKanbanField}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select a status attribute" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectFields.length === 0 ? (
                      <div className="py-2 px-3 text-sm text-muted-foreground">
                        No Select or Link fields available
                      </div>
                    ) : (
                      selectFields.map((field) => (
                        <SelectItem key={field.fieldname} value={field.fieldname}>
                          {field.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
              <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ESC
              </kbd>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || (viewType === "Kanban" && !kanbanField)}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create view
              <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-primary-foreground/20 px-1.5 font-mono text-[10px] font-medium">
                ↵
              </kbd>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateViewDialog;
