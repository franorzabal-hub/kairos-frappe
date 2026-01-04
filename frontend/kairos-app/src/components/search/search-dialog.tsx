/**
 * Search Dialog Component (Attio-style)
 *
 * Split-view search dialog with left panel showing records
 * and right panel showing selected record preview.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFrappeGetDoc } from "frappe-react-sdk";
import {
  ArrowRight,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Newspaper,
  Phone,
  Search,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, doctypeToSlug } from "@/lib/utils";

// ============================================================================
// Types & Config
// ============================================================================

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RecordItem {
  doctype: string;
  name: string;
}

interface DoctypeConfig {
  icon: LucideIcon;
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  avatarBg: string;
}

const DOCTYPE_CONFIG: Record<string, DoctypeConfig> = {
  Student: {
    icon: Users,
    label: "Student",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    avatarBg: "bg-gradient-to-br from-blue-400 to-blue-600",
  },
  Guardian: {
    icon: UserCheck,
    label: "Guardian",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    avatarBg: "bg-gradient-to-br from-emerald-400 to-emerald-600",
  },
  Institution: {
    icon: Building2,
    label: "Institution",
    bgColor: "bg-violet-50",
    textColor: "text-violet-700",
    borderColor: "border-violet-200",
    avatarBg: "bg-gradient-to-br from-violet-400 to-violet-600",
  },
  Message: {
    icon: MessageSquare,
    label: "Message",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
    avatarBg: "bg-gradient-to-br from-amber-400 to-amber-600",
  },
  News: {
    icon: Newspaper,
    label: "News",
    bgColor: "bg-rose-50",
    textColor: "text-rose-700",
    borderColor: "border-rose-200",
    avatarBg: "bg-gradient-to-br from-rose-400 to-rose-600",
  },
  "School Event": {
    icon: Calendar,
    label: "Event",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
    avatarBg: "bg-gradient-to-br from-orange-400 to-orange-600",
  },
  Grade: {
    icon: GraduationCap,
    label: "Grade",
    bgColor: "bg-cyan-50",
    textColor: "text-cyan-700",
    borderColor: "border-cyan-200",
    avatarBg: "bg-gradient-to-br from-cyan-400 to-cyan-600",
  },
  Enrollment: {
    icon: FileText,
    label: "Enrollment",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-700",
    borderColor: "border-indigo-200",
    avatarBg: "bg-gradient-to-br from-indigo-400 to-indigo-600",
  },
  "Guardian Invite": {
    icon: Mail,
    label: "Invite",
    bgColor: "bg-teal-50",
    textColor: "text-teal-700",
    borderColor: "border-teal-200",
    avatarBg: "bg-gradient-to-br from-teal-400 to-teal-600",
  },
};

const DEFAULT_CONFIG: DoctypeConfig = {
  icon: FileText,
  label: "Record",
  bgColor: "bg-slate-50",
  textColor: "text-slate-700",
  borderColor: "border-slate-200",
  avatarBg: "bg-gradient-to-br from-slate-400 to-slate-600",
};

const SEARCHABLE_DOCTYPES = [
  "Student",
  "Guardian",
  "Institution",
  "Message",
  "News",
  "School Event",
  "Grade",
  "Enrollment",
  "Guardian Invite",
];

// ============================================================================
// Sub-components
// ============================================================================

function RecordAvatar({ doctype, className }: { doctype: string; className?: string }) {
  const config = DOCTYPE_CONFIG[doctype] || DEFAULT_CONFIG;
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center justify-center rounded-lg shadow-sm",
      config.avatarBg,
      className
    )}>
      <Icon className="w-4 h-4 text-white" />
    </div>
  );
}

function TypeBadge({ doctype }: { doctype: string }) {
  const config = DOCTYPE_CONFIG[doctype] || DEFAULT_CONFIG;

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full",
      config.bgColor,
      config.textColor
    )}>
      {config.label}
    </span>
  );
}

function RecordRow({
  record,
  isSelected,
  onClick,
  onDoubleClick,
}: {
  record: RecordItem;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg transition-all duration-100",
        isSelected
          ? "bg-slate-100"
          : "hover:bg-slate-50"
      )}
    >
      <RecordAvatar doctype={record.doctype} className="w-8 h-8 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-medium text-slate-800 text-sm truncate block leading-tight">
          {record.name}
        </span>
      </div>
      <TypeBadge doctype={record.doctype} />
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
        <div className="text-sm text-slate-700">{children}</div>
      </div>
    </div>
  );
}

function RecordPreview({ record }: { record: RecordItem | null }) {
  const { data: docData, isLoading } = useFrappeGetDoc(
    record?.doctype || "",
    record?.name || "",
    record ? undefined : null
  );

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Search className="h-8 w-8 text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-500">Select a record</p>
        <p className="text-xs text-slate-400 mt-1">Click on a record to see details</p>
      </div>
    );
  }

  const config = DOCTYPE_CONFIG[record.doctype] || DEFAULT_CONFIG;
  const doc = docData as Record<string, unknown> | undefined;

  const displayName = (doc?.full_name || doc?.student_name || doc?.guardian_name || doc?.title || record.name) as string;
  const description = doc?.description as string | undefined;
  const email = doc?.email as string | undefined;
  const phone = (doc?.phone || doc?.mobile_no || doc?.contact_phone) as string | undefined;
  const website = doc?.website as string | undefined;
  const city = doc?.city as string | undefined;
  const state = doc?.state as string | undefined;
  const country = doc?.country as string | undefined;
  const status = doc?.status as string | undefined;
  const createdOn = doc?.creation as string | undefined;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-start gap-4">
          <RecordAvatar doctype={record.doctype} className="w-12 h-12" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 truncate">{displayName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <TypeBadge doctype={record.doctype} />
              {status && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 text-slate-600">
                  {status}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-1">
            {description && (
              <DetailItem icon={FileText} label="Description">
                <p className="leading-relaxed">{description}</p>
              </DetailItem>
            )}

            {email && (
              <DetailItem icon={Mail} label="Email">
                <a href={`mailto:${email}`} className="text-blue-600 hover:text-blue-700 hover:underline">
                  {email}
                </a>
              </DetailItem>
            )}

            {phone && (
              <DetailItem icon={Phone} label="Phone">
                <a href={`tel:${phone}`} className="text-slate-700 hover:text-slate-900">
                  {phone}
                </a>
              </DetailItem>
            )}

            {website && (
              <DetailItem icon={Globe} label="Website">
                <a
                  href={website.startsWith("http") ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                >
                  {website.replace(/^https?:\/\//, "")}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </DetailItem>
            )}

            {(city || state || country) && (
              <DetailItem icon={MapPin} label="Location">
                {[city, state, country].filter(Boolean).join(", ")}
              </DetailItem>
            )}

            {createdOn && (
              <DetailItem icon={Calendar} label="Created">
                {new Date(createdOn).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </DetailItem>
            )}

            {/* Show record ID */}
            <DetailItem icon={FileText} label="Record ID">
              <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                {record.name}
              </code>
            </DetailItem>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load records when dialog opens
  useEffect(() => {
    if (open) {
      loadRecords();
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Load records using the /api/frappe proxy
  const loadRecords = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allRecords: RecordItem[] = [];

      const promises = SEARCHABLE_DOCTYPES.map(async (doctype) => {
        try {
          const response = await fetch("/api/frappe/api/method/frappe.client.get_list", {
            method: "POST",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              doctype,
              fields: ["name"],
              limit_page_length: 15,
              order_by: "modified desc",
            }),
          });

          const data = await response.json();

          if (response.ok && data.message) {
            const items = data.message || [];
            return items.map((item: { name: string }) => ({
              doctype,
              name: item.name,
            }));
          }

          if (data.exc_type || data.exception) {
            console.warn(`[Search] ${doctype} error:`, data.exc_type || data.exception);
          }

          return [];
        } catch (err) {
          console.warn(`[Search] Failed to load ${doctype}:`, err);
          return [];
        }
      });

      const results = await Promise.all(promises);
      results.forEach((arr) => allRecords.push(...arr));

      setRecords(allRecords);
      if (allRecords.length > 0) {
        setSelectedRecord(allRecords[0]);
        setSelectedIndex(0);
      }
    } catch (err) {
      console.error("[Search] Failed to load records:", err);
      setError("Failed to load records");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter records
  const filteredRecords = records.filter((record) =>
    record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.doctype.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Update selection when filtered records change
  useEffect(() => {
    if (filteredRecords.length > 0) {
      const newIndex = Math.min(selectedIndex, filteredRecords.length - 1);
      setSelectedIndex(newIndex);
      setSelectedRecord(filteredRecords[newIndex]);
    } else {
      setSelectedRecord(null);
    }
  }, [searchQuery, filteredRecords.length]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const items = listRef.current.querySelectorAll("[data-record-row]");
      const selectedItem = items[selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  // Navigate to record
  const navigateToRecord = useCallback((record: RecordItem) => {
    const slug = doctypeToSlug(record.doctype);
    const url = `/${slug}/${encodeURIComponent(record.name)}`;
    onOpenChange(false);
    router.push(url);
  }, [router, onOpenChange]);

  // Keyboard navigation
  const navigateUp = useCallback(() => {
    setSelectedIndex((prev) => {
      const newIndex = prev > 0 ? prev - 1 : prev;
      if (filteredRecords[newIndex]) {
        setSelectedRecord(filteredRecords[newIndex]);
      }
      return newIndex;
    });
  }, [filteredRecords]);

  const navigateDown = useCallback(() => {
    setSelectedIndex((prev) => {
      const newIndex = prev < filteredRecords.length - 1 ? prev + 1 : prev;
      if (filteredRecords[newIndex]) {
        setSelectedRecord(filteredRecords[newIndex]);
      }
      return newIndex;
    });
  }, [filteredRecords]);

  // Keyboard events
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
          if (selectedRecord) navigateToRecord(selectedRecord);
          break;
        case "Escape":
          e.preventDefault();
          onOpenChange(false);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, selectedRecord, navigateUp, navigateDown, navigateToRecord, onOpenChange]);

  // Global shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
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
      <DialogContent className="max-w-4xl h-[600px] p-0 gap-0 overflow-hidden bg-white">
        <DialogTitle className="sr-only">Search records</DialogTitle>

        <div className="flex flex-col h-full">
          {/* Search Header */}
          <div className="px-4 py-3 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search all records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg
                          placeholder:text-slate-400 text-slate-900
                          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                          transition-all duration-150"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 min-h-0">
            {/* Left Panel - Records List */}
            <div className="w-[340px] border-r border-slate-200 flex flex-col min-h-0 bg-white">
              <div className="px-4 py-2 border-b border-slate-100">
                <span className="text-xs font-medium text-slate-500">
                  {filteredRecords.length} {filteredRecords.length === 1 ? "record" : "records"}
                </span>
              </div>

              <div ref={listRef} className="flex-1 overflow-y-auto p-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : error ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-red-600">{error}</p>
                    <button
                      onClick={loadRecords}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      Try again
                    </button>
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                      <Search className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">No records found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery ? `No results for "${searchQuery}"` : "Try a different search"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {filteredRecords.map((record, index) => (
                      <div key={`${record.doctype}-${record.name}`} data-record-row>
                        <RecordRow
                          record={record}
                          isSelected={index === selectedIndex}
                          onClick={() => {
                            setSelectedIndex(index);
                            setSelectedRecord(record);
                          }}
                          onDoubleClick={() => navigateToRecord(record)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Preview */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
              <RecordPreview record={selectedRecord} />
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={navigateUp}
                  disabled={selectedIndex === 0 || filteredRecords.length === 0}
                  className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={navigateDown}
                  disabled={selectedIndex >= filteredRecords.length - 1 || filteredRecords.length === 0}
                  className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              <span className="text-xs text-slate-400">Navigate</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded shadow-sm">
                  ↵
                </kbd>
                <span>to open</span>
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded shadow-sm">
                  esc
                </kbd>
                <span>to close</span>
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <button
                onClick={() => selectedRecord && navigateToRecord(selectedRecord)}
                disabled={!selectedRecord}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Open record
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
