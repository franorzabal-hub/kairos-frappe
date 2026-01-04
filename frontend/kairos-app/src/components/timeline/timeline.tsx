/**
 * Timeline Component
 *
 * Main timeline/comments component that displays activity history
 * and allows adding new comments
 */

"use client";

import { useState, useCallback } from "react";
import { useTimeline } from "@/hooks/use-timeline";
import { useNotification } from "@/hooks/use-notification";
import { TimelineItem } from "./timeline-item";
import { CommentInput } from "./comment-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  History,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface TimelineProps {
  doctype: string;
  docname: string;
  className?: string;
  maxItems?: number;
  showInput?: boolean;
}

type FilterType = "all" | "comments" | "changes";

// ============================================================================
// Component
// ============================================================================

export function Timeline({
  doctype,
  docname,
  className,
  maxItems = 10,
  showInput = true,
}: TimelineProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [isExpanded, setIsExpanded] = useState(false);
  const { showSuccess, showError } = useNotification();

  const {
    items,
    isLoading,
    error,
    addComment,
    isAddingComment,
    refresh,
  } = useTimeline({
    doctype,
    docname,
    enabled: !!doctype && !!docname,
  });

  // Filter items based on selected filter
  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "comments") return item.type === "Comment";
    if (filter === "changes") return item.type === "Edit";
    return true;
  });

  // Limit items if not expanded
  const displayItems = isExpanded
    ? filteredItems
    : filteredItems.slice(0, maxItems);

  const hasMore = filteredItems.length > maxItems;

  // Handle adding comment
  const handleAddComment = useCallback(
    async (content: string) => {
      try {
        await addComment(content);
        showSuccess("Comment added");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to add comment";
        showError(message);
        throw err;
      }
    },
    [addComment, showSuccess, showError]
  );

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <TimelineHeader onRefresh={handleRefresh} isRefreshing={false} />
        <TimelineSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <TimelineHeader onRefresh={handleRefresh} isRefreshing={false} />
        <div className="text-sm text-muted-foreground text-center py-6">
          Failed to load timeline
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="ml-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <TimelineHeader onRefresh={handleRefresh} isRefreshing={isLoading} />

      {/* Comment Input */}
      {showInput && (
        <CommentInput
          onSubmit={handleAddComment}
          isSubmitting={isAddingComment}
        />
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 border-b">
        <FilterButton
          active={filter === "all"}
          onClick={() => setFilter("all")}
          count={items.length}
        >
          All
        </FilterButton>
        <FilterButton
          active={filter === "comments"}
          onClick={() => setFilter("comments")}
          icon={<MessageSquare className="h-3.5 w-3.5" />}
          count={items.filter((i) => i.type === "Comment").length}
        >
          Comments
        </FilterButton>
        <FilterButton
          active={filter === "changes"}
          onClick={() => setFilter("changes")}
          icon={<History className="h-3.5 w-3.5" />}
          count={items.filter((i) => i.type === "Edit").length}
        >
          Changes
        </FilterButton>
      </div>

      {/* Timeline items */}
      {displayItems.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8">
          {filter === "all"
            ? "No activity yet"
            : filter === "comments"
              ? "No comments yet"
              : "No changes recorded"}
        </div>
      ) : (
        <div className="space-y-0">
          {displayItems.map((item, index) => (
            <TimelineItem
              key={item.name}
              item={item}
              isLast={index === displayItems.length - 1}
            />
          ))}
        </div>
      )}

      {/* Show more/less button */}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Show {filteredItems.length - maxItems} more
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface TimelineHeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

function TimelineHeader({ onRefresh, isRefreshing }: TimelineHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-foreground">Activity</h3>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="h-8 w-8"
      >
        <RefreshCw
          className={cn("h-4 w-4", isRefreshing && "animate-spin")}
        />
      </Button>
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
}

function FilterButton({
  active,
  onClick,
  children,
  icon,
  count,
}: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {children}
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "px-1.5 py-0.5 text-xs rounded-full",
            active
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default Timeline;
