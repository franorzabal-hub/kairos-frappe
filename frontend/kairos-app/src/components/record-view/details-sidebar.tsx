/**
 * DetailsSidebar Component
 *
 * Right sidebar showing:
 * - Details tab: Field values with inline editing (auto-save on blur)
 * - Comments tab: Comment thread
 */

"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useFrappeUpdateDoc, useFrappeGetDocList } from "frappe-react-sdk";
import { DocTypeField, DocTypeMeta } from "@/types/frappe";
import { Timeline } from "@/components/timeline";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useNotification } from "@/hooks/use-notification";
import {
  Grid3X3,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface DetailsSidebarProps {
  /** DocType metadata */
  meta: DocTypeMeta;
  /** Document data */
  doc: Record<string, unknown>;
  /** DocType name */
  doctype: string;
  /** Document name */
  docname: string;
  /** Whether this is a new record */
  isNew?: boolean;
  /** Custom className */
  className?: string;
  /** Callback when document is updated */
  onUpdate?: () => void;
}

type TabType = "details" | "comments";

// ============================================================================
// Constants
// ============================================================================

const EXCLUDED_FIELDS = [
  "name",
  "owner",
  "creation",
  "modified",
  "modified_by",
  "docstatus",
  "idx",
  "parent",
  "parentfield",
  "parenttype",
  "naming_series",
];

const LAYOUT_FIELD_TYPES = [
  "Section Break",
  "Column Break",
  "Tab Break",
  "HTML",
];

const READ_ONLY_FIELD_TYPES = [
  "Read Only",
  "HTML",
  "Image",
  "Attach",
  "Attach Image",
];

// ============================================================================
// Helper Functions
// ============================================================================

function formatDisplayValue(value: unknown, field: DocTypeField): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (field.fieldtype === "Check") {
    return value ? "Yes" : "No";
  }

  if (field.fieldtype === "Date" && typeof value === "string") {
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return String(value);
    }
  }

  if (field.fieldtype === "Datetime" && typeof value === "string") {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function getSelectOptions(field: DocTypeField): string[] {
  if (!field.options) return [];
  return field.options.split("\n").filter(Boolean);
}

// ============================================================================
// Editable Field Component
// ============================================================================

interface EditableFieldProps {
  field: DocTypeField;
  value: unknown;
  doctype: string;
  docname: string;
  onUpdate?: () => void;
  isNew?: boolean;
}

function EditableField({
  field,
  value,
  doctype,
  docname,
  onUpdate,
  isNew,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>(value != null ? String(value) : "");
  const [isSaving, setIsSaving] = useState(false);
  const [linkSearchOpen, setLinkSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showError } = useNotification();
  const { updateDoc } = useFrappeUpdateDoc();

  // For Link fields, search linked records
  const [linkSearch, setLinkSearch] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: linkOptions } = useFrappeGetDocList<any>(
    field.options || "",
    {
      fields: ["name"],
      filters: linkSearch ? [["name", "like", `%${linkSearch}%`]] : [],
      limit: 10,
    },
    field.fieldtype === "Link" && linkSearchOpen ? `link_${field.options}_${linkSearch}` : null
  );

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset edit value when external value changes
  useEffect(() => {
    setEditValue(value != null ? String(value) : "");
  }, [value]);

  const isReadOnly =
    isNew ||
    field.read_only === 1 ||
    READ_ONLY_FIELD_TYPES.includes(field.fieldtype);

  const handleSave = async (newValue: unknown) => {
    if (isNew || isReadOnly) return;

    // Skip if value hasn't changed
    const currentValue = value ?? "";
    const compareNewValue = newValue ?? "";
    if (String(currentValue) === String(compareNewValue)) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doctype, docname, {
        [field.fieldname]: newValue,
      });
      onUpdate?.();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to save");
      // Reset to original value on error
      setEditValue(value != null ? String(value) : "");
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    if (field.fieldtype === "Check") return; // Checkbox handles its own save
    handleSave(editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave(editValue);
    } else if (e.key === "Escape") {
      setEditValue(value != null ? String(value) : "");
      setIsEditing(false);
    }
  };

  // Render based on field type
  const displayValue = formatDisplayValue(value, field);

  // Check field - inline toggle
  if (field.fieldtype === "Check") {
    return (
      <div className="flex items-center">
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Checkbox
            checked={!!value}
            disabled={isReadOnly}
            onCheckedChange={async (checked) => {
              if (isReadOnly) return;
              setIsSaving(true);
              try {
                await updateDoc(doctype, docname, {
                  [field.fieldname]: checked ? 1 : 0,
                });
                onUpdate?.();
              } catch (error) {
                showError(error instanceof Error ? error.message : "Failed to save");
              } finally {
                setIsSaving(false);
              }
            }}
          />
        )}
      </div>
    );
  }

  // Link field - with autocomplete
  if (field.fieldtype === "Link" && field.options) {
    const slug = field.options.toLowerCase().replace(/ /g, "-");

    if (isReadOnly) {
      return value ? (
        <Link
          href={`/${slug}/${encodeURIComponent(String(value))}`}
          className="text-primary hover:underline truncate block"
        >
          {displayValue}
        </Link>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    }

    return (
      <Popover open={linkSearchOpen} onOpenChange={setLinkSearchOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "w-full text-left text-sm truncate px-2 py-1 -mx-2 rounded hover:bg-accent transition-colors",
              isSaving && "opacity-50"
            )}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : value ? (
              <span className="text-primary">{displayValue}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder={`Search ${field.options}...`}
              value={linkSearch}
              onValueChange={setLinkSearch}
            />
            <CommandList>
              <CommandEmpty>No results found</CommandEmpty>
              <CommandGroup>
                {value != null && value !== "" && (
                  <CommandItem
                    value=""
                    onSelect={() => {
                      handleSave("");
                      setLinkSearchOpen(false);
                    }}
                  >
                    <span className="text-muted-foreground">Clear</span>
                  </CommandItem>
                )}
                {linkOptions?.map((opt: { name: string }) => (
                  <CommandItem
                    key={opt.name}
                    value={opt.name}
                    onSelect={() => {
                      handleSave(opt.name);
                      setLinkSearchOpen(false);
                    }}
                  >
                    {opt.name}
                    {opt.name === String(value) && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  // Select field
  if (field.fieldtype === "Select") {
    const options = getSelectOptions(field);

    if (isReadOnly) {
      return displayValue !== "—" ? (
        <Badge variant="secondary">{displayValue}</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    }

    return (
      <Select
        value={editValue}
        onValueChange={(newValue) => {
          setEditValue(newValue);
          handleSave(newValue);
        }}
        disabled={isSaving}
      >
        <SelectTrigger className="h-7 text-sm border-0 shadow-none px-2 -mx-2 hover:bg-accent">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SelectValue placeholder="—" />
          )}
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

  // Date field
  if (field.fieldtype === "Date") {
    if (isReadOnly) {
      return (
        <span className={displayValue === "—" ? "text-muted-foreground" : ""}>
          {displayValue}
        </span>
      );
    }

    return isEditing ? (
      <Input
        ref={inputRef}
        type="date"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className="h-7 text-sm"
      />
    ) : (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className={cn(
          "w-full text-left text-sm truncate px-2 py-1 -mx-2 rounded hover:bg-accent transition-colors",
          displayValue === "—" && "text-muted-foreground"
        )}
      >
        {displayValue}
      </button>
    );
  }

  // Default: Text input
  if (isReadOnly) {
    return (
      <span className={displayValue === "—" ? "text-muted-foreground" : "truncate block"}>
        {displayValue}
      </span>
    );
  }

  return isEditing ? (
    <Input
      ref={inputRef}
      type={field.fieldtype === "Int" || field.fieldtype === "Float" || field.fieldtype === "Currency" ? "number" : "text"}
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={isSaving}
      className="h-7 text-sm"
    />
  ) : (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className={cn(
        "w-full text-left text-sm truncate px-2 py-1 -mx-2 rounded hover:bg-accent transition-colors",
        displayValue === "—" && "text-muted-foreground"
      )}
    >
      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : displayValue}
    </button>
  );
}

// ============================================================================
// Component
// ============================================================================

export function DetailsSidebar({
  meta,
  doc,
  doctype,
  docname,
  isNew = false,
  className,
  onUpdate,
}: DetailsSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>("details");

  // Get all section names to open by default
  const allSectionNames = useMemo(() => {
    const names = new Set<string>(["Record Details", "System Info"]);
    meta.fields.forEach((field) => {
      if (field.fieldtype === "Section Break" && field.label) {
        names.add(field.label);
      }
    });
    return names;
  }, [meta.fields]);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(allSectionNames);

  // Group fields by section
  const fieldSections = useMemo(() => {
    const sections: { name: string; fields: DocTypeField[] }[] = [];
    let currentSection = { name: "Record Details", fields: [] as DocTypeField[] };

    meta.fields.forEach((field) => {
      if (field.fieldtype === "Section Break") {
        if (currentSection.fields.length > 0) {
          sections.push(currentSection);
        }
        currentSection = {
          name: field.label || "Details",
          fields: [],
        };
      } else if (
        !EXCLUDED_FIELDS.includes(field.fieldname) &&
        !LAYOUT_FIELD_TYPES.includes(field.fieldtype) &&
        field.hidden !== 1 &&
        field.fieldtype !== "Table"
      ) {
        currentSection.fields.push(field);
      }
    });

    if (currentSection.fields.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  }, [meta.fields]);

  // Count comments (placeholder - would come from timeline data)
  const commentCount = 0;

  const toggleSection = (sectionName: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionName)) {
        next.delete(sectionName);
      } else {
        next.add(sectionName);
      }
      return next;
    });
  };

  return (
    <div className={cn("flex flex-col h-full min-h-0 border-l bg-background", className)}>
      {/* Tab header */}
      <div className="flex border-b px-4">
        <TabButton
          active={activeTab === "details"}
          onClick={() => setActiveTab("details")}
          icon={<Grid3X3 className="h-4 w-4" />}
        >
          Details
        </TabButton>
        <TabButton
          active={activeTab === "comments"}
          onClick={() => setActiveTab("comments")}
          icon={<MessageSquare className="h-4 w-4" />}
          count={commentCount}
        >
          Comments
        </TabButton>
      </div>

      {/* Tab content */}
      <ScrollArea className="flex-1 h-0">
        {activeTab === "details" ? (
          <div className="p-4 space-y-4">
            {fieldSections.map((section) => (
              <div key={section.name}>
                {/* Section header */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.name)}
                  className="flex items-center gap-2 w-full text-left py-2 hover:bg-accent/50 rounded -mx-2 px-2 cursor-pointer"
                >
                  {expandedSections.has(section.name) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">{section.name}</span>
                </button>

                {/* Section fields */}
                {expandedSections.has(section.name) && (
                  <div className="space-y-1 mt-2 ml-6">
                    {section.fields.map((field) => (
                      <div key={field.fieldname} className="flex items-center gap-2 py-1">
                        <div className="text-sm text-muted-foreground flex-shrink-0 w-[140px]">
                          {field.label}
                        </div>
                        <div className="text-sm flex-1 min-w-0">
                          <EditableField
                            field={field}
                            value={doc[field.fieldname]}
                            doctype={doctype}
                            docname={docname}
                            onUpdate={onUpdate}
                            isNew={isNew}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* System info section */}
            <Separator className="my-4" />
            <div>
              <button
                type="button"
                onClick={() => toggleSection("System Info")}
                className="flex items-center gap-2 w-full text-left py-2 hover:bg-accent/50 rounded -mx-2 px-2 cursor-pointer"
              >
                {expandedSections.has("System Info") ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">System Info</span>
              </button>

              {expandedSections.has("System Info") && (
                <div className="space-y-1 mt-2 ml-6 text-sm">
                  <div className="flex items-center gap-2 py-1">
                    <div className="text-sm text-muted-foreground flex-shrink-0 w-[140px]">ID</div>
                    <div className="font-mono text-xs truncate">{doc.name as string}</div>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <div className="text-sm text-muted-foreground flex-shrink-0 w-[140px]">Created by</div>
                    <div className="truncate">{doc.owner as string}</div>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <div className="text-sm text-muted-foreground flex-shrink-0 w-[140px]">Created</div>
                    <div className="truncate">
                      {doc.creation
                        ? new Date(doc.creation as string).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <div className="text-sm text-muted-foreground flex-shrink-0 w-[140px]">Modified</div>
                    <div className="truncate">
                      {doc.modified
                        ? new Date(doc.modified as string).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4">
            {!isNew ? (
              <Timeline
                doctype={doctype}
                docname={docname}
                maxItems={20}
                showInput={true}
                defaultFilter="comments"
                hideFilters={true}
                hideHeader={true}
              />
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                Save the record to add comments
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
}

function TabButton({ active, onClick, children, icon, count }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {children}
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "px-1.5 py-0.5 text-xs rounded-full",
            active
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default DetailsSidebar;
