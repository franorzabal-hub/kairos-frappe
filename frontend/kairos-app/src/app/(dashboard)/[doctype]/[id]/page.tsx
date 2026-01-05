/**
 * DocType Detail View Page
 *
 * Dynamic page that displays a single document for any DocType
 * Uses an Attio-style layout with:
 * - Header with navigation
 * - Main content area with tabs (Overview, Activity, Related objects)
 * - Right sidebar with Details and Comments
 */

"use client";

import { useCallback, use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useFrappeGetDoc,
  useFrappeCreateDoc,
  useFrappeUpdateDoc,
  useFrappeDeleteDoc,
} from "frappe-react-sdk";
import { useNotification } from "@/hooks/use-notification";
import { useFrappeDocMeta } from "@/hooks/use-frappe-meta";
import { DynamicForm } from "@/components/forms/dynamic-form";
import { RecordHeader, DetailsSidebar, RelatedTabs } from "@/components/record-view";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { slugToDoctype } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface DocTypeDetailPageProps {
  params: Promise<{
    doctype: string;
    id: string;
  }>;
}

// ============================================================================
// Component
// ============================================================================

export default function DocTypeDetailPage({ params }: DocTypeDetailPageProps) {
  const { doctype: doctypeSlug, id } = use(params);
  const router = useRouter();
  const { showSuccess, showError } = useNotification();

  // Convert URL slug to Frappe DocType name
  const doctype = slugToDoctype(doctypeSlug);
  const isNew = id === "new";

  // State for sidebar visibility (mobile)
  const [showSidebar, setShowSidebar] = useState(true);

  // Fetch DocType metadata with permissions applied
  const {
    meta: docMeta,
    isLoading: metaLoading,
    error: metaError,
    titleField,
  } = useFrappeDocMeta({
    doctype,
    isNewDoc: isNew,
  });

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

  // Get document title
  const docTitle = doc
    ? (doc[titleField] as string) || (doc.name as string)
    : id;

  // Handle form submission
  const handleSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        if (isNew) {
          const result = await createDoc(doctype, data);
          showSuccess(`${doctype} created successfully`);
          router.push(`/${doctypeSlug}/${result.name}`);
        } else {
          await updateDoc(doctype, id, data);
          showSuccess(`${doctype} updated successfully`);
          mutateDoc();
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "An error occurred";
        showError(`Failed to save: ${message}`);
      }
    },
    [isNew, createDoc, updateDoc, doctype, id, router, doctypeSlug, mutateDoc, showSuccess, showError]
  );

  // Handle delete
  const handleDelete = useCallback(async () => {
    try {
      await deleteDoc(doctype, id);
      showSuccess(`${doctype} deleted successfully`);
      router.push(`/${doctypeSlug}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      showError(`Failed to delete: ${message}`);
    }
  }, [deleteDoc, doctype, id, router, doctypeSlug, showSuccess, showError]);

  // Handle back
  const handleBack = useCallback(() => {
    router.push(`/${doctypeSlug}`);
  }, [router, doctypeSlug]);

  // Error state
  if (metaError || docError) {
    const error = metaError || docError;
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="border-destructive max-w-md w-full">
          <CardHeader>
            <h2 className="text-lg font-semibold text-destructive">Error</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "Failed to load data"}
            </p>
            <Button variant="outline" onClick={handleBack}>
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
      <div className="h-full flex flex-col -m-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 flex">
          <div className="flex-1 p-6">
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
          <div className="w-80 border-l p-4">
            <Skeleton className="h-8 w-full mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="flex flex-col -m-6" style={{ height: 'calc(100vh - 48px)' }}>
      {/* Header */}
      <RecordHeader
        title={docTitle}
        doctype={doctype}
        isNew={isNew}
      />

      {/* Main content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left side: Tabs and content */}
        <div className="flex-1 flex flex-col min-h-0">
          {docMeta && (
            <>
              {/* Related tabs (Overview, Activity, Child tables) */}
              {!isNew && doc && (
                <RelatedTabs
                  meta={docMeta}
                  doc={doc}
                  doctype={doctype}
                  docname={id}
                  isNew={isNew}
                  className="flex-1"
                />
              )}

              {/* Form (only for new records - existing records show details in sidebar) */}
              {isNew && (
                <div className="flex-1 overflow-auto p-6">
                  <DynamicForm
                    docMeta={docMeta}
                    initialData={undefined}
                    onSubmit={handleSubmit}
                    isLoading={isSaving}
                    formId="record-form"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Right sidebar: Details and Comments */}
        {docMeta && (showSidebar || !isNew) && (
          <DetailsSidebar
            meta={docMeta}
            doc={doc || {}}
            doctype={doctype}
            docname={id}
            isNew={isNew}
            className="w-[400px] hidden lg:flex"
          />
        )}
      </div>
    </div>
  );
}
