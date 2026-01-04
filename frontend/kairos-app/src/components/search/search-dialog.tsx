/**
 * Search Dialog Component (Attio-style)
 *
 * Split-view search dialog with:
 * - Left panel: Search input + results list
 * - Right panel: Preview of selected record with details
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFrappeGetDoc } from "frappe-react-sdk";
import {
  Building2,
  Calendar,
  FileText,
  GraduationCap,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Newspaper,
  Plus,
  Search,
  Tag,
  UserCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, doctypeToSlug } from "@/lib/utils";
import { useGlobalSearch, type GlobalSearchResult } from "@/hooks/use-global-search";

// ============================================================================
// Types
// ============================================================================

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResultItemProps {
  item: GlobalSearchResult;
  isSelected: boolean;
  onSelect: () => void;
  onNavigate: () => void;
}

interface RecordPreviewProps {
  item: GlobalSearchResult | null;
  onOpenRecord: () => void;
}

// ============================================================================
// DocType Icons & Labels
// ============================================================================

const DOCTYPE_ICONS: Record<string, LucideIcon> = {
  Student: Users,
  Guardian: UserCheck,
  Institution: Building2,
  Message: MessageSquare,
  News: Newspaper,
  "School Event": Calendar,
  Grade: GraduationCap,
  Enrollment: FileText,
  "Guardian Invite": Mail,
};

const DOCTYPE_COLORS: Record<string, string> = {
  Student: "bg-blue-100 text-blue-700",
  Guardian: "bg-green-100 text-green-700",
  Institution: "bg-purple-100 text-purple-700",
  Message: "bg-yellow-100 text-yellow-700",
  News: "bg-pink-100 text-pink-700",
  "School Event": "bg-orange-100 text-orange-700",
  Grade: "bg-cyan-100 text-cyan-700",
  Enrollment: "bg-indigo-100 text-indigo-700",
  "Guardian Invite": "bg-emerald-100 text-emerald-700",
};

function getDocTypeIcon(doctype: string): LucideIcon {
  return DOCTYPE_ICONS[doctype] || FileText;
}

function getDocTypeColor(doctype: string): string {
  return DOCTYPE_COLORS[doctype] || "bg-gray-100 text-gray-700";
}

// ============================================================================
// Search Result Item
// ============================================================================

function SearchResultItem({
  item,
  isSelected,
  onSelect,
  onNavigate,
}: SearchResultItemProps) {
  const Icon = getDocTypeIcon(item.doctype);
  const colorClass = getDocTypeColor(item.doctype);

  return (
    <button
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors",
        isSelected
          ? "bg-accent"
          : "hover:bg-muted/50"
      )}
      onClick={onSelect}
      onDoubleClick={onNavigate}
    >
      <div className="flex items-center justify-center h-9 w-9 rounded-full bg-muted flex-shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate">{item.name}</span>
          {item.description && (
            <span className="text-sm text-muted-foreground truncate">
              {item.description}
            </span>
          )}
        </div>
      </div>
      <Badge
        variant="outline"
        className={cn(
          "text-xs font-normal flex items-center gap-1 flex-shrink-0",
          colorClass
        )}
      >
        <Icon className="h-3 w-3" />
        {item.doctype}
      </Badge>
    </button>
  );
}

// ============================================================================
// Record Preview Panel
// ============================================================================

function RecordPreview({ item, onOpenRecord }: RecordPreviewProps) {
  // Fetch actual document data when item is selected
  const { data: docData, isLoading: docLoading } = useFrappeGetDoc(
    item?.doctype || "",
    item?.name || "",
    item ? undefined : null // Only fetch when item exists
  );

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Search className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm">Select a record to preview</p>
      </div>
    );
  }

  const Icon = getDocTypeIcon(item.doctype);

  // Extract common fields from document data
  const doc = docData as Record<string, unknown> | undefined;
  const description = doc?.description as string | undefined;
  const email = doc?.email as string | undefined;
  const phone = doc?.phone as string | undefined;
  const mobile = doc?.mobile_no as string | undefined;
  const address = doc?.address as string | undefined;
  const city = doc?.city as string | undefined;
  const state = doc?.state as string | undefined;
  const country = doc?.country as string | undefined;
  const status = doc?.status as string | undefined;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted flex-shrink-0">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{item.name}</h3>
              {status && (
                <Badge variant="outline" className="text-xs font-normal">
                  {status}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            Details
          </p>

          {docLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Description */}
              {description && (
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground">{description}</p>
                </div>
              )}

              {/* Email */}
              {email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{email}</span>
                </div>
              )}

              {/* Phone */}
              {(phone || mobile) && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{phone || mobile}</span>
                </div>
              )}

              {/* Location */}
              {(city || state || country) && (
                <>
                  {city && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{city}</span>
                    </div>
                  )}
                  {state && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{state}</span>
                    </div>
                  )}
                  {country && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{country}</span>
                    </div>
                  )}
                </>
              )}

              {/* Address */}
              {address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{address}</span>
                </div>
              )}

              {/* DocType badge */}
              <div className="flex items-center gap-3 pt-2">
                <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Badge variant="secondary" className="text-xs">
                  {item.doctype}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer - Attio style */}
      <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" className="gap-1">
          Actions
          <kbd className="ml-1 text-[10px] font-mono text-muted-foreground">⌘K</kbd>
        </Button>
        <Button size="sm" onClick={onOpenRecord} className="gap-1">
          Open record
          <kbd className="ml-1 text-[10px] font-mono text-primary-foreground/70">↵</kbd>
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Search Dialog
// ============================================================================

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const {
    query,
    setQuery,
    results,
    flatResults,
    isLoading,
    error,
    recentItems,
    addRecentItem,
    clearRecentItems,
    quickActions,
    clear,
  } = useGlobalSearch();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<GlobalSearchResult | null>(null);

  // All items to display (results or recent)
  const displayItems = useMemo(() => {
    if (flatResults.length > 0) {
      return flatResults;
    }
    if (!query && recentItems.length > 0) {
      return recentItems.map((item): GlobalSearchResult => ({
        doctype: item.doctype,
        name: item.name,
        content: item.label,
      }));
    }
    return [];
  }, [flatResults, query, recentItems]);

  // Update selected item when index or items change
  useEffect(() => {
    if (displayItems.length > 0 && selectedIndex < displayItems.length) {
      setSelectedItem(displayItems[selectedIndex]);
    } else {
      setSelectedItem(null);
    }
  }, [displayItems, selectedIndex]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [flatResults]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < displayItems.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedItem) {
            navigateToRecord(selectedItem);
          }
          break;
        case "Escape":
          e.preventDefault();
          handleClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, displayItems.length, selectedItem]);

  // Navigate to record
  const navigateToRecord = useCallback(
    (item: GlobalSearchResult) => {
      addRecentItem({
        doctype: item.doctype,
        name: item.name,
        label: item.content || item.name,
      });

      const slug = doctypeToSlug(item.doctype);
      const url = `/${slug}/${encodeURIComponent(item.name)}`;

      handleClose();
      router.push(url);
    },
    [router, addRecentItem]
  );

  // Handle close
  const handleClose = useCallback(() => {
    onOpenChange(false);
    setTimeout(() => {
      clear();
      setSelectedIndex(0);
      setSelectedItem(null);
    }, 150);
  }, [onOpenChange, clear]);

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
      if (e.key === "/" && !open) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          onOpenChange(true);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const hasResults = displayItems.length > 0;
  const showQuickActions = !query && !hasResults;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[500px] p-0 gap-0 overflow-hidden">
        <div className="flex h-full">
          {/* Left Panel - Search & Results */}
          <div className="w-[400px] flex flex-col border-r">
            {/* Search Input */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 pr-9"
                  autoFocus
                />
                {query && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Results List */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {isLoading && (
                  <div className="space-y-2 p-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="p-4 text-center text-sm text-destructive">
                    {error}
                  </div>
                )}

                {!isLoading && hasResults && (
                  <div className="space-y-1">
                    <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      {query ? "Records" : "Recent"}
                    </p>
                    {displayItems.map((item, index) => (
                      <SearchResultItem
                        key={`${item.doctype}-${item.name}`}
                        item={item}
                        isSelected={index === selectedIndex}
                        onSelect={() => {
                          setSelectedIndex(index);
                          setSelectedItem(item);
                        }}
                        onNavigate={() => navigateToRecord(item)}
                      />
                    ))}
                  </div>
                )}

                {!isLoading && !hasResults && query && query.length >= 2 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No results found for "{query}"
                  </div>
                )}

                {showQuickActions && (
                  <div className="space-y-1">
                    <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      Quick Actions
                    </p>
                    {quickActions.map((action) => {
                      const Icon = getDocTypeIcon(action.doctype);
                      return (
                        <button
                          key={action.doctype}
                          className="flex items-center gap-3 w-full px-3 py-2 text-left rounded-md hover:bg-muted transition-colors"
                          onClick={() => {
                            const slug = doctypeToSlug(action.doctype);
                            handleClose();
                            router.push(`/${slug}/new`);
                          }}
                        >
                          <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary/10">
                            <Plus className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm">{action.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer - Attio style */}
            <div className="px-3 py-2 border-t flex items-center text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px]">↑</kbd>
                <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px]">↓</kbd>
                <span className="ml-1">Navigate</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-1 bg-muted/20">
            <RecordPreview
              item={selectedItem}
              onOpenRecord={() => selectedItem && navigateToRecord(selectedItem)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
