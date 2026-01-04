/**
 * Header Component
 *
 * Top navigation bar with logo, search bar (awesomebar), notifications, theme toggle, and user dropdown menu
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Settings, User, Loader2, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Awesomebar } from "@/components/awesomebar";
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
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/notifications";
import { NewDocumentDialog } from "@/components/dialogs";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { user, isLoading, logout } = useCurrentUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showNewDoc, setShowNewDoc] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              K
            </div>
            <span className="hidden font-bold text-xl sm:inline-block">
              Kairos
            </span>
          </Link>
        </div>

        {/* Awesomebar - Global Search */}
        <div className="flex-1 flex justify-center max-w-2xl mx-auto">
          <Awesomebar className="w-full" />
        </div>

        {/* New Document, Notifications, Theme Toggle & User Dropdown */}
        <div className="flex items-center gap-2">
          {/* New Document */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNewDoc(true)}
            title="New Document (Ctrl+N)"
          >
            <Plus className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <NotificationBell />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Dropdown */}
          {isLoading ? (
            <Skeleton className="h-9 w-9 rounded-full" />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                  disabled={isLoggingOut}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatar || ""} alt={user?.fullName || "User"} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {user?.initials || "??"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.fullName || "User"}</p>
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
      </div>

      {/* New Document Dialog */}
      <NewDocumentDialog open={showNewDoc} onOpenChange={setShowNewDoc} />
    </header>
  );
}
