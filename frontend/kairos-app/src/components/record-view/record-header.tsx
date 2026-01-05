/**
 * RecordHeader Component
 *
 * Header for the record view with:
 * - Record title with favorite toggle
 * - Quick actions (Send Email, Add Note, Log Call)
 *
 * Note: Navigation (prev/next) is handled by AppHeader
 */

"use client";

import { Button } from "@/components/ui/button";
import {
  Star,
  Mail,
  FileText,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface RecordHeaderProps {
  /** Record title to display */
  title: string;
  /** DocType name */
  doctype: string;
  /** Whether this is a new record */
  isNew?: boolean;
  /** Whether record is favorited */
  isFavorited?: boolean;
  /** Toggle favorite callback */
  onToggleFavorite?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function RecordHeader({
  title,
  doctype,
  isNew = false,
  isFavorited = false,
  onToggleFavorite,
}: RecordHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
      {/* Left: Title */}
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold truncate max-w-md">
          {isNew ? `New ${doctype}` : title}
        </h1>
        {!isNew && onToggleFavorite && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFavorite}
            className="h-8 w-8"
          >
            <Star
              className={cn(
                "h-4 w-4",
                isFavorited
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              )}
            />
          </Button>
        )}
      </div>

      {/* Right: Quick Actions */}
      {!isNew && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Add Note
          </Button>
          <Button variant="outline" size="sm">
            <Phone className="mr-2 h-4 w-4" />
            Log Call
          </Button>
        </div>
      )}
    </div>
  );
}

export default RecordHeader;
