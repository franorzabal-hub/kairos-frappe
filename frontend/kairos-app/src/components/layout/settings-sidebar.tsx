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
      { label: "User", href: "/User", icon: User, doctype: "User" },
      { label: "Role", href: "/Role", icon: UserCheck, doctype: "Role" },
      { label: "Role Profile", href: "/Role-Profile", icon: Users, doctype: "Role Profile" },
      { label: "User Permission", href: "/User-Permission", icon: Lock, doctype: "User Permission" },
      { label: "Module Profile", href: "/Module-Profile", icon: LayoutGrid, doctype: "Module Profile" },
      { label: "Activity Log", href: "/Activity-Log", icon: Activity, doctype: "Activity Log" },
    ],
  },
  {
    title: "Website",
    items: [
      { label: "Website Settings", href: "/Website-Settings", icon: Globe, doctype: "Website Settings" },
      { label: "Website Theme", href: "/Website-Theme", icon: Palette, doctype: "Website Theme" },
      { label: "Web Page", href: "/Web-Page", icon: FileText, doctype: "Web Page" },
      { label: "Web Form", href: "/Web-Form", icon: ClipboardList, doctype: "Web Form" },
      { label: "Blog Post", href: "/Blog-Post", icon: FileText, doctype: "Blog Post" },
      { label: "Portal Settings", href: "/Portal-Settings", icon: Globe, doctype: "Portal Settings" },
    ],
  },
  {
    title: "Tools",
    items: [
      { label: "Data Import", href: "/Data-Import", icon: Upload, doctype: "Data Import" },
      { label: "Deleted Documents", href: "/Deleted-Document", icon: FolderOpen, doctype: "Deleted Document" },
      { label: "ToDo", href: "/ToDo", icon: CheckSquare, doctype: "ToDo" },
      { label: "File", href: "/File", icon: FolderOpen, doctype: "File" },
      { label: "Assignment Rule", href: "/Assignment-Rule", icon: ListChecks, doctype: "Assignment Rule" },
      { label: "Auto Repeat", href: "/Auto-Repeat", icon: RefreshCw, doctype: "Auto Repeat" },
    ],
  },
  {
    title: "Email & Notifications",
    items: [
      { label: "Email Account", href: "/Email-Account", icon: Mail, doctype: "Email Account" },
      { label: "Email Template", href: "/Email-Template", icon: Mail, doctype: "Email Template" },
      { label: "Notification", href: "/Notification", icon: Bell, doctype: "Notification" },
      { label: "Notification Settings", href: "/Notification-Settings", icon: Bell, doctype: "Notification Settings" },
      { label: "Print Settings", href: "/Print-Settings", icon: Printer, doctype: "Print Settings" },
    ],
  },
  {
    title: "Integrations",
    items: [
      { label: "Webhook", href: "/Webhook", icon: Webhook, doctype: "Webhook" },
      { label: "Social Login Key", href: "/Social-Login-Key", icon: Key, doctype: "Social Login Key" },
      { label: "OAuth Client", href: "/OAuth-Client", icon: Shield, doctype: "OAuth Client" },
      { label: "Google Settings", href: "/Google-Settings", icon: Globe, doctype: "Google Settings" },
      { label: "SMS Settings", href: "/SMS-Settings", icon: Smartphone, doctype: "SMS Settings" },
      { label: "Push Notification Settings", href: "/Push-Notification-Settings", icon: Megaphone, doctype: "Push Notification Settings" },
    ],
  },
  {
    title: "Build",
    items: [
      { label: "DocType", href: "/DocType", icon: Database, doctype: "DocType" },
      { label: "Customize Form", href: "/Customize-Form", icon: Settings, doctype: "Customize Form" },
      { label: "Custom Field", href: "/Custom-Field", icon: SquareCode, doctype: "Custom Field" },
      { label: "Report", href: "/Report", icon: FileCode, doctype: "Report" },
      { label: "Print Format", href: "/Print-Format", icon: Printer, doctype: "Print Format" },
      { label: "Server Script", href: "/Server-Script", icon: Code, doctype: "Server Script" },
      { label: "Client Script", href: "/Client-Script", icon: Code, doctype: "Client Script" },
      { label: "Workflow", href: "/Workflow", icon: Workflow, doctype: "Workflow" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "System Settings", href: "/System-Settings", icon: Cog, doctype: "System Settings" },
      { label: "Error Log", href: "/Error-Log", icon: FileText, doctype: "Error Log" },
      { label: "Scheduled Job Log", href: "/Scheduled-Job-Log", icon: Calendar, doctype: "Scheduled Job Log" },
      { label: "Background Jobs", href: "/RQ-Job", icon: Server, doctype: "RQ Job" },
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
