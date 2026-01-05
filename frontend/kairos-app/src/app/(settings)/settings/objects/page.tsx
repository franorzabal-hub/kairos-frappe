/**
 * Objects List Page (Attio-style)
 *
 * Lists all DocTypes in the workspace with their record counts and attributes.
 * Provides a modern interface for managing data models.
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  SlidersHorizontal,
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
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  onClick,
}: {
  object: ObjectInfo;
  onClick: () => void;
}) {
  const Icon = object.icon;

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={onClick}
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
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>
              View details
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="text-destructive">
              Delete
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
  const [objects, setObjects] = useState<ObjectInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch DocTypes and their metadata
  useEffect(() => {
    const fetchObjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const allDoctypes = [...KAIROS_DOCTYPES, ...CORE_DOCTYPES];
        const objectsData: ObjectInfo[] = [];

        // Fetch metadata and counts for each DocType
        await Promise.all(
          allDoctypes.map(async (doctype) => {
            try {
              // Fetch DocType metadata using getdoctype (GET request)
              const metaResponse = await fetch(
                `/api/frappe/api/method/frappe.desk.form.load.getdoctype?doctype=${encodeURIComponent(doctype)}&with_parent=0`,
                {
                  method: "GET",
                  credentials: "include",
                  headers: {
                    Accept: "application/json",
                  },
                }
              );

              if (!metaResponse.ok) {
                // DocType doesn't exist or no permission
                return;
              }

              const metaData = await metaResponse.json();
              const meta = metaData.message?.docs?.[0];

              if (!meta) return;

              // Fetch record count
              let recordCount = 0;
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
                    body: JSON.stringify({ doctype }),
                  }
                );

                if (countResponse.ok) {
                  const countData = await countResponse.json();
                  recordCount = countData.message || 0;
                }
              } catch {
                // Ignore count errors
              }

              const iconInfo = getObjectIcon(doctype);
              const isKairos = KAIROS_DOCTYPES.includes(doctype);

              objectsData.push({
                name: doctype,
                module: meta.module || "Core",
                isCustom: meta.custom === 1,
                recordCount,
                fieldCount: meta.fields?.length || 0,
                icon: iconInfo.icon,
                color: iconInfo.color,
              });
            } catch (err) {
              console.warn(`Failed to fetch ${doctype}:`, err);
            }
          })
        );

        // Sort: Kairos first, then by name
        objectsData.sort((a, b) => {
          const aIsKairos = KAIROS_DOCTYPES.includes(a.name);
          const bIsKairos = KAIROS_DOCTYPES.includes(b.name);
          if (aIsKairos && !bIsKairos) return -1;
          if (!aIsKairos && bIsKairos) return 1;
          return a.name.localeCompare(b.name);
        });

        setObjects(objectsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load objects");
      } finally {
        setIsLoading(false);
      }
    };

    fetchObjects();
  }, []);

  // Filter objects based on search
  const filteredObjects = useMemo(() => {
    if (!searchQuery) return objects;
    const query = searchQuery.toLowerCase();
    return objects.filter(
      (obj) =>
        obj.name.toLowerCase().includes(query) ||
        obj.module.toLowerCase().includes(query)
    );
  }, [objects, searchQuery]);

  // Calculate totals
  const activeCount = objects.filter((o) => o.recordCount > 0).length;
  const totalCount = objects.length;

  const handleObjectClick = (doctype: string) => {
    router.push(`/settings/objects/${doctypeToSlug(doctype)}`);
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
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          New custom object
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search objects"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" disabled>
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filter
        </Button>
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
                      {activeCount}/{totalCount}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead>Type</TableHead>
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
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {searchQuery
                    ? `No objects found for "${searchQuery}"`
                    : "No objects found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredObjects.map((obj) => (
                <ObjectRow
                  key={obj.name}
                  object={obj}
                  onClick={() => handleObjectClick(obj.name)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
