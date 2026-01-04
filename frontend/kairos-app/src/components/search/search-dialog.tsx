/**
 * Search Dialog Component (Attio-style)
 *
 * Split-view search dialog matching Attio CRM design.
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
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Newspaper,
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
// Types & Config
// ============================================================================

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RecordItem {
  doctype: string;
  name: string;
  label?: string; // Display name (full_name, title, etc.)
}

const DOCTYPE_ICONS: Record<string, LucideIcon> = {
  Student: Users,
  Guardian: UserCheck,
  Institution: Building2,
  Message: MessageSquare,
  News: Newspaper,
  "School Event": Calendar,
  Grade: GraduationCap,
  "Guardian Invite": Mail,
};

const SEARCHABLE_DOCTYPES = [
  "Student",
  "Guardian",
  "Institution",
  "Message",
  "News",
  "School Event",
  "Grade",
  "Guardian Invite",
];

// ============================================================================
// Sub-components
// ============================================================================

function Avatar({ name, className = "" }: { name: string; className?: string }) {
  return (
    <div className={cn(
      "rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center",
      className
    )}>
      <User className="w-4 h-4 text-slate-400" />
    </div>
  );
}

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "company" | "person" | "status";
}) {
  const variants = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    company: "bg-blue-50 text-blue-600 border-blue-200",
    person: "bg-violet-50 text-violet-600 border-violet-200",
    status: "bg-slate-100 text-slate-500 border-slate-200",
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border",
      variants[variant]
    )}>
      {children}
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
  const Icon = DOCTYPE_ICONS[record.doctype] || FileText;
  const displayName = record.label || record.name;

  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg transition-all duration-150",
        isSelected
          ? "bg-blue-50 border border-blue-200"
          : "hover:bg-slate-50 border border-transparent"
      )}
    >
      <Avatar name={displayName} className="w-9 h-9" />

      <div className="flex-1 min-w-0">
        <span className="font-medium text-slate-900 text-sm truncate block">{displayName}</span>
      </div>

      <Badge variant="company">
        <Icon className="w-3 h-3" />
        {record.doctype}
      </Badge>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-5 h-5 flex items-center justify-center mt-0.5">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function RecordPreview({ record }: { record: RecordItem | null }) {
  const [doc, setDoc] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch document when record changes
  useEffect(() => {
    if (!record) {
      setDoc(null);
      return;
    }

    const fetchDoc = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const encodedName = encodeURIComponent(record.name);
        const response = await fetch(
          `/api/frappe/api/resource/${record.doctype}/${encodedName}`,
          {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
          }
        );

        const result = await response.json();

        if (response.ok && result.data) {
          setDoc(result.data);
        } else {
          setError("Failed to load");
        }
      } catch (err) {
        console.error("[Preview] Error:", err);
        setError("Failed to load");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoc();
  }, [record?.doctype, record?.name]);

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
          <Search className="w-5 h-5 text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-500">Select a record</p>
        <p className="text-xs text-slate-400 mt-1">Click on a record to see details</p>
      </div>
    );
  }

  const displayName = record.label || record.name;

  // Extract all possible fields from the document
  const fullName = (doc?.full_name || doc?.student_name || doc?.guardian_name || doc?.institution_name) as string | undefined;
  const firstName = doc?.first_name as string | undefined;
  const lastName = doc?.last_name as string | undefined;
  const title = doc?.title as string | undefined;
  const description = doc?.description as string | undefined;
  const email = doc?.email as string | undefined;
  const phone = (doc?.phone || doc?.mobile_no || doc?.contact_phone) as string | undefined;
  const website = doc?.website as string | undefined;
  const address = doc?.address as string | undefined;
  const city = doc?.city as string | undefined;
  const state = doc?.state as string | undefined;
  const country = doc?.country as string | undefined;
  const status = doc?.status as string | undefined;
  const program = doc?.program as string | undefined;
  const subject = doc?.subject as string | undefined;
  const content = doc?.content as string | undefined;
  const dateOfBirth = doc?.date_of_birth as string | undefined;
  const gender = doc?.gender as string | undefined;

  // Check if we have any details to show
  const hasDetails = fullName || firstName || title || description || email || phone ||
    website || address || city || program || subject || content || dateOfBirth || gender;

  return (
    <div className="flex flex-col h-full">
      {/* Detail Header */}
      <div className="shrink-0 px-6 py-3 border-b border-slate-100 flex items-center gap-3">
        <Avatar name={displayName} className="w-7 h-7" />
        <h2 className="text-base font-semibold text-slate-900 flex-1 truncate">{displayName}</h2>
        <Badge variant="status">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          {status || record.doctype}
        </Badge>
      </div>

      {/* Detail Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Details
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : !hasDetails ? (
          <div className="space-y-4">
            <DetailRow icon={FileText}>
              <span className="text-sm text-slate-500">No additional details available</span>
            </DetailRow>
            <DetailRow icon={FileText}>
              <span className="text-xs text-slate-400 font-mono">{record.name}</span>
            </DetailRow>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Full name if different */}
            {firstName && lastName && (
              <DetailRow icon={User}>
                <span className="text-sm text-slate-700">{firstName} {lastName}</span>
              </DetailRow>
            )}

            {/* Title */}
            {title && title !== displayName && (
              <DetailRow icon={FileText}>
                <span className="text-sm text-slate-700">{title}</span>
              </DetailRow>
            )}

            {/* Subject for messages */}
            {subject && (
              <DetailRow icon={MessageSquare}>
                <span className="text-sm text-slate-700">{subject}</span>
              </DetailRow>
            )}

            {/* Description or content */}
            {(description || content) && (
              <DetailRow icon={FileText}>
                <p className="text-sm text-slate-600 leading-relaxed">{description || content}</p>
              </DetailRow>
            )}

            {/* Date of birth */}
            {dateOfBirth && (
              <DetailRow icon={Calendar}>
                <span className="text-sm text-slate-700">{dateOfBirth}</span>
              </DetailRow>
            )}

            {/* Gender */}
            {gender && (
              <DetailRow icon={User}>
                <span className="text-sm text-slate-700">{gender}</span>
              </DetailRow>
            )}

            {/* Program */}
            {program && (
              <DetailRow icon={GraduationCap}>
                <span className="text-sm text-slate-700">{program}</span>
              </DetailRow>
            )}

            {/* Email */}
            {email && (
              <DetailRow icon={Mail}>
                <a href={`mailto:${email}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  {email}
                </a>
              </DetailRow>
            )}

            {/* Phone */}
            {phone && (
              <DetailRow icon={MessageSquare}>
                <span className="text-sm text-slate-700">{phone}</span>
              </DetailRow>
            )}

            {/* Website */}
            {website && (
              <DetailRow icon={Globe}>
                <a
                  href={website.startsWith("http") ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {website.replace(/^https?:\/\//, "")}
                </a>
              </DetailRow>
            )}

            {/* Location */}
            {(address || city || state || country) && (
              <DetailRow icon={MapPin}>
                <span className="text-sm text-slate-700">
                  {[address, city, state, country].filter(Boolean).join(", ")}
                </span>
              </DetailRow>
            )}

            {/* Record ID */}
            <DetailRow icon={FileText}>
              <span className="text-xs text-slate-400 font-mono">{record.name}</span>
            </DetailRow>
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

  // Fields to fetch for each DocType to get display name
  const DOCTYPE_FIELDS: Record<string, string[]> = {
    Student: ["name", "full_name"],
    Guardian: ["name", "full_name"],
    Institution: ["name", "institution_name"],
    Message: ["name", "subject"],
    News: ["name", "title"],
    "School Event": ["name", "event_name"],
    Grade: ["name", "grade_name"],
    "Guardian Invite": ["name", "email"],
  };

  // Get display label from item based on doctype
  const getDisplayLabel = (doctype: string, item: Record<string, string>): string => {
    switch (doctype) {
      case "Student":
        return item.full_name || item.name;
      case "Guardian":
        return item.full_name || item.name;
      case "Institution":
        return item.institution_name || item.name;
      case "Message":
        return item.subject || item.name;
      case "News":
        return item.title || item.name;
      case "School Event":
        return item.event_name || item.name;
      case "Grade":
        return item.grade_name || item.name;
      case "Guardian Invite":
        return item.email || item.name;
      default:
        return item.name;
    }
  };

  // Load records using the /api/frappe proxy
  const loadRecords = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allRecords: RecordItem[] = [];

      const promises = SEARCHABLE_DOCTYPES.map(async (doctype) => {
        try {
          const fields = DOCTYPE_FIELDS[doctype] || ["name", "title"];

          const response = await fetch("/api/frappe/api/method/frappe.client.get_list", {
            method: "POST",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              doctype,
              fields,
              limit_page_length: 15,
              order_by: "modified desc",
            }),
          });

          const data = await response.json();

          if (response.ok && data.message) {
            return data.message.map((item: Record<string, string>) => ({
              doctype,
              name: item.name,
              label: getDisplayLabel(doctype, item),
            }));
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
    record.doctype.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (record.label && record.label.toLowerCase().includes(searchQuery.toLowerCase()))
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
    router.push(url);
    setTimeout(() => onOpenChange(false), 100);
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
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        unstyled
        showCloseButton={false}
        className="w-[1024px] max-w-[calc(100vw-2rem)] h-[700px] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
      >
        <DialogTitle className="sr-only">Search records</DialogTitle>

        {/* Header - Fixed at top */}
        <div className="shrink-0 p-4 border-b border-slate-100 bg-white">
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

        {/* Content Area - Middle (takes remaining space) */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Panel - Records List */}
          <div className="w-[400px] border-r border-slate-100 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-50 shrink-0">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Records
              </span>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
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
                  <Search className="w-8 h-8 text-slate-200 mb-3" />
                  <p className="text-sm text-slate-500">No records found</p>
                </div>
              ) : (
                filteredRecords.map((record, index) => (
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
                ))
              )}
            </div>
          </div>

          {/* Right Panel - Details */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <RecordPreview record={selectedRecord} />
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="shrink-0 px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={navigateUp}
              disabled={selectedIndex === 0 || filteredRecords.length === 0}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={navigateDown}
              disabled={selectedIndex >= filteredRecords.length - 1 || filteredRecords.length === 0}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-slate-400 ml-1">Navigate</span>
          </div>

          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors">
              Actions
              <kbd className="px-1 py-0.5 text-[10px] font-mono bg-slate-100 rounded border border-slate-200">⌘K</kbd>
            </button>
            <button
              onClick={() => selectedRecord && navigateToRecord(selectedRecord)}
              disabled={!selectedRecord}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-md bg-blue-500 text-white border border-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Open record
              <kbd className="px-1 py-0.5 text-[10px] font-mono bg-blue-400/30 rounded border border-blue-400/50">↵</kbd>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SearchDialog;
