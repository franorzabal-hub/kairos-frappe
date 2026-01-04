/**
 * useDialog Hook
 *
 * React hook for programmatic dialog control.
 * Provides methods to open confirm, alert, and form dialogs.
 * Must be used within a DialogProvider.
 */

"use client";

import { useContext } from "react";
import { DialogContext, DialogContextValue } from "@/providers/dialog-provider";

export function useDialog(): DialogContextValue {
  const context = useContext(DialogContext);

  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }

  return context;
}

export type { DialogContextValue };
