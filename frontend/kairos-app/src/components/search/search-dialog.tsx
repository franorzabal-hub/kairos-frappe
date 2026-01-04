/**
 * Search Dialog Component (Attio-style)
 * Based on exact Attio design reference
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  User,
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
// Types
// ============================================================================

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RecordItem {
  doctype: string;
  name: string;
  label?: string;
}

// ============================================================================
// DocType Configuration
// ============================================================================

const DOCTYPE_CONFIG: Record<string, { icon: LucideIcon; label: string }> = {
  Student: { icon: Users, label: "Student" },
  Guardian: { icon: UserCheck, label: "Guardian" },
  Institution: { icon: Building2, label: "Institution" },
  Message: { icon: MessageSquare, label: "Message" },
  News: { icon: Newspaper, label: "News" },
  "School Event": { icon: Calendar, label: "Event" },
  Grade: { icon: GraduationCap, label: "Grade" },
  Enrollment: { icon: FileText, label: "Enrollment" },
  "Guardian Invite": { icon: Mail, label: "Invite" },
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

const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || "http://kairos.localhost:8000";

// ============================================================================
// Components
// ============================================================================

function Avatar({ name, doctype, className = "" }: { name: string; doctype: string; className?: string }) {
  const config = DOCTYPE_CONFIG[doctype] || { icon: FileText };
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200",
      className
    )}>
      <Icon className="w-4 h-4 text-slate-400" />
    </div>
  );
}

function Badge({ doctype }: { doctype: string }) {
  const config = DOCTYPE_CONFIG[doctype] || { icon: FileText, label: doctype };
  const Icon = config.icon;

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border bg-blue-50 text-blue-600 border-blue-200">
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function RecordItemRow({
  record,
  isSelected,
  onClick,
}: {
  record: RecordItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg transition-all duration-150",
        isSelected
          ? "bg-blue-50 border border-blue-200"
          : "hover:bg-slate-50 border border-transparent"
      )}
    >
      <Avatar name={record.name} doctype={record.doctype} className="w-9 h-9" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900 text-sm">{record.label || record.name}</span>
        </div>
      </div>

      <Badge doctype={record.doctype} />
    </div>
  );
}

function DetailRow({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-5 h-5 flex items-center justify-center mt-0.5">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function RecordDetails({ record }: { record: RecordItem | null }) {
  const { data: docData, isLoading } = useFrappeGetDoc(
    record?.doctype || "",
    record?.name || "",
    record ? undefined : null
  );

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <Search className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm">Select a record to preview</p>
      </div>
    );
  }

  const doc = docData as Record<string, unknown> | undefined;
  const config = DOCTYPE_CONFIG[record.doctype] || { icon: FileText };

  // Extract common fields
  const displayName = (doc?.full_name || doc?.student_name || doc?.guardian_name || doc?.title || record.name) as string;
  const description = doc?.description as string | undefined;
  const email = doc?.email as string | undefined;
  const phone = (doc?.phone || doc?.mobile_no || doc?.contact_phone) as string | undefined;
  const website = doc?.website as string | undefined;
  const city = doc?.city as string | undefined;
  const state = doc?.state as string | undefined;
  const country = doc?.country as string | undefined;
  const status = doc?.status as string | undefined;

  return (
    <div className="flex flex-col h-full">
      {/* Detail Header */}
      <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
        <Avatar name={record.name} doctype={record.doctype} className="w-7 h-7" />
        <h2 className="text-base font-semibold text-slate-900">{displayName}</h2>
        {status && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border bg-slate-100 text-slate-500 border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {status}
          </span>
        )}
      </div>

      {/* Detail Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Details
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 bg-slate-100 rounded w-full animate-pulse" />
            <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse" />
          </div>
        ) : (
          <div className="space-y-4">
            {description && (
              <DetailRow icon={Building2}>
                <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
              </DetailRow>
            )}

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

            {phone && (
              <DetailRow icon={Phone}>
                <span className="text-sm text-slate-700">{phone}</span>
              </DetailRow>
            )}

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
  const inputRef = useRef<HTMLInputElement>(null);

  // Load records when dialog opens
  useEffect(() => {
    if (open) {
      loadRecords();
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Reset state when closing
      setSearchQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Load records from all doctypes
  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const allRecords: RecordItem[] = [];

      const promises = SEARCHABLE_DOCTYPES.map(async (doctype) => {
        try {
          const response = await fetch(`${FRAPPE_URL}/api/method/frappe.client.get_list`, {
            method: "POST",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              doctype,
              fields: ["name", "modified"],
              limit_page_length: 20,
              order_by: "modified desc",
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const items = data.message || [];
            return items.map((item: { name: string }) => ({
              doctype,
              name: item.name,
              label: item.name,
            }));
          }
        } catch (err) {
          console.warn(`Failed to load ${doctype}:`, err);
        }
        return [];
      });

      const results = await Promise.all(promises);
      results.forEach((arr) => allRecords.push(...arr));

      setRecords(allRecords);
      if (allRecords.length > 0) {
        setSelectedRecord(allRecords[0]);
      }
    } catch (err) {
      console.error("Failed to load records:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter records based on search query
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

  // Handle keyboard events
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
          if (selectedRecord) {
            navigateToRecord(selectedRecord);
          }
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

  // Global shortcut to open
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
      <DialogContent className="max-w-5xl h-[700px] p-0 gap-0 overflow-hidden font-['Inter',system-ui,sans-serif]">
        <DialogTitle className="sr-only">Search records</DialogTitle>

        <div className="flex flex-col h-full">
          {/* 1. Search Header - Full width */}
          <div className="p-4 border-b border-slate-100 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 text-sm bg-white border border-slate-200 rounded-lg
                          placeholder:text-slate-400 text-slate-700
                          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                          transition-all duration-200"
              />
            </div>
          </div>

          {/* 2. Content Area - Two columns */}
          <div className="flex flex-1 min-h-0">
            {/* Left Panel - Records List */}
            <div className="w-[400px] border-r border-slate-100 flex flex-col min-h-0">
              <div className="px-4 py-3 border-b border-slate-50 flex-shrink-0">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Records
                </span>
              </div>

              {/* Scrollable Records List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {isLoading ? (
                  <div className="space-y-2 p-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-100 animate-pulse" />
                        <div className="flex-1">
                          <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
                        </div>
                        <div className="h-6 w-20 bg-slate-100 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400">
                    {searchQuery ? `No results for "${searchQuery}"` : "No records found"}
                  </div>
                ) : (
                  filteredRecords.map((record, index) => (
                    <RecordItemRow
                      key={`${record.doctype}-${record.name}`}
                      record={record}
                      isSelected={index === selectedIndex}
                      onClick={() => {
                        setSelectedIndex(index);
                        setSelectedRecord(record);
                      }}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Right Panel - Details */}
            <div className="flex-1 flex flex-col min-h-0">
              <RecordDetails record={selectedRecord} />
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
                onClick={() => selectedRecord && navigateToRecord(selectedRecord)}
                disabled={!selectedRecord}
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
