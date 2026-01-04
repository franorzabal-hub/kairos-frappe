/**
 * Filter Builder Component
 *
 * UI for building filter conditions with multiple fields and operators.
 * Supports all Frappe filter operators and field types.
 */

"use client";

import { useCallback } from "react";
import { X, Plus, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DocTypeField } from "@/types/frappe";
import {
  FilterCondition,
  FilterOperator,
  OperatorDef,
  OPERATORS,
  TIMESPAN_OPTIONS,
  TimespanValue,
  getOperatorsForField,
  getDefaultOperator,
  createEmptyFilter,
  isValidFilter,
} from "@/lib/filters";

// ============================================================================
// Types
// ============================================================================

interface FilterBuilderProps {
  /** Available fields to filter on */
  fields: DocTypeField[];
  /** Current filter conditions */
  filters: FilterCondition[];
  /** Callback when filters change */
  onFiltersChange: (filters: FilterCondition[]) => void;
  /** Max number of filters allowed */
  maxFilters?: number;
  /** Class name for container */
  className?: string;
}

interface FilterRowProps {
  filter: FilterCondition;
  fields: DocTypeField[];
  onChange: (filter: FilterCondition) => void;
  onRemove: () => void;
}

// ============================================================================
// Filter Row Component
// ============================================================================

function FilterRow({ filter, fields, onChange, onRemove }: FilterRowProps) {
  // Find the selected field
  const selectedField = fields.find((f) => f.fieldname === filter.fieldname);

  // Get applicable operators for the selected field
  const applicableOperators = selectedField
    ? getOperatorsForField(selectedField)
    : OPERATORS;

  // Current operator definition
  const currentOperator = OPERATORS.find((op) => op.value === filter.operator);

  // Handle field change
  const handleFieldChange = useCallback(
    (fieldname: string) => {
      const field = fields.find((f) => f.fieldname === fieldname);
      onChange({
        ...filter,
        fieldname,
        operator: field ? getDefaultOperator(field) : "=",
        value: "",
        value2: null,
      });
    },
    [filter, fields, onChange]
  );

  // Handle operator change
  const handleOperatorChange = useCallback(
    (operator: FilterOperator) => {
      const opDef = OPERATORS.find((op) => op.value === operator);
      onChange({
        ...filter,
        operator,
        // Reset value when changing to special operators
        value: opDef?.valueCount === 0 ? "set" : opDef?.valueCount === "list" ? [] : "",
        value2: null,
      });
    },
    [filter, onChange]
  );

  // Handle value change
  const handleValueChange = useCallback(
    (value: string | string[]) => {
      onChange({ ...filter, value });
    },
    [filter, onChange]
  );

  // Handle second value change (for "between")
  const handleValue2Change = useCallback(
    (value2: string) => {
      onChange({ ...filter, value2 });
    },
    [filter, onChange]
  );

  // Render value input based on operator and field type
  const renderValueInput = () => {
    if (!currentOperator || !selectedField) {
      return (
        <Input
          placeholder="Value"
          value={typeof filter.value === "string" ? filter.value : ""}
          onChange={(e) => handleValueChange(e.target.value)}
          className="flex-1"
        />
      );
    }

    // No value needed for "is set" type operators
    if (currentOperator.valueCount === 0) {
      return (
        <Select
          value={filter.value as string || "set"}
          onValueChange={handleValueChange}
        >
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="set">set</SelectItem>
            <SelectItem value="not set">not set</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    // Timespan selector for date fields
    if (filter.operator === "timespan") {
      return (
        <Select
          value={filter.value as string}
          onValueChange={handleValueChange}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select timespan" />
          </SelectTrigger>
          <SelectContent>
            {TIMESPAN_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Select field options
    if (selectedField.fieldtype === "Select" && selectedField.options) {
      const options = selectedField.options.split("\n").filter(Boolean);

      if (currentOperator.valueCount === "list") {
        // Multi-select for "in" / "not in"
        const selectedValues: string[] = Array.isArray(filter.value)
          ? (filter.value as string[])
          : filter.value
            ? [String(filter.value)]
            : [];

        return (
          <div className="flex-1 flex flex-wrap gap-1 p-2 border rounded-md min-h-9">
            {options.map((opt) => {
              const isSelected = selectedValues.includes(opt);
              return (
                <Badge
                  key={opt}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    const newValues = isSelected
                      ? selectedValues.filter((v) => v !== opt)
                      : [...selectedValues, opt];
                    handleValueChange(newValues);
                  }}
                >
                  {opt}
                </Badge>
              );
            })}
          </div>
        );
      }

      return (
        <Select
          value={filter.value as string}
          onValueChange={handleValueChange}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Check field
    if (selectedField.fieldtype === "Check") {
      return (
        <Select
          value={filter.value === 1 || filter.value === "1" ? "1" : "0"}
          onValueChange={handleValueChange}
        >
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Yes</SelectItem>
            <SelectItem value="0">No</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    // Date/Datetime input
    if (selectedField.fieldtype === "Date") {
      if (currentOperator.valueCount === 2) {
        // Between - two date inputs
        return (
          <div className="flex-1 flex gap-2">
            <Input
              type="date"
              value={filter.value as string}
              onChange={(e) => handleValueChange(e.target.value)}
              className="flex-1"
            />
            <span className="self-center text-muted-foreground">and</span>
            <Input
              type="date"
              value={filter.value2 as string || ""}
              onChange={(e) => handleValue2Change(e.target.value)}
              className="flex-1"
            />
          </div>
        );
      }
      return (
        <Input
          type="date"
          value={filter.value as string}
          onChange={(e) => handleValueChange(e.target.value)}
          className="flex-1"
        />
      );
    }

    if (selectedField.fieldtype === "Datetime") {
      if (currentOperator.valueCount === 2) {
        return (
          <div className="flex-1 flex gap-2">
            <Input
              type="datetime-local"
              value={filter.value as string}
              onChange={(e) => handleValueChange(e.target.value)}
              className="flex-1"
            />
            <span className="self-center text-muted-foreground">and</span>
            <Input
              type="datetime-local"
              value={filter.value2 as string || ""}
              onChange={(e) => handleValue2Change(e.target.value)}
              className="flex-1"
            />
          </div>
        );
      }
      return (
        <Input
          type="datetime-local"
          value={filter.value as string}
          onChange={(e) => handleValueChange(e.target.value)}
          className="flex-1"
        />
      );
    }

    // Number input
    if (["Int", "Float", "Currency", "Percent"].includes(selectedField.fieldtype)) {
      if (currentOperator.valueCount === 2) {
        return (
          <div className="flex-1 flex gap-2">
            <Input
              type="number"
              value={filter.value as string}
              onChange={(e) => handleValueChange(e.target.value)}
              className="flex-1"
              placeholder="Min"
            />
            <span className="self-center text-muted-foreground">and</span>
            <Input
              type="number"
              value={filter.value2 as string || ""}
              onChange={(e) => handleValue2Change(e.target.value)}
              className="flex-1"
              placeholder="Max"
            />
          </div>
        );
      }
      return (
        <Input
          type="number"
          value={filter.value as string}
          onChange={(e) => handleValueChange(e.target.value)}
          className="flex-1"
          placeholder="Value"
        />
      );
    }

    // Default text input
    return (
      <Input
        placeholder="Value"
        value={typeof filter.value === "string" ? filter.value : ""}
        onChange={(e) => handleValueChange(e.target.value)}
        className="flex-1"
      />
    );
  };

  return (
    <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
      {/* Field selector */}
      <Select value={filter.fieldname} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Select field" />
        </SelectTrigger>
        <SelectContent>
          {fields.map((field) => (
            <SelectItem key={field.fieldname} value={field.fieldname}>
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator selector */}
      <Select
        value={filter.operator}
        onValueChange={(v) => handleOperatorChange(v as FilterOperator)}
        disabled={!filter.fieldname}
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {applicableOperators.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value input */}
      {renderValueInput()}

      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="shrink-0"
        aria-label="Remove filter"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ============================================================================
// Filter Builder Component
// ============================================================================

export function FilterBuilder({
  fields,
  filters,
  onFiltersChange,
  maxFilters = 10,
  className,
}: FilterBuilderProps) {
  // Filter out layout fields
  const filterableFields = fields.filter(
    (f) =>
      !["Section Break", "Column Break", "Tab Break", "HTML"].includes(f.fieldtype) &&
      f.hidden !== 1
  );

  // Count valid filters for badge
  const validFilterCount = filters.filter(isValidFilter).length;

  // Add new filter
  const handleAddFilter = useCallback(() => {
    if (filters.length >= maxFilters) return;
    onFiltersChange([...filters, createEmptyFilter()]);
  }, [filters, maxFilters, onFiltersChange]);

  // Update filter
  const handleUpdateFilter = useCallback(
    (index: number, filter: FilterCondition) => {
      const newFilters = [...filters];
      newFilters[index] = filter;
      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange]
  );

  // Remove filter
  const handleRemoveFilter = useCallback(
    (index: number) => {
      const newFilters = filters.filter((_, i) => i !== index);
      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange]
  );

  // Clear all filters
  const handleClearAll = useCallback(() => {
    onFiltersChange([]);
  }, [onFiltersChange]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("gap-2", className)}>
          <Filter className="h-4 w-4" />
          Filters
          {validFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {validFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-4" align="start">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filters</h4>
            {filters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-muted-foreground"
              >
                Clear all
              </Button>
            )}
          </div>

          {/* Filter rows */}
          <div className="space-y-2">
            {filters.map((filter, index) => (
              <FilterRow
                key={filter.id}
                filter={filter}
                fields={filterableFields}
                onChange={(f) => handleUpdateFilter(index, f)}
                onRemove={() => handleRemoveFilter(index)}
              />
            ))}
          </div>

          {/* Add filter button */}
          {filters.length < maxFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddFilter}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Filter
            </Button>
          )}

          {/* Empty state */}
          {filters.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No filters applied. Click &quot;Add Filter&quot; to get started.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Active Filters Display (for showing applied filters inline)
// ============================================================================

interface ActiveFiltersProps {
  filters: FilterCondition[];
  fields: DocTypeField[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export function ActiveFilters({
  filters,
  fields,
  onRemove,
  onClearAll,
}: ActiveFiltersProps) {
  const validFilters = filters.filter(isValidFilter);

  if (validFilters.length === 0) return null;

  const getFieldLabel = (fieldname: string): string => {
    const field = fields.find((f) => f.fieldname === fieldname);
    return field?.label || fieldname;
  };

  const getOperatorLabel = (operator: FilterOperator): string => {
    const op = OPERATORS.find((o) => o.value === operator);
    return op?.label || operator;
  };

  const formatValue = (filter: FilterCondition): string => {
    if (filter.operator === "between") {
      return `${filter.value} - ${filter.value2}`;
    }
    if (Array.isArray(filter.value)) {
      return filter.value.join(", ");
    }
    return String(filter.value);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {validFilters.map((filter) => (
        <Badge
          key={filter.id}
          variant="secondary"
          className="gap-1 pr-1"
        >
          <span className="font-medium">{getFieldLabel(filter.fieldname)}</span>
          <span className="text-muted-foreground">{getOperatorLabel(filter.operator)}</span>
          <span>&quot;{formatValue(filter)}&quot;</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onRemove(filter.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      {validFilters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 px-2 text-xs"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
