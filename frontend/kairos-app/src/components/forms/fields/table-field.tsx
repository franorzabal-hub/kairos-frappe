/**
 * Table Field Component
 *
 * Child table field for Frappe "Table" field type
 * Renders an editable table with rows that can be added, removed, and reordered
 * Integrates with react-hook-form via useFieldArray
 */

"use client";

import { useCallback, useMemo } from "react";
import {
  Control,
  Controller,
  FieldValues,
  Path,
  useFieldArray,
} from "react-hook-form";
import { Plus, Trash2, GripVertical } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DocTypeField } from "@/types/frappe";

// ============================================================================
// Types
// ============================================================================

interface TableFieldProps<T extends FieldValues> {
  /** Field name for react-hook-form (the array field) */
  name: Path<T>;
  /** react-hook-form control object */
  control: Control<T>;
  /** Field label (displayed in card header) */
  label: string;
  /** The child DocType name */
  doctype: string;
  /** Fields definition for the child table */
  fields: DocTypeField[];
  /** Whether the table is required */
  required?: boolean;
  /** Whether the table is read-only */
  readOnly?: boolean;
  /** Error message (external) */
  error?: string;
  /** Maximum number of rows allowed */
  maxRows?: number;
  /** Additional CSS classes */
  className?: string;
}

interface ChildRowData {
  name?: string;
  idx?: number;
  [key: string]: unknown;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse options string from Frappe Select field to array of options
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
 * Get visible fields (fields with in_list_view = 1)
 */
function getVisibleFields(fields: DocTypeField[]): DocTypeField[] {
  return fields.filter(
    (field) =>
      field.in_list_view === 1 &&
      !["Section Break", "Column Break", "Tab Break"].includes(field.fieldtype)
  );
}

/**
 * Get default value for a field
 */
function getFieldDefaultValue(field: DocTypeField): unknown {
  if (field.default) return field.default;

  switch (field.fieldtype) {
    case "Check":
      return 0;
    case "Int":
    case "Float":
    case "Currency":
      return 0;
    default:
      return "";
  }
}

/**
 * Create empty row with defaults for all fields
 */
function createEmptyRow(fields: DocTypeField[], idx: number): ChildRowData {
  const row: ChildRowData = { idx };

  for (const field of fields) {
    if (!["Section Break", "Column Break", "Tab Break"].includes(field.fieldtype)) {
      row[field.fieldname] = getFieldDefaultValue(field);
    }
  }

  return row;
}

// ============================================================================
// Inline Field Components (Compact versions without labels)
// ============================================================================

interface InlineFieldProps {
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  field: DocTypeField;
  readOnly: boolean;
  hasError: boolean;
}

function InlineDataField({ value, onChange, onBlur, readOnly, hasError }: InlineFieldProps) {
  return (
    <Input
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      readOnly={readOnly}
      disabled={readOnly}
      className={cn(
        "h-8 text-sm",
        hasError && "border-destructive"
      )}
    />
  );
}

function InlineIntField({ value, onChange, onBlur, readOnly, hasError }: InlineFieldProps) {
  return (
    <Input
      type="number"
      value={(value as number) ?? ""}
      onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : "")}
      onBlur={onBlur}
      readOnly={readOnly}
      disabled={readOnly}
      className={cn(
        "h-8 text-sm",
        hasError && "border-destructive"
      )}
    />
  );
}

function InlineFloatField({ value, onChange, onBlur, readOnly, hasError }: InlineFieldProps) {
  return (
    <Input
      type="number"
      step="any"
      value={(value as number) ?? ""}
      onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : "")}
      onBlur={onBlur}
      readOnly={readOnly}
      disabled={readOnly}
      className={cn(
        "h-8 text-sm",
        hasError && "border-destructive"
      )}
    />
  );
}

function InlineSelectField({ value, onChange, field, readOnly, hasError }: InlineFieldProps) {
  const options = parseSelectOptions(field.options);

  return (
    <Select
      value={(value as string) ?? ""}
      onValueChange={onChange}
      disabled={readOnly}
    >
      <SelectTrigger
        className={cn(
          "h-8 text-sm",
          hasError && "border-destructive"
        )}
      >
        <SelectValue placeholder="Select..." />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function InlineCheckField({ value, onChange, readOnly, hasError }: InlineFieldProps) {
  return (
    <div className="flex justify-center">
      <Checkbox
        checked={value === 1 || value === true}
        onCheckedChange={(checked) => onChange(checked ? 1 : 0)}
        disabled={readOnly}
        className={cn(hasError && "border-destructive")}
      />
    </div>
  );
}

function InlineLinkField({ value, onChange, onBlur, field, readOnly, hasError }: InlineFieldProps) {
  // Simple text input for now - could be enhanced with autocomplete
  return (
    <Input
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      readOnly={readOnly}
      disabled={readOnly}
      placeholder={`Search ${field.options}...`}
      className={cn(
        "h-8 text-sm",
        hasError && "border-destructive"
      )}
    />
  );
}

function InlineDateField({ value, onChange, onBlur, readOnly, hasError }: InlineFieldProps) {
  return (
    <Input
      type="date"
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      readOnly={readOnly}
      disabled={readOnly}
      className={cn(
        "h-8 text-sm",
        hasError && "border-destructive"
      )}
    />
  );
}

/**
 * Render the appropriate inline field component based on field type
 */
function renderInlineField(props: InlineFieldProps) {
  const { field } = props;

  switch (field.fieldtype) {
    case "Data":
    case "Small Text":
    case "Password":
    case "Read Only":
    case "Text":
    case "Long Text":
      return <InlineDataField {...props} />;

    case "Int":
      return <InlineIntField {...props} />;

    case "Float":
    case "Currency":
      return <InlineFloatField {...props} />;

    case "Select":
      return <InlineSelectField {...props} />;

    case "Check":
      return <InlineCheckField {...props} />;

    case "Link":
      return <InlineLinkField {...props} />;

    case "Date":
      return <InlineDateField {...props} />;

    case "Datetime":
      return <InlineDataField {...props} />; // Fallback to text for now

    default:
      return <InlineDataField {...props} />;
  }
}

// ============================================================================
// Table Row Component
// ============================================================================

interface TableRowItemProps<T extends FieldValues> {
  index: number;
  control: Control<T>;
  name: Path<T>;
  visibleFields: DocTypeField[];
  readOnly: boolean;
  onRemove: () => void;
}

function TableRowItem<T extends FieldValues>({
  index,
  control,
  name,
  visibleFields,
  readOnly,
  onRemove,
}: TableRowItemProps<T>) {
  return (
    <TableRow>
      {/* Row number / Drag handle */}
      <TableCell className="w-12 text-center text-muted-foreground">
        <div className="flex items-center justify-center gap-1">
          {!readOnly && (
            <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground/50" />
          )}
          <span className="text-xs">{index + 1}</span>
        </div>
      </TableCell>

      {/* Field cells */}
      {visibleFields.map((field) => (
        <TableCell key={field.fieldname} className="p-1">
          <Controller
            name={`${name}.${index}.${field.fieldname}` as Path<T>}
            control={control}
            render={({ field: formField, fieldState: { error } }) =>
              renderInlineField({
                value: formField.value,
                onChange: formField.onChange,
                onBlur: formField.onBlur,
                field,
                readOnly: readOnly || field.read_only === 1,
                hasError: !!error,
              })
            }
          />
        </TableCell>
      ))}

      {/* Actions cell */}
      <TableCell className="w-12 p-1">
        {!readOnly && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            aria-label="Remove row"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function TableField<T extends FieldValues>({
  name,
  control,
  label,
  doctype,
  fields,
  required = false,
  readOnly = false,
  error,
  maxRows,
  className,
}: TableFieldProps<T>) {
  // Get visible fields for table columns
  const visibleFields = useMemo(() => getVisibleFields(fields), [fields]);

  // useFieldArray for managing the array of rows
  const { fields: rows, append, remove } = useFieldArray({
    control,
    name: name as never,
  });

  // Add new row
  const handleAddRow = useCallback(() => {
    if (maxRows && rows.length >= maxRows) return;
    const newRow = createEmptyRow(fields, rows.length + 1);
    append(newRow as never);
  }, [append, fields, maxRows, rows.length]);

  // Remove row
  const handleRemoveRow = useCallback(
    (index: number) => {
      remove(index);
    },
    [remove]
  );

  // Check if can add more rows
  const canAddRow = !readOnly && (!maxRows || rows.length < maxRows);

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header */}
      <CardHeader className="border-b bg-muted/50 py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
            <span className="text-xs text-muted-foreground ml-2 font-normal">
              ({doctype})
            </span>
          </CardTitle>
          {canAddRow && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              className="h-7 gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Row
            </Button>
          )}
        </div>
        {maxRows && (
          <p className="text-xs text-muted-foreground mt-1">
            {rows.length} / {maxRows} rows
          </p>
        )}
      </CardHeader>

      {/* Table content */}
      <CardContent className="p-0">
        {rows.length === 0 ? (
          // Empty state
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-sm">No rows added yet.</p>
            {canAddRow && (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handleAddRow}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add first row
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                {/* Row number header */}
                <TableHead className="w-12 text-center">#</TableHead>

                {/* Field headers */}
                {visibleFields.map((field) => (
                  <TableHead key={field.fieldname} className="text-xs">
                    {field.label}
                    {field.reqd === 1 && (
                      <span className="text-destructive ml-0.5">*</span>
                    )}
                  </TableHead>
                ))}

                {/* Actions header */}
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((row, index) => (
                <TableRowItem
                  key={row.id}
                  index={index}
                  control={control}
                  name={name}
                  visibleFields={visibleFields}
                  readOnly={readOnly}
                  onRemove={() => handleRemoveRow(index)}
                />
              ))}
            </TableBody>
          </Table>
        )}

        {/* Error message */}
        {error && (
          <div className="px-4 py-2 border-t bg-destructive/5">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
