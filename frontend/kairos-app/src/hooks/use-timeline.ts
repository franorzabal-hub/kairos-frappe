/**
 * useTimeline Hook
 *
 * React hook for fetching and managing timeline/comments data for a document
 */

"use client";

import { useMemo, useCallback } from "react";
import {
  useFrappeGetCall,
  useFrappePostCall,
  useFrappeGetDocList,
} from "frappe-react-sdk";
import {
  TimelineItem,
  TimelineItemType,
  CommunicationData,
  VersionData,
  ParsedVersionChange,
  UserMention,
} from "@/types/timeline";

// ============================================================================
// Types
// ============================================================================

interface UseTimelineOptions {
  doctype: string;
  docname: string;
  enabled?: boolean;
}

interface UseTimelineResult {
  items: TimelineItem[];
  isLoading: boolean;
  error: { message: string } | null;
  addComment: (content: string) => Promise<void>;
  isAddingComment: boolean;
  refresh: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse comment type to timeline item type
 */
function getTimelineItemType(commentType: string | undefined): TimelineItemType {
  switch (commentType) {
    case "Comment":
      return "Comment";
    case "Like":
      return "Like";
    case "Info":
      return "Info";
    case "Created":
      return "Creation";
    case "Workflow":
      return "Workflow";
    case "Shared":
      return "Share";
    case "Assigned":
      return "Assignment";
    case "Attachment":
      return "Attachment";
    case "Edit":
      return "Edit";
    default:
      return "Comment";
  }
}

/**
 * Parse version data to extract changes
 */
function parseVersionData(dataStr: string): ParsedVersionChange | null {
  try {
    const data = JSON.parse(dataStr);
    return {
      changed: data.changed || [],
      added: data.added || [],
      removed: data.removed || [],
    };
  } catch {
    return null;
  }
}

/**
 * Format field value for display
 */
function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "(empty)";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Convert communications to timeline items
 */
function communicationsToTimelineItems(
  communications: CommunicationData[]
): TimelineItem[] {
  return communications.map((comm) => ({
    name: comm.name,
    type: getTimelineItemType(comm.comment_type),
    owner: comm.owner,
    owner_name: comm.owner_name,
    user_image: comm.user_image,
    creation: comm.creation,
    content: comm.content,
  }));
}

/**
 * Convert versions to timeline items (Edit type)
 */
function versionsToTimelineItems(versions: VersionData[]): TimelineItem[] {
  const items: TimelineItem[] = [];

  versions.forEach((version) => {
    const parsed = parseVersionData(version.data);
    if (!parsed) return;

    // Process changed fields
    if (parsed.changed && parsed.changed.length > 0) {
      const changes = parsed.changed.map(([fieldname, oldVal, newVal]) => ({
        fieldname: String(fieldname),
        label: String(fieldname).replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        old_value: formatFieldValue(oldVal),
        new_value: formatFieldValue(newVal),
      }));

      const content = changes
        .map((c) => `Changed ${c.label}: ${c.old_value} → ${c.new_value}`)
        .join("\n");

      items.push({
        name: version.name,
        type: "Edit",
        owner: version.owner,
        owner_name: version.owner_name,
        user_image: version.user_image,
        creation: version.creation,
        content,
      });
    }
  });

  return items;
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Hook for fetching and managing timeline data
 */
export function useTimeline({
  doctype,
  docname,
  enabled = true,
}: UseTimelineOptions): UseTimelineResult {
  // Fetch communications (comments, etc.)
  const {
    data: commData,
    isLoading: commLoading,
    error: commError,
    mutate: mutateComm,
  } = useFrappeGetCall<{ message: CommunicationData[] }>(
    "frappe.client.get_list",
    {
      doctype: "Comment",
      filters: JSON.stringify({
        reference_doctype: doctype,
        reference_name: docname,
      }),
      fields: JSON.stringify([
        "name",
        "comment_type",
        "content",
        "owner",
        "creation",
      ]),
      order_by: "creation desc",
      limit_page_length: 100,
    },
    enabled ? `timeline_comm_${doctype}_${docname}` : null
  );

  // Fetch versions (edit history)
  const {
    data: versionData,
    isLoading: versionLoading,
    error: versionError,
    mutate: mutateVersion,
  } = useFrappeGetCall<{ message: VersionData[] }>(
    "frappe.client.get_list",
    {
      doctype: "Version",
      filters: JSON.stringify({
        ref_doctype: doctype,
        docname: docname,
      }),
      fields: JSON.stringify(["name", "owner", "creation", "data"]),
      order_by: "creation desc",
      limit_page_length: 50,
    },
    enabled ? `timeline_version_${doctype}_${docname}` : null
  );

  // Create comment mutation
  const { call: createComment, loading: isAddingComment } = useFrappePostCall(
    "frappe.client.insert"
  );

  // Combine and sort timeline items
  const items = useMemo(() => {
    const commItems = communicationsToTimelineItems(commData?.message || []);
    const versionItems = versionsToTimelineItems(versionData?.message || []);

    // Combine all items
    const allItems = [...commItems, ...versionItems];

    // Sort by creation date (newest first)
    allItems.sort(
      (a, b) => new Date(b.creation).getTime() - new Date(a.creation).getTime()
    );

    return allItems;
  }, [commData, versionData]);

  // Add comment handler
  const addComment = useCallback(
    async (content: string) => {
      await createComment({
        doc: {
          doctype: "Comment",
          comment_type: "Comment",
          reference_doctype: doctype,
          reference_name: docname,
          content,
        },
      });

      // Refresh timeline data
      mutateComm();
    },
    [createComment, doctype, docname, mutateComm]
  );

  // Refresh handler
  const refresh = useCallback(() => {
    mutateComm();
    mutateVersion();
  }, [mutateComm, mutateVersion]);

  return {
    items,
    isLoading: commLoading || versionLoading,
    error: commError || versionError || null,
    addComment,
    isAddingComment,
    refresh,
  };
}

// ============================================================================
// User Search Hook for @mentions
// ============================================================================

interface UseUserSearchOptions {
  query: string;
  enabled?: boolean;
}

interface UseUserSearchResult {
  users: UserMention[];
  isLoading: boolean;
}

/**
 * Hook for searching users for @mentions
 */
export function useUserSearch({
  query,
  enabled = true,
}: UseUserSearchOptions): UseUserSearchResult {
  const shouldSearch = enabled && query.length >= 2;

  const { data, isLoading } = useFrappeGetCall<{ message: UserMention[] }>(
    "frappe.client.get_list",
    {
      doctype: "User",
      filters: JSON.stringify({
        enabled: 1,
        user_type: "System User",
        full_name: ["like", `%${query}%`],
      }),
      fields: JSON.stringify(["name", "full_name", "user_image"]),
      limit_page_length: 10,
    },
    shouldSearch ? `user_search_${query}` : null
  );

  return {
    users: data?.message || [],
    isLoading: shouldSearch ? isLoading : false,
  };
}

export default useTimeline;
