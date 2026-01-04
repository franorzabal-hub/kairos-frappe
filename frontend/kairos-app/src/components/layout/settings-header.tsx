/**
 * Settings Header Component (Attio-style)
 *
 * Header for settings pages with:
 * - Back arrow + "Settings" title (left, same width as sidebar)
 * - Breadcrumb navigation (center)
 * - Help icon (right)
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SettingsHeaderProps {
  className?: string;
}

/**
 * Generate breadcrumb from pathname
 */
function useBreadcrumb() {
  const pathname = usePathname();

  // Remove /settings prefix and split
  const path = pathname.replace(/^\/settings\/?/, "");
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [];
  }

  // Build breadcrumb items
  return segments.map((segment, index) => {
    const href = "/settings/" + segments.slice(0, index + 1).join("/");
    const label = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return { label, href, isLast: index === segments.length - 1 };
  });
}

export function SettingsHeader({ className }: SettingsHeaderProps) {
  const breadcrumb = useBreadcrumb();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-12 items-center border-b bg-background",
        className
      )}
    >
      {/* Left: Back + Settings title (same width as sidebar) */}
      <div className="flex items-center w-[280px] flex-shrink-0 border-r px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-muted-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </div>

      {/* Center: Breadcrumb */}
      <div className="flex items-center gap-1 px-4">
        {breadcrumb.map((item, index) => (
          <div key={item.href} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            {item.isLast ? (
              <span className="text-sm font-medium text-foreground">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: Help */}
      <div className="flex items-center px-4">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
}
