/**
 * AddRelatedPopover Component
 *
 * Popover for adding related records with:
 * - Search input to find existing records
 * - List of available records to link
 * - "Create new" option at the bottom
 */

"use client";

import { useState, useMemo } from "react";
import { useFrappeGetDocList, useFrappeCreateDoc } from "frappe-react-sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { RelatedDocTypeConfig } from "@/lib/doctype-relations";
import { useFrappeDocMeta } from "@/hooks/use-frappe-meta";
import { DynamicForm } from "@/components/forms/dynamic-form";
import { useNotification } from "@/hooks/use-notification";

// ============================================================================
// Types
// ============================================================================

interface AddRelatedPopoverProps {
  /** Related DocType configuration */
  config: RelatedDocTypeConfig;
  /** Current document name (parent) */
  parentDocname: string;
  /** Callback when a record is linked */
  onLinked?: () => void;
  /** Already linked record names to exclude from search */
  excludeNames?: string[];
}

// ============================================================================
// Component
// ============================================================================

export function AddRelatedPopover({
  config,
  parentDocname,
  onLinked,
  excludeNames = [],
}: AddRelatedPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isLinking, setIsLinking] = useState<string | null>(null);
  const { showSuccess, showError } = useNotification();

  // Determine the display field to search/show
  const displayField = config.displayFields?.[0]?.fieldname || "name";

  // Fetch available records - limit to 10 initially, search fetches more
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: availableRecords, isLoading } = useFrappeGetDocList<any>(
    config.doctype,
    {
      fields: ["name", displayField],
      filters: search ? [[displayField, "like", `%${search}%`]] : [],
      orderBy: { field: "modified", order: "desc" },
      limit: 10,
    },
    open ? `search_${config.doctype}_${search}` : null
  );

  // Filter out already linked records
  const filteredRecords = useMemo(() => {
    if (!availableRecords) return [];
    return availableRecords.filter(
      (r: { name: string }) => !excludeNames.includes(r.name)
    );
  }, [availableRecords, excludeNames]);

  // For link tables (like Student Guardian), we need to create a link record
  const { createDoc, loading: createLoading } = useFrappeCreateDoc();

  // Handle selecting an existing record to link
  const handleSelectRecord = async (recordName: string) => {
    setIsLinking(recordName);
    try {
      // Create a link record in the child table
      // The structure depends on the DocType - for now we assume it's a link table
      await createDoc(config.doctype, {
        [config.linkField]: parentDocname,
        // For tables like Student Guardian, we need the other link field too
        // This is a simplified version - might need adjustment per DocType
      });
      showSuccess(`${config.label.replace(/s$/, "")} linked successfully`);
      onLinked?.();
      setOpen(false);
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Failed to link record"
      );
    } finally {
      setIsLinking(null);
    }
  };

  // Handle creating a new record
  const handleCreateNew = () => {
    setOpen(false);
    setCreateModalOpen(true);
  };

  const singularLabel = config.label.replace(/ies$/, "y").replace(/s$/, "");

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add {singularLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          {/* Search input */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${config.label.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
          </div>

          {/* Results list */}
          <div className="max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {search
                  ? `No ${config.label.toLowerCase()} found`
                  : `No available ${config.label.toLowerCase()}`}
              </div>
            ) : (
              <div className="p-1">
                {filteredRecords.map((record: Record<string, unknown>) => (
                  <button
                    key={record.name as string}
                    type="button"
                    onClick={() => handleSelectRecord(record.name as string)}
                    disabled={isLinking !== null}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left",
                      isLinking === record.name && "opacity-50"
                    )}
                  >
                    {isLinking === record.name ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {(record[displayField] as string) || (record.name as string)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create new option */}
          <div className="p-2 border-t">
            <button
              type="button"
              onClick={handleCreateNew}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-primary"
            >
              <Plus className="h-4 w-4" />
              Create {singularLabel}
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Create Modal */}
      <CreateRecordModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        doctype={config.doctype}
        linkField={config.linkField}
        parentDocname={parentDocname}
        label={singularLabel}
        onCreated={() => {
          onLinked?.();
          setCreateModalOpen(false);
        }}
      />
    </>
  );
}

// ============================================================================
// Create Record Modal
// ============================================================================

interface CreateRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctype: string;
  linkField: string;
  parentDocname: string;
  label: string;
  onCreated?: () => void;
}

function CreateRecordModal({
  open,
  onOpenChange,
  doctype,
  linkField,
  parentDocname,
  label,
  onCreated,
}: CreateRecordModalProps) {
  const { showSuccess, showError } = useNotification();
  const { createDoc, loading: createLoading } = useFrappeCreateDoc();

  // Fetch DocType metadata
  const { meta, isLoading: metaLoading } = useFrappeDocMeta({
    doctype,
    isNewDoc: true,
  });

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      // Pre-fill the link field with the parent document
      const docData = {
        ...data,
        [linkField]: parentDocname,
      };
      await createDoc(doctype, docData);
      showSuccess(`${label} created successfully`);
      onCreated?.();
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Failed to create record"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create {label}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          {metaLoading ? (
            <div className="space-y-4 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : meta ? (
            <DynamicForm
              docMeta={meta}
              initialData={{ [linkField]: parentDocname }}
              onSubmit={handleSubmit}
              isLoading={createLoading}
              formId="create-related-form"
            />
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Failed to load form
            </div>
          )}
        </div>
        {meta && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-related-form"
              disabled={createLoading}
            >
              {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create {label}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AddRelatedPopover;
