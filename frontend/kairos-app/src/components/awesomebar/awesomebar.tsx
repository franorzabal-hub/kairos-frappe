/**
 * Awesomebar Component
 *
 * Global search command palette for Kairos Desk.
 * Opens with Cmd+K (Mac) or Ctrl+K (Windows/Linux).
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
  SearchResultsList,
  RecentItems,
  useSearchNavigation,
} from "./search-results";

// ============================================================================
// Types
// ============================================================================

interface AwesomebarProps {
  className?: string;
  placeholder?: string;
}

// ============================================================================
// Awesomebar Component
// ============================================================================

export function Awesomebar({
  className,
  placeholder = "Search or type a command...",
}: AwesomebarProps) {
  const [open, setOpen] = useState(false);

  const {
    query,
    setQuery,
    results,
    isLoading,
    error,
    recentItems,
    addRecentItem,
    clearRecentItems,
    clear,
    loadInitialRecords,
  } = useGlobalSearch();

  const { navigateToDocument } = useSearchNavigation(
    () => {
      setOpen(false);
      clear();
    },
    addRecentItem
  );

  // Load records when dialog opens
  useEffect(() => {
    if (open) {
      loadInitialRecords();
    }
  }, [open, loadInitialRecords]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen);
      if (!isOpen) {
        setTimeout(() => {
          clear();
        }, 150);
      }
    },
    [clear]
  );

  const hasResults = results.length > 0;
  const hasRecentItems = recentItems.length > 0;
  const showEmptyState = query.length >= 2 && !isLoading && !hasResults;
  const showRecentItems = !query && hasRecentItems;

  return (
    <>
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

      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <CommandInput
          placeholder={placeholder}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading && <CommandLoading />}

          {showEmptyState && (
            <CommandEmpty>
              No results found for &ldquo;{query}&rdquo;
            </CommandEmpty>
          )}

          {error && (
            <div className="py-6 text-center text-sm text-destructive">
              {error}
            </div>
          )}

          {hasResults && (
            <>
              <SearchResultsList
                results={results}
                onSelect={navigateToDocument}
              />
              <CommandSeparator />
            </>
          )}

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

          {!query && !hasRecentItems && !hasResults && (
            <CommandGroup heading="Tips">
              <CommandItem disabled value="tip-search">
                <span className="text-muted-foreground">
                  Type to search students, guardians, messages...
                </span>
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>

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

export function AwesomebarTrigger({
  children,
  className,
  onClick,
}: {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
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

export default Awesomebar;
