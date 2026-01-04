/**
 * Settings Sidebar Component (Attio-style)
 *
 * Sidebar for settings pages with:
 * - Search input
 * - Grouped navigation sections
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  CreditCard,
  Database,
  Key,
  LayoutGrid,
  Mail,
  Palette,
  Search,
  Settings,
  Shield,
  User,
  Users,
  Webhook,
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
}

interface SettingsSection {
  title: string;
  items: SettingsNavItem[];
}

interface SettingsSidebarProps {
  className?: string;
}

// ============================================================================
// Data
// ============================================================================

const settingsSections: SettingsSection[] = [
  {
    title: "Personal",
    items: [
      { label: "Profile", href: "/settings/profile", icon: User },
      { label: "Appearance", href: "/settings/appearance", icon: Palette },
      { label: "Notifications", href: "/settings/notifications", icon: Bell },
    ],
  },
  {
    title: "Workspace",
    items: [
      { label: "General", href: "/settings/general", icon: Settings },
      { label: "Members", href: "/settings/members", icon: Users },
      { label: "Institutions", href: "/settings/institutions", icon: Building2 },
      { label: "Billing", href: "/settings/billing", icon: CreditCard },
    ],
  },
  {
    title: "Developer",
    items: [
      { label: "API Keys", href: "/settings/api-keys", icon: Key },
      { label: "Webhooks", href: "/settings/webhooks", icon: Webhook },
      { label: "Integrations", href: "/settings/integrations", icon: LayoutGrid },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Security", href: "/settings/security", icon: Shield },
      { label: "Email", href: "/settings/email", icon: Mail },
      { label: "Data", href: "/settings/data", icon: Database },
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
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside
      className={cn(
        "flex h-full w-[280px] flex-col border-r bg-background",
        className
      )}
    >
      {/* Search */}
      <div className="p-3 border-b">
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
      <ScrollArea className="flex-1">
        <div className="p-2">
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
