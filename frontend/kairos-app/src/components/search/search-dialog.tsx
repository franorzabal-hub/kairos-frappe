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

import { useState, useEffect, useCallback } from "react";
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
  Phone,
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

function RecordAvatar({ doctype, className = "" }: { doctype: string; className?: string }) {
  const config = getDocTypeConfig(doctype);
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200",
      className
    )}>
      <Icon className="w-4 h-4 text-slate-500" />
    </div>
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
      "inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md border",
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

function RecordItem({
  item,
  isSelected,
  onSelect,
  onNavigate,
}: {
  item: GlobalSearchResult;
  isSelected: boolean;
  onSelect: () => void;
  onNavigate: () => void;
}) {
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
      <RecordAvatar doctype={item.doctype} className="w-9 h-9 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <span className="font-medium text-slate-900 text-sm block truncate">
          {item.name}
        </span>
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
  label,
  value,
  isLink = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  isLink?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-5 h-5 flex items-center justify-center mt-0.5 flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        {isLink ? (
          <a
            href={value.startsWith("http") ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            {value.replace(/^https?:\/\//, "")}
          </a>
        ) : (
          <p className="text-sm text-slate-700">{value}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Record Preview Component
// ============================================================================

function RecordPreview({
  item,
  isSearchLoading,
}: {
  item: GlobalSearchResult | null;
  isSearchLoading: boolean;
}) {
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

  const isLoading = isSearchLoading || docLoading;
  const doc = docData as Record<string, unknown> | undefined;

  // Extract fields
  const description = doc?.description as string | undefined;
  const email = doc?.email as string | undefined;
  const phone = (doc?.phone || doc?.mobile_no) as string | undefined;
  const website = doc?.website as string | undefined;
  const city = doc?.city as string | undefined;
  const state = doc?.state as string | undefined;
  const country = doc?.country as string | undefined;
  const status = doc?.status as string | undefined;
  const fullName = (doc?.full_name || doc?.student_name || doc?.guardian_name) as string | undefined;

  // Build location string
  const locationParts = [city, state, country].filter(Boolean);
  const location = locationParts.join(", ");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
        <RecordAvatar doctype={item.doctype} className="w-10 h-10" />
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-slate-900 truncate">
            {fullName || item.name}
          </h2>
          {fullName && fullName !== item.name && (
            <p className="text-xs text-slate-400">{item.name}</p>
          )}
        </div>
        {status && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
            {status}
          </span>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Details
          </h3>

          {isLoading ? (
            <div className="space-y-4 mt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {description && (
                <div className="py-3">
                  <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
                </div>
              )}

              {email && (
                <DetailRow icon={Mail} label="Email" value={email} />
              )}

              {phone && (
                <DetailRow icon={Phone} label="Phone" value={phone} />
              )}

              {website && (
                <DetailRow icon={Globe} label="Website" value={website} isLink />
              )}

              {location && (
                <DetailRow icon={MapPin} label="Location" value={location} />
              )}

              <div className="py-3">
                <p className="text-xs text-slate-400 mb-1">Type</p>
                <TypeBadge doctype={item.doctype} />
              </div>
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
    results,
    isLoading,
    error,
    addRecentItem,
    clear,
    loadInitialRecords,
  } = useGlobalSearch();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<GlobalSearchResult | null>(null);

  // Load initial records when dialog opens
  useEffect(() => {
    if (open) {
      loadInitialRecords();
    }
  }, [open, loadInitialRecords]);

  // Update selected item when index or results change
  useEffect(() => {
    if (results.length > 0 && selectedIndex < results.length) {
      setSelectedItem(results[selectedIndex]);
    } else if (results.length > 0) {
      setSelectedIndex(0);
      setSelectedItem(results[0]);
    } else {
      setSelectedItem(null);
    }
  }, [results, selectedIndex]);

  // Reset selection when results change significantly
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

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

      onOpenChange(false);
      setTimeout(() => {
        clear();
        setSelectedIndex(0);
        setSelectedItem(null);
      }, 150);
      router.push(url);
    },
    [router, addRecentItem, onOpenChange, clear]
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
    setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
  }, [results.length]);

  // Keyboard navigation
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

  // Global keyboard shortcut to open
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[600px] p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Search records</DialogTitle>

        <div className="flex flex-col h-full">
          {/* Search Header */}
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

          {/* Content Area */}
          <div className="flex flex-1 min-h-0">
            {/* Left Panel - Records List */}
            <div className="w-[400px] border-r border-slate-100 flex flex-col min-h-0">
              <div className="px-4 py-2 border-b border-slate-50 flex-shrink-0">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Records
                </span>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-2 space-y-0.5">
                  {isLoading && results.length === 0 && (
                    <div className="space-y-2 p-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-lg" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-32" />
                          </div>
                          <Skeleton className="h-5 w-16 rounded-md" />
                        </div>
                      ))}
                    </div>
                  )}

                  {error && (
                    <div className="p-4 text-center text-sm text-red-500">
                      {error}
                    </div>
                  )}

                  {!isLoading && results.length === 0 && query && (
                    <div className="p-4 text-center text-sm text-slate-400">
                      No results found for "{query}"
                    </div>
                  )}

                  {results.map((item, index) => (
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
                </div>
              </ScrollArea>
            </div>

            {/* Right Panel - Details */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30">
              <RecordPreview item={selectedItem} isSearchLoading={isLoading} />
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between flex-shrink-0 bg-white">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={navigateUp}
                disabled={selectedIndex === 0}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors disabled:opacity-50"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={navigateDown}
                disabled={selectedIndex >= results.length - 1}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors disabled:opacity-50"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-slate-400 ml-1">Navigate</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => selectedItem && navigateToRecord(selectedItem)}
                disabled={!selectedItem}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all duration-200 bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Open record
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-blue-400/30 rounded">↵</kbd>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
