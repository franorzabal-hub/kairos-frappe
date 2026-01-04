/**
 * Workspace Detail Page
 *
 * Displays a Frappe workspace with its shortcuts and links
 */

"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useFrappeGetDoc } from "frappe-react-sdk";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { doctypeToSlug } from "@/lib/utils";
import {
  File,
  FileText,
  Link as LinkIcon,
  ExternalLink,
  LayoutGrid,
  ChevronRight,
} from "lucide-react";

interface WorkspacePageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface WorkspaceShortcut {
  name: string;
  label: string;
  link_type: "DocType" | "Report" | "Page" | "URL";
  link_to: string;
  type?: "Link" | "Card Break" | "Shortcut" | "Spacer";
  icon?: string;
  color?: string;
  description?: string;
}

interface WorkspaceLink {
  name: string;
  label: string;
  link_type: "DocType" | "Report" | "Page" | "URL";
  link_to: string;
  type?: "Link" | "Card Break";
  icon?: string;
  only_for?: string;
  onboard?: 0 | 1;
  dependencies?: string;
  is_query_report?: 0 | 1;
}

interface WorkspaceData {
  name: string;
  title: string;
  icon?: string;
  module?: string;
  content?: string;
  public?: 0 | 1;
  shortcuts: WorkspaceShortcut[];
  links: WorkspaceLink[];
}

interface WorkspaceResponse {
  workspace: WorkspaceData;
}

function slugToWorkspaceName(slug: string): string {
  // Convert slug back to workspace name
  // e.g., "my-workspace" -> "My Workspace"
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildLinkHref(link: WorkspaceShortcut | WorkspaceLink): string {
  switch (link.link_type) {
    case "DocType":
      return `/${doctypeToSlug(link.link_to)}`;
    case "Report":
      return `/report/${encodeURIComponent(link.link_to)}`;
    case "Page":
      return `/page/${encodeURIComponent(link.link_to)}`;
    case "URL":
      return link.link_to;
    default:
      return "#";
  }
}

function isExternalLink(link: WorkspaceShortcut | WorkspaceLink): boolean {
  return link.link_type === "URL" && link.link_to.startsWith("http");
}

function ShortcutCard({ shortcut }: { shortcut: WorkspaceShortcut }) {
  const href = buildLinkHref(shortcut);
  const isExternal = isExternalLink(shortcut);

  const content = (
    <Card className="h-full hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: shortcut.color || "hsl(var(--primary) / 0.1)" }}
          >
            <LayoutGrid className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{shortcut.label}</h3>
            {shortcut.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {shortcut.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {shortcut.link_type}
            </p>
          </div>
          {isExternal && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardContent>
    </Card>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return <Link href={href}>{content}</Link>;
}

function LinkItem({ link }: { link: WorkspaceLink }) {
  const href = buildLinkHref(link);
  const isExternal = isExternalLink(link);

  const content = (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
      {link.link_type === "DocType" ? (
        <FileText className="h-4 w-4 text-muted-foreground" />
      ) : link.link_type === "Report" ? (
        <File className="h-4 w-4 text-muted-foreground" />
      ) : (
        <LinkIcon className="h-4 w-4 text-muted-foreground" />
      )}
      <span className="flex-1 text-sm">{link.label}</span>
      {isExternal ? (
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return <Link href={href}>{content}</Link>;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const { slug } = use(params);
  const workspaceName = slugToWorkspaceName(slug);

  // Fetch workspace document directly
  const { data: workspace, error, isLoading } = useFrappeGetDoc<WorkspaceData>(
    "Workspace",
    workspaceName,
    `workspace_${slug}`
  );

  // Group links by Card Break
  const linkGroups = useMemo(() => {
    if (!workspace?.links) return [];

    const groups: { title?: string; links: WorkspaceLink[] }[] = [];
    let currentGroup: { title?: string; links: WorkspaceLink[] } = { links: [] };

    for (const link of workspace.links) {
      if (link.type === "Card Break") {
        if (currentGroup.links.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = { title: link.label, links: [] };
      } else if (link.type === "Link") {
        currentGroup.links.push(link);
      }
    }

    if (currentGroup.links.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }, [workspace?.links]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{workspaceName}</h1>
        </div>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Failed to load workspace. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{workspaceName}</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Workspace not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {workspace.title || workspace.name}
        </h1>
        {workspace.module && (
          <p className="text-muted-foreground">{workspace.module}</p>
        )}
      </div>

      {/* Shortcuts */}
      {workspace.shortcuts && workspace.shortcuts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Shortcuts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {workspace.shortcuts.map((shortcut) => (
              <ShortcutCard key={shortcut.name} shortcut={shortcut} />
            ))}
          </div>
        </div>
      )}

      {/* Links grouped by Card Break */}
      {linkGroups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {linkGroups.map((group, index) => (
            <Card key={index}>
              {group.title && (
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{group.title}</CardTitle>
                </CardHeader>
              )}
              <CardContent className={group.title ? "" : "pt-4"}>
                <div className="space-y-1">
                  {group.links.map((link) => (
                    <LinkItem key={link.name} link={link} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {(!workspace.shortcuts || workspace.shortcuts.length === 0) &&
        linkGroups.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                This workspace is empty. Add shortcuts and links to customize it.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
