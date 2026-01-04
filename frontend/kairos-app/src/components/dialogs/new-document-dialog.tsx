/**
 * New Document Dialog
 *
 * A dialog to create a new document from any DocType.
 * Shows a searchable list of DocTypes the user can create.
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFrappeGetCall, useFrappeCreateDoc } from "frappe-react-sdk";
import { useDialog } from "@/hooks/use-dialog";
import { useNotification } from "@/hooks/use-notification";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { doctypeToSlug } from "@/lib/utils";
import { FileText, Plus, Loader2 } from "lucide-react";

interface DocTypeInfo {
  name: string;
  module?: string;
  is_submittable?: 0 | 1;
  quick_entry?: 0 | 1;
}

interface NewDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewDocumentDialog({
  open,
  onOpenChange,
}: NewDocumentDialogProps) {
  const router = useRouter();
  const { openForm } = useDialog();
  const { showSuccess, showError } = useNotification();
  const { createDoc, loading: isCreating } = useFrappeCreateDoc();

  const [search, setSearch] = useState("");

  // Fetch list of DocTypes user can create
  const { data, isLoading } = useFrappeGetCall<{ message: DocTypeInfo[] }>(
    "frappe.client.get_list",
    {
      doctype: "DocType",
      filters: {
        istable: 0,
        issingle: 0,
        is_virtual: 0,
      },
      fields: ["name", "module", "is_submittable", "quick_entry"],
      order_by: "name asc",
      limit_page_length: 0,
    },
    "doctypes_for_new_doc",
    {
      revalidateOnFocus: false,
    }
  );

  const doctypes = data?.message || [];

  // Group doctypes by module
  const groupedDoctypes = useMemo(() => {
    const filtered = search.trim()
      ? doctypes.filter((dt) =>
          dt.name.toLowerCase().includes(search.toLowerCase())
        )
      : doctypes;

    const grouped = new Map<string, DocTypeInfo[]>();
    for (const dt of filtered) {
      const module = dt.module || "Other";
      if (!grouped.has(module)) {
        grouped.set(module, []);
      }
      grouped.get(module)!.push(dt);
    }

    return new Map(
      [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    );
  }, [doctypes, search]);

  // Handle doctype selection
  const handleSelect = useCallback(
    async (doctype: DocTypeInfo) => {
      onOpenChange(false);
      setSearch("");

      if (doctype.quick_entry === 1) {
        // Use quick entry form in dialog
        try {
          const result = await openForm({
            doctype: doctype.name,
            title: `New ${doctype.name}`,
            quickEntry: true,
            onSubmit: async (data) => {
              const doc = await createDoc(doctype.name, data);
              showSuccess(`${doctype.name} created successfully`);
              return doc;
            },
          });

          if (result?.name) {
            // Navigate to the created document
            router.push(`/${doctypeToSlug(doctype.name)}/${result.name}`);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to create document";
          showError(message);
        }
      } else {
        // Navigate to full form
        router.push(`/${doctypeToSlug(doctype.name)}/new`);
      }
    },
    [onOpenChange, openForm, createDoc, router, showSuccess, showError]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            New Document
          </DialogTitle>
          <DialogDescription>
            Select a document type to create
          </DialogDescription>
        </DialogHeader>

        <Command className="border-t">
          <CommandInput
            placeholder="Search document types..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[300px]">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : isCreating ? (
              <div className="p-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm">Creating document...</p>
              </div>
            ) : groupedDoctypes.size === 0 ? (
              <CommandEmpty>No document types found.</CommandEmpty>
            ) : (
              Array.from(groupedDoctypes.entries()).map(([module, types]) => (
                <CommandGroup key={module} heading={module}>
                  {types.map((dt) => (
                    <CommandItem
                      key={dt.name}
                      value={dt.name}
                      onSelect={() => handleSelect(dt)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{dt.name}</span>
                      {dt.quick_entry === 1 && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          Quick Entry
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
