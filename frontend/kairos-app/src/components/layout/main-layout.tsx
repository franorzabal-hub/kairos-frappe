/**
 * Main Layout Component (Attio-style)
 *
 * Combines AppHeader and AppSidebar with responsive behavior
 * - Desktop: Resizable sidebar on the left, minimal header on top
 * - Mobile: Collapsible sidebar via sheet
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Menu, PanelLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
    isCollapsed,
    isResizing,
    minWidth,
    maxWidth,
    setWidth,
    startResizing,
    stopResizing,
    expand,
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

      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Expand button when collapsed */}
        {isCollapsed && (
          <div className="hidden md:flex items-start pt-2 pl-2 flex-shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={expand}
                    className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Expand sidebar
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

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
