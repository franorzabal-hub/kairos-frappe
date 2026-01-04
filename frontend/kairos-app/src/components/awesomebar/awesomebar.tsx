/**
 * Awesomebar Component
 *
 * Global search command palette for Kairos Desk.
 * Opens with Cmd+K (Mac) or Ctrl+K (Windows/Linux).
 * Provides search across DocTypes, recent items, and quick actions.
 */

"use client";

import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandLoading,
} from "@/components/ui/command";
import { useGlobalSearch } from "@/hooks/use-global-search";
import {
  SearchResults,
  RecentItems,
  QuickActions,
  useSearchNavigation,
} from "./search-results";

// ============================================================================
// Types
// ============================================================================

interface AwesomebarProps {
  /** Additional className for the trigger button */
  className?: string;
  /** Placeholder text for the search input */
  placeholder?: string;
}

// ============================================================================
// Awesomebar Component
// ============================================================================

/**
 * Global search command palette component.
 *
 * Features:
 * - Opens with Cmd+K (Mac) or Ctrl+K (Windows/Linux)
 * - Searches across all DocTypes (Students, Guardians, Messages, etc.)
 * - Shows recent items for quick access
 * - Provides quick actions to create new documents
 * - Debounced search with loading states
 *
 * @example
 * ```tsx
 * // In your header/navbar component
 * <Awesomebar />
 *
 * // With custom placeholder
 * <Awesomebar placeholder="Search Kairos..." />
 * ```
 */
export function Awesomebar({
  className,
  placeholder = "Search or type a command...",
}: AwesomebarProps) {
  const [open, setOpen] = useState(false);

  // Global search hook
  const {
    query,
    setQuery,
    results,
    isLoading,
    error,
    recentItems,
    addRecentItem,
    clearRecentItems,
    quickActions,
    clear,
  } = useGlobalSearch();

  // Navigation helpers
  const { navigateToDocument, navigateToNew } = useSearchNavigation(
    () => {
      setOpen(false);
      clear();
    },
    addRecentItem
  );

  // ============================================================================
  // Keyboard Shortcut
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Clear search when dialog closes
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen);
      if (!isOpen) {
        // Delay clearing to avoid flash during close animation
        setTimeout(() => {
          clear();
        }, 150);
      }
    },
    [clear]
  );

  // ============================================================================
  // Computed Values
  // ============================================================================

  const hasResults = Object.keys(results).length > 0;
  const hasRecentItems = recentItems.length > 0;
  const showEmptyState = query.length >= 2 && !isLoading && !hasResults;
  const showQuickActions = !query || query.toLowerCase().startsWith("new");
  const showRecentItems = !query && hasRecentItems;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-full justify-start rounded-md bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64",
          className
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search...</span>
        <span className="inline-flex lg:hidden">Search</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">
            {typeof navigator !== "undefined" &&
            navigator.platform?.toLowerCase().includes("mac")
              ? "Cmd"
              : "Ctrl"}
          </span>
          K
        </kbd>
      </Button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <CommandInput
          placeholder={placeholder}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {/* Loading State */}
          {isLoading && <CommandLoading />}

          {/* Empty State */}
          {showEmptyState && (
            <CommandEmpty>
              No results found for &ldquo;{query}&rdquo;
            </CommandEmpty>
          )}

          {/* Error State */}
          {error && (
            <div className="py-6 text-center text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Search Results */}
          {hasResults && (
            <>
              <SearchResults
                results={results}
                onSelect={navigateToDocument}
              />
              <CommandSeparator />
            </>
          )}

          {/* Recent Items (when no query) */}
          {showRecentItems && (
            <>
              <RecentItems
                items={recentItems}
                onSelect={navigateToDocument}
                onClear={clearRecentItems}
              />
              <CommandSeparator />
            </>
          )}

          {/* Quick Actions */}
          {showQuickActions && (
            <QuickActions
              actions={quickActions}
              onSelect={navigateToNew}
              query={query}
            />
          )}

          {/* Navigation Hints */}
          {!query && !hasRecentItems && (
            <CommandGroup heading="Tips">
              <CommandItem disabled value="tip-search">
                <span className="text-muted-foreground">
                  Type to search students, guardians, messages...
                </span>
              </CommandItem>
              <CommandItem disabled value="tip-new">
                <span className="text-muted-foreground">
                  Type &ldquo;new&rdquo; to create a new document
                </span>
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <kbd className="rounded border bg-muted px-1.5 py-0.5">
              <span>&#8593;</span>
              <span>&#8595;</span>
            </kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="rounded border bg-muted px-1.5 py-0.5">
              &#9166;
            </kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="rounded border bg-muted px-1.5 py-0.5">Esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </CommandDialog>
    </>
  );
}

// ============================================================================
// AwesomebarTrigger Component
// ============================================================================

/**
 * Standalone trigger for the Awesomebar.
 * Use this when you want to customize the trigger appearance.
 */
interface AwesomebarTriggerProps {
  /** Children to render inside the trigger */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Callback when clicked */
  onClick?: () => void;
}

export function AwesomebarTrigger({
  children,
  className,
  onClick,
}: AwesomebarTriggerProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={onClick}
    >
      {children || <Search className="h-4 w-4" />}
    </Button>
  );
}

// ============================================================================
// Default Export
// ============================================================================

export default Awesomebar;
