/**
 * Rename View Dialog
 *
 * Dialog for renaming an existing saved view.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";

// ============================================================================
// Types
// ============================================================================

interface RenameViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  onConfirm: (newName: string) => Promise<void>;
}

// ============================================================================
// Component
// ============================================================================

export function RenameViewDialog({
  open,
  onOpenChange,
  currentName,
  onConfirm,
}: RenameViewDialogProps) {
  const [name, setName] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update name when dialog opens with new currentName
  useEffect(() => {
    if (open) {
      setName(currentName);
      setError(null);
    }
  }, [open, currentName]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedName = name.trim();
      if (!trimmedName) {
        setError("View name is required");
        return;
      }

      if (trimmedName === currentName) {
        onOpenChange(false);
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        await onConfirm(trimmedName);
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to rename view");
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, currentName, onConfirm, onOpenChange]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setName(currentName);
        setError(null);
      }
      onOpenChange(open);
    },
    [currentName, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename view</DialogTitle>
            <DialogDescription>
              Enter a new name for this view.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="view-name">View name</Label>
              <Input
                id="view-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                onFocus={(e) => e.target.select()}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default RenameViewDialog;
