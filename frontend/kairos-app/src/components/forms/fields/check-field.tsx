/**
 * Check Field Component
 *
 * Checkbox field for Frappe "Check" field type
 * Integrates with react-hook-form via Controller
 */

"use client";

import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CheckFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  description?: string;
  className?: string;
}

export function CheckField<T extends FieldValues>({
  name,
  control,
  label,
  required = false,
  readOnly = false,
  description,
  className,
}: CheckFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div className={cn("space-y-2", className)}>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={name}
              checked={field.value === 1 || field.value === true}
              onCheckedChange={(checked) => {
                // Frappe uses 1/0 for boolean values
                field.onChange(checked ? 1 : 0);
              }}
              disabled={readOnly}
              aria-invalid={!!error}
              className={cn(error && "border-destructive")}
            />
            <Label
              htmlFor={name}
              className={cn(
                "cursor-pointer",
                readOnly && "cursor-not-allowed opacity-50",
                error && "text-destructive"
              )}
            >
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
          {description && !error && (
            <p className="text-sm text-muted-foreground ml-6">{description}</p>
          )}
          {error && (
            <p className="text-sm text-destructive ml-6">{error.message}</p>
          )}
        </div>
      )}
    />
  );
}
