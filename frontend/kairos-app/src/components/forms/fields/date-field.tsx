/**
 * Date Field Component
 *
 * Date picker for Frappe "Date" field type
 * Integrates with react-hook-form via Controller
 */

"use client";

import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DateFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  description?: string;
  className?: string;
}

export function DateField<T extends FieldValues>({
  name,
  control,
  label,
  required = false,
  readOnly = false,
  description,
  className,
}: DateFieldProps<T>) {
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
            {...field}
            type="date"
            id={name}
            readOnly={readOnly}
            disabled={readOnly}
            value={field.value ?? ""}
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
