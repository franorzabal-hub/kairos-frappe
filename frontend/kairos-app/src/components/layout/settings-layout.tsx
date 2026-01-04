/**
 * Settings Layout Component (Attio-style)
 *
 * Full layout for settings pages combining:
 * - SettingsHeader (top)
 * - SettingsSidebar (left)
 * - Content area (right)
 */

"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SettingsHeader } from "./settings-header";
import { SettingsSidebar } from "./settings-sidebar";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex h-screen flex-col bg-background overflow-hidden">
      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Settings Navigation</SheetTitle>
          </SheetHeader>
          <SettingsSidebar className="w-full border-r-0" />
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
          <span className="sr-only">Toggle settings menu</span>
        </Button>

        {/* Header component */}
        <SettingsHeader className="flex-1" />
      </div>

      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <SettingsSidebar className="hidden md:flex flex-shrink-0" />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="h-full p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
