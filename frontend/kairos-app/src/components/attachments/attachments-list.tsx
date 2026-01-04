/**
 * Attachments List Component
 *
 * Displays list of file attachments for a document
 * Supports preview, download, and delete actions
 */

"use client";

import { useState, useCallback } from "react";
import { useFrappeDeleteDoc, useFrappeFileUpload } from "frappe-react-sdk";
import {
  useAttachments,
  formatFileSize,
  getFileType,
  Attachment,
} from "@/hooks/use-attachments";
import { useNotification } from "@/hooks/use-notification";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Paperclip,
  File,
  FileText,
  FileSpreadsheet,
  FileImage,
  Download,
  Trash2,
  Upload,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AttachmentsListProps {
  doctype: string;
  docname: string;
  className?: string;
  allowUpload?: boolean;
  allowDelete?: boolean;
}

export function AttachmentsList({
  doctype,
  docname,
  className,
  allowUpload = true,
  allowDelete = true,
}: AttachmentsListProps) {
  const { attachments, isLoading, error, mutate } = useAttachments(
    doctype,
    docname
  );
  const { showSuccess, showError } = useNotification();
  const { deleteDoc } = useFrappeDeleteDoc();
  const { upload, loading: uploading } = useFrappeFileUpload();

  const [deleteTarget, setDeleteTarget] = useState<Attachment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle file upload
  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      try {
        for (const file of Array.from(files)) {
          await upload(file, {
            doctype,
            docname,
            isPrivate: true,
          });
        }
        showSuccess("File(s) uploaded successfully");
        mutate();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        showError(message);
      }

      // Reset input
      e.target.value = "";
    },
    [upload, doctype, docname, mutate, showSuccess, showError]
  );

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteDoc("File", deleteTarget.name);
      showSuccess("Attachment deleted");
      mutate();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed";
      showError(message);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteDoc, mutate, showSuccess, showError]);

  // Handle download
  const handleDownload = useCallback((attachment: Attachment) => {
    const link = document.createElement("a");
    link.href = attachment.file_url;
    link.download = attachment.file_name;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  if (isLoading) {
    return <AttachmentsListSkeleton />;
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        Failed to load attachments
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Paperclip className="h-4 w-4" />
          <span>Attachments</span>
          {attachments.length > 0 && (
            <span className="text-muted-foreground">({attachments.length})</span>
          )}
        </div>

        {allowUpload && (
          <label>
            <input
              type="file"
              multiple
              className="sr-only"
              onChange={handleUpload}
              disabled={uploading}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 cursor-pointer"
              disabled={uploading}
              asChild
            >
              <span>
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </span>
            </Button>
          </label>
        )}
      </div>

      {/* Attachments List */}
      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No attachments
        </p>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <AttachmentItem
              key={attachment.name}
              attachment={attachment}
              onDownload={handleDownload}
              onDelete={allowDelete ? setDeleteTarget : undefined}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deleteTarget?.file_name}&quot;.
              This action cannot be undone.
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Single attachment item
 */
function AttachmentItem({
  attachment,
  onDownload,
  onDelete,
}: {
  attachment: Attachment;
  onDownload: (a: Attachment) => void;
  onDelete?: (a: Attachment) => void;
}) {
  const fileType = getFileType(attachment.file_name);
  const Icon = getFileIcon(fileType);

  return (
    <div className="group flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      {/* File Icon */}
      <div
        className={cn(
          "h-9 w-9 rounded flex items-center justify-center flex-shrink-0",
          fileType === "image" && "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
          fileType === "pdf" && "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
          fileType === "document" && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
          fileType === "spreadsheet" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
          fileType === "other" && "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" title={attachment.file_name}>
          {attachment.file_name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(attachment.file_size)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Open in new tab (for images/PDFs) */}
        {(fileType === "image" || fileType === "pdf") && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            asChild
          >
            <a
              href={attachment.file_url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}

        {/* Download */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onDownload(attachment)}
          title="Download"
        >
          <Download className="h-3.5 w-3.5" />
        </Button>

        {/* Delete */}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(attachment)}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Get icon component based on file type
 */
function getFileIcon(fileType: ReturnType<typeof getFileType>) {
  switch (fileType) {
    case "image":
      return FileImage;
    case "pdf":
      return FileText;
    case "document":
      return FileText;
    case "spreadsheet":
      return FileSpreadsheet;
    default:
      return File;
  }
}

/**
 * Loading skeleton
 */
function AttachmentsListSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <Skeleton className="h-9 w-9 rounded" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
