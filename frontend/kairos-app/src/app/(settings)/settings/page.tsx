/**
 * Settings Overview Page
 *
 * Main settings page that shows quick access to common settings.
 */

import Link from "next/link";
import {
  Bell,
  Building2,
  CreditCard,
  Key,
  Mail,
  Palette,
  Settings,
  Shield,
  User,
  Users,
} from "lucide-react";

const settingsCards = [
  {
    title: "Profile",
    description: "Manage your personal information and preferences",
    href: "/settings/profile",
    icon: User,
  },
  {
    title: "Appearance",
    description: "Customize the look and feel of the application",
    href: "/settings/appearance",
    icon: Palette,
  },
  {
    title: "Notifications",
    description: "Configure how you receive notifications",
    href: "/settings/notifications",
    icon: Bell,
  },
  {
    title: "General",
    description: "Workspace-wide settings and configuration",
    href: "/settings/general",
    icon: Settings,
  },
  {
    title: "Members",
    description: "Manage team members and their permissions",
    href: "/settings/members",
    icon: Users,
  },
  {
    title: "Institutions",
    description: "Configure institutions and their settings",
    href: "/settings/institutions",
    icon: Building2,
  },
  {
    title: "Security",
    description: "Security settings and access controls",
    href: "/settings/security",
    icon: Shield,
  },
  {
    title: "API Keys",
    description: "Manage API keys for integrations",
    href: "/settings/api-keys",
    icon: Key,
  },
];

export default function SettingsPage() {
  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and workspace settings
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {settingsCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{card.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {card.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
