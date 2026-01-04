/**
 * Text Field Component
 *
 * Textarea field for Frappe "Small Text", "Long Text", "Text" field types
 * Integrates with react-hook-form via Controller
 */

"use client";

import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TextFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  description?: string;
  className?: string;
  rows?: number;
  maxLength?: number;
}

export function TextField<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  required = false,
  readOnly = false,
  description,
  className,
  rows = 3,
  maxLength,
}: TextFieldProps<T>) {
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
          <Textarea
            {...field}
            id={name}
            placeholder={placeholder}
            readOnly={readOnly}
            disabled={readOnly}
            rows={rows}
            maxLength={maxLength}
            value={field.value ?? ""}
            aria-invalid={!!error}
            className={cn(error && "border-destructive")}
          />
          {maxLength && (
            <p className="text-xs text-muted-foreground text-right">
              {(field.value?.length ?? 0)} / {maxLength}
            </p>
          )}
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
