/**
 * useFileUpload Hook
 *
 * Wrapper around useFrappeFileUpload from frappe-react-sdk
 * Provides file upload functionality with progress tracking and error handling
 */

"use client";

import { useState, useCallback } from "react";
import { useFrappeFileUpload } from "frappe-react-sdk";

export interface FileUploadOptions {
  /** If the file access is private then set to TRUE */
  isPrivate?: boolean;
  /** Folder the file exists in */
  folder?: string;
  /** Doctype associated with the file */
  doctype?: string;
  /** Docname associated with the file (mandatory if doctype is present) */
  docname?: string;
  /** Field to be linked in the Document */
  fieldname?: string;
}

export interface FileUploadResult {
  file_url: string;
  file_name: string;
  is_private: boolean;
}

export interface UseFileUploadReturn {
  /** Upload a file */
  uploadFile: (file: File, options?: FileUploadOptions) => Promise<FileUploadResult>;
  /** Current upload progress (0-100) */
  progress: number;
  /** Whether upload is in progress */
  isUploading: boolean;
  /** Error message if upload failed */
  error: string | null;
  /** Whether upload is completed */
  isCompleted: boolean;
  /** Reset the upload state */
  reset: () => void;
  /** Get the full URL for a file path */
  getFullFileUrl: (fileUrl: string | null | undefined) => string | null;
}

/**
 * Hook for handling file uploads to Frappe
 */
export function useFileUpload(): UseFileUploadReturn {
  const { upload, error, loading, progress, isCompleted, reset } =
    useFrappeFileUpload();
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File, options?: FileUploadOptions): Promise<FileUploadResult> => {
      setUploadError(null);

      try {
        const result = await upload(file, {
          isPrivate: options?.isPrivate ?? false,
          folder: options?.folder,
          doctype: options?.doctype,
          docname: options?.docname,
          fieldname: options?.fieldname,
        });

        return {
          file_url: result.file_url,
          file_name: result.file_name || file.name,
          is_private: Boolean(result.is_private || options?.isPrivate),
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to upload file";
        setUploadError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [upload]
  );

  const resetState = useCallback(() => {
    setUploadError(null);
    reset();
  }, [reset]);

  /**
   * Get the full URL for a file path
   * Handles both absolute URLs and relative Frappe file paths
   */
  const getFullFileUrl = useCallback(
    (fileUrl: string | null | undefined): string | null => {
      if (!fileUrl) return null;

      // If it's already an absolute URL, return as-is
      if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
        return fileUrl;
      }

      // For relative Frappe file paths, prepend the base URL
      if (fileUrl.startsWith("/")) {
        if (typeof window !== "undefined") {
          return window.location.origin + fileUrl;
        }
        return fileUrl;
      }

      // If it's just a filename, assume it's in /files/
      return "/files/" + fileUrl;
    },
    []
  );

  return {
    uploadFile,
    progress: progress ?? 0,
    isUploading: loading,
    error: uploadError || (error ? String(error) : null),
    isCompleted,
    reset: resetState,
    getFullFileUrl,
  };
}

/**
 * Helper function to format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Helper function to get file extension
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

/**
 * Helper function to check if file is an image
 */
export function isImageFile(file: File | string): boolean {
  if (typeof file === "string") {
    const ext = getFileExtension(file).toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext);
  }
  return file.type.startsWith("image/");
}
