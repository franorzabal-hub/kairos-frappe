/**
 * Float Field Component
 *
 * Float/decimal input field for Frappe "Float" field type
 * Integrates with react-hook-form via Controller
 */

"use client";

import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FloatFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  description?: string;
  className?: string;
  step?: number | string;
  min?: number;
  max?: number;
  precision?: number; // Number of decimal places
}

export function FloatField<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  required = false,
  readOnly = false,
  description,
  className,
  step = "0.01",
  min,
  max,
  precision,
}: FloatFieldProps<T>) {
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
            step={step}
            min={min}
            max={max}
            id={name}
            placeholder={placeholder}
            readOnly={readOnly}
            disabled={readOnly}
            value={field.value ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                field.onChange(null);
              } else {
                let parsed = parseFloat(value);
                if (isNaN(parsed)) {
                  field.onChange(null);
                } else {
                  // Apply precision if specified
                  if (precision !== undefined) {
                    parsed = parseFloat(parsed.toFixed(precision));
                  }
                  field.onChange(parsed);
                }
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
