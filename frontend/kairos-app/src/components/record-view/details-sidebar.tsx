/**
 * DetailsSidebar Component
 *
 * Right sidebar showing:
 * - Details tab: Field values in a read-only format
 * - Comments tab: Comment thread
 */

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DocTypeField, DocTypeMeta } from "@/types/frappe";
import { Timeline } from "@/components/timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getFieldDisplayValue } from "@/hooks/use-frappe-meta";
import {
  Grid3X3,
  MessageSquare,
  ChevronDown,
  ChevronRight,
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

// ============================================================================
// Helper Functions
// ============================================================================

function formatValue(
  value: unknown,
  field: DocTypeField
): { display: string; isLink?: boolean; href?: string } {
  if (value === null || value === undefined || value === "") {
    return { display: "—" };
  }

  // Handle Link fields
  if (field.fieldtype === "Link" && field.options && value) {
    const doctype = field.options;
    const slug = doctype.toLowerCase().replace(/ /g, "-");
    return {
      display: String(value),
      isLink: true,
      href: `/${slug}/${encodeURIComponent(String(value))}`,
    };
  }

  // Handle Check fields
  if (field.fieldtype === "Check") {
    return { display: value ? "Yes" : "No" };
  }

  // Handle Date fields
  if (field.fieldtype === "Date" && typeof value === "string") {
    try {
      return { display: new Date(value).toLocaleDateString() };
    } catch {
      return { display: String(value) };
    }
  }

  // Handle Datetime fields
  if (field.fieldtype === "Datetime" && typeof value === "string") {
    try {
      return { display: new Date(value).toLocaleString() };
    } catch {
      return { display: String(value) };
    }
  }

  // Handle Select fields (could show badges)
  if (field.fieldtype === "Select") {
    return { display: String(value) };
  }

  return { display: String(value) };
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

  // Get displayable fields
  const displayFields = useMemo(() => {
    return meta.fields.filter(
      (field) =>
        !EXCLUDED_FIELDS.includes(field.fieldname) &&
        !LAYOUT_FIELD_TYPES.includes(field.fieldtype) &&
        field.hidden !== 1 &&
        field.fieldtype !== "Table" // Tables shown in tabs
    );
  }, [meta.fields]);

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
    <div className={cn("flex flex-col h-full border-l bg-background", className)}>
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
      <ScrollArea className="flex-1">
        {activeTab === "details" ? (
          <div className="p-4 space-y-4">
            {fieldSections.map((section) => (
              <div key={section.name}>
                {/* Section header */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.name)}
                  className="flex items-center gap-2 w-full text-left py-2 hover:bg-accent/50 rounded -mx-2 px-2"
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
                  <div className="space-y-2 mt-2 ml-6">
                    {section.fields.map((field) => {
                      const value = doc[field.fieldname];
                      const formatted = formatValue(value, field);

                      return (
                        <div key={field.fieldname} className="flex items-center gap-2 py-1">
                          <div className="text-sm text-muted-foreground flex-shrink-0 w-[140px]">
                            {field.label}
                          </div>
                          <div className="text-sm flex-1 min-w-0">
                            {formatted.isLink && formatted.href ? (
                              <Link
                                href={formatted.href}
                                className="text-primary hover:underline truncate block"
                              >
                                {formatted.display}
                              </Link>
                            ) : formatted.display === "—" ? (
                              <span className="text-muted-foreground">
                                {formatted.display}
                              </span>
                            ) : field.fieldtype === "Select" ? (
                              <Badge variant="secondary">
                                {formatted.display}
                              </Badge>
                            ) : (
                              <span className="truncate block">
                                {formatted.display}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
                className="flex items-center gap-2 w-full text-left py-2 hover:bg-accent/50 rounded -mx-2 px-2"
              >
                {expandedSections.has("System Info") ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">System Info</span>
              </button>

              {expandedSections.has("System Info") && (
                <div className="space-y-2 mt-2 ml-6 text-sm">
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
        "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
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
