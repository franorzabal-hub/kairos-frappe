/**
 * App Header Component (Attio-style)
 *
 * Minimal header with:
 * - Logo + Workspace selector (left)
 * - Current context/page indicator (center-left)
 * - Actions: notifications, help, user avatar (right)
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  Calendar,
  ChevronDown,
  FileText,
  GraduationCap,
  HelpCircle,
  Home,
  LayoutGrid,
  Loader2,
  LogOut,
  Mail,
  MessageSquare,
  Newspaper,
  Settings,
  User,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn, slugToDoctype } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/notifications";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";

interface AppHeaderProps {
  className?: string;
}

/**
 * Map of routes/doctypes to their icons
 */
const contextIcons: Record<string, LucideIcon> = {
  home: Home,
  dashboard: LayoutGrid,
  notifications: Bell,
  student: Users,
  guardian: UserCheck,
  institution: Building2,
  message: MessageSquare,
  news: Newspaper,
  "school-event": Calendar,
  grade: GraduationCap,
  enrollment: FileText,
  "guardian-invite": Mail,
  settings: Settings,
};

/**
 * Get the current page context from pathname
 */
function usePageContext(): { title: string; icon: LucideIcon } {
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/dashboard") {
    return { title: "Home", icon: Home };
  }

  // Match /[doctype] or /[doctype]/[id]
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length >= 1) {
    const slug = segments[0].toLowerCase();
    const doctype = slugToDoctype(segments[0]);
    const icon = contextIcons[slug] || FileText;
    return { title: doctype, icon };
  }

  return { title: "Kairos", icon: Home };
}

export function AppHeader({ className }: AppHeaderProps) {
  const { user, isLoading, logout } = useCurrentUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pageContext = usePageContext();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-12 items-center border-b bg-background",
        className
      )}
    >
      {/* Left: Logo + Workspace Selector (same width as sidebar) */}
      <div className="hidden md:flex items-center gap-1 w-64 flex-shrink-0 border-r bg-muted/50 px-3">
        {/* Logo */}
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm"
        >
          K
        </Link>

        {/* Workspace Selector (placeholder - can expand later) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 font-semibold"
            >
              Kairos
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold mr-2">
                K
              </div>
              Kairos
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Current Page Context */}
      <div className="flex items-center gap-2 px-4">
        <pageContext.icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          {pageContext.title}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: Actions */}
      <div className="flex items-center gap-1 px-2">
        {/* Messages (placeholder) */}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </Button>

        {/* Notifications */}
        <NotificationBell />

        {/* Help */}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </Button>

        {/* User Dropdown */}
        {isLoading ? (
          <Skeleton className="h-8 w-8 rounded-full" />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full"
                disabled={isLoggingOut}
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage
                    src={user?.avatar || ""}
                    alt={user?.fullName || "User"}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {user?.initials || "??"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.fullName || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/User" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                {isLoggingOut ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
