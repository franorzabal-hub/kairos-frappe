/**
 * Column Definitions
 *
 * Utility functions for generating table columns from DocType metadata
 */

import { ColumnDef } from "@tanstack/react-table";
import { format, parseISO, isValid } from "date-fns";
import { Check, X, ExternalLink } from "lucide-react";

import { DocTypeField, FieldType } from "@/types/frappe";
import { Badge } from "@/components/ui/badge";

/**
 * Color mapping for Select field options
 * Maps common status/state values to badge variants
 */
const SELECT_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  // Status values
  active: "default",
  enabled: "default",
  approved: "default",
  completed: "default",
  success: "default",
  yes: "default",

  inactive: "secondary",
  disabled: "secondary",
  pending: "secondary",
  draft: "secondary",

  cancelled: "destructive",
  rejected: "destructive",
  failed: "destructive",
  error: "destructive",
  no: "destructive",

  // Default for unknown values
  default: "outline",
};

/**
 * Get badge variant based on the option value
 */
function getBadgeVariant(value: string): "default" | "secondary" | "destructive" | "outline" {
  const normalizedValue = value.toLowerCase().replace(/[^a-z]/g, "");
  return SELECT_COLORS[normalizedValue] ?? "outline";
}

/**
 * Format a date string to a readable format
 */
function formatDate(value: unknown): string {
  if (!value || typeof value !== "string") return "-";

  try {
    const date = parseISO(value);
    if (!isValid(date)) return String(value);
    return format(date, "MMM d, yyyy");
  } catch {
    return String(value);
  }
}

/**
 * Format a datetime string to a readable format
 */
function formatDatetime(value: unknown): string {
  if (!value || typeof value !== "string") return "-";

  try {
    const date = parseISO(value);
    if (!isValid(date)) return String(value);
    return format(date, "MMM d, yyyy h:mm a");
  } catch {
    return String(value);
  }
}

/**
 * Format a currency value
 */
function formatCurrency(value: unknown, currency: string = "USD"): string {
  if (value === null || value === undefined) return "-";

  const numValue = typeof value === "string" ? parseFloat(value) : Number(value);

  if (isNaN(numValue)) return "-";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(numValue);
  } catch {
    return `${currency} ${numValue.toFixed(2)}`;
  }
}

/**
 * Format a number value
 */
function formatNumber(value: unknown, decimals?: number): string {
  if (value === null || value === undefined) return "-";

  const numValue = typeof value === "string" ? parseFloat(value) : Number(value);

  if (isNaN(numValue)) return "-";

  if (decimals !== undefined) {
    return numValue.toFixed(decimals);
  }

  return new Intl.NumberFormat("en-US").format(numValue);
}

/**
 * Cell renderer components for different field types
 */
const CellRenderers = {
  /**
   * Default text cell
   */
  text: (value: unknown) => {
    if (value === null || value === undefined || value === "") return "-";
    return <span className="truncate max-w-[300px]" title={String(value)}>{String(value)}</span>;
  },

  /**
   * Link cell with clickable styling
   */
  link: (value: unknown, doctype?: string) => {
    if (!value) return "-";
    return (
      <span
        className="text-primary hover:underline cursor-pointer inline-flex items-center gap-1"
        title={`Open ${doctype}: ${value}`}
      >
        {String(value)}
        <ExternalLink className="h-3 w-3" />
      </span>
    );
  },

  /**
   * Select/Badge cell
   */
  select: (value: unknown) => {
    if (!value) return "-";
    const stringValue = String(value);
    return (
      <Badge variant={getBadgeVariant(stringValue)}>
        {stringValue}
      </Badge>
    );
  },

  /**
   * Date cell
   */
  date: (value: unknown) => {
    const formatted = formatDate(value);
    return <span className="whitespace-nowrap">{formatted}</span>;
  },

  /**
   * Datetime cell
   */
  datetime: (value: unknown) => {
    const formatted = formatDatetime(value);
    return <span className="whitespace-nowrap">{formatted}</span>;
  },

  /**
   * Checkbox cell
   */
  check: (value: unknown) => {
    const isChecked = value === 1 || value === true || value === "1";
    return isChecked ? (
      <Check className="h-4 w-4 text-green-600" />
    ) : (
      <X className="h-4 w-4 text-muted-foreground" />
    );
  },

  /**
   * Currency cell
   */
  currency: (value: unknown, currency?: string) => {
    const formatted = formatCurrency(value, currency);
    return <span className="font-mono whitespace-nowrap">{formatted}</span>;
  },

  /**
   * Integer cell
   */
  int: (value: unknown) => {
    const formatted = formatNumber(value, 0);
    return <span className="font-mono">{formatted}</span>;
  },

  /**
   * Float cell
   */
  float: (value: unknown, decimals: number = 2) => {
    const formatted = formatNumber(value, decimals);
    return <span className="font-mono">{formatted}</span>;
  },
};

/**
 * Get the appropriate cell renderer for a field type
 */
function getCellRenderer(fieldType: FieldType, options?: string) {
  switch (fieldType) {
    case "Link":
      return (value: unknown) => CellRenderers.link(value, options);

    case "Select":
      return CellRenderers.select;

    case "Date":
      return CellRenderers.date;

    case "Datetime":
      return CellRenderers.datetime;

    case "Check":
      return CellRenderers.check;

    case "Currency":
      return (value: unknown) => CellRenderers.currency(value, options);

    case "Int":
      return CellRenderers.int;

    case "Float":
      return CellRenderers.float;

    case "Data":
    case "Text":
    case "Small Text":
    case "Long Text":
    case "Read Only":
    default:
      return CellRenderers.text;
  }
}

/**
 * Options for column generation
 */
export interface GenerateColumnsOptions {
  /** Only include fields with in_list_view = 1 */
  listViewOnly?: boolean;
  /** Custom cell renderers for specific fields */
  customRenderers?: Record<string, (value: unknown, row: unknown) => React.ReactNode>;
  /** Fields to exclude */
  excludeFields?: string[];
  /** Whether columns should be sortable by default */
  sortable?: boolean;
  /** Callback when a Link field is clicked */
  onLinkClick?: (doctype: string, name: string) => void;
}

/**
 * Generate column definitions from DocType fields
 *
 * @param fields - Array of DocType field definitions
 * @param options - Column generation options
 * @returns Array of TanStack Table column definitions
 */
export function generateColumnsFromMeta<TData extends Record<string, unknown>>(
  fields: DocTypeField[],
  options: GenerateColumnsOptions = {}
): ColumnDef<TData>[] {
  const {
    listViewOnly = true,
    customRenderers = {},
    excludeFields = [],
    sortable = true,
    onLinkClick,
  } = options;

  // Filter out layout fields and excluded fields
  const layoutFields: FieldType[] = ["Section Break", "Column Break", "Tab Break", "Table"];

  const filteredFields = fields.filter((field) => {
    // Skip layout fields
    if (layoutFields.includes(field.fieldtype)) return false;

    // Skip excluded fields
    if (excludeFields.includes(field.fieldname)) return false;

    // Skip hidden fields
    if (field.hidden === 1) return false;

    // If listViewOnly, only include fields marked for list view
    if (listViewOnly && field.in_list_view !== 1) return false;

    return true;
  });

  return filteredFields.map((field): ColumnDef<TData> => {
    const { fieldname, fieldtype, label, options: fieldOptions } = field;

    // Check for custom renderer
    if (customRenderers[fieldname]) {
      return {
        accessorKey: fieldname,
        header: label,
        enableSorting: sortable,
        cell: ({ row }) => customRenderers[fieldname](row.getValue(fieldname), row.original),
      };
    }

    // Get default cell renderer based on field type
    const cellRenderer = getCellRenderer(fieldtype, fieldOptions);

    // Special handling for Link fields with click handler
    if (fieldtype === "Link" && onLinkClick && fieldOptions) {
      return {
        accessorKey: fieldname,
        header: label,
        enableSorting: sortable,
        cell: ({ row }) => {
          const value = row.getValue(fieldname);
          if (!value) return "-";

          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLinkClick(fieldOptions, String(value));
              }}
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              {String(value)}
              <ExternalLink className="h-3 w-3" />
            </button>
          );
        },
      };
    }

    return {
      accessorKey: fieldname,
      header: label,
      enableSorting: sortable && !["Check", "Table"].includes(fieldtype),
      cell: ({ row }) => cellRenderer(row.getValue(fieldname)),
    };
  });
}

/**
 * Generate columns for a simple field list (deprecated, use generateColumnsFromMeta)
 *
 * @deprecated Use generateColumnsFromMeta instead
 */
export function generateColumns(fields: DocTypeField[]): ColumnDef<Record<string, unknown>>[] {
  return generateColumnsFromMeta(fields, { listViewOnly: true });
}

/**
 * Default columns for common document fields
 */
export const defaultColumns: ColumnDef<Record<string, unknown>>[] = [
  {
    accessorKey: "name",
    header: "ID",
    cell: ({ row }) => CellRenderers.text(row.getValue("name")),
  },
  {
    accessorKey: "modified",
    header: "Last Modified",
    cell: ({ row }) => CellRenderers.datetime(row.getValue("modified")),
  },
];

/**
 * Create a column helper for type-safe column definitions
 */
export function createColumnHelper<TData extends Record<string, unknown>>() {
  return {
    /**
     * Create a text column
     */
    text: (accessorKey: keyof TData & string, header: string): ColumnDef<TData> => ({
      accessorKey,
      header,
      cell: ({ row }) => CellRenderers.text(row.getValue(accessorKey)),
    }),

    /**
     * Create a link column
     */
    link: (
      accessorKey: keyof TData & string,
      header: string,
      doctype: string,
      onClick?: (doctype: string, name: string) => void
    ): ColumnDef<TData> => ({
      accessorKey,
      header,
      cell: ({ row }) => {
        const value = row.getValue(accessorKey);
        if (!value) return "-";

        if (onClick) {
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClick(doctype, String(value));
              }}
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              {String(value)}
              <ExternalLink className="h-3 w-3" />
            </button>
          );
        }

        return CellRenderers.link(value, doctype);
      },
    }),

    /**
     * Create a select/badge column
     */
    select: (accessorKey: keyof TData & string, header: string): ColumnDef<TData> => ({
      accessorKey,
      header,
      cell: ({ row }) => CellRenderers.select(row.getValue(accessorKey)),
    }),

    /**
     * Create a date column
     */
    date: (accessorKey: keyof TData & string, header: string): ColumnDef<TData> => ({
      accessorKey,
      header,
      cell: ({ row }) => CellRenderers.date(row.getValue(accessorKey)),
    }),

    /**
     * Create a datetime column
     */
    datetime: (accessorKey: keyof TData & string, header: string): ColumnDef<TData> => ({
      accessorKey,
      header,
      cell: ({ row }) => CellRenderers.datetime(row.getValue(accessorKey)),
    }),

    /**
     * Create a checkbox column
     */
    check: (accessorKey: keyof TData & string, header: string): ColumnDef<TData> => ({
      accessorKey,
      header,
      enableSorting: false,
      cell: ({ row }) => CellRenderers.check(row.getValue(accessorKey)),
    }),

    /**
     * Create a currency column
     */
    currency: (
      accessorKey: keyof TData & string,
      header: string,
      currency: string = "USD"
    ): ColumnDef<TData> => ({
      accessorKey,
      header,
      cell: ({ row }) => CellRenderers.currency(row.getValue(accessorKey), currency),
    }),

    /**
     * Create an integer column
     */
    int: (accessorKey: keyof TData & string, header: string): ColumnDef<TData> => ({
      accessorKey,
      header,
      cell: ({ row }) => CellRenderers.int(row.getValue(accessorKey)),
    }),

    /**
     * Create a float column
     */
    float: (
      accessorKey: keyof TData & string,
      header: string,
      decimals: number = 2
    ): ColumnDef<TData> => ({
      accessorKey,
      header,
      cell: ({ row }) => CellRenderers.float(row.getValue(accessorKey), decimals),
    }),

    /**
     * Create a custom column
     */
    custom: (
      accessorKey: keyof TData & string,
      header: string,
      cell: (value: unknown, row: TData) => React.ReactNode
    ): ColumnDef<TData> => ({
      accessorKey,
      header,
      cell: ({ row }) => cell(row.getValue(accessorKey), row.original),
    }),
  };
}

// Export cell renderers for custom use
export { CellRenderers, formatDate, formatDatetime, formatCurrency, formatNumber };
