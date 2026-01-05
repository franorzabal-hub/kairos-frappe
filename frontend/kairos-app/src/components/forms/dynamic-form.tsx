/**
 * Dynamic Form Component
 *
 * Renders a form dynamically based on Frappe DocType metadata
 * Handles field rendering, validation, and submission
 * Groups fields by Section Break
 * Supports Table (child table) fields
 */

"use client";

import { useForm, useWatch, FieldValues, DefaultValues, Control } from "react-hook-form";
import { useMemo, useCallback } from "react";
import { DocTypeMeta, DocTypeField, FieldType } from "@/types/frappe";
import { computeFieldDependsState, FieldDependsState } from "@/lib/depends-on";
import { DataField } from "@/components/forms/fields/data-field";
import { SelectField } from "@/components/forms/fields/select-field";
import { DateField } from "@/components/forms/fields/date-field";
import { DatetimeField } from "@/components/forms/fields/datetime-field";
import { LinkField } from "@/components/forms/fields/link-field";
import { CheckField } from "@/components/forms/fields/check-field";
import { TableField } from "@/components/forms/fields/table-field";
import { TextField } from "@/components/forms/fields/text-field";
import { TextEditorField } from "@/components/forms/fields/text-editor-field";
import { MultiSelectField } from "@/components/forms/fields/multiselect-field";
import { AttachField } from "@/components/forms/fields/attach-field";
import { AttachImageField } from "@/components/forms/fields/attach-image-field";
import { DynamicLinkField } from "@/components/forms/fields/dynamic-link-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DynamicFormProps<T extends FieldValues> {
  docMeta: DocTypeMeta;
  initialData?: Partial<T>;
  onSubmit: (data: T) => void | Promise<void>;
  isLoading?: boolean;
  formId?: string;
  /** Child DocType metadata map - needed for rendering Table fields */
  childDocMetas?: Record<string, DocTypeMeta>;
}

interface Section {
  label: string;
  fields: DocTypeField[];
  columns: Column[];
}

interface Column {
  fields: DocTypeField[];
}

/**
 * Parse options string from Frappe Select field to array of options
 * Options are newline-separated in Frappe
 */
function parseSelectOptions(options?: string): { value: string; label: string }[] {
  if (!options) return [];
  return options
    .split("\n")
    .filter((opt) => opt.trim())
    .map((opt) => ({
      value: opt.trim(),
      label: opt.trim(),
    }));
}

/**
 * Group fields by Section Break and Column Break
 */
function groupFieldsBySections(fields: DocTypeField[]): Section[] {
  const sections: Section[] = [];
  let currentSection: Section = {
    label: "",
    fields: [],
    columns: [{ fields: [] }],
  };
  let currentColumnIndex = 0;

  // Fields to always exclude from the form
  const excludedFields = ["naming_series"];

  for (const field of fields) {
    // Skip hidden fields and excluded fields
    if (field.hidden === 1) continue;
    if (excludedFields.includes(field.fieldname)) continue;

    if (field.fieldtype === "Section Break") {
      // Save current section if it has fields
      if (currentSection.columns.some((col) => col.fields.length > 0)) {
        sections.push(currentSection);
      }
      // Start new section
      currentSection = {
        label: field.label || "",
        fields: [],
        columns: [{ fields: [] }],
      };
      currentColumnIndex = 0;
    } else if (field.fieldtype === "Column Break") {
      // Start new column in current section
      currentColumnIndex++;
      currentSection.columns.push({ fields: [] });
    } else if (field.fieldtype === "Tab Break") {
      // For now, treat Tab Break like Section Break
      if (currentSection.columns.some((col) => col.fields.length > 0)) {
        sections.push(currentSection);
      }
      currentSection = {
        label: field.label || "",
        fields: [],
        columns: [{ fields: [] }],
      };
      currentColumnIndex = 0;
    } else if (!isLayoutField(field.fieldtype)) {
      // Add field to current column
      if (currentSection.columns[currentColumnIndex]) {
        currentSection.columns[currentColumnIndex].fields.push(field);
      }
    }
  }

  // Add the last section if it has fields
  if (currentSection.columns.some((col) => col.fields.length > 0)) {
    sections.push(currentSection);
  }

  // If no sections were created, create a default one
  if (sections.length === 0 && fields.length > 0) {
    const defaultSection: Section = {
      label: "",
      fields: [],
      columns: [{ fields: fields.filter((f) => !isLayoutField(f.fieldtype) && f.hidden !== 1) }],
    };
    sections.push(defaultSection);
  }

  return sections;
}

/**
 * Check if field type is a layout field (not a data field)
 */
function isLayoutField(fieldtype: FieldType): boolean {
  return ["Section Break", "Column Break", "Tab Break"].includes(fieldtype);
}

/**
 * Hook to compute field depends_on state reactively
 * Watches form values and re-computes when they change
 */
function useFieldDependsState<T extends FieldValues>(
  field: DocTypeField,
  control: Control<T>
): FieldDependsState {
  // Watch all form values to react to changes
  const formValues = useWatch({ control }) as Record<string, unknown>;

  // Compute field state based on current form values
  return useMemo(
    () => computeFieldDependsState(field, formValues),
    [field, formValues]
  );
}

/**
 * Wrapper component that handles depends_on visibility
 */
function DependsOnFieldWrapper<T extends FieldValues>({
  field,
  control,
  children,
}: {
  field: DocTypeField;
  control: Control<T>;
  children: (state: FieldDependsState) => React.ReactNode;
}) {
  const state = useFieldDependsState(field, control);

  // Don't render if field is not visible
  if (!state.isVisible) {
    return null;
  }

  return <>{children(state)}</>;
}

/**
 * Build default values from fields and initial data
 */
function buildDefaultValues<T extends FieldValues>(
  fields: DocTypeField[],
  initialData?: Partial<T>
): DefaultValues<T> {
  const defaults: Record<string, unknown> = {};

  for (const field of fields) {
    if (isLayoutField(field.fieldtype) || field.hidden === 1) continue;

    // Use initial data if available, otherwise use field default
    if (initialData && field.fieldname in initialData) {
      defaults[field.fieldname] = initialData[field.fieldname];
    } else if (field.fieldtype === "Table" || field.fieldtype === "Table MultiSelect" || field.fieldtype === "MultiSelect") {
      // Initialize table fields as empty arrays
      defaults[field.fieldname] = [];
    } else if (field.default) {
      defaults[field.fieldname] = field.default;
    } else {
      defaults[field.fieldname] = "";
    }
  }

  return defaults as DefaultValues<T>;
}

export function DynamicForm<T extends FieldValues>({
  docMeta,
  initialData,
  onSubmit,
  isLoading = false,
  formId = "dynamic-form",
  childDocMetas = {},
}: DynamicFormProps<T>) {
  const sections = useMemo(
    () => groupFieldsBySections(docMeta.fields),
    [docMeta.fields]
  );

  const defaultValues = useMemo(
    () => buildDefaultValues<T>(docMeta.fields, initialData),
    [docMeta.fields, initialData]
  );

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<T>({
    defaultValues,
  });

  // Render a field with depends_on state
  const renderFieldWithState = useCallback(
    (field: DocTypeField, dependsState: FieldDependsState) => {
      const isRequired = dependsState.isRequired;
      const isReadOnly = dependsState.isReadOnly || isLoading;

    switch (field.fieldtype) {
      case "Data":
      case "Small Text":
      case "Password":
      case "Read Only":
        return (
          <DataField
            key={field.fieldname}
            name={field.fieldname as never}
            control={control}
            label={field.label}
            placeholder={field.description}
            required={isRequired}
            readOnly={isReadOnly}
            description={field.description}
          />
        );

      case "Select":
        return (
          <SelectField
            key={field.fieldname}
            name={field.fieldname as never}
            control={control}
            label={field.label}
            options={parseSelectOptions(field.options)}
            required={isRequired}
            readOnly={isReadOnly}
            description={field.description}
          />
        );

      case "Date":
        return (
          <DateField
            key={field.fieldname}
            name={field.fieldname as never}
            control={control}
            label={field.label}
            required={isRequired}
            readOnly={isReadOnly}
            description={field.description}
          />
        );

      case "Link":
        return (
          <LinkField
            key={field.fieldname}
            name={field.fieldname as never}
            control={control}
            label={field.label}
            doctype={field.options || ""}
            required={isRequired}
            readOnly={isReadOnly}
            description={field.description}
          />
        );

      case "Int":
      case "Float":
      case "Currency":
        return (
          <DataField
            key={field.fieldname}
            name={field.fieldname as never}
            control={control}
            label={field.label}
            placeholder={field.description}
            required={isRequired}
            readOnly={isReadOnly}
            description={field.description}
          />
        );

      case "Check":
        return (
          <CheckField
            key={field.fieldname}
            name={field.fieldname as never}
            control={control}
            label={field.label}
            required={isRequired}
            readOnly={isReadOnly}
            description={field.description}
          />
        );

      case "Text":
      case "Long Text":
        return (
          <TextField
            key={field.fieldname}
            name={field.fieldname as never}
            control={control}
            label={field.label}
            placeholder={field.description}
            required={isRequired}
            readOnly={isReadOnly}
            description={field.description}
          />
        );

      case "Text Editor":
      case "HTML":
        return (
          <TextEditorField
            key={field.fieldname}
            name={field.fieldname as never}
            control={control}
            label={field.label}
            placeholder={field.description}
            required={isRequired}
            readOnly={isReadOnly}
            description={field.description}
          />
        );

      case "Datetime":
        return (
          <DatetimeField
            key={field.fieldname}
            name={field.fieldname as never}
            control={control}
            label={field.label}
            required={isRequired}
            readOnly={isReadOnly}
            description={field.description}
          />
        );

      case "Time":
        // Time field - use DataField with time input type for now
        return (
          <DataField
            key={field.fieldname}
            name={field.fieldname as never}
            control={control}
            label={field.label}
            placeholder="HH:MM:SS"
            required={isRequired}
            readOnly={isReadOnly}
            description={field.description}
          />
        );

      case "Attach":
        return (
          <AttachField
            key={field.fieldname}
            name={field.fieldname as never}
            control={control}
            label={field.label}
            required={isRequired}
            readOnly={isReadOnly}
            description={field.description}
          />
        );

      case "Attach Image":
        return (
          <AttachImageField
            key={field.fieldname}
            name={field.fieldname as never}
            control={control}
            label={field.label}
            required={isRequired}
            readOnly={isReadOnly}
            description={field.description}
          />
        );

      case "MultiSelect":
        return (
          <MultiSelectField
            key={field.fieldname}
            name={field.fieldname as never}
            control={control}
            label={field.label}
            options={parseSelectOptions(field.options)}
            required={isRequired}
            readOnly={isReadOnly}
            description={field.description}
          />
        );

      case "Table":
      case "Table MultiSelect": {
        // Get the child DocType name from field.options
        const childDoctype = field.options || "";
        const childMeta = childDocMetas[childDoctype];

        if (!childMeta) {
          // Fallback: show placeholder if child meta is not available
          return (
            <div key={field.fieldname} className="space-y-2">
              <Card className="border-dashed">
                <CardHeader className="py-3">
                  <CardTitle className="text-base font-medium">
                    {field.label}
                    {isRequired && <span className="text-destructive ml-1">*</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4">
                  <p className="text-sm text-muted-foreground">
                    Loading child table for: {childDoctype}...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tip: Pass childDocMetas prop with metadata for &quot;{childDoctype}&quot;
                  </p>
                </CardContent>
              </Card>
            </div>
          );
        }

        return (
          <TableField
            key={field.fieldname}
            name={field.fieldname as never}
            control={control}
            label={field.label}
            doctype={childDoctype}
            fields={childMeta.fields}
            required={isRequired}
            readOnly={isReadOnly}
          />
        );
      }

      case "Dynamic Link":
        return (
          <DynamicLinkField
            key={field.fieldname}
            name={field.fieldname as never}
            control={control}
            label={field.label}
            options={field.options || ""}
            required={isRequired}
            readOnly={isReadOnly}
            description={field.description}
          />
        );

      default:
        // Fallback to Data field for unknown types
        return (
          <DataField
            key={field.fieldname}
            name={field.fieldname as never}
            control={control}
            label={field.label}
            placeholder={field.description}
            required={isRequired}
            readOnly={isReadOnly}
            description={field.description}
          />
        );
    }
  }, [control, isLoading, childDocMetas]);

  // Wrap field rendering with depends_on evaluation
  const renderField = useCallback(
    (field: DocTypeField) => {
      // Check if field has any depends_on expressions
      const hasDependsOn = field.depends_on || field.mandatory_depends_on || field.read_only_depends_on;

      if (!hasDependsOn) {
        // No depends_on - render with default state
        const defaultState: FieldDependsState = {
          isVisible: field.hidden !== 1,
          isRequired: field.reqd === 1,
          isReadOnly: field.read_only === 1,
        };
        return defaultState.isVisible ? renderFieldWithState(field, defaultState) : null;
      }

      // Has depends_on - use wrapper for reactive evaluation
      return (
        <DependsOnFieldWrapper key={field.fieldname} field={field} control={control}>
          {(state) => renderFieldWithState(field, state)}
        </DependsOnFieldWrapper>
      );
    },
    [control, renderFieldWithState]
  );

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      {sections.map((section, sectionIndex) => (
        <Card key={sectionIndex} className="overflow-hidden">
          {section.label && (
            <CardHeader className="border-b bg-muted/50 py-4">
              <CardTitle className="text-lg">{section.label}</CardTitle>
            </CardHeader>
          )}
          <CardContent className={cn("pt-6", !section.label && "pt-6")}>
            <div
              className={cn(
                "grid gap-6",
                section.columns.length > 1 &&
                  `grid-cols-1 md:grid-cols-${section.columns.length}`
              )}
              style={
                section.columns.length > 1
                  ? {
                      gridTemplateColumns: `repeat(${section.columns.length}, minmax(0, 1fr))`,
                    }
                  : undefined
              }
            >
              {section.columns.map((column, columnIndex) => (
                <div key={columnIndex} className="space-y-4">
                  {column.fields.map((field) => renderField(field))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Hidden submit button - form is submitted via external button */}
      <button
        type="submit"
        disabled={isSubmitting || isLoading}
        className="sr-only"
        aria-hidden="true"
      >
        Submit
      </button>
    </form>
  );
}
