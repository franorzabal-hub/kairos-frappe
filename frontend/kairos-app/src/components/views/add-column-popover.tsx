/**
 * Add Column Popover
 *
 * Popover for adding columns to a view with:
 * - Search functionality
 * - Nested navigation for linked DocTypes
 * - Field type grouping
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Hash,
  Calendar,
  Link2,
  List,
  Type,
  ToggleLeft,
  FileText,
  Image,
  Clock,
  Search,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DocTypeField, FieldType } from "@/types/frappe";

// ============================================================================
// Types
// ============================================================================

interface AddColumnPopoverProps {
  /** Available fields to add */
  fields: DocTypeField[];
  /** Fields already visible (to exclude from list) */
  visibleFieldnames: string[];
  /** Callback when a field is selected */
  onSelect: (fieldname: string) => void;
  /** Optional trigger element */
  trigger?: React.ReactNode;
  /** Optional class name */
  className?: string;
}

interface NavigationState {
  /** Current path in the navigation */
  path: Array<{ fieldname: string; label: string; doctype: string }>;
  /** Fields to display at current level */
  fields: DocTypeField[];
}

// ============================================================================
// Constants
// ============================================================================

const FIELD_TYPE_ICONS: Partial<Record<FieldType, React.ReactNode>> = {
  Data: <Type className="h-4 w-4" />,
  "Small Text": <Type className="h-4 w-4" />,
  "Long Text": <FileText className="h-4 w-4" />,
  Text: <FileText className="h-4 w-4" />,
  "Text Editor": <FileText className="h-4 w-4" />,
  Int: <Hash className="h-4 w-4" />,
  Float: <Hash className="h-4 w-4" />,
  Currency: <Hash className="h-4 w-4" />,
  Date: <Calendar className="h-4 w-4" />,
  Datetime: <Calendar className="h-4 w-4" />,
  Time: <Clock className="h-4 w-4" />,
  Link: <Link2 className="h-4 w-4" />,
  Select: <List className="h-4 w-4" />,
  Check: <ToggleLeft className="h-4 w-4" />,
  Attach: <FileText className="h-4 w-4" />,
  "Attach Image": <Image className="h-4 w-4" />,
};

const EXCLUDED_FIELD_TYPES: FieldType[] = [
  "Section Break",
  "Column Break",
  "Tab Break",
  "Table",
  "Table MultiSelect",
  "HTML",
  "Password",
];

// ============================================================================
// Helper Functions
// ============================================================================

function getFieldIcon(fieldtype: FieldType): React.ReactNode {
  return FIELD_TYPE_ICONS[fieldtype] || <Type className="h-4 w-4" />;
}

function filterFields(
  fields: DocTypeField[],
  visibleFieldnames: string[],
  searchQuery: string
): DocTypeField[] {
  const visibleSet = new Set(visibleFieldnames);
  const query = searchQuery.toLowerCase().trim();

  return fields.filter((field) => {
    // Exclude already visible fields
    if (visibleSet.has(field.fieldname)) return false;

    // Exclude layout fields
    if (EXCLUDED_FIELD_TYPES.includes(field.fieldtype)) return false;

    // Filter by search query
    if (query) {
      const labelMatch = field.label?.toLowerCase().includes(query);
      const fieldnameMatch = field.fieldname.toLowerCase().includes(query);
      return labelMatch || fieldnameMatch;
    }

    return true;
  });
}

// ============================================================================
// Field Item Component
// ============================================================================

interface FieldItemProps {
  field: DocTypeField;
  onSelect: (fieldname: string) => void;
  onNavigate?: (field: DocTypeField) => void;
}

function FieldItem({ field, onSelect, onNavigate }: FieldItemProps) {
  const isLink = field.fieldtype === "Link" && field.options;
  const icon = getFieldIcon(field.fieldtype);

  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2 text-left",
        "rounded-md hover:bg-muted/50 transition-colors",
        "group"
      )}
      onClick={() => {
        if (isLink && onNavigate) {
          onNavigate(field);
        } else {
          onSelect(field.fieldname);
        }
      }}
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1 text-sm truncate">{field.label}</span>
      {isLink && (
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AddColumnPopover({
  fields,
  visibleFieldnames,
  onSelect,
  trigger,
  className,
}: AddColumnPopoverProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [navigation, setNavigation] = useState<NavigationState>({
    path: [],
    fields: [],
  });

  // Get filtered fields at current level
  const filteredFields = useMemo(() => {
    const baseFields = navigation.path.length > 0 ? navigation.fields : fields;
    return filterFields(baseFields, visibleFieldnames, searchQuery);
  }, [fields, visibleFieldnames, searchQuery, navigation]);

  // Group fields by type for better organization
  const groupedFields = useMemo(() => {
    const groups: Record<string, DocTypeField[]> = {
      text: [],
      number: [],
      date: [],
      relation: [],
      selection: [],
      other: [],
    };

    filteredFields.forEach((field) => {
      switch (field.fieldtype) {
        case "Data":
        case "Small Text":
        case "Long Text":
        case "Text":
        case "Text Editor":
          groups.text.push(field);
          break;
        case "Int":
        case "Float":
        case "Currency":
          groups.number.push(field);
          break;
        case "Date":
        case "Datetime":
        case "Time":
          groups.date.push(field);
          break;
        case "Link":
        case "Dynamic Link":
          groups.relation.push(field);
          break;
        case "Select":
        case "MultiSelect":
          groups.selection.push(field);
          break;
        default:
          groups.other.push(field);
      }
    });

    return groups;
  }, [filteredFields]);

  // Handle field selection
  const handleSelect = useCallback(
    (fieldname: string) => {
      // Build full path for nested fields
      const fullPath =
        navigation.path.length > 0
          ? [...navigation.path.map((p) => p.fieldname), fieldname].join(".")
          : fieldname;

      onSelect(fullPath);
      setOpen(false);
      setSearchQuery("");
      setNavigation({ path: [], fields: [] });
    },
    [navigation.path, onSelect]
  );

  // Handle navigation into a linked DocType
  const handleNavigate = useCallback((field: DocTypeField) => {
    // In a real implementation, we would fetch the fields of the linked DocType
    // For now, we'll just show a message that nested fields are not available
    setNavigation((prev) => ({
      path: [
        ...prev.path,
        {
          fieldname: field.fieldname,
          label: field.label,
          doctype: field.options || "",
        },
      ],
      fields: [], // Would be populated from API
    }));
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    setNavigation((prev) => ({
      path: prev.path.slice(0, -1),
      fields: prev.path.length > 1 ? prev.fields : [],
    }));
  }, []);

  // Reset on close
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchQuery("");
      setNavigation({ path: [], fields: [] });
    }
  }, []);

  const currentLevel =
    navigation.path.length > 0
      ? navigation.path[navigation.path.length - 1]
      : null;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-2", className)}
          >
            <Plus className="h-4 w-4" />
            Add column
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        {/* Header */}
        <div className="p-2 border-b">
          {currentLevel ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleBack}
                className="h-7 w-7"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {currentLevel.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentLevel.doctype}
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search attributes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
          )}
        </div>

        {/* Field List */}
        <ScrollArea className="max-h-80">
          <div className="p-1">
            {filteredFields.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "No attributes found"
                    : navigation.path.length > 0
                    ? "Nested attributes not available yet"
                    : "All attributes are already visible"}
                </p>
              </div>
            ) : (
              <>
                {/* Relation fields first (for navigation) */}
                {groupedFields.relation.length > 0 && (
                  <div className="mb-1">
                    {groupedFields.relation.map((field) => (
                      <FieldItem
                        key={field.fieldname}
                        field={field}
                        onSelect={handleSelect}
                        onNavigate={handleNavigate}
                      />
                    ))}
                  </div>
                )}

                {/* Other fields */}
                {[
                  ...groupedFields.text,
                  ...groupedFields.number,
                  ...groupedFields.date,
                  ...groupedFields.selection,
                  ...groupedFields.other,
                ].map((field) => (
                  <FieldItem
                    key={field.fieldname}
                    field={field}
                    onSelect={handleSelect}
                  />
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export default AddColumnPopover;
