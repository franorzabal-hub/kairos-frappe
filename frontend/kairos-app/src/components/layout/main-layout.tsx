/**
 * Main Layout Component (Attio-style)
 *
 * Combines AppHeader and AppSidebar with responsive behavior
 * - Desktop: Resizable sidebar on the left, minimal header on top
 * - Mobile: Collapsible sidebar via sheet
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown, Menu, PanelLeftClose } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { SidebarProvider, useSidebar } from "./sidebar-context";

interface MainLayoutProps {
  children: React.ReactNode;
}

function MainLayoutContent({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    width,
    actualWidth,
    isCollapsed,
    isHoverExpanded,
    isResizing,
    minWidth,
    maxWidth,
    setWidth,
    startResizing,
    stopResizing,
    setHoverExpanded,
    collapse,
  } = useSidebar();

  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle mouse move for resizing
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    },
    [isResizing, minWidth, maxWidth, setWidth]
  );

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    stopResizing();
  }, [stopResizing]);

  // Add/remove event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className="relative flex h-screen flex-col bg-background overflow-hidden">
      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <AppSidebar className="w-full border-r-0" />
        </SheetContent>
      </Sheet>

      {/* Header */}
      <div className="sticky top-0 z-40 flex items-center bg-background">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden ml-1 h-8 w-8"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>

        {/* Header component */}
        <AppHeader className="flex-1" />
      </div>

      {/* Hover zone to expand collapsed sidebar (full height) */}
      {isCollapsed && !isHoverExpanded && (
        <div
          className="hidden md:block fixed left-0 top-0 bottom-0 w-2 z-[60] cursor-pointer"
          onMouseEnter={() => setHoverExpanded(true)}
        />
      )}

      {/* Hover-expanded sidebar overlay (header + sidebar) */}
      {isCollapsed && isHoverExpanded && (
        <div
          className="hidden md:flex fixed left-0 top-0 bottom-0 z-[60] flex-col shadow-xl border-r bg-background"
          style={{ width: actualWidth }}
          onMouseLeave={() => setHoverExpanded(false)}
        >
          {/* Hover sidebar header */}
          <div className="flex h-12 items-center gap-1 border-b bg-muted/50 px-3 flex-shrink-0">
            {/* Logo */}
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm flex-shrink-0"
            >
              K
            </Link>

            {/* Workspace Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 px-2 font-semibold"
                >
                  <span className="truncate">Kairos</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
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

            {/* Spacer */}
            <div className="flex-1" />

            {/* Collapse Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setHoverExpanded(false);
                      collapse();
                    }}
                    className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 group"
                  >
                    <PanelLeftClose className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="flex items-center gap-2">
                  <span>Collapse sidebar</span>
                  <div className="flex items-center gap-0.5">
                    <kbd className="flex h-5 min-w-5 items-center justify-center rounded border border-background/30 bg-foreground px-1 font-mono text-[10px] font-medium text-background">
                      ⌘
                    </kbd>
                    <kbd className="flex h-5 min-w-5 items-center justify-center rounded border border-background/30 bg-foreground px-1 font-mono text-[10px] font-medium text-background">
                      .
                    </kbd>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Hover sidebar content */}
          <AppSidebar className="flex-1" />
        </div>
      )}

      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">

        {/* Desktop Sidebar with resize handle */}
        <div
          ref={sidebarRef}
          className={cn(
            "hidden md:flex flex-shrink-0 relative transition-[width] duration-200",
            isResizing && "select-none transition-none"
          )}
          style={{ width: isCollapsed ? 0 : width }}
        >
          <AppSidebar
            className={cn(
              "flex-1 transition-opacity duration-200 overflow-hidden",
              isCollapsed && "opacity-0 pointer-events-none w-0"
            )}
          />

          {/* Resize handle */}
          {!isCollapsed && (
            <div
              className={cn(
                "absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 transition-colors z-10",
                isResizing && "bg-primary/30"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                startResizing();
              }}
            />
          )}
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="h-full p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </SidebarProvider>
  );
}
