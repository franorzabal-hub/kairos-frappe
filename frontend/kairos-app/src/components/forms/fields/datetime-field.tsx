/**
 * DateTime Field Component
 *
 * DateTime input field for Frappe "Datetime" field type
 * Integrates with react-hook-form via Controller
 */

"use client";

import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DatetimeFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  description?: string;
  className?: string;
  min?: string;
  max?: string;
}

// Convert ISO datetime to datetime-local format (YYYY-MM-DDTHH:mm)
function toDatetimeLocalFormat(value: string | null | undefined): string {
  if (!value) return "";
  // Handle ISO format (e.g., "2024-01-15T10:30:00.000Z" or "2024-01-15 10:30:00")
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";
    // Format as YYYY-MM-DDTHH:mm for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
}

// Convert datetime-local format to ISO string for storage
function toISOFormat(value: string): string | null {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

export function DatetimeField<T extends FieldValues>({
  name,
  control,
  label,
  required = false,
  readOnly = false,
  description,
  className,
  min,
  max,
}: DatetimeFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div className={cn("space-y-2", className)}>
          <Label htmlFor={name} className={cn(error && "text-destructive")}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            type="datetime-local"
            id={name}
            min={min}
            max={max}
            readOnly={readOnly}
            disabled={readOnly}
            value={toDatetimeLocalFormat(field.value)}
            onChange={(e) => {
              const isoValue = toISOFormat(e.target.value);
              field.onChange(isoValue);
            }}
            onBlur={field.onBlur}
            ref={field.ref}
            aria-invalid={!!error}
            className={cn(error && "border-destructive")}
          />
          {description && !error && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          {error && (
            <p className="text-sm text-destructive">{error.message}</p>
          )}
        </div>
      )}
    />
  );
}
