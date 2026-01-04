/**
 * useNotification Hook
 *
 * Custom hook for managing toast notifications in CRUD operations.
 * Integrates seamlessly with frappe-react-sdk mutations.
 */

import { useCallback, useRef } from "react";
import { toast, crudToast } from "@/lib/toast";

// ============================================================================
// Types
// ============================================================================

interface NotificationOptions {
  /** Entity name for display in messages (e.g., "Student", "Course") */
  entityName?: string;
  /** Custom success message */
  successMessage?: string;
  /** Custom error message */
  errorMessage?: string;
  /** Whether to show loading toast */
  showLoading?: boolean;
}

interface MutationCallbacks<TData = unknown, TError = Error> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

type OperationType = "create" | "update" | "delete" | "save";

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing toast notifications during CRUD operations
 *
 * @example
 * ```tsx
 * const { notifyOnMutation, showSuccess, showError } = useNotification();
 *
 * // With frappe-react-sdk
 * const handleSave = async (data) => {
 *   const callbacks = notifyOnMutation({
 *     operation: 'update',
 *     entityName: 'Student',
 *   });
 *
 *   try {
 *     const result = await updateDoc('Student', id, data);
 *     callbacks.onSuccess(result);
 *   } catch (error) {
 *     callbacks.onError(error);
 *   }
 * };
 *
 * // Direct usage
 * showSuccess("Document saved!");
 * showError("Failed to save document");
 * ```
 */
export function useNotification() {
  // Track active loading toasts for cleanup
  const loadingToastRef = useRef<string | number | null>(null);

  /**
   * Show a success notification
   */
  const showSuccess = useCallback((message: string) => {
    // Dismiss any active loading toast
    if (loadingToastRef.current !== null) {
      toast.dismiss(loadingToastRef.current);
      loadingToastRef.current = null;
    }
    return toast.success(message);
  }, []);

  /**
   * Show an error notification
   */
  const showError = useCallback((message: string) => {
    // Dismiss any active loading toast
    if (loadingToastRef.current !== null) {
      toast.dismiss(loadingToastRef.current);
      loadingToastRef.current = null;
    }
    return toast.error(message);
  }, []);

  /**
   * Show an info notification
   */
  const showInfo = useCallback((message: string) => {
    return toast.info(message);
  }, []);

  /**
   * Show a loading notification
   */
  const showLoading = useCallback((message: string) => {
    loadingToastRef.current = toast.loading(message);
    return loadingToastRef.current;
  }, []);

  /**
   * Dismiss the current loading toast
   */
  const dismissLoading = useCallback(() => {
    if (loadingToastRef.current !== null) {
      toast.dismiss(loadingToastRef.current);
      loadingToastRef.current = null;
    }
  }, []);

  /**
   * Create callbacks for mutation operations with automatic toast notifications
   *
   * @param options Configuration for the notification
   * @returns Object with onSuccess and onError callbacks
   */
  const notifyOnMutation = useCallback(
    <TData = unknown, TError = Error>(
      options: NotificationOptions & {
        operation: OperationType;
      }
    ): MutationCallbacks<TData, TError> => {
      const {
        operation,
        entityName = "Document",
        successMessage,
        errorMessage,
        showLoading: shouldShowLoading = false,
      } = options;

      // Show loading toast if requested
      if (shouldShowLoading) {
        const loadingMessage =
          operation === "delete"
            ? `Deleting ${entityName}...`
            : `Saving ${entityName}...`;
        loadingToastRef.current = toast.loading(loadingMessage);
      }

      return {
        onSuccess: () => {
          // Dismiss loading toast
          if (loadingToastRef.current !== null) {
            toast.dismiss(loadingToastRef.current);
            loadingToastRef.current = null;
          }

          // Show success message
          if (successMessage) {
            toast.success(successMessage);
          } else {
            switch (operation) {
              case "create":
                crudToast.created(entityName);
                break;
              case "update":
              case "save":
                crudToast.updated(entityName);
                break;
              case "delete":
                crudToast.deleted(entityName);
                break;
            }
          }
        },

        onError: (error: TError) => {
          // Dismiss loading toast
          if (loadingToastRef.current !== null) {
            toast.dismiss(loadingToastRef.current);
            loadingToastRef.current = null;
          }

          // Extract error message
          const errorMsg =
            error instanceof Error
              ? error.message
              : typeof error === "string"
                ? error
                : "An unexpected error occurred";

          // Show error message
          if (errorMessage) {
            toast.error(`${errorMessage}: ${errorMsg}`);
          } else {
            switch (operation) {
              case "create":
                crudToast.createFailed(entityName, errorMsg);
                break;
              case "update":
              case "save":
                crudToast.updateFailed(entityName, errorMsg);
                break;
              case "delete":
                crudToast.deleteFailed(entityName, errorMsg);
                break;
            }
          }
        },
      };
    },
    []
  );

  /**
   * Wrap an async operation with automatic loading/success/error toasts
   *
   * @example
   * ```tsx
   * const { withNotification } = useNotification();
   *
   * const handleSave = () => {
   *   withNotification(
   *     () => updateDoc('Student', id, data),
   *     {
   *       operation: 'update',
   *       entityName: 'Student',
   *       showLoading: true,
   *     }
   *   );
   * };
   * ```
   */
  const withNotification = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      options: NotificationOptions & {
        operation: OperationType;
      }
    ): Promise<T> => {
      const callbacks = notifyOnMutation<T>(options);

      try {
        const result = await asyncFn();
        callbacks.onSuccess?.(result);
        return result;
      } catch (error) {
        callbacks.onError?.(error as Error);
        throw error;
      }
    },
    [notifyOnMutation]
  );

  return {
    // Basic toast methods
    showSuccess,
    showError,
    showInfo,
    showLoading,
    dismissLoading,

    // Mutation helpers
    notifyOnMutation,
    withNotification,

    // Direct access to toast library
    toast,
    crudToast,
  };
}

// ============================================================================
// Default Export
// ============================================================================

export default useNotification;
