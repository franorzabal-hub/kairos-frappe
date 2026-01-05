/**
 * Objects List Page (Attio-style)
 *
 * Lists all DocTypes in the workspace with their record counts and attributes.
 * Provides a modern interface for managing data models.
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  MoreVertical,
  Database,
  Users,
  Building2,
  MessageSquare,
  Newspaper,
  Calendar,
  GraduationCap,
  Mail,
  FileText,
  Eye,
  Pencil,
  X,
  Box,
  Loader2,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ============================================================================
// Types
// ============================================================================

interface ObjectInfo {
  name: string;
  module: string;
  isCustom: boolean;
  recordCount: number;
  fieldCount: number;
  icon: LucideIcon;
  color: string;
}

// ============================================================================
// Constants
// ============================================================================

// DocTypes to show in Objects (Kairos module + important core ones)
const KAIROS_DOCTYPES = [
  "Student",
  "Guardian",
  "Institution",
  "Message",
  "News",
  "School Event",
  "Grade",
  "Guardian Invite",
  "Section",
  "Campus",
];

const CORE_DOCTYPES = [
  "User",
  "Role",
  "DocType",
  "Custom Field",
  "Workflow",
];

// Icon mapping for DocTypes
const DOCTYPE_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  Student: { icon: Users, color: "bg-blue-500" },
  Guardian: { icon: Users, color: "bg-green-500" },
  Institution: { icon: Building2, color: "bg-purple-500" },
  Message: { icon: MessageSquare, color: "bg-orange-500" },
  News: { icon: Newspaper, color: "bg-pink-500" },
  "School Event": { icon: Calendar, color: "bg-cyan-500" },
  Grade: { icon: GraduationCap, color: "bg-yellow-500" },
  "Guardian Invite": { icon: Mail, color: "bg-red-500" },
  Section: { icon: FileText, color: "bg-indigo-500" },
  Campus: { icon: Building2, color: "bg-teal-500" },
  User: { icon: Users, color: "bg-slate-500" },
  Role: { icon: Users, color: "bg-slate-500" },
  DocType: { icon: Database, color: "bg-slate-500" },
  "Custom Field": { icon: Database, color: "bg-slate-500" },
  Workflow: { icon: Database, color: "bg-slate-500" },
};

// ============================================================================
// Helper Functions
// ============================================================================

function getObjectIcon(doctype: string): { icon: LucideIcon; color: string } {
  return DOCTYPE_ICONS[doctype] || { icon: Database, color: "bg-slate-400" };
}

function doctypeToSlug(doctype: string): string {
  return doctype.toLowerCase().replace(/ /g, "-");
}

// ============================================================================
// Components
// ============================================================================

function ObjectRow({
  object,
  onView,
  onEdit,
}: {
  object: ObjectInfo;
  onView: () => void;
  onEdit: () => void;
}) {
  const Icon = object.icon;

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={onView}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-md ${object.color}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <span className="font-medium">{object.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={object.isCustom ? "default" : "secondary"}>
          {object.isCustom ? "Custom" : "Standard"}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {object.module}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {object.recordCount > 0 ? object.recordCount.toLocaleString() : "-"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {object.fieldCount}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function LoadingRow() {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-4 w-32" />
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
    </TableRow>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ObjectsListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "standard" | "custom">("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [objects, setObjects] = useState<ObjectInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Object Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [pluralNoun, setPluralNoun] = useState("");
  const [singularNoun, setSingularNoun] = useState("");
  const [objectSlug, setObjectSlug] = useState("");

  // Fetch DocTypes and their metadata
  useEffect(() => {
    const fetchObjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // First, fetch list of DocTypes from Frappe (exclude child tables with istable=0)
        const doctypeListResponse = await fetch(
          `/api/frappe/api/resource/DocType?fields=["name","module","custom"]&filters=[["istable","=",0]]&limit_page_length=500`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!doctypeListResponse.ok) {
          console.error("[Objects] Failed to fetch DocType list:", doctypeListResponse.status);
          throw new Error("Failed to fetch DocTypes");
        }

        const doctypeListData = await doctypeListResponse.json();
        console.log("[Objects] DocType list response:", doctypeListData);
        console.log("[Objects] Data array:", doctypeListData.data);
        console.log("[Objects] Data length:", doctypeListData.data?.length);

        // Get all DocTypes from the API response (no filtering - show all)
        const allDoctypes: Array<{ name: string; module: string; custom: number }> =
          doctypeListData.data || [];

        console.log("[Objects] allDoctypes length:", allDoctypes.length);

        const objectsData: ObjectInfo[] = [];

        // Fetch record counts for each DocType
        await Promise.all(
          allDoctypes.map(async (doctype) => {
            try {
              // Fetch record count
              let recordCount = 0;
              let fieldCount = 0;

              try {
                const countResponse = await fetch(
                  `/api/frappe/api/method/frappe.client.get_count`,
                  {
                    method: "POST",
                    credentials: "include",
                    headers: {
                      Accept: "application/json",
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ doctype: doctype.name }),
                  }
                );

                if (countResponse.ok) {
                  const countData = await countResponse.json();
                  recordCount = countData.message || 0;
                }
              } catch {
                // Ignore count errors
              }

              // Try to get field count from getdoctype
              try {
                const metaResponse = await fetch(
                  `/api/frappe/api/method/frappe.desk.form.load.getdoctype?doctype=${encodeURIComponent(doctype.name)}&with_parent=0`,
                  {
                    method: "GET",
                    credentials: "include",
                    headers: {
                      Accept: "application/json",
                    },
                  }
                );

                if (metaResponse.ok) {
                  const metaData = await metaResponse.json();
                  // Response structure is { docs: [...] } - no message wrapper
                  const meta = metaData.docs?.[0];
                  if (meta?.fields) {
                    fieldCount = meta.fields.length;
                  }
                }
              } catch {
                // Ignore meta errors
              }

              const iconInfo = getObjectIcon(doctype.name);

              objectsData.push({
                name: doctype.name,
                module: doctype.module || "Core",
                isCustom: doctype.custom === 1,
                recordCount,
                fieldCount,
                icon: iconInfo.icon,
                color: iconInfo.color,
              });
            } catch (err) {
              console.warn(`Failed to fetch ${doctype.name}:`, err);
            }
          })
        );

        // Sort: Custom first, then Kairos module, then by module and name
        objectsData.sort((a, b) => {
          // Custom objects first
          if (a.isCustom && !b.isCustom) return -1;
          if (!a.isCustom && b.isCustom) return 1;
          // Then Kairos module
          if (a.module === "Kairos" && b.module !== "Kairos") return -1;
          if (a.module !== "Kairos" && b.module === "Kairos") return 1;
          // Then by module
          if (a.module !== b.module) return a.module.localeCompare(b.module);
          // Then by name
          return a.name.localeCompare(b.name);
        });

        console.log("[Objects] Final objects data:", objectsData);
        setObjects(objectsData);
      } catch (err) {
        console.error("[Objects] Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load objects");
      } finally {
        setIsLoading(false);
      }
    };

    fetchObjects();
  }, []);

  // Get unique modules for filter
  const uniqueModules = useMemo(() => {
    const modules = new Set(objects.map((obj) => obj.module));
    return Array.from(modules).sort();
  }, [objects]);

  // Filter objects based on search and filters
  const filteredObjects = useMemo(() => {
    return objects.filter((obj) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!obj.name.toLowerCase().includes(query) && !obj.module.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== "all") {
        if (typeFilter === "custom" && !obj.isCustom) return false;
        if (typeFilter === "standard" && obj.isCustom) return false;
      }

      // Module filter
      if (moduleFilter !== "all" && obj.module !== moduleFilter) {
        return false;
      }

      return true;
    });
  }, [objects, searchQuery, typeFilter, moduleFilter]);

  // Check if any filter is active
  const hasActiveFilters = typeFilter !== "all" || moduleFilter !== "all";

  // Calculate total count
  const totalCount = objects.length;

  const handleObjectView = (doctype: string) => {
    router.push(`/settings/objects/${doctypeToSlug(doctype)}`);
  };

  const handleObjectEdit = (doctype: string) => {
    // Navigate to Frappe's DocType editor
    window.open(`/api/frappe/app/doctype/${encodeURIComponent(doctype)}`, "_blank");
  };

  const clearFilters = () => {
    setTypeFilter("all");
    setModuleFilter("all");
  };

  // Auto-generate slug from plural noun
  const handlePluralNounChange = (value: string) => {
    setPluralNoun(value);
    // Auto-generate slug: lowercase, replace spaces with underscores
    const slug = value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    setObjectSlug(slug);
    // Auto-generate singular (simple: remove trailing 's' or 'es')
    if (!singularNoun || singularNoun === pluralNoun.slice(0, -1) || singularNoun === pluralNoun.slice(0, -2)) {
      if (value.endsWith("ies")) {
        setSingularNoun(value.slice(0, -3) + "y");
      } else if (value.endsWith("es")) {
        setSingularNoun(value.slice(0, -2));
      } else if (value.endsWith("s")) {
        setSingularNoun(value.slice(0, -1));
      } else {
        setSingularNoun(value);
      }
    }
  };

  const resetCreateForm = () => {
    setPluralNoun("");
    setSingularNoun("");
    setObjectSlug("");
    setCreateError(null);
  };

  const handleCreateObject = async () => {
    if (!pluralNoun.trim() || !singularNoun.trim() || !objectSlug.trim()) {
      setCreateError("All fields are required");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      // Create custom DocType via Frappe API
      const response = await fetch(`/api/frappe/api/resource/DocType`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctype: "DocType",
          name: singularNoun,
          module: "Kairos",
          custom: 1,
          autoname: "format:{#####}",
          title_field: "title",
          fields: [
            {
              fieldname: "title",
              fieldtype: "Data",
              label: "Title",
              reqd: 1,
              in_list_view: 1,
              in_standard_filter: 1,
            },
          ],
          permissions: [
            {
              role: "System Manager",
              read: 1,
              write: 1,
              create: 1,
              delete: 1,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.exc || "Failed to create object");
      }

      // Success - close modal and refresh list
      setIsCreateModalOpen(false);
      resetCreateForm();
      // Refresh the objects list
      window.location.reload();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create object");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Objects</h1>
          <p className="text-muted-foreground">
            Modify and add objects in your workspace
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New custom object
        </Button>
      </div>

      {/* Create Object Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
        setIsCreateModalOpen(open);
        if (!open) resetCreateForm();
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Custom Object</DialogTitle>
            <DialogDescription>
              Define a new custom object type for your workspace
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Plural and Singular Nouns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pluralNoun">Plural Noun</Label>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    <Box className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input
                    id="pluralNoun"
                    placeholder="e.g Products"
                    value={pluralNoun}
                    onChange={(e) => handlePluralNounChange(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="singularNoun">Singular Noun</Label>
                <Input
                  id="singularNoun"
                  placeholder="e.g Product"
                  value={singularNoun}
                  onChange={(e) => setSingularNoun(e.target.value)}
                />
              </div>
            </div>

            {/* Identifier / Slug */}
            <div className="space-y-2">
              <Label htmlFor="objectSlug">Identifier / Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">/</span>
                <Input
                  id="objectSlug"
                  placeholder="e.g product"
                  value={objectSlug}
                  onChange={(e) => setObjectSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  className="font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Important: Once an object is created the slug cannot be changed.
              </p>
            </div>

            {/* Error message */}
            {createError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {createError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetCreateForm();
              }}
              disabled={isCreating}
            >
              Cancel
              <span className="ml-2 text-xs text-muted-foreground">ESC</span>
            </Button>
            <Button onClick={handleCreateObject} disabled={isCreating || !pluralNoun.trim() || !singularNoun.trim()}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Object
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search objects"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as "all" | "standard" | "custom")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>

        {/* Module Filter */}
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {uniqueModules.map((module) => (
              <SelectItem key={module} value={module}>
                {module}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-md border border-destructive p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Object
                  {!isLoading && (
                    <span className="text-muted-foreground font-normal">
                      {filteredObjects.length}/{totalCount}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Records</TableHead>
              <TableHead>Attributes</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <>
                {Array.from({ length: 8 }).map((_, i) => (
                  <LoadingRow key={i} />
                ))}
              </>
            ) : filteredObjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchQuery || hasActiveFilters
                    ? "No objects match your filters"
                    : "No objects found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredObjects.map((obj) => (
                <ObjectRow
                  key={obj.name}
                  object={obj}
                  onView={() => handleObjectView(obj.name)}
                  onEdit={() => handleObjectEdit(obj.name)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
