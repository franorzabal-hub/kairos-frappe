/**
 * Settings Sidebar Component (Frappe-style)
 *
 * Sidebar for settings pages organized by Frappe workspace categories:
 * - Users (Usuarios)
 * - Website (Sitio Web)
 * - Tools (Herramientas)
 * - Integrations (Integraciones)
 * - Build (Construir) - Developer
 * - System (Sistema)
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  Calendar,
  CheckSquare,
  ClipboardList,
  Code,
  Cog,
  Database,
  FileCode,
  FileText,
  FolderOpen,
  Globe,
  Key,
  LayoutGrid,
  ListChecks,
  Lock,
  Mail,
  Megaphone,
  Palette,
  Printer,
  RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  Smartphone,
  SquareCode,
  Upload,
  User,
  UserCheck,
  Users,
  Webhook,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

// ============================================================================
// Types
// ============================================================================

interface SettingsNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  doctype?: string; // Frappe DocType to link to
}

interface SettingsSection {
  title: string;
  items: SettingsNavItem[];
}

interface SettingsSidebarProps {
  className?: string;
}

// ============================================================================
// Data - Organized by Frappe Workspace Categories
// ============================================================================

const settingsSections: SettingsSection[] = [
  {
    title: "Users",
    items: [
      { label: "User", href: "/settings/User", icon: User, doctype: "User" },
      { label: "Role", href: "/settings/Role", icon: UserCheck, doctype: "Role" },
      { label: "Role Profile", href: "/settings/Role-Profile", icon: Users, doctype: "Role Profile" },
      { label: "User Permission", href: "/settings/User-Permission", icon: Lock, doctype: "User Permission" },
      { label: "Module Profile", href: "/settings/Module-Profile", icon: LayoutGrid, doctype: "Module Profile" },
      { label: "Activity Log", href: "/settings/Activity-Log", icon: Activity, doctype: "Activity Log" },
    ],
  },
  {
    title: "Website",
    items: [
      { label: "Website Settings", href: "/settings/Website-Settings", icon: Globe, doctype: "Website Settings" },
      { label: "Website Theme", href: "/settings/Website-Theme", icon: Palette, doctype: "Website Theme" },
      { label: "Web Page", href: "/settings/Web-Page", icon: FileText, doctype: "Web Page" },
      { label: "Web Form", href: "/settings/Web-Form", icon: ClipboardList, doctype: "Web Form" },
      { label: "Blog Post", href: "/settings/Blog-Post", icon: FileText, doctype: "Blog Post" },
      { label: "Portal Settings", href: "/settings/Portal-Settings", icon: Globe, doctype: "Portal Settings" },
    ],
  },
  {
    title: "Tools",
    items: [
      { label: "Data Import", href: "/settings/Data-Import", icon: Upload, doctype: "Data Import" },
      { label: "Deleted Documents", href: "/settings/Deleted-Document", icon: FolderOpen, doctype: "Deleted Document" },
      { label: "ToDo", href: "/settings/ToDo", icon: CheckSquare, doctype: "ToDo" },
      { label: "File", href: "/settings/File", icon: FolderOpen, doctype: "File" },
      { label: "Assignment Rule", href: "/settings/Assignment-Rule", icon: ListChecks, doctype: "Assignment Rule" },
      { label: "Auto Repeat", href: "/settings/Auto-Repeat", icon: RefreshCw, doctype: "Auto Repeat" },
    ],
  },
  {
    title: "Email & Notifications",
    items: [
      { label: "Email Account", href: "/settings/Email-Account", icon: Mail, doctype: "Email Account" },
      { label: "Email Template", href: "/settings/Email-Template", icon: Mail, doctype: "Email Template" },
      { label: "Notification", href: "/settings/Notification", icon: Bell, doctype: "Notification" },
      { label: "Notification Settings", href: "/settings/Notification-Settings", icon: Bell, doctype: "Notification Settings" },
      { label: "Print Settings", href: "/settings/Print-Settings", icon: Printer, doctype: "Print Settings" },
    ],
  },
  {
    title: "Integrations",
    items: [
      { label: "Webhook", href: "/settings/Webhook", icon: Webhook, doctype: "Webhook" },
      { label: "Social Login Key", href: "/settings/Social-Login-Key", icon: Key, doctype: "Social Login Key" },
      { label: "OAuth Client", href: "/settings/OAuth-Client", icon: Shield, doctype: "OAuth Client" },
      { label: "Google Settings", href: "/settings/Google-Settings", icon: Globe, doctype: "Google Settings" },
      { label: "SMS Settings", href: "/settings/SMS-Settings", icon: Smartphone, doctype: "SMS Settings" },
      { label: "Push Notification Settings", href: "/settings/Push-Notification-Settings", icon: Megaphone, doctype: "Push Notification Settings" },
    ],
  },
  {
    title: "Build",
    items: [
      { label: "DocType", href: "/settings/DocType", icon: Database, doctype: "DocType" },
      { label: "Customize Form", href: "/settings/Customize-Form", icon: Settings, doctype: "Customize Form" },
      { label: "Custom Field", href: "/settings/Custom-Field", icon: SquareCode, doctype: "Custom Field" },
      { label: "Report", href: "/settings/Report", icon: FileCode, doctype: "Report" },
      { label: "Print Format", href: "/settings/Print-Format", icon: Printer, doctype: "Print Format" },
      { label: "Server Script", href: "/settings/Server-Script", icon: Code, doctype: "Server Script" },
      { label: "Client Script", href: "/settings/Client-Script", icon: Code, doctype: "Client Script" },
      { label: "Workflow", href: "/settings/Workflow", icon: Workflow, doctype: "Workflow" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "System Settings", href: "/settings/System-Settings", icon: Cog, doctype: "System Settings" },
      { label: "Error Log", href: "/settings/Error-Log", icon: FileText, doctype: "Error Log" },
      { label: "Scheduled Job Log", href: "/settings/Scheduled-Job-Log", icon: Calendar, doctype: "Scheduled Job Log" },
      { label: "Background Jobs", href: "/settings/RQ-Job", icon: Server, doctype: "RQ Job" },
    ],
  },
];

// ============================================================================
// Components
// ============================================================================

/**
 * Section header
 */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      {children}
    </h3>
  );
}

/**
 * Navigation item
 */
function NavItem({
  item,
  isActive,
}: {
  item: SettingsNavItem;
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
      <span>{item.label}</span>
    </Link>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SettingsSidebar({ className }: SettingsSidebarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Filter sections based on search
  const filteredSections = settingsSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.doctype && item.doctype.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside
      className={cn(
        "flex h-full w-[280px] flex-col border-r bg-background overflow-hidden",
        className
      )}
    >
      {/* Search */}
      <div className="shrink-0 p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search settings..."
            className="h-9 pl-9 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 pb-6">
          {filteredSections.map((section) => (
            <div key={section.title} className="mb-4">
              <SectionHeader>{section.title}</SectionHeader>
              <nav className="space-y-1">
                {section.items.map((item) => (
                  <NavItem
                    key={item.href}
                    item={item}
                    isActive={isActive(item.href)}
                  />
                ))}
              </nav>
            </div>
          ))}

          {filteredSections.length === 0 && searchQuery && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No settings found for &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

export default SettingsSidebar;
