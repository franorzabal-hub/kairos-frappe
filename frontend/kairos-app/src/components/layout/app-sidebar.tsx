/**
 * App Sidebar Component (Attio-style)
 *
 * Sidebar with:
 * - Quick actions (Cmd+K trigger)
 * - Search input
 * - Navigation sections (Notifications, etc.)
 * - Records section (DocTypes)
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Command,
  LayoutGrid,
  Search,
  Users,
  Building2,
  MessageSquare,
  Newspaper,
  Calendar,
  GraduationCap,
  UserCheck,
  MapPin,
  Layers,
  PanelLeftClose,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SearchDialog } from "@/components/search/search-dialog";
import { useSidebar } from "./sidebar-context";

// ============================================================================
// Types
// ============================================================================

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

interface DocTypeItem {
  name: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

interface SidebarSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

interface AppSidebarProps {
  className?: string;
}

// ============================================================================
// Data
// ============================================================================

/**
 * Main navigation items
 */
const navigationItems: NavItem[] = [
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
];

/**
 * Comunicación - DocTypes relacionados a comunicación con padres/tutores
 */
const comunicacionItems: DocTypeItem[] = [
  {
    name: "Message",
    label: "Mensajes",
    icon: MessageSquare,
    href: "/Message",
  },
  {
    name: "News",
    label: "Noticias",
    icon: Newspaper,
    href: "/News",
  },
  {
    name: "School Event",
    label: "Eventos",
    icon: Calendar,
    href: "/School-Event",
  },
];

/**
 * Estructura - DocTypes relacionados a la estructura de la institución
 */
const estructuraItems: DocTypeItem[] = [
  {
    name: "Institution",
    label: "Institución",
    icon: Building2,
    href: "/Institution",
  },
  {
    name: "Campus",
    label: "Sedes",
    icon: MapPin,
    href: "/Campus",
  },
  {
    name: "Grade",
    label: "Grados",
    icon: GraduationCap,
    href: "/Grade",
  },
  {
    name: "Section",
    label: "Secciones",
    icon: Layers,
    href: "/Section",
  },
  {
    name: "Student",
    label: "Alumnos",
    icon: Users,
    href: "/Student",
  },
  {
    name: "Guardian",
    label: "Tutores",
    icon: UserCheck,
    href: "/Guardian",
  },
];

// ============================================================================
// Components
// ============================================================================

/**
 * Collapsible sidebar section
 */
function SidebarSection({
  title,
  defaultOpen = true,
  children,
}: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="py-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        {title}
      </button>
      {isOpen && <div className="mt-1">{children}</div>}
    </div>
  );
}

/**
 * Navigation item component
 */
function NavItemLink({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </Link>
  );
}

/**
 * Record type item component (for DocTypes)
 */
function RecordItemLink({
  item,
  isActive,
}: {
  item: DocTypeItem;
  isActive: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1">{item.label}</span>
    </Link>
  );
}

/**
 * Sidebar header with search and collapse button
 */
function SidebarHeader() {
  const [open, setOpen] = useState(false);
  const { collapse } = useSidebar();

  return (
    <>
      {/* Header row with Quick Actions, Search, and Collapse */}
      <div className="flex items-center gap-1">
        {/* Quick Actions Button */}
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors shadow-sm flex-1 min-w-0"
        >
          <Command className="h-4 w-4 flex-shrink-0" />
          <span className="whitespace-nowrap truncate">Quick actions</span>
          <kbd className="hidden sm:flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground flex-shrink-0">
            ⌘K
          </kbd>
        </button>

        {/* Search + Slash */}
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shadow-sm flex-shrink-0"
        >
          <Search className="h-4 w-4" />
          <span className="text-sm font-medium">/</span>
        </button>

        {/* Collapse Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={collapse}
                className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-foreground"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Collapse sidebar
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Search Dialog */}
      <SearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();

  const isNavActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isRecordActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col border-r bg-muted/50",
        className
      )}
    >
      {/* Header with Quick Actions, Search & Collapse */}
      <div className="px-3 py-2">
        <SidebarHeader />
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Main Navigation */}
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <NavItemLink
                key={item.href}
                item={item}
                isActive={isNavActive(item.href)}
              />
            ))}
          </nav>

          {/* Comunicación Section */}
          <SidebarSection title="Comunicación" defaultOpen>
            <nav className="space-y-1">
              {comunicacionItems.map((item) => (
                <RecordItemLink
                  key={item.name}
                  item={item}
                  isActive={isRecordActive(item.href)}
                />
              ))}
            </nav>
          </SidebarSection>

          {/* Estructura Section */}
          <SidebarSection title="Estructura" defaultOpen>
            <nav className="space-y-1">
              {estructuraItems.map((item) => (
                <RecordItemLink
                  key={item.name}
                  item={item}
                  isActive={isRecordActive(item.href)}
                />
              ))}
            </nav>
          </SidebarSection>
        </div>
      </ScrollArea>
    </aside>
  );
}

export default AppSidebar;
