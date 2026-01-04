/**
 * Sidebar Component
 *
 * Navigation sidebar with workspace/module links and menu items
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Calendar,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  Settings,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navigationItems: NavItem[] = [
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

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className={cn("flex flex-col h-full bg-background", className)}>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigationItems.map((item) => {
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

// Export navigation items for use in mobile sidebar
export { navigationItems };
export type { NavItem };
