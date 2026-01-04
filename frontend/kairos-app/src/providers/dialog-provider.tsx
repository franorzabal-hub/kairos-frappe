/**
 * Dialog Provider
 *
 * Global provider for the dialog system.
 * Manages dialog state and provides programmatic dialog control.
 */

"use client";

import {
  createContext,
  useState,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import { FieldValues } from "react-hook-form";
import { ConfirmDialog, ConfirmDialogProps } from "@/components/dialogs/confirm-dialog";
import {
  AlertDialogCustom,
  AlertDialogCustomProps,
  AlertVariant,
} from "@/components/dialogs/alert-dialog";
import { FormDialog, FormDialogProps } from "@/components/dialogs/form-dialog";
import { DocTypeMeta } from "@/types/frappe";

// ============================================================================
// Types
// ============================================================================

export interface ConfirmOptions {
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

export interface AlertOptions {
  title: string;
  message: string | ReactNode;
  okLabel?: string;
  variant?: AlertVariant;
}

export interface FormOptions<T extends FieldValues = FieldValues> {
  doctype: string;
  title?: string;
  description?: string;
  initialData?: Partial<T>;
  quickEntry?: boolean;
  onSubmit: (data: T) => void | Promise<T | void>;
  childDocMetas?: Record<string, DocTypeMeta>;
  submitLabel?: string;
  cancelLabel?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export interface CustomDialogOptions {
  content: ReactNode;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export interface DialogContextValue {
  /**
   * Show a confirmation dialog
   * @returns Promise that resolves to true if confirmed, false if cancelled
   */
  confirm: (options: ConfirmOptions) => Promise<boolean>;

  /**
   * Show an alert dialog
   * @returns Promise that resolves when the dialog is closed
   */
  alert: (options: AlertOptions) => Promise<void>;

  /**
   * Show a form dialog
   * @returns Promise that resolves to the submitted data, or null if cancelled
   */
  openForm: <T extends FieldValues = FieldValues>(
    options: FormOptions<T>
  ) => Promise<T | null>;

  /**
   * Show a custom content dialog
   * @returns Promise that resolves when the dialog is closed
   */
  openCustom: (options: CustomDialogOptions) => Promise<void>;

  /**
   * Close all open dialogs
   */
  closeAll: () => void;
}

// ============================================================================
// Context
// ============================================================================

export const DialogContext = createContext<DialogContextValue | null>(null);

// ============================================================================
// Internal Dialog State Types
// ============================================================================

interface ConfirmDialogState {
  type: "confirm";
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

interface AlertDialogState {
  type: "alert";
  options: AlertOptions;
  resolve: () => void;
}

interface FormDialogState<T extends FieldValues = FieldValues> {
  type: "form";
  options: FormOptions<T>;
  resolve: (value: T | null) => void;
}

interface CustomDialogState {
  type: "custom";
  options: CustomDialogOptions;
  resolve: () => void;
}

type DialogState =
  | ConfirmDialogState
  | AlertDialogState
  | FormDialogState
  | CustomDialogState;

// ============================================================================
// Provider Component
// ============================================================================

interface DialogProviderProps {
  children: ReactNode;
}

export function DialogProvider({ children }: DialogProviderProps) {
  const [dialogStack, setDialogStack] = useState<DialogState[]>([]);

  // Get the current (topmost) dialog
  const currentDialog = dialogStack[dialogStack.length - 1] ?? null;

  // Remove the current dialog from the stack
  const popDialog = useCallback(() => {
    setDialogStack((stack) => stack.slice(0, -1));
  }, []);

  // ============================================================================
  // Dialog Methods
  // ============================================================================

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const state: ConfirmDialogState = {
        type: "confirm",
        options,
        resolve,
      };
      setDialogStack((stack) => [...stack, state]);
    });
  }, []);

  const alert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      const state: AlertDialogState = {
        type: "alert",
        options,
        resolve,
      };
      setDialogStack((stack) => [...stack, state]);
    });
  }, []);

  const openForm = useCallback(
    <T extends FieldValues = FieldValues>(
      options: FormOptions<T>
    ): Promise<T | null> => {
      return new Promise((resolve) => {
        const state: FormDialogState<T> = {
          type: "form",
          options,
          resolve,
        };
        setDialogStack((stack) => [...stack, state as DialogState]);
      });
    },
    []
  );

  const openCustom = useCallback(
    (options: CustomDialogOptions): Promise<void> => {
      return new Promise((resolve) => {
        const state: CustomDialogState = {
          type: "custom",
          options,
          resolve,
        };
        setDialogStack((stack) => [...stack, state]);
      });
    },
    []
  );

  const closeAll = useCallback(() => {
    // Resolve all pending dialogs
    dialogStack.forEach((dialog) => {
      if (dialog.type === "confirm") {
        dialog.resolve(false);
      } else if (dialog.type === "alert" || dialog.type === "custom") {
        dialog.resolve();
      } else if (dialog.type === "form") {
        dialog.resolve(null);
      }
    });
    setDialogStack([]);
  }, [dialogStack]);

  // ============================================================================
  // Dialog Handlers
  // ============================================================================

  const handleConfirmClose = useCallback(
    (confirmed: boolean) => {
      if (currentDialog?.type === "confirm") {
        currentDialog.resolve(confirmed);
        popDialog();
      }
    },
    [currentDialog, popDialog]
  );

  const handleAlertClose = useCallback(() => {
    if (currentDialog?.type === "alert") {
      currentDialog.resolve();
      popDialog();
    }
  }, [currentDialog, popDialog]);

  const handleFormSubmit = useCallback(
    async (data: FieldValues) => {
      if (currentDialog?.type === "form") {
        // Call the original onSubmit handler
        const result = await currentDialog.options.onSubmit(data);
        // Resolve with the result or the original data
        currentDialog.resolve(result ?? data);
        popDialog();
        return result;
      }
    },
    [currentDialog, popDialog]
  );

  const handleFormCancel = useCallback(() => {
    if (currentDialog?.type === "form") {
      currentDialog.resolve(null);
      popDialog();
    }
  }, [currentDialog, popDialog]);

  const handleCustomClose = useCallback(() => {
    if (currentDialog?.type === "custom") {
      currentDialog.resolve();
      popDialog();
    }
  }, [currentDialog, popDialog]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue = useMemo<DialogContextValue>(
    () => ({
      confirm,
      alert,
      openForm,
      openCustom,
      closeAll,
    }),
    [confirm, alert, openForm, openCustom, closeAll]
  );

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <DialogContext.Provider value={contextValue}>
      {children}

      {/* Confirm Dialog */}
      {currentDialog?.type === "confirm" && (
        <ConfirmDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) handleConfirmClose(false);
          }}
          title={currentDialog.options.title}
          message={currentDialog.options.message}
          confirmLabel={currentDialog.options.confirmLabel}
          cancelLabel={currentDialog.options.cancelLabel}
          variant={currentDialog.options.variant}
          onConfirm={() => handleConfirmClose(true)}
          onCancel={() => handleConfirmClose(false)}
        />
      )}

      {/* Alert Dialog */}
      {currentDialog?.type === "alert" && (
        <AlertDialogCustom
          open={true}
          onOpenChange={(open) => {
            if (!open) handleAlertClose();
          }}
          title={currentDialog.options.title}
          message={currentDialog.options.message}
          okLabel={currentDialog.options.okLabel}
          variant={currentDialog.options.variant}
          onOk={handleAlertClose}
        />
      )}

      {/* Form Dialog */}
      {currentDialog?.type === "form" && (
        <FormDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) handleFormCancel();
          }}
          doctype={currentDialog.options.doctype}
          title={currentDialog.options.title}
          description={currentDialog.options.description}
          initialData={currentDialog.options.initialData}
          quickEntry={currentDialog.options.quickEntry}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          childDocMetas={currentDialog.options.childDocMetas}
          submitLabel={currentDialog.options.submitLabel}
          cancelLabel={currentDialog.options.cancelLabel}
          size={currentDialog.options.size}
        />
      )}

      {/* Custom Dialog */}
      {currentDialog?.type === "custom" && (
        <CustomDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) handleCustomClose();
          }}
          title={currentDialog.options.title}
          description={currentDialog.options.description}
          size={currentDialog.options.size}
        >
          {currentDialog.options.content}
        </CustomDialog>
      )}
    </DialogContext.Provider>
  );
}

// ============================================================================
// Custom Dialog Component (internal)
// ============================================================================

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CustomDialogComponentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  children: ReactNode;
}

const sizeClasses: Record<string, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  full: "sm:max-w-4xl",
};

function CustomDialog({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  children,
}: CustomDialogComponentProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(sizeClasses[size])}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}
