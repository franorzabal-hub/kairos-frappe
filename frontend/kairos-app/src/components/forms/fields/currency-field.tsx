/**
 * Currency Field Component
 *
 * Currency input field for Frappe "Currency" field type
 * Integrates with react-hook-form via Controller
 */

"use client";

import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CurrencyFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  description?: string;
  className?: string;
  currencySymbol?: string;
  min?: number;
  max?: number;
}

export function CurrencyField<T extends FieldValues>({
  name,
  control,
  label,
  placeholder = "0.00",
  required = false,
  readOnly = false,
  description,
  className,
  currencySymbol = "$",
  min,
  max,
}: CurrencyFieldProps<T>) {
  const formatCurrency = (value: number | null): string => {
    if (value === null || value === undefined) return "";
    return value.toFixed(2);
  };

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
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {currencySymbol}
            </span>
            <Input
              {...field}
              type="number"
              step="0.01"
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
                  const parsed = parseFloat(value);
                  if (isNaN(parsed)) {
                    field.onChange(null);
                  } else {
                    // Round to 2 decimal places for currency
                    field.onChange(parseFloat(parsed.toFixed(2)));
                  }
                }
              }}
              onBlur={(e) => {
                field.onBlur();
                // Format to 2 decimal places on blur
                if (field.value !== null && field.value !== undefined) {
                  const formatted = formatCurrency(field.value);
                  e.target.value = formatted;
                }
              }}
              aria-invalid={!!error}
              className={cn("pl-7", error && "border-destructive")}
            />
          </div>
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
