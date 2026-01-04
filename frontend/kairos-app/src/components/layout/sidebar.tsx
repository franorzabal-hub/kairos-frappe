/**
 * Sidebar Component
 *
 * Navigation sidebar with dynamic workspaces from Frappe API
 * Falls back to static navigation if workspaces fail to load
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  Newspaper,
  Settings,
  UserCheck,
  Users,
  Home,
  File,
  Folder,
  BarChart,
  Mail,
  Star,
  Package,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { useWorkspaces, SidebarWorkspace, iconMapping } from "@/hooks/use-workspaces";
import { Skeleton } from "@/components/ui/skeleton";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Fallback navigation items when workspaces don't load
 */
const fallbackNavigationItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Students",
    href: "/Student",
    icon: Users,
  },
  {
    label: "Guardians",
    href: "/Guardian",
    icon: UserCheck,
  },
  {
    label: "Institutions",
    href: "/Institution",
    icon: Building2,
  },
  {
    label: "Messages",
    href: "/Message",
    icon: MessageSquare,
  },
  {
    label: "News",
    href: "/News",
    icon: Newspaper,
  },
  {
    label: "Events",
    href: "/School-Event",
    icon: Calendar,
  },
  {
    label: "Grades",
    href: "/Grade",
    icon: GraduationCap,
  },
];

/**
 * Map Frappe icon names to Lucide components
 */
const iconComponents: Record<string, LucideIcon> = {
  Home,
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  MessageSquare,
  Newspaper,
  Calendar,
  GraduationCap,
  Settings,
  File,
  Folder,
  BarChart,
  Mail,
  Star,
  Package,
};

function getIconComponent(iconName?: string): LucideIcon {
  if (!iconName) return File;

  // Try direct lookup
  const lucideName = iconMapping[iconName];
  if (lucideName && iconComponents[lucideName]) {
    return iconComponents[lucideName];
  }

  // Try Pascal case conversion
  const pascalCase = iconName
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  if (iconComponents[pascalCase]) {
    return iconComponents[pascalCase];
  }

  return File;
}

interface SidebarProps {
  className?: string;
}

/**
 * Workspace navigation item with optional children
 */
function WorkspaceNavItem({
  workspace,
  pathname,
  level = 0,
}: {
  workspace: SidebarWorkspace;
  pathname: string;
  level?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = workspace.children.length > 0;
  const Icon = getIconComponent(workspace.icon);

  const isActive = pathname === workspace.href || pathname.startsWith(`${workspace.href}/`);
  const isChildActive = workspace.children.some(
    (child) => pathname === child.href || pathname.startsWith(`${child.href}/`)
  );

  // Auto-expand if a child is active
  const shouldExpand = isExpanded || isChildActive;

  return (
    <div>
      <div className="flex items-center">
        <Link
          href={workspace.href}
          className={cn(
            "flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            "hover:bg-accent hover:text-accent-foreground",
            isActive || isChildActive
              ? "bg-primary/10 text-primary hover:bg-primary/15"
              : "text-muted-foreground",
            level > 0 && "pl-9"
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5 shrink-0 transition-colors",
              isActive || isChildActive ? "text-primary" : "text-muted-foreground"
            )}
          />
          <span className="flex-1 truncate">{workspace.title}</span>
        </Link>

        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!shouldExpand)}
            className={cn(
              "p-1.5 rounded-md hover:bg-accent transition-colors",
              "text-muted-foreground hover:text-foreground"
            )}
          >
            {shouldExpand ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {hasChildren && shouldExpand && (
        <div className="mt-1 space-y-1">
          {workspace.children.map((child) => (
            <WorkspaceNavItem
              key={child.name}
              workspace={child}
              pathname={pathname}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Section header for workspace groups
 */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      {children}
    </h3>
  );
}

/**
 * Loading skeleton for sidebar
 */
function SidebarSkeleton() {
  return (
    <div className="space-y-2 px-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { publicWorkspaces, privateWorkspaces, isLoading, error } = useWorkspaces();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // Use fallback navigation if there's an error or no workspaces
  const useFallback = error || (!isLoading && publicWorkspaces.length === 0 && privateWorkspaces.length === 0);

  return (
    <aside className={cn("flex flex-col h-full bg-background", className)}>
      <div className="flex-1 overflow-y-auto py-4">
        {isLoading ? (
          <SidebarSkeleton />
        ) : useFallback ? (
          // Fallback static navigation
          <nav className="space-y-1 px-3">
            {fallbackNavigationItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "hover:bg-accent hover:text-accent-foreground",
                    active
                      ? "bg-primary/10 text-primary hover:bg-primary/15"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-colors",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        ) : (
          // Dynamic workspaces
          <nav className="space-y-4">
            {/* Private workspaces section */}
            {privateWorkspaces.length > 0 && (
              <div>
                <SectionHeader>My Workspaces</SectionHeader>
                <div className="space-y-1 px-3">
                  {privateWorkspaces.map((workspace) => (
                    <WorkspaceNavItem
                      key={workspace.name}
                      workspace={workspace}
                      pathname={pathname}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Public workspaces section */}
            {publicWorkspaces.length > 0 && (
              <div>
                {privateWorkspaces.length > 0 && (
                  <SectionHeader>Public</SectionHeader>
                )}
                <div className="space-y-1 px-3">
                  {publicWorkspaces.map((workspace) => (
                    <WorkspaceNavItem
                      key={workspace.name}
                      workspace={workspace}
                      pathname={pathname}
                    />
                  ))}
                </div>
              </div>
            )}
          </nav>
        )}
      </div>

      {/* Footer section */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          Kairos v0.1.0
        </p>
      </div>
    </aside>
  );
}

// Export for use in mobile sidebar
export { fallbackNavigationItems as navigationItems };
export type { NavItem };
