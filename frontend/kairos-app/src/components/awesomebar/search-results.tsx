/**
 * SearchResults Component
 *
 * Displays search results grouped by DocType, recent items,
 * and quick actions in the Awesomebar command menu.
 */

"use client";

import { useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  MessageSquare,
  Newspaper,
  Plus,
  Trash2,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { doctypeToSlug } from "@/lib/utils";
import type {
  GlobalSearchResult,
  GroupedSearchResults,
  QuickAction,
  RecentItem,
} from "@/hooks/use-global-search";

// ============================================================================
// Types
// ============================================================================

interface SearchResultsProps {
  /** Search results grouped by DocType */
  results: GroupedSearchResults;
  /** Callback when a result is selected */
  onSelect: (doctype: string, name: string, label: string) => void;
}

interface RecentItemsProps {
  /** List of recent items */
  items: RecentItem[];
  /** Callback when a recent item is selected */
  onSelect: (doctype: string, name: string, label: string) => void;
  /** Callback to clear all recent items */
  onClear: () => void;
}

interface QuickActionsProps {
  /** List of quick actions */
  actions: QuickAction[];
  /** Callback when an action is selected */
  onSelect: (doctype: string) => void;
  /** Current search query (for filtering) */
  query: string;
}

// ============================================================================
// DocType Icons
// ============================================================================

/**
 * Map of DocType names to their icons
 */
const DOCTYPE_ICONS: Record<string, LucideIcon> = {
  Student: Users,
  Guardian: UserCheck,
  Institution: Building2,
  Message: MessageSquare,
  News: Newspaper,
  "School Event": Calendar,
  Grade: GraduationCap,
  Enrollment: FileText,
  "Guardian Invite": UserCheck,
};

/**
 * Get the icon for a DocType
 */
function getDocTypeIcon(doctype: string): LucideIcon {
  return DOCTYPE_ICONS[doctype] || FileText;
}

/**
 * Get a friendly label for a DocType (plural form for groups)
 */
function getDocTypeLabel(doctype: string): string {
  const labels: Record<string, string> = {
    Student: "Students",
    Guardian: "Guardians",
    Institution: "Institutions",
    Message: "Messages",
    News: "News",
    "School Event": "Events",
    Grade: "Grades",
    Enrollment: "Enrollments",
    "Guardian Invite": "Guardian Invites",
  };
  return labels[doctype] || doctype;
}

// ============================================================================
// SearchResults Component
// ============================================================================

/**
 * Displays search results grouped by DocType
 */
export function SearchResults({ results, onSelect }: SearchResultsProps) {
  const doctypes = Object.keys(results);

  if (doctypes.length === 0) {
    return null;
  }

  return (
    <>
      {doctypes.map((doctype, index) => {
        const items = results[doctype];
        const Icon = getDocTypeIcon(doctype);

        return (
          <CommandGroup key={doctype} heading={getDocTypeLabel(doctype)}>
            {items.map((item) => (
              <CommandItem
                key={`${item.doctype}-${item.name}`}
                value={`${item.doctype} ${item.name} ${item.content}`}
                onSelect={() => onSelect(item.doctype, item.name, item.content)}
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="truncate">{item.name}</span>
                  {item.description && (
                    <span className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {doctype}
                </span>
              </CommandItem>
            ))}
            {index < doctypes.length - 1 && <CommandSeparator className="my-1" />}
          </CommandGroup>
        );
      })}
    </>
  );
}

// ============================================================================
// RecentItems Component
// ============================================================================

/**
 * Displays recent items with option to clear
 */
export function RecentItems({ items, onSelect, onClear }: RecentItemsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <CommandGroup heading="Recent">
      {items.map((item) => {
        const Icon = getDocTypeIcon(item.doctype);

        return (
          <CommandItem
            key={`recent-${item.doctype}-${item.name}`}
            value={`recent ${item.doctype} ${item.name} ${item.label}`}
            onSelect={() => onSelect(item.doctype, item.name, item.label)}
          >
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="truncate flex-1">{item.label}</span>
            <span className="text-xs text-muted-foreground">
              {item.doctype}
            </span>
          </CommandItem>
        );
      })}
      <CommandItem
        value="clear recent items"
        onSelect={() => {
          onClear();
        }}
        className="text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        <span>Clear recent items</span>
      </CommandItem>
    </CommandGroup>
  );
}

// ============================================================================
// QuickActions Component
// ============================================================================

/**
 * Displays quick actions for creating new documents
 */
export function QuickActions({ actions, onSelect, query }: QuickActionsProps) {
  // Filter actions based on query if it starts with "new" or contains a doctype
  const filteredActions = query
    ? actions.filter(
        (action) =>
          action.label.toLowerCase().includes(query.toLowerCase()) ||
          action.doctype.toLowerCase().includes(query.toLowerCase())
      )
    : actions;

  if (filteredActions.length === 0) {
    return null;
  }

  return (
    <CommandGroup heading="Quick Actions">
      {filteredActions.map((action) => {
        const Icon = getDocTypeIcon(action.doctype);

        return (
          <CommandItem
            key={`action-${action.doctype}`}
            value={`new ${action.doctype} ${action.label}`}
            onSelect={() => onSelect(action.doctype)}
          >
            <Plus className="h-4 w-4 text-primary" />
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span>{action.label}</span>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}

// ============================================================================
// Navigation Helpers
// ============================================================================

/**
 * Hook for navigation from search results
 */
export function useSearchNavigation(
  onClose: () => void,
  addRecentItem: (item: Omit<RecentItem, "timestamp">) => void
) {
  const router = useRouter();

  /**
   * Navigate to a document
   */
  const navigateToDocument = (
    doctype: string,
    name: string,
    label: string
  ) => {
    // Add to recent items
    addRecentItem({ doctype, name, label });

    // Build the URL
    const slug = doctypeToSlug(doctype);
    const encodedName = encodeURIComponent(name);
    const url = "/" + slug + "/" + encodedName;

    // Close the dialog and navigate
    onClose();
    router.push(url);
  };

  /**
   * Navigate to create a new document
   */
  const navigateToNew = (doctype: string) => {
    const slug = doctypeToSlug(doctype);
    const url = "/" + slug + "/new";

    onClose();
    router.push(url);
  };

  return {
    navigateToDocument,
    navigateToNew,
  };
}

// ============================================================================
// Exports
// ============================================================================

export { getDocTypeIcon, getDocTypeLabel };
