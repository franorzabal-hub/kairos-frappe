/**
 * Toast Notification Helpers
 *
 * Wrapper around sonner toast library providing type-safe,
 * consistent toast notifications throughout the application.
 */

import { toast as sonnerToast, ExternalToast } from "sonner";

// ============================================================================
// Types
// ============================================================================

type ToastOptions = ExternalToast;

interface ToastPromiseOptions<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: Error) => string);
}

// ============================================================================
// Toast Helper Object
// ============================================================================

/**
 * Toast notification helpers
 *
 * @example
 * ```ts
 * // Success toast
 * toast.success("Document saved successfully");
 *
 * // Error toast
 * toast.error("Failed to save document");
 *
 * // Info toast
 * toast.info("New updates available");
 *
 * // Loading toast that can be dismissed
 * const toastId = toast.loading("Saving...");
 * // Later: toast.dismiss(toastId);
 *
 * // Promise toast (auto-handles loading/success/error states)
 * toast.promise(saveDocument(), {
 *   loading: "Saving document...",
 *   success: "Document saved!",
 *   error: "Failed to save document"
 * });
 * ```
 */
export const toast = {
  /**
   * Show a success toast notification
   */
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      duration: 4000,
      ...options,
    });
  },

  /**
   * Show an error toast notification
   */
  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      duration: 6000, // Errors stay longer for visibility
      ...options,
    });
  },

  /**
   * Show an info toast notification
   */
  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      duration: 4000,
      ...options,
    });
  },

  /**
   * Show a warning toast notification
   */
  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      duration: 5000,
      ...options,
    });
  },

  /**
   * Show a loading toast notification
   * Returns a toast ID that can be used to dismiss or update the toast
   */
  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, {
      duration: Infinity, // Loading toasts don't auto-dismiss
      ...options,
    });
  },

  /**
   * Show a promise-based toast that automatically handles
   * loading, success, and error states
   *
   * @example
   * ```ts
   * toast.promise(
   *   fetch('/api/save'),
   *   {
   *     loading: "Saving...",
   *     success: "Saved successfully!",
   *     error: (err) => `Error: ${err.message}`
   *   }
   * );
   * ```
   */
  promise: <T>(
    promise: Promise<T>,
    options: ToastPromiseOptions<T>
  ) => {
    return sonnerToast.promise(promise, options);
  },

  /**
   * Dismiss a specific toast by ID or all toasts
   */
  dismiss: (toastId?: string | number) => {
    return sonnerToast.dismiss(toastId);
  },

  /**
   * Show a custom message (default style)
   */
  message: (message: string, options?: ToastOptions) => {
    return sonnerToast.message(message, options);
  },
};

// ============================================================================
// CRUD-specific Toast Helpers
// ============================================================================

/**
 * Pre-configured toast messages for CRUD operations
 */
export const crudToast = {
  /**
   * Toast for successful create operation
   */
  created: (entityName: string, options?: ToastOptions) => {
    return toast.success(`${entityName} created successfully`, options);
  },

  /**
   * Toast for successful update operation
   */
  updated: (entityName: string, options?: ToastOptions) => {
    return toast.success(`${entityName} updated successfully`, options);
  },

  /**
   * Toast for successful delete operation
   */
  deleted: (entityName: string, options?: ToastOptions) => {
    return toast.success(`${entityName} deleted successfully`, options);
  },

  /**
   * Toast for failed create operation
   */
  createFailed: (entityName: string, error?: string, options?: ToastOptions) => {
    const message = error
      ? `Failed to create ${entityName}: ${error}`
      : `Failed to create ${entityName}`;
    return toast.error(message, options);
  },

  /**
   * Toast for failed update operation
   */
  updateFailed: (entityName: string, error?: string, options?: ToastOptions) => {
    const message = error
      ? `Failed to update ${entityName}: ${error}`
      : `Failed to update ${entityName}`;
    return toast.error(message, options);
  },

  /**
   * Toast for failed delete operation
   */
  deleteFailed: (entityName: string, error?: string, options?: ToastOptions) => {
    const message = error
      ? `Failed to delete ${entityName}: ${error}`
      : `Failed to delete ${entityName}`;
    return toast.error(message, options);
  },

  /**
   * Toast for loading state during save
   */
  saving: (entityName: string, options?: ToastOptions) => {
    return toast.loading(`Saving ${entityName}...`, options);
  },

  /**
   * Toast for loading state during delete
   */
  deleting: (entityName: string, options?: ToastOptions) => {
    return toast.loading(`Deleting ${entityName}...`, options);
  },
};

// ============================================================================
// Default Export
// ============================================================================

export default toast;
