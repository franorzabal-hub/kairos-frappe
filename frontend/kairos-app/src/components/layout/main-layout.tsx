/**
 * Main Layout Component
 *
 * Combines header, sidebar, and main content area with responsive behavior
 * - Desktop: Fixed sidebar on the left, header on top
 * - Mobile: Collapsible sidebar via hamburger menu
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Header } from "./header";
import { Sidebar, navigationItems } from "./sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                K
              </div>
              <span className="font-bold text-xl">Kairos</span>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-3">
              {navigationItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
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
            </div>
          </nav>
          <div className="border-t p-4">
            <p className="text-xs text-muted-foreground text-center">
              Kairos v0.1.0
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Header with mobile menu button */}
      <div className="sticky top-0 z-40 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden ml-2"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>

        {/* Header component */}
        <Header className="flex-1 border-b-0" />
      </div>

      {/* Main content area with desktop sidebar */}
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-[220px] lg:w-[280px] border-r flex-shrink-0">
          <Sidebar className="w-full" />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-7xl p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
