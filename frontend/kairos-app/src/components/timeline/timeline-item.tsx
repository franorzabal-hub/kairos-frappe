/**
 * Timeline Item Component
 *
 * Displays a single timeline entry with appropriate formatting
 */

"use client";

import { useMemo } from "react";
import { TimelineItem as TimelineItemType } from "@/types/timeline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ActivityIcon } from "./activity-icon";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface TimelineItemProps {
  item: TimelineItemType;
  isLast?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format timestamp to relative time
 */
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 4) return `${diffWeek}w ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Format full timestamp for tooltip
 */
function formatFullTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  const parts = name.split(/[\s@]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (parts[0]?.[0] || "?").toUpperCase();
}

/**
 * Get display name from owner
 */
function getDisplayName(owner: string, ownerName?: string): string {
  if (ownerName) return ownerName;
  // If owner is an email, extract the part before @
  if (owner.includes("@")) {
    return owner.split("@")[0].replace(/[._]/g, " ");
  }
  return owner;
}

/**
 * Get activity description based on type
 */
function getActivityDescription(item: TimelineItemType): string {
  switch (item.type) {
    case "Comment":
      return "commented";
    case "Edit":
      return "made changes";
    case "Creation":
      return "created this document";
    case "Assignment":
      return "assigned this document";
    case "Share":
      return "shared this document";
    case "Attachment":
      return "attached a file";
    case "Email":
      return "sent an email";
    case "Workflow":
      return "changed workflow state";
    case "Like":
      return "liked this document";
    case "Info":
      return "added info";
    default:
      return "updated";
  }
}

/**
 * Parse and render content with @mentions highlighted
 */
function renderContent(content: string | undefined): React.ReactNode {
  if (!content) return null;

  // Parse @mentions
  const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    // Add highlighted mention
    parts.push(
      <span
        key={match.index}
        className="text-blue-600 dark:text-blue-400 font-medium"
      >
        @{match[1]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}

// ============================================================================
// Component
// ============================================================================

export function TimelineItem({ item, isLast = false }: TimelineItemProps) {
  const displayName = useMemo(
    () => getDisplayName(item.owner, item.owner_name),
    [item.owner, item.owner_name]
  );

  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const relativeTime = useMemo(
    () => formatRelativeTime(item.creation),
    [item.creation]
  );

  const fullTime = useMemo(
    () => formatFullTime(item.creation),
    [item.creation]
  );

  const activityDescription = useMemo(
    () => getActivityDescription(item),
    [item.type]
  );

  const renderedContent = useMemo(
    () => renderContent(item.content),
    [item.content]
  );

  return (
    <div className="relative flex gap-3">
      {/* Timeline connector line */}
      {!isLast && (
        <div className="absolute left-4 top-10 bottom-0 w-px bg-border" />
      )}

      {/* Avatar */}
      <div className="relative z-10 flex-shrink-0">
        <Avatar className="h-8 w-8 border-2 border-background">
          {item.user_image && (
            <AvatarImage src={item.user_image} alt={displayName} />
          )}
          <AvatarFallback className="text-xs bg-muted">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-6">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-foreground truncate">
            {displayName}
          </span>
          <span className="text-sm text-muted-foreground">
            {activityDescription}
          </span>
          <span
            className="text-xs text-muted-foreground ml-auto"
            title={fullTime}
          >
            {relativeTime}
          </span>
        </div>

        {/* Content based on type */}
        {item.content && (
          <div
            className={cn(
              "mt-2 text-sm",
              item.type === "Comment"
                ? "bg-muted/50 rounded-lg p-3 border border-border/50"
                : "text-muted-foreground"
            )}
          >
            {item.type === "Edit" ? (
              <div className="space-y-1">
                {item.content.split("\n").map((line, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <ActivityIcon type="Edit" size="sm" className="mt-0.5" />
                    <span className="text-xs">{line}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="whitespace-pre-wrap break-words">
                {renderedContent}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TimelineItem;
