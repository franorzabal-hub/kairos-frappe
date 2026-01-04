/**
 * Filter Operators and Utilities
 *
 * Defines filter operators compatible with Frappe's query system
 * and utilities for building and serializing filter expressions.
 *
 * Frappe filter format: [doctype, fieldname, operator, value]
 * or simple: [fieldname, operator, value]
 */

import { DocTypeField } from "@/types/frappe";

// ============================================================================
// Types
// ============================================================================

/**
 * Available filter operators
 */
export type FilterOperator =
  | "="       // Equals
  | "!="      // Not equals
  | "like"    // Contains (SQL LIKE with %)
  | "not like" // Does not contain
  | ">"       // Greater than
  | "<"       // Less than
  | ">="      // Greater than or equal
  | "<="      // Less than or equal
  | "in"      // In list
  | "not in"  // Not in list
  | "between" // Between two values
  | "is"      // Is set / not set (null check)
  | "timespan"; // Date/time relative (today, this week, etc.)

/**
 * Operator definition with metadata
 */
export interface OperatorDef {
  value: FilterOperator;
  label: string;
  /** Number of values required (0=special, 1=single, 2=range) */
  valueCount: 0 | 1 | 2 | "list";
  /** Field types this operator applies to */
  applicableTo: FieldTypeGroup[];
}

/**
 * Field type groups for operator applicability
 */
export type FieldTypeGroup =
  | "text"     // Data, Text, Small Text, etc.
  | "number"   // Int, Float, Currency, Percent
  | "date"     // Date, Datetime
  | "select"   // Select, Link
  | "check"    // Check (boolean)
  | "all";     // Applies to all types

/**
 * Single filter condition
 */
export interface FilterCondition {
  /** Unique ID for React keys */
  id: string;
  /** Field name to filter on */
  fieldname: string;
  /** Filter operator */
  operator: FilterOperator;
  /** Filter value(s) */
  value: FilterValue;
  /** For "between" operator */
  value2?: string | number | null;
}

/**
 * Filter value types
 */
export type FilterValue =
  | string
  | number
  | boolean
  | null
  | string[]   // For "in" operator
  | number[];  // For "in" operator

/**
 * Timespan options for date filters
 */
export type TimespanValue =
  | "today"
  | "yesterday"
  | "tomorrow"
  | "this week"
  | "last week"
  | "next week"
  | "this month"
  | "last month"
  | "next month"
  | "this quarter"
  | "last quarter"
  | "this year"
  | "last year";

// ============================================================================
// Operator Definitions
// ============================================================================

/**
 * All available operators with metadata
 */
export const OPERATORS: OperatorDef[] = [
  { value: "=", label: "equals", valueCount: 1, applicableTo: ["all"] },
  { value: "!=", label: "not equals", valueCount: 1, applicableTo: ["all"] },
  { value: "like", label: "contains", valueCount: 1, applicableTo: ["text"] },
  { value: "not like", label: "does not contain", valueCount: 1, applicableTo: ["text"] },
  { value: ">", label: "greater than", valueCount: 1, applicableTo: ["number", "date"] },
  { value: "<", label: "less than", valueCount: 1, applicableTo: ["number", "date"] },
  { value: ">=", label: "greater or equal", valueCount: 1, applicableTo: ["number", "date"] },
  { value: "<=", label: "less or equal", valueCount: 1, applicableTo: ["number", "date"] },
  { value: "in", label: "is one of", valueCount: "list", applicableTo: ["text", "select"] },
  { value: "not in", label: "is not one of", valueCount: "list", applicableTo: ["text", "select"] },
  { value: "between", label: "between", valueCount: 2, applicableTo: ["number", "date"] },
  { value: "is", label: "is set", valueCount: 0, applicableTo: ["all"] },
  { value: "timespan", label: "within", valueCount: 1, applicableTo: ["date"] },
];

/**
 * Timespan options for relative date filtering
 */
export const TIMESPAN_OPTIONS: { value: TimespanValue; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "this week", label: "This Week" },
  { value: "last week", label: "Last Week" },
  { value: "next week", label: "Next Week" },
  { value: "this month", label: "This Month" },
  { value: "last month", label: "Last Month" },
  { value: "next month", label: "Next Month" },
  { value: "this quarter", label: "This Quarter" },
  { value: "last quarter", label: "Last Quarter" },
  { value: "this year", label: "This Year" },
  { value: "last year", label: "Last Year" },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map field type to field type group
 */
export function getFieldTypeGroup(fieldtype: string): FieldTypeGroup {
  const textTypes = [
    "Data", "Text", "Small Text", "Long Text", "Text Editor",
    "Code", "HTML", "Markdown", "Password", "Read Only",
  ];
  const numberTypes = ["Int", "Float", "Currency", "Percent"];
  const dateTypes = ["Date", "Datetime", "Time"];
  const selectTypes = ["Select", "Link"];
  const checkTypes = ["Check"];

  if (textTypes.includes(fieldtype)) return "text";
  if (numberTypes.includes(fieldtype)) return "number";
  if (dateTypes.includes(fieldtype)) return "date";
  if (selectTypes.includes(fieldtype)) return "select";
  if (checkTypes.includes(fieldtype)) return "check";

  return "text"; // Default to text for unknown types
}

/**
 * Get applicable operators for a field type
 */
export function getOperatorsForField(field: DocTypeField): OperatorDef[] {
  const group = getFieldTypeGroup(field.fieldtype);

  return OPERATORS.filter((op) =>
    op.applicableTo.includes("all") || op.applicableTo.includes(group)
  );
}

/**
 * Get default operator for a field type
 */
export function getDefaultOperator(field: DocTypeField): FilterOperator {
  const group = getFieldTypeGroup(field.fieldtype);

  switch (group) {
    case "text":
      return "like";
    case "number":
    case "date":
    case "select":
    case "check":
      return "=";
    default:
      return "=";
  }
}

/**
 * Generate unique ID for filter condition
 */
export function generateFilterId(): string {
  return `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create empty filter condition
 */
export function createEmptyFilter(field?: DocTypeField): FilterCondition {
  return {
    id: generateFilterId(),
    fieldname: field?.fieldname || "",
    operator: field ? getDefaultOperator(field) : "=",
    value: "",
    value2: null,
  };
}

// ============================================================================
// Serialization (for Frappe API)
// ============================================================================

/**
 * Convert FilterCondition to Frappe filter format
 * Returns [fieldname, operator, value] tuple
 */
export function filterToFrappe(
  filter: FilterCondition
): [string, string, unknown] | [string, string, unknown, unknown] | null {
  const { fieldname, operator, value, value2 } = filter;

  // Skip empty filters
  if (!fieldname) return null;

  // Handle special operators
  switch (operator) {
    case "is":
      // "is set" -> ["fieldname", "is", "set"]
      // "is not set" -> ["fieldname", "is", "not set"]
      return [fieldname, "is", value === "not set" ? "not set" : "set"];

    case "like":
    case "not like":
      // Wrap value with wildcards for LIKE
      const likeValue = typeof value === "string" ? `%${value}%` : value;
      return [fieldname, operator, likeValue];

    case "between":
      // Frappe expects: ["fieldname", "between", [start, end]]
      return [fieldname, "between", [value, value2]];

    case "in":
    case "not in":
      // Ensure value is array
      const listValue = Array.isArray(value) ? value : [value];
      return [fieldname, operator, listValue];

    default:
      return [fieldname, operator, value];
  }
}

/**
 * Convert array of FilterConditions to Frappe filters
 */
export function filtersToFrappe(
  filters: FilterCondition[]
): [string, string, unknown][] {
  return filters
    .map(filterToFrappe)
    .filter((f): f is [string, string, unknown] => f !== null);
}

/**
 * Parse Frappe filter tuple back to FilterCondition
 */
export function frappeToFilter(
  frappeFilter: [string, string, unknown]
): FilterCondition {
  const [fieldname, operator, value] = frappeFilter;

  // Handle "like" - strip wildcards
  if (operator === "like" || operator === "not like") {
    const strValue = typeof value === "string"
      ? value.replace(/^%|%$/g, "")
      : String(value);
    return {
      id: generateFilterId(),
      fieldname,
      operator: operator as FilterOperator,
      value: strValue,
      value2: null,
    };
  }

  // Handle "between"
  if (operator === "between" && Array.isArray(value)) {
    return {
      id: generateFilterId(),
      fieldname,
      operator: "between",
      value: value[0] ?? "",
      value2: value[1] ?? null,
    };
  }

  // Handle "in" / "not in"
  if ((operator === "in" || operator === "not in") && Array.isArray(value)) {
    return {
      id: generateFilterId(),
      fieldname,
      operator: operator as FilterOperator,
      value: value as string[],
      value2: null,
    };
  }

  // Standard operator
  return {
    id: generateFilterId(),
    fieldname,
    operator: operator as FilterOperator,
    value: value as FilterValue,
    value2: null,
  };
}

// ============================================================================
// URL Serialization
// ============================================================================

/**
 * Serialize filters to URL-safe string
 */
export function filtersToUrlParam(filters: FilterCondition[]): string {
  if (filters.length === 0) return "";

  const simplified = filters.map((f) => ({
    f: f.fieldname,
    o: f.operator,
    v: f.value,
    v2: f.value2,
  }));

  return encodeURIComponent(JSON.stringify(simplified));
}

/**
 * Parse filters from URL param
 */
export function urlParamToFilters(param: string): FilterCondition[] {
  if (!param) return [];

  try {
    const parsed = JSON.parse(decodeURIComponent(param));
    return parsed.map((p: { f: string; o: FilterOperator; v: FilterValue; v2?: string | number | null }) => ({
      id: generateFilterId(),
      fieldname: p.f,
      operator: p.o,
      value: p.v,
      value2: p.v2 ?? null,
    }));
  } catch {
    return [];
  }
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Check if a filter condition is valid (has required values)
 */
export function isValidFilter(filter: FilterCondition): boolean {
  if (!filter.fieldname) return false;

  const operator = OPERATORS.find((op) => op.value === filter.operator);
  if (!operator) return false;

  switch (operator.valueCount) {
    case 0:
      // No value needed (e.g., "is set")
      return true;
    case 1:
      return filter.value !== "" && filter.value !== null && filter.value !== undefined;
    case 2:
      return (
        filter.value !== "" &&
        filter.value !== null &&
        filter.value2 !== "" &&
        filter.value2 !== null
      );
    case "list":
      return Array.isArray(filter.value) && filter.value.length > 0;
    default:
      return true;
  }
}

/**
 * Get valid filters only
 */
export function getValidFilters(filters: FilterCondition[]): FilterCondition[] {
  return filters.filter(isValidFilter);
}
