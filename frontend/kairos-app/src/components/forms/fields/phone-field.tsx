/**
 * Phone Field Component
 *
 * Phone input field for Frappe "Phone" field type
 * Integrates with react-hook-form via Controller
 */

"use client";

import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PhoneFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  description?: string;
  className?: string;
}

// Format phone number for display (basic formatting)
function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, "");

  // Format based on number of digits (US format as default)
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else if (digits.length <= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else {
    // International format: keep raw for longer numbers
    return `+${digits.slice(0, digits.length - 10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
  }
}

// Clean phone number for storage (digits only with optional +)
function cleanPhoneNumber(value: string): string {
  // Keep + at start and all digits
  const hasPlus = value.startsWith("+");
  const digits = value.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

export function PhoneField<T extends FieldValues>({
  name,
  control,
  label,
  placeholder = "(123) 456-7890",
  required = false,
  readOnly = false,
  description,
  className,
}: PhoneFieldProps<T>) {
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
            type="tel"
            id={name}
            placeholder={placeholder}
            readOnly={readOnly}
            disabled={readOnly}
            value={field.value ?? ""}
            onChange={(e) => {
              // Store cleaned value
              const cleaned = cleanPhoneNumber(e.target.value);
              field.onChange(cleaned);
            }}
            autoComplete="tel"
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

// Export the format function for use in display contexts
export { formatPhoneNumber };
