/**
 * ViewSwitcher Component
 *
 * A toggle component that allows switching between different view types
 * (List view, Calendar view, etc.) for DocType lists.
 */

"use client";

import { List, Calendar, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export type ViewType = "list" | "calendar" | "kanban";

interface ViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  availableViews?: ViewType[];
  disabled?: boolean;
  className?: string;
}

interface ViewOption {
  value: ViewType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

// ============================================================================
// Constants
// ============================================================================

const VIEW_OPTIONS: ViewOption[] = [
  {
    value: "list",
    label: "List",
    icon: <List className="h-4 w-4" />,
    description: "View as a table with columns",
  },
  {
    value: "kanban",
    label: "Kanban",
    icon: <Columns3 className="h-4 w-4" />,
    description: "View as a kanban board by status",
  },
  {
    value: "calendar",
    label: "Calendar",
    icon: <Calendar className="h-4 w-4" />,
    description: "View on a calendar by date",
  },
];

// ============================================================================
// Main Component
// ============================================================================

export function ViewSwitcher({
  currentView,
  onViewChange,
  availableViews = ["list"],
  disabled = false,
  className,
}: ViewSwitcherProps) {
  // Filter to only show available views
  const visibleOptions = VIEW_OPTIONS.filter((option) =>
    availableViews.includes(option.value)
  );

  // Don't render if only one view is available
  if (visibleOptions.length <= 1) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "inline-flex items-center rounded-lg border bg-muted p-1",
          className
        )}
        role="tablist"
        aria-label="View options"
      >
        {visibleOptions.map((option) => {
          const isActive = currentView === option.value;

          return (
            <Tooltip key={option.value}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onViewChange(option.value)}
                  disabled={disabled}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={option.value + "-view"}
                  className={cn(
                    "h-8 px-3 gap-1.5",
                    isActive
                      ? "bg-background shadow-sm hover:bg-background"
                      : "hover:bg-background/50"
                  )}
                >
                  {option.icon}
                  <span className="hidden sm:inline text-xs font-medium">
                    {option.label}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {option.description}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

// ============================================================================
// Compact Version
// ============================================================================

interface CompactViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  availableViews?: ViewType[];
  disabled?: boolean;
  className?: string;
}

export function CompactViewSwitcher({
  currentView,
  onViewChange,
  availableViews = ["list"],
  disabled = false,
  className,
}: CompactViewSwitcherProps) {
  // Filter to only show available views
  const visibleOptions = VIEW_OPTIONS.filter((option) =>
    availableViews.includes(option.value)
  );

  // Don't render if only one view is available
  if (visibleOptions.length <= 1) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn("inline-flex items-center gap-1", className)}
        role="tablist"
        aria-label="View options"
      >
        {visibleOptions.map((option) => {
          const isActive = currentView === option.value;

          return (
            <Tooltip key={option.value}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => onViewChange(option.value)}
                  disabled={disabled}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={option.value + "-view"}
                  className={cn(
                    isActive && "bg-secondary"
                  )}
                >
                  {option.icon}
                  <span className="sr-only">{option.label} view</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {option.description}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
