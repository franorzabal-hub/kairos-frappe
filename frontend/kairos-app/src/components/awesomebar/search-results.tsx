/**
 * SearchResults Component
 *
 * Displays search results and recent items in the Awesomebar command menu.
 */

"use client";

import { useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  Mail,
  MessageSquare,
  Newspaper,
  Trash2,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { doctypeToSlug } from "@/lib/utils";
import type {
  GlobalSearchResult,
  RecentItem,
} from "@/hooks/use-global-search";

// ============================================================================
// DocType Icons
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

function getDocTypeIcon(doctype: string): LucideIcon {
  return DOCTYPE_ICONS[doctype] || FileText;
}

// ============================================================================
// SearchResultsList Component (flat array)
// ============================================================================

interface SearchResultsListProps {
  results: GlobalSearchResult[];
  onSelect: (doctype: string, name: string, label: string) => void;
}

export function SearchResultsList({ results, onSelect }: SearchResultsListProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <CommandGroup heading="Results">
      {results.map((item) => {
        const Icon = getDocTypeIcon(item.doctype);

        return (
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
              {item.doctype}
            </span>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}

// ============================================================================
// RecentItems Component
// ============================================================================

interface RecentItemsProps {
  items: RecentItem[];
  onSelect: (doctype: string, name: string, label: string) => void;
  onClear: () => void;
}

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
        onSelect={() => onClear()}
        className="text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        <span>Clear recent items</span>
      </CommandItem>
    </CommandGroup>
  );
}

// ============================================================================
// Navigation Helpers
// ============================================================================

export function useSearchNavigation(
  onClose: () => void,
  addRecentItem: (item: Omit<RecentItem, "timestamp">) => void
) {
  const router = useRouter();

  const navigateToDocument = (
    doctype: string,
    name: string,
    label: string
  ) => {
    addRecentItem({ doctype, name, label });

    const slug = doctypeToSlug(doctype);
    const encodedName = encodeURIComponent(name);
    const url = "/" + slug + "/" + encodedName;

    onClose();
    router.push(url);
  };

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

export { getDocTypeIcon };
