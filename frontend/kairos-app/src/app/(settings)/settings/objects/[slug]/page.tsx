/**
 * Object Detail Page (Attio-style)
 *
 * Shows detailed configuration for a specific DocType/Object.
 * Includes tabs: Configuration, Appearance, Attributes, Templates, Notifications, Imports
 */

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  Palette,
  LayoutGrid,
  FileText,
  Bell,
  Upload,
  Database,
  Users,
  Building2,
  MessageSquare,
  Newspaper,
  Calendar,
  GraduationCap,
  Mail,
  type LucideIcon,
  Check,
  Link as LinkIcon,
  Hash,
  ToggleLeft,
  Type,
  CalendarDays,
  FileCode,
  Percent,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ============================================================================
// Types
// ============================================================================

interface ObjectDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface DocTypeMeta {
  name: string;
  module: string;
  description?: string;
  isCustom: boolean;
  isSingle: boolean;
  fields: DocTypeField[];
  titleField?: string;
  searchFields?: string;
  imageField?: string;
}

interface DocTypeField {
  fieldname: string;
  fieldtype: string;
  label: string;
  reqd: number;
  options?: string;
  description?: string;
  hidden: number;
  inListView: number;
}

// ============================================================================
// Constants
// ============================================================================

// Icon mapping for DocTypes
const DOCTYPE_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  student: { icon: Users, color: "bg-blue-500" },
  guardian: { icon: Users, color: "bg-green-500" },
  institution: { icon: Building2, color: "bg-purple-500" },
  message: { icon: MessageSquare, color: "bg-orange-500" },
  news: { icon: Newspaper, color: "bg-pink-500" },
  "school-event": { icon: Calendar, color: "bg-cyan-500" },
  grade: { icon: GraduationCap, color: "bg-yellow-500" },
  "guardian-invite": { icon: Mail, color: "bg-red-500" },
};

// Field type icons
const FIELDTYPE_ICONS: Record<string, LucideIcon> = {
  Data: Type,
  Link: LinkIcon,
  Int: Hash,
  Float: Percent,
  Currency: Hash,
  Check: ToggleLeft,
  Date: CalendarDays,
  Datetime: CalendarDays,
  Text: FileText,
  "Text Editor": FileText,
  "Small Text": FileText,
  "Long Text": FileText,
  Select: LayoutGrid,
  Table: LayoutGrid,
  Code: FileCode,
  Password: Type,
  Attach: Upload,
  "Attach Image": Upload,
};

// ============================================================================
// Helper Functions
// ============================================================================

function slugToDocType(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getObjectIcon(slug: string): { icon: LucideIcon; color: string } {
  return DOCTYPE_ICONS[slug] || { icon: Database, color: "bg-slate-500" };
}

function getFieldTypeIcon(fieldtype: string): LucideIcon {
  return FIELDTYPE_ICONS[fieldtype] || Type;
}

function singularize(name: string): string {
  // Simple singularization
  if (name.endsWith("ies")) return name.slice(0, -3) + "y";
  if (name.endsWith("es")) return name.slice(0, -2);
  if (name.endsWith("s")) return name.slice(0, -1);
  return name;
}

function pluralize(name: string): string {
  // Simple pluralization
  if (name.endsWith("y")) return name.slice(0, -1) + "ies";
  if (name.endsWith("s") || name.endsWith("x") || name.endsWith("ch") || name.endsWith("sh")) {
    return name + "es";
  }
  return name + "s";
}

// ============================================================================
// Components
// ============================================================================

function AttributeRow({ field }: { field: DocTypeField }) {
  const Icon = getFieldTypeIcon(field.fieldtype);

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <span className="font-medium">{field.label}</span>
            <span className="ml-2 text-xs text-muted-foreground">{field.fieldname}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{field.fieldtype}</Badge>
      </TableCell>
      <TableCell>
        {field.options && (
          <span className="text-sm text-muted-foreground">{field.options}</span>
        )}
      </TableCell>
      <TableCell>
        {field.reqd === 1 && (
          <Badge variant="destructive" className="text-xs">Required</Badge>
        )}
      </TableCell>
      <TableCell>
        {field.inListView === 1 && (
          <Check className="h-4 w-4 text-green-600" />
        )}
      </TableCell>
    </TableRow>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ObjectDetailPage({ params }: ObjectDetailPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const doctypeName = slugToDocType(slug);

  const [meta, setMeta] = useState<DocTypeMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recordCount, setRecordCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  // Fetch DocType metadata
  useEffect(() => {
    const fetchMeta = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch DocType metadata
        const metaResponse = await fetch(
          `/api/frappe/api/method/frappe.desk.form.utils.get_meta`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ doctype: doctypeName }),
          }
        );

        if (!metaResponse.ok) {
          throw new Error("DocType not found");
        }

        const metaData = await metaResponse.json();
        const rawMeta = metaData.message;

        if (!rawMeta) {
          throw new Error("DocType not found");
        }

        // Parse fields
        const fields: DocTypeField[] = (rawMeta.fields || [])
          .filter((f: { fieldtype: string }) => !["Section Break", "Column Break", "Tab Break"].includes(f.fieldtype))
          .map((f: Record<string, unknown>) => ({
            fieldname: f.fieldname as string,
            fieldtype: f.fieldtype as string,
            label: f.label as string || f.fieldname as string,
            reqd: f.reqd as number || 0,
            options: f.options as string,
            description: f.description as string,
            hidden: f.hidden as number || 0,
            inListView: f.in_list_view as number || 0,
          }));

        setMeta({
          name: rawMeta.name,
          module: rawMeta.module || "Core",
          description: rawMeta.description,
          isCustom: rawMeta.custom === 1,
          isSingle: rawMeta.issingle === 1,
          fields,
          titleField: rawMeta.title_field,
          searchFields: rawMeta.search_fields,
          imageField: rawMeta.image_field,
        });

        // Fetch record count
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
              body: JSON.stringify({ doctype: doctypeName }),
            }
          );

          if (countResponse.ok) {
            const countData = await countResponse.json();
            setRecordCount(countData.message || 0);
          }
        } catch {
          // Ignore count errors
        }

        // Fetch notification count
        try {
          const notifResponse = await fetch(
            `/api/frappe/api/method/frappe.client.get_count`,
            {
              method: "POST",
              credentials: "include",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                doctype: "Notification",
                filters: { document_type: doctypeName },
              }),
            }
          );

          if (notifResponse.ok) {
            const notifData = await notifResponse.json();
            setNotificationCount(notifData.message || 0);
          }
        } catch {
          // Ignore notification count errors
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load object");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeta();
  }, [doctypeName]);

  const iconInfo = getObjectIcon(slug);
  const Icon = iconInfo.icon;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (error || !meta) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/settings/objects")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Object Not Found</CardTitle>
            <CardDescription>
              The object &quot;{doctypeName}&quot; could not be loaded.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {error || "Unknown error"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const singularName = singularize(meta.name);
  const pluralName = pluralize(singularName);
  const visibleFields = meta.fields.filter((f) => f.hidden !== 1);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/settings/objects"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${iconInfo.color}`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{meta.name}</h1>
            <Badge variant={meta.isCustom ? "default" : "secondary"}>
              {meta.isCustom ? "Custom" : "Standard"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {meta.description || "Manage object attributes and other relevant settings"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="configuration">
        <TabsList>
          <TabsTrigger value="configuration" className="gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="attributes" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Attributes
            <Badge variant="secondary" className="ml-1">{visibleFields.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
            <Badge variant="secondary" className="ml-1">{notificationCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="imports" className="gap-2">
            <Upload className="h-4 w-4" />
            Imports
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>
                Set words to describe a single and multiple objects of this type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Singular noun</Label>
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-md ${iconInfo.color}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <Input value={singularName} disabled className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Plural noun</Label>
                  <Input value={pluralName} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Identifier / Slug</Label>
                <Input value={slug} disabled />
                <p className="text-xs text-muted-foreground">
                  You can&apos;t change the slug for standard objects
                </p>
              </div>

              <div className="space-y-2">
                <Label>Module</Label>
                <Input value={meta.module} disabled />
              </div>

              {meta.titleField && (
                <div className="space-y-2">
                  <Label>Title Field</Label>
                  <Input value={meta.titleField} disabled />
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Records</span>
                  <span className="font-medium">{recordCount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Icon & Color</CardTitle>
              <CardDescription>
                Customize how this object appears in the interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`flex h-16 w-16 items-center justify-center rounded-xl ${iconInfo.color}`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-sm text-muted-foreground">
                  Icon and color customization coming soon
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attributes Tab */}
        <TabsContent value="attributes" className="space-y-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attribute</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Options</TableHead>
                  <TableHead>Validation</TableHead>
                  <TableHead>In List</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleFields.map((field) => (
                  <AttributeRow key={field.fieldname} field={field} />
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Print format templates will be shown here
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {notificationCount > 0
                ? `${notificationCount} notification(s) configured for this object`
                : "No notifications configured for this object"}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Imports Tab */}
        <TabsContent value="imports" className="space-y-6">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Data import history will be shown here
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
