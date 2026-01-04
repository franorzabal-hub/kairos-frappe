/**
 * DocType Detail View Page
 *
 * Dynamic page that displays a single document for any DocType
 * Handles both creation (id === "new") and editing modes
 * Uses dynamic form rendering based on DocType metadata
 */

"use client";

import { useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useFrappeGetDoc,
  useFrappeCreateDoc,
  useFrappeUpdateDoc,
  useFrappeDeleteDoc,
  useFrappeGetCall,
} from "frappe-react-sdk";
import { useNotification } from "@/hooks/use-notification";
import { DynamicForm } from "@/components/forms/dynamic-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { slugToDoctype } from "@/lib/utils";
import { ChevronRight, ArrowLeft, Save, Trash2, Loader2 } from "lucide-react";
import { DocTypeMeta } from "@/types/frappe";

interface DocTypeDetailPageProps {
  params: Promise<{
    doctype: string;
    id: string;
  }>;
}

export default function DocTypeDetailPage({ params }: DocTypeDetailPageProps) {
  const { doctype: doctypeSlug, id } = use(params);
  const router = useRouter();
  const { showSuccess, showError } = useNotification();

  // Convert URL slug to Frappe DocType name
  const doctype = slugToDoctype(doctypeSlug);
  const isNew = id === "new";

  // Fetch DocType metadata using frappe.desk.form.load.getdoctype
  const {
    data: metaResponse,
    isLoading: metaLoading,
    error: metaError,
  } = useFrappeGetCall<{ docs: DocTypeMeta[] }>(
    "frappe.desk.form.load.getdoctype",
    { doctype, with_parent: 0 },
    `doctype_meta_${doctype}`
  );

  const docMeta = metaResponse?.docs?.[0];

  // Fetch existing document (only if not creating new)
  const {
    data: doc,
    isLoading: docLoading,
    error: docError,
    mutate: mutateDoc,
  } = useFrappeGetDoc(doctype, isNew ? undefined : id);

  // Mutations
  const { createDoc, loading: createLoading } = useFrappeCreateDoc();
  const { updateDoc, loading: updateLoading } = useFrappeUpdateDoc();
  const { deleteDoc, loading: deleteLoading } = useFrappeDeleteDoc();

  const isLoading = metaLoading || (!isNew && docLoading);
  const isSaving = createLoading || updateLoading;
  const isDeleting = deleteLoading;

  // Handle form submission
  const handleSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        if (isNew) {
          // Create new document
          const result = await createDoc(doctype, data);
          showSuccess(`${doctype} created successfully`);
          // Navigate to the created document
          router.push(`/${doctypeSlug}/${result.name}`);
        } else {
          // Update existing document
          await updateDoc(doctype, id, data);
          showSuccess(`${doctype} updated successfully`);
          // Refresh the document data
          mutateDoc();
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "An error occurred";
        showError(`Failed to save: ${message}`);
        console.error("Save error:", error);
      }
    },
    [isNew, createDoc, updateDoc, doctype, id, router, doctypeSlug, mutateDoc, showSuccess, showError]
  );

  // Handle delete
  const handleDelete = useCallback(async () => {
    try {
      await deleteDoc(doctype, id);
      showSuccess(`${doctype} deleted successfully`);
      // Navigate back to list view
      router.push(`/${doctypeSlug}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      showError(`Failed to delete: ${message}`);
      console.error("Delete error:", error);
    }
  }, [deleteDoc, doctype, id, router, doctypeSlug, showSuccess, showError]);

  // Handle cancel/back
  const handleBack = useCallback(() => {
    router.push(`/${doctypeSlug}`);
  }, [router, doctypeSlug]);

  // Error state
  if (metaError || docError) {
    const error = metaError || docError;
    return (
      <div className="space-y-6">
        <Breadcrumb doctype={doctype} doctypeSlug={doctypeSlug} id={id} isNew={isNew} />
        <Card className="border-destructive">
          <CardHeader>
            <h2 className="text-lg font-semibold text-destructive">Error</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Failed to load data"}
            </p>
            <Button variant="outline" className="mt-4" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to list
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumb doctype={doctype} doctypeSlug={doctypeSlug} id={id} isNew={isNew} />
        <Header
          doctype={doctype}
          isNew={isNew}
          docName={id}
          isSaving={false}
          isDeleting={false}
          onBack={handleBack}
        />
        <LoadingSkeleton />
      </div>
    );
  }

  // Main render
  return (
    <div className="space-y-6">
      <Breadcrumb doctype={doctype} doctypeSlug={doctypeSlug} id={id} isNew={isNew} />

      <Header
        doctype={doctype}
        isNew={isNew}
        docName={doc?.name || id}
        isSaving={isSaving}
        isDeleting={isDeleting}
        onBack={handleBack}
        onDelete={handleDelete}
      />

      {docMeta && (
        <DynamicForm
          docMeta={docMeta}
          initialData={isNew ? undefined : doc}
          onSubmit={handleSubmit}
          isLoading={isSaving}
          formId="doctype-form"
        />
      )}
    </div>
  );
}

/**
 * Breadcrumb Component
 */
function Breadcrumb({
  doctype,
  doctypeSlug,
  id,
  isNew,
}: {
  doctype: string;
  doctypeSlug: string;
  id: string;
  isNew: boolean;
}) {
  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      <Link
        href={`/${doctypeSlug}`}
        className="hover:text-foreground transition-colors"
      >
        {doctype}
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-foreground font-medium">
        {isNew ? "New" : id}
      </span>
    </nav>
  );
}

/**
 * Header Component with actions
 */
function Header({
  doctype,
  isNew,
  docName,
  isSaving,
  isDeleting,
  onBack,
  onDelete,
}: {
  doctype: string;
  isNew: boolean;
  docName: string;
  isSaving: boolean;
  isDeleting: boolean;
  onBack: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isNew ? `New ${doctype}` : docName}
        </h1>
        <p className="text-muted-foreground">
          {isNew ? `Create a new ${doctype}` : `Edit ${doctype}`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Back/Cancel Button */}
        <Button variant="outline" onClick={onBack} disabled={isSaving}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>

        {/* Delete Button (only in edit mode) */}
        {!isNew && onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isSaving || isDeleting}>
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  {` ${doctype} "${docName}"`} and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Save Button */}
        <Button
          type="submit"
          form="doctype-form"
          disabled={isSaving || isDeleting}
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isNew ? "Create" : "Save"}
        </Button>
      </div>
    </div>
  );
}

/**
 * Loading Skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
