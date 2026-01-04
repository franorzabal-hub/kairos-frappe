/**
 * Search Dialog Component (Attio-style)
 *
 * Split-view search dialog with:
 * - Full-width search header
 * - Left panel: Records list
 * - Right panel: Record details preview
 * - Full-width footer with navigation
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFrappeGetDoc } from "frappe-react-sdk";
import {
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  MessageSquare,
  Newspaper,
  Plus,
  Search,
  Tag,
  User,
  UserCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface RecordItemProps {
  item: GlobalSearchResult;
  isSelected: boolean;
  onSelect: () => void;
  onNavigate: () => void;
}

interface RecordPreviewProps {
  item: GlobalSearchResult | null;
  isLoading: boolean;
}

// ============================================================================
// DocType Configuration
// ============================================================================

const DOCTYPE_CONFIG: Record<string, { icon: LucideIcon; color: string; bgColor: string }> = {
  Student: { icon: Users, color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
  Guardian: { icon: UserCheck, color: "text-green-600", bgColor: "bg-green-50 border-green-200" },
  Institution: { icon: Building2, color: "text-purple-600", bgColor: "bg-purple-50 border-purple-200" },
  Message: { icon: MessageSquare, color: "text-yellow-600", bgColor: "bg-yellow-50 border-yellow-200" },
  News: { icon: Newspaper, color: "text-pink-600", bgColor: "bg-pink-50 border-pink-200" },
  "School Event": { icon: Calendar, color: "text-orange-600", bgColor: "bg-orange-50 border-orange-200" },
  Grade: { icon: GraduationCap, color: "text-cyan-600", bgColor: "bg-cyan-50 border-cyan-200" },
  Enrollment: { icon: FileText, color: "text-indigo-600", bgColor: "bg-indigo-50 border-indigo-200" },
  "Guardian Invite": { icon: Mail, color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-200" },
};

function getDocTypeConfig(doctype: string) {
  return DOCTYPE_CONFIG[doctype] || { icon: FileText, color: "text-slate-600", bgColor: "bg-slate-50 border-slate-200" };
}

// ============================================================================
// Avatar Component
// ============================================================================

function Avatar({
  src,
  name,
  doctype,
  className = ""
}: {
  src?: string | null;
  name: string;
  doctype: string;
  className?: string;
}) {
  const [error, setError] = useState(false);
  const config = getDocTypeConfig(doctype);
  const Icon = config.icon;

  if (!src || error) {
    return (
      <div className={cn(
        "flex items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200",
        className
      )}>
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setError(true)}
      className={cn(
        "rounded-lg object-contain bg-white border border-slate-100",
        className
      )}
    />
  );
}

// ============================================================================
// Badge Component
// ============================================================================

function TypeBadge({ doctype }: { doctype: string }) {
  const config = getDocTypeConfig(doctype);
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border",
      config.bgColor,
      config.color
    )}>
      <Icon className="w-3 h-3" />
      {doctype}
    </span>
  );
}

// ============================================================================
// Record Item Component
// ============================================================================

function RecordItem({ item, isSelected, onSelect, onNavigate }: RecordItemProps) {
  const config = getDocTypeConfig(item.doctype);

  return (
    <div
      onClick={onSelect}
      onDoubleClick={onNavigate}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg transition-all duration-150",
        isSelected
          ? "bg-blue-50 border border-blue-200"
          : "hover:bg-slate-50 border border-transparent"
      )}
    >
      <Avatar
        name={item.name}
        doctype={item.doctype}
        className="w-9 h-9"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900 text-sm">{item.name}</span>
          {item.description ? (
            <span className="text-slate-400 text-sm truncate">{item.description}</span>
          ) : item.content ? (
            <span className="text-slate-400 text-sm truncate">{item.content}</span>
          ) : null}
        </div>
      </div>

      <TypeBadge doctype={item.doctype} />
    </div>
  );
}

// ============================================================================
// Detail Row Component
// ============================================================================

function DetailRow({
  icon: Icon,
  children,
  className = ""
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div className="w-5 h-5 flex items-center justify-center mt-0.5">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ============================================================================
// Record Preview Component
// ============================================================================

function RecordPreview({ item, isLoading: searchLoading }: RecordPreviewProps) {
  // Fetch actual document data when item is selected
  const { data: docData, isLoading: docLoading } = useFrappeGetDoc(
    item?.doctype || "",
    item?.name || "",
    item ? undefined : null
  );

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <Search className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm">Select a record to preview</p>
      </div>
    );
  }

  const isLoading = searchLoading || docLoading;
  const doc = docData as Record<string, unknown> | undefined;
  const config = getDocTypeConfig(item.doctype);
  const Icon = config.icon;

  // Extract common fields
  const description = doc?.description as string | undefined;
  const email = doc?.email as string | undefined;
  const phone = doc?.phone as string | undefined;
  const mobile = doc?.mobile_no as string | undefined;
  const website = doc?.website as string | undefined;
  const city = doc?.city as string | undefined;
  const state = doc?.state as string | undefined;
  const country = doc?.country as string | undefined;
  const status = doc?.status as string | undefined;
  const tags = doc?.tags as string[] | undefined;

  // No communication indicator
  const hasCommunication = email || phone || mobile;

  return (
    <div className="flex flex-col h-full">
      {/* Detail Header */}
      <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
        <Avatar
          name={item.name}
          doctype={item.doctype}
          className="w-7 h-7"
        />
        <h2 className="text-base font-semibold text-slate-900">{item.name}</h2>
        {status ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border bg-slate-100 text-slate-500 border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {status}
          </span>
        ) : !hasCommunication && !isLoading ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border bg-slate-100 text-slate-500 border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            No communication found
          </span>
        ) : null}
      </div>

      {/* Detail Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Details
          </h3>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Description */}
              {description && (
                <DetailRow icon={Building2}>
                  <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
                </DetailRow>
              )}

              {/* Website */}
              {website && (
                <DetailRow icon={Globe}>
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {website.replace(/^https?:\/\//, "")}
                  </a>
                </DetailRow>
              )}

              {/* Email */}
              {email && (
                <DetailRow icon={Mail}>
                  <a
                    href={`mailto:${email}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {email}
                  </a>
                </DetailRow>
              )}

              {/* Phone */}
              {(phone || mobile) && (
                <DetailRow icon={Globe}>
                  <span className="text-sm text-slate-700">{phone || mobile}</span>
                </DetailRow>
              )}

              {/* Tags */}
              {tags && tags.length > 0 && (
                <DetailRow icon={Tag}>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </DetailRow>
              )}

              {/* Location */}
              {city && (
                <DetailRow icon={MapPin}>
                  <span className="text-sm text-slate-700">{city}</span>
                </DetailRow>
              )}
              {state && (
                <DetailRow icon={MapPin}>
                  <span className="text-sm text-slate-700">{state}</span>
                </DetailRow>
              )}
              {country && (
                <DetailRow icon={MapPin}>
                  <span className="text-sm text-slate-700">{country}</span>
                </DetailRow>
              )}

              {/* DocType */}
              <DetailRow icon={Tag}>
                <TypeBadge doctype={item.doctype} />
              </DetailRow>
            </div>
          )}
        </div>
      </ScrollArea>
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
    flatResults,
    isLoading,
    error,
    recentItems,
    addRecentItem,
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

  // Navigate up/down
  const navigateUp = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const navigateDown = useCallback(() => {
    setSelectedIndex((prev) =>
      prev < displayItems.length - 1 ? prev + 1 : prev
    );
  }, [displayItems.length]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          navigateDown();
          break;
        case "ArrowUp":
          e.preventDefault();
          navigateUp();
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
  }, [open, selectedItem, navigateUp, navigateDown, navigateToRecord, handleClose]);

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
      <DialogContent className="max-w-5xl h-[700px] p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Search records</DialogTitle>

        <div className="flex flex-col h-full">
          {/* 1. Search Header - Full width */}
          <div className="p-4 border-b border-slate-100 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search records..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-10 text-sm bg-white border border-slate-200 rounded-lg
                          placeholder:text-slate-400 text-slate-700
                          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                          transition-all duration-200"
                autoFocus
              />
              {query && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setQuery("")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Content Area - Two columns */}
          <div className="flex flex-1 min-h-0">
            {/* Left Panel - Records List */}
            <div className="w-[400px] border-r border-slate-100 flex flex-col min-h-0">
              <div className="px-4 py-3 border-b border-slate-50 flex-shrink-0">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {query ? "Records" : hasResults ? "Recent" : "Quick Actions"}
                </span>
              </div>

              {/* Scrollable Records List */}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-0.5">
                  {isLoading && (
                    <div className="space-y-2 p-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-lg" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {error && (
                    <div className="p-4 text-center text-sm text-red-500">
                      {error}
                    </div>
                  )}

                  {!isLoading && hasResults && displayItems.map((item, index) => (
                    <RecordItem
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

                  {!isLoading && !hasResults && query && query.length >= 2 && (
                    <div className="p-4 text-center text-sm text-slate-400">
                      No results found for "{query}"
                    </div>
                  )}

                  {showQuickActions && quickActions.map((action) => {
                    const config = getDocTypeConfig(action.doctype);
                    return (
                      <div
                        key={action.doctype}
                        onClick={() => {
                          const slug = doctypeToSlug(action.doctype);
                          handleClose();
                          router.push(`/${slug}/new`);
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50">
                          <Plus className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{action.label}</span>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Right Panel - Details */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
              <RecordPreview item={selectedItem} isLoading={isLoading} />
            </div>
          </div>

          {/* 3. Actions Footer - Full width */}
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between flex-shrink-0 bg-white">
            {/* Left - Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={navigateUp}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={navigateDown}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-slate-400 ml-1">Navigate</span>
            </div>

            {/* Right - Action Buttons */}
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all duration-200 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300">
                Actions
                <kbd className="px-1 py-0.5 text-[10px] font-mono bg-slate-100 rounded border border-slate-200">⌘K</kbd>
              </button>
              <button
                onClick={() => selectedItem && navigateToRecord(selectedItem)}
                disabled={!selectedItem}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all duration-200 bg-blue-500 text-white border border-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Open record
                <kbd className="px-1 py-0.5 text-[10px] font-mono bg-blue-400/30 rounded border border-blue-400/50">↵</kbd>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
