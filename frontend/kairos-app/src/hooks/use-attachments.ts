/**
 * useAttachments Hook
 *
 * Fetches attachments for a document from Frappe File doctype
 * Files in Frappe are linked via attached_to_doctype and attached_to_name
 */

import { useFrappeGetCall } from "frappe-react-sdk";

export interface Attachment {
  name: string;
  file_name: string;
  file_url: string;
  file_size: number;
  is_private: 0 | 1;
  file_type?: string;
  creation: string;
  owner: string;
}

interface UseAttachmentsResult {
  attachments: Attachment[];
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

/**
 * Hook to fetch attachments for a specific document
 */
export function useAttachments(
  doctype: string,
  docname: string
): UseAttachmentsResult {
  const { data, error, isLoading, mutate } = useFrappeGetCall<{
    message: Attachment[];
  }>(
    "frappe.client.get_list",
    {
      doctype: "File",
      filters: {
        attached_to_doctype: doctype,
        attached_to_name: docname,
      },
      fields: [
        "name",
        "file_name",
        "file_url",
        "file_size",
        "is_private",
        "file_type",
        "creation",
        "owner",
      ],
      order_by: "creation desc",
      limit_page_length: 0, // Get all attachments
    },
    `attachments_${doctype}_${docname}`,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    attachments: data?.message || [],
    isLoading,
    error: error ? (error as unknown as Error) : null,
    mutate,
  };
}

/**
 * Format file size to human readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get file icon based on file type/extension
 */
export function getFileType(fileName: string): "image" | "pdf" | "document" | "spreadsheet" | "other" {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) {
    return "image";
  }
  if (ext === "pdf") {
    return "pdf";
  }
  if (["doc", "docx", "txt", "rtf", "odt"].includes(ext)) {
    return "document";
  }
  if (["xls", "xlsx", "csv", "ods"].includes(ext)) {
    return "spreadsheet";
  }
  return "other";
}
