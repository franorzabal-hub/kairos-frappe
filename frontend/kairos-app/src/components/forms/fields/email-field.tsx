/**
 * Email Field Component
 *
 * Email input field with validation
 * Integrates with react-hook-form via Controller
 */

"use client";

import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface EmailFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  description?: string;
  className?: string;
}

// Basic email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailField<T extends FieldValues>({
  name,
  control,
  label,
  placeholder = "email@example.com",
  required = false,
  readOnly = false,
  description,
  className,
}: EmailFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={{
        validate: (value) => {
          if (!value) return true; // Let required validation handle empty values
          if (!EMAIL_REGEX.test(value)) {
            return "Please enter a valid email address";
          }
          return true;
        },
      }}
      render={({ field, fieldState: { error } }) => (
        <div className={cn("space-y-2", className)}>
          <Label htmlFor={name} className={cn(error && "text-destructive")}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            {...field}
            type="email"
            id={name}
            placeholder={placeholder}
            readOnly={readOnly}
            disabled={readOnly}
            value={field.value ?? ""}
            autoComplete="email"
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
