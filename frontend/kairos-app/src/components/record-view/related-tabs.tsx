/**
 * RelatedTabs Component
 *
 * Dynamic tabs showing related records (child tables, linked records)
 * Similar to Attio's related objects tabs
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { DocTypeMeta, DocTypeField } from "@/types/frappe";
import { getRelatedDocTypes, RelatedDocTypeConfig, DisplayField } from "@/lib/doctype-relations";
import { AddRelatedPopover } from "./add-related-popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Activity,
  Users,
  FileText,
  ChevronDown,
  Plus,
  MoreVertical,
  GraduationCap,
  Building,
  Layers,
  UserCheck,
  Newspaper,
  Calendar,
  MessageSquare,
  Bell,
  Reply,
  CalendarCheck,
  ClipboardList,
  Mail,
  Trash2,
  X,
  Unlink,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface RelatedTabsProps {
  /** DocType metadata */
  meta: DocTypeMeta;
  /** Document data (includes child tables) */
  doc: Record<string, unknown>;
  /** DocType name */
  doctype: string;
  /** Document name */
  docname: string;
  /** Whether this is a new record */
  isNew?: boolean;
  /** Custom className */
  className?: string;
  /** Callback when tab changes */
  onTabChange?: (tabId: string) => void;
}

interface TabDefinition {
  id: string;
  label: string;
  icon: React.ElementType;
  count: number;
  type: "overview" | "activity" | "child_table" | "related";
  field?: DocTypeField;
  relatedConfig?: RelatedDocTypeConfig;
}

// ============================================================================
// Icon mapping
// ============================================================================

const ICON_MAP: Record<string, React.ElementType> = {
  "graduation-cap": GraduationCap,
  building: Building,
  layers: Layers,
  users: Users,
  "user-check": UserCheck,
  newspaper: Newspaper,
  calendar: Calendar,
  "message-square": MessageSquare,
  bell: Bell,
  reply: Reply,
  "calendar-check": CalendarCheck,
  "clipboard-list": ClipboardList,
};

function getIconComponent(iconName?: string): React.ElementType {
  if (!iconName) return FileText;
  return ICON_MAP[iconName] || FileText;
}

// ============================================================================
// Component
// ============================================================================

export function RelatedTabs({
  meta,
  doc,
  doctype,
  docname,
  isNew = false,
  className,
  onTabChange,
}: RelatedTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read initial tab from URL or default to "overview"
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab state with URL on mount
  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);

    // Update URL with tab parameter (preserves in browser history)
    const params = new URLSearchParams(searchParams.toString());
    if (tabId === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", tabId);
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  };

  // Get related DocTypes from configuration
  const relatedDocTypes = useMemo(() => getRelatedDocTypes(doctype), [doctype]);

  // Build tabs from metadata and relations
  const tabs = useMemo(() => {
    const result: TabDefinition[] = [
      {
        id: "overview",
        label: "Overview",
        icon: LayoutGrid,
        count: 0,
        type: "overview",
      },
      {
        id: "activity",
        label: "Activity",
        icon: Activity,
        count: 0,
        type: "activity",
      },
    ];

    // Add child tables as tabs
    meta.fields
      .filter((field) => field.fieldtype === "Table" && field.options)
      .forEach((field) => {
        const childData = doc[field.fieldname];
        const count = Array.isArray(childData) ? childData.length : 0;

        result.push({
          id: `child_${field.fieldname}`,
          label: field.label,
          icon: FileText,
          count,
          type: "child_table",
          field,
        });
      });

    // Add related DocTypes as tabs
    relatedDocTypes.forEach((config) => {
      result.push({
        id: `related_${config.doctype}`,
        label: config.label,
        icon: getIconComponent(config.icon),
        count: 0, // Will be fetched dynamically
        type: "related",
        relatedConfig: config,
      });
    });

    return result;
  }, [meta.fields, doc, relatedDocTypes]);

  // Get active tab data
  const activeTabDef = tabs.find((t) => t.id === activeTab);

  // Visible tabs (show first 5, rest in dropdown)
  const visibleTabs = tabs.slice(0, 5);
  const hiddenTabs = tabs.slice(5);

  // Check if active tab is in hidden tabs
  const activeInHidden = hiddenTabs.some((t) => t.id === activeTab);

  return (
    <div className={cn("flex flex-col min-h-0", className)}>
      {/* Tabs header */}
      <div className="border-b">
        <div className="flex items-center px-4">
          {visibleTabs.map((tab) => (
            <RelatedTabButton
              key={tab.id}
              tab={tab}
              active={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
              doctype={doctype}
              docname={docname}
              isNew={isNew}
            />
          ))}

          {hiddenTabs.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    activeInHidden
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  +{hiddenTabs.length} more
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {hiddenTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <DropdownMenuItem
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        "cursor-pointer",
                        activeTab === tab.id && "bg-accent"
                      )}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {tab.label}
                      {tab.count > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {tab.count}
                        </span>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "overview" && (
          <OverviewContent
            meta={meta}
            doc={doc}
            doctype={doctype}
            isNew={isNew}
          />
        )}
        {activeTab === "activity" && (
          <ActivityContent
            doctype={doctype}
            docname={docname}
            isNew={isNew}
          />
        )}
        {activeTabDef?.type === "child_table" && activeTabDef.field && (
          <ChildTableContent
            field={activeTabDef.field}
            data={(doc[activeTabDef.field.fieldname] as Record<string, unknown>[]) || []}
            doctype={doctype}
            isNew={isNew}
          />
        )}
        {activeTabDef?.type === "related" && activeTabDef.relatedConfig && (
          <RelatedContent
            config={activeTabDef.relatedConfig}
            docname={docname}
            parentDoctype={doctype}
            isNew={isNew}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Tab Button with dynamic count
// ============================================================================

interface RelatedTabButtonProps {
  tab: TabDefinition;
  active: boolean;
  onClick: () => void;
  doctype: string;
  docname: string;
  isNew: boolean;
}

function RelatedTabButton({
  tab,
  active,
  onClick,
  doctype,
  docname,
  isNew,
}: RelatedTabButtonProps) {
  // Fetch count for related tabs
  const shouldFetchCount = tab.type === "related" && tab.relatedConfig && !isNew;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: countData } = useFrappeGetDocList<any>(
    tab.relatedConfig?.doctype || "",
    {
      fields: ["count(name) as count"],
      filters: [[tab.relatedConfig?.linkField || "", "=", docname]],
    },
    shouldFetchCount ? `count_${tab.relatedConfig?.doctype}_${docname}` : null
  );

  const count = useMemo(() => {
    if (tab.type === "related" && countData && countData.length > 0) {
      return (countData[0] as { count: number })?.count ?? 0;
    }
    return tab.count;
  }, [tab.type, tab.count, countData]);

  const Icon = tab.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {tab.label}
      {count > 0 && (
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

// ============================================================================
// Overview Content
// ============================================================================

interface OverviewContentProps {
  meta: DocTypeMeta;
  doc: Record<string, unknown>;
  doctype: string;
  isNew: boolean;
}

function OverviewContent({ meta, doc }: OverviewContentProps) {
  // Get "highlight" fields - fields marked as in_list_view or first few visible fields
  const highlightFields = useMemo(() => {
    const fields = meta.fields.filter(
      (f) =>
        f.in_list_view === 1 &&
        f.hidden !== 1 &&
        f.fieldtype !== "Table" &&
        !["Section Break", "Column Break", "Tab Break", "HTML"].includes(f.fieldtype)
    );
    return fields.slice(0, 6);
  }, [meta.fields]);

  return (
    <div className="p-6">
      {/* Highlights section */}
      {highlightFields.length > 0 ? (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Highlights</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {highlightFields.map((field) => (
              <HighlightCard
                key={field.fieldname}
                label={field.label}
                value={doc[field.fieldname]}
                fieldtype={field.fieldtype}
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="text-sm text-muted-foreground text-center py-8">
          No highlights available
        </div>
      )}
    </div>
  );
}

interface HighlightCardProps {
  label: string;
  value: unknown;
  fieldtype: string;
}

function HighlightCard({ label, value, fieldtype }: HighlightCardProps) {
  const displayValue = useMemo(() => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    if (fieldtype === "Check") {
      return value ? "Yes" : "No";
    }
    if (fieldtype === "Date" && typeof value === "string") {
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return String(value);
      }
    }
    if (fieldtype === "Currency" && typeof value === "number") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value);
    }
    return String(value);
  }, [value, fieldtype]);

  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-sm font-medium truncate">{displayValue}</div>
    </div>
  );
}

// ============================================================================
// Activity Content
// ============================================================================

interface ActivityContentProps {
  doctype: string;
  docname: string;
  isNew: boolean;
}

function ActivityContent({ doctype, docname, isNew }: ActivityContentProps) {
  if (isNew) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Save the record to see activity
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Recent Activity</h3>
      </div>
      <div className="text-sm text-muted-foreground">
        Activity timeline coming soon...
      </div>
    </div>
  );
}

// ============================================================================
// Child Table Content
// ============================================================================

interface ChildTableContentProps {
  field: DocTypeField;
  data: Record<string, unknown>[];
  doctype: string;
  isNew: boolean;
}

function ChildTableContent({ field, data, doctype, isNew }: ChildTableContentProps) {
  if (data.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="mb-4">No {field.label.toLowerCase()} yet</p>
        {!isNew && (
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add {field.label.replace(/s$/, "")}
          </Button>
        )}
      </div>
    );
  }

  // Get column headers from first row
  const columns = Object.keys(data[0] || {}).filter(
    (key) =>
      !["name", "parent", "parentfield", "parenttype", "idx", "doctype"].includes(
        key
      )
  );

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">{field.label}</h3>
          <Badge variant="secondary">{data.length}</Badge>
        </div>
        {!isNew && (
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.slice(0, 5).map((col) => (
                <TableHead key={col} className="capitalize">
                  {col.replace(/_/g, " ")}
                </TableHead>
              ))}
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={idx}>
                {columns.slice(0, 5).map((col) => (
                  <TableCell key={col} className="truncate max-w-[200px]">
                    {formatCellValue(row[col])}
                  </TableCell>
                ))}
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ============================================================================
// Related Content (linked records from other DocTypes)
// ============================================================================

interface RelatedContentProps {
  config: RelatedDocTypeConfig;
  docname: string;
  parentDoctype: string;
  isNew: boolean;
}

function RelatedContent({ config, docname, parentDoctype, isNew }: RelatedContentProps) {
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Get display fields or fallback to default
  const displayFields: DisplayField[] = config.displayFields || [
    { fieldname: "name", label: "Name" },
  ];

  // Fetch related records - use ["*"] to get all fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, isLoading, error, mutate } = useFrappeGetDocList<any>(
    config.doctype,
    {
      fields: ["*"],
      filters: [[config.linkField, "=", docname]],
      orderBy: { field: "modified", order: "desc" },
      limit: 20,
    },
    !isNew ? `related_${config.doctype}_${docname}` : null
  );

  const Icon = getIconComponent(config.icon);
  const slug = config.doctype.toLowerCase().replace(/ /g, "-");
  const singularLabel = config.label.replace(/ies$/, "y").replace(/s$/, "");

  // Get already linked record names to exclude from search
  const linkedNames = useMemo(() => {
    if (!data) return [];
    return data.map((r: { name: string }) => r.name);
  }, [data]);

  const handleLinked = () => {
    mutate();
  };

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!data) return;
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map((r: { name: string }) => r.name)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const isAllSelected = data && data.length > 0 && selectedIds.size === data.length;
  const hasSelection = selectedIds.size > 0;

  if (isNew) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Save the record to see related {config.label.toLowerCase()}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    console.error(`RelatedContent error for ${config.doctype}:`, error);
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="mb-2">Could not load {config.label.toLowerCase()}</p>
        <p className="text-xs text-muted-foreground/70">
          {error instanceof Error ? error.message : "Check console for details"}
        </p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="mb-4">No {config.label.toLowerCase()} yet</p>
        <AddRelatedPopover
          config={config}
          parentDocname={docname}
          onLinked={handleLinked}
          excludeNames={linkedNames}
        />
      </div>
    );
  }

  return (
    <div className="p-4 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">{config.label}</h3>
          <Badge variant="secondary">{data.length}</Badge>
        </div>
        <AddRelatedPopover
          config={config}
          parentDocname={docname}
          onLinked={handleLinked}
          excludeNames={linkedNames}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              {displayFields.map((field) => (
                <TableHead key={field.fieldname}>{field.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row: Record<string, unknown>) => {
              const rowId = row.name as string;
              const isSelected = selectedIds.has(rowId);
              return (
                <TableRow
                  key={rowId}
                  className={cn(isSelected && "bg-accent")}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(rowId)}
                      aria-label={`Select ${rowId}`}
                    />
                  </TableCell>
                  {displayFields.map((field, fieldIndex) => (
                    <TableCell key={field.fieldname} className="truncate max-w-[200px]">
                      {fieldIndex === 0 ? (
                        // First field: Avatar + Name as link to record
                        // Pass parent context for navigation
                        <Link
                          href={`/${slug}/${encodeURIComponent(rowId)}?parentDoctype=${encodeURIComponent(parentDoctype)}&parent=${encodeURIComponent(docname)}&linkField=${encodeURIComponent(config.linkField)}`}
                          className="flex items-center gap-3 hover:underline"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={row.image as string || row.user_image as string} />
                            <AvatarFallback className="text-xs">
                              {getInitials(String(row[field.fieldname] || rowId))}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {formatCellValue(row[field.fieldname])}
                          </span>
                        </Link>
                      ) : field.isLink && field.linkDoctype && row[field.fieldname] ? (
                        <Link
                          href={`/${field.linkDoctype.toLowerCase().replace(/ /g, "-")}/${encodeURIComponent(String(row[field.fieldname]))}`}
                          className="text-primary hover:underline"
                        >
                          {formatCellValue(row[field.fieldname])}
                        </Link>
                      ) : (
                        formatCellValue(row[field.fieldname])
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Bulk Action Bar */}
      {hasSelection && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 bg-background border rounded-lg shadow-lg z-50">
          <span className="text-sm font-medium text-muted-foreground pr-3 border-r whitespace-nowrap">
            {selectedIds.size} {selectedIds.size === 1 ? singularLabel.toLowerCase() : config.label.toLowerCase()}
          </span>
          <Button variant="ghost" size="sm">
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem>
                <Unlink className="mr-2 h-4 w-4" />
                Unassociate {singularLabel}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete {singularLabel}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={clearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default RelatedTabs;
