/**
 * Int Field Component
 *
 * Integer input field for Frappe "Int" field type
 * Integrates with react-hook-form via Controller
 */

"use client";

import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface IntFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  description?: string;
  className?: string;
  min?: number;
  max?: number;
}

export function IntField<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  required = false,
  readOnly = false,
  description,
  className,
  min,
  max,
}: IntFieldProps<T>) {
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
            type="number"
            step="1"
            min={min}
            max={max}
            id={name}
            placeholder={placeholder}
            readOnly={readOnly}
            disabled={readOnly}
            value={field.value ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              // Parse as integer, or set to empty string if invalid
              if (value === "") {
                field.onChange(null);
              } else {
                const parsed = parseInt(value, 10);
                field.onChange(isNaN(parsed) ? null : parsed);
              }
            }}
            onKeyDown={(e) => {
              // Prevent decimal point and 'e' (scientific notation)
              if (e.key === "." || e.key === "e" || e.key === "E") {
                e.preventDefault();
              }
            }}
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
