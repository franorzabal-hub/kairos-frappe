/**
 * Alert Dialog Component (Custom)
 *
 * An informational dialog with a single OK button.
 * Used for success messages, warnings, and information display.
 */

"use client";

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertDialogCustomProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string | ReactNode;
  okLabel?: string;
  variant?: AlertVariant;
  onOk?: () => void;
}

const variantConfig: Record<
  AlertVariant,
  { icon: typeof Info; className: string }
> = {
  info: { icon: Info, className: "text-blue-500" },
  success: { icon: CheckCircle2, className: "text-green-500" },
  warning: { icon: AlertTriangle, className: "text-yellow-500" },
  error: { icon: AlertCircle, className: "text-red-500" },
};

export function AlertDialogCustom({
  open,
  onOpenChange,
  title,
  message,
  okLabel = "OK",
  variant = "info",
  onOk,
}: AlertDialogCustomProps) {
  const { icon: Icon, className: iconClassName } = variantConfig[variant];

  const handleOk = () => {
    onOk?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={cn("h-5 w-5", iconClassName)} />
            {title}
          </DialogTitle>
          <DialogDescription asChild>
            {typeof message === "string" ? (
              <p className="mt-2">{message}</p>
            ) : (
              <div className="mt-2">{message}</div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleOk}>{okLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
