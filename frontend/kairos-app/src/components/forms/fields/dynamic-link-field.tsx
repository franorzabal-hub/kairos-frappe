/**
 * Dynamic Link Field Component
 *
 * A link field where the target DocType is determined by another field's value.
 * For example, a "party" field might link to either Customer or Supplier
 * based on the value of a "party_type" field.
 *
 * The `options` prop contains the fieldname that holds the DocType name.
 */

"use client";

import { Control, FieldValues, Path, useWatch } from "react-hook-form";
import { LinkField } from "./link-field";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DynamicLinkFieldProps<T extends FieldValues> {
  /** Field name for react-hook-form */
  name: Path<T>;
  /** react-hook-form control object */
  control: Control<T>;
  /** Field label */
  label: string;
  /** The fieldname that contains the target DocType */
  options: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is read-only */
  readOnly?: boolean;
  /** Field description/help text */
  description?: string;
  /** Additional CSS classes */
  className?: string;
}

export function DynamicLinkField<T extends FieldValues>({
  name,
  control,
  label,
  options,
  required = false,
  readOnly = false,
  description,
  className,
}: DynamicLinkFieldProps<T>) {
  // Watch the field that determines the target DocType
  const targetDoctype = useWatch({
    control,
    name: options as Path<T>,
  }) as string | undefined;

  // If no target DocType is set, show a disabled state
  if (!targetDoctype) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label className="text-muted-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="flex items-center h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
          Select {options} first...
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    );
  }

  // Render LinkField with the dynamic doctype
  return (
    <LinkField
      name={name}
      control={control}
      label={label}
      doctype={targetDoctype}
      required={required}
      readOnly={readOnly}
      description={description}
      className={className}
    />
  );
}
