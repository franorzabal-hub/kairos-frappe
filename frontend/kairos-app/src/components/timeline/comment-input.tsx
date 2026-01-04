/**
 * Comment Input Component
 *
 * Input field for adding new comments with @mentions support
 */

"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  KeyboardEvent,
} from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserSearch } from "@/hooks/use-timeline";
import { UserMention } from "@/types/timeline";
import { cn } from "@/lib/utils";
import { Send, Loader2 } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>;
  isSubmitting?: boolean;
  placeholder?: string;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function CommentInput({
  onSubmit,
  isSubmitting = false,
  placeholder = "Add a comment... Use @ to mention someone",
  className,
}: CommentInputProps) {
  const [content, setContent] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Search for users when mentioning
  const { users, isLoading: isSearchingUsers } = useUserSearch({
    query: mentionQuery,
    enabled: showMentionPopup && mentionQuery.length >= 2,
  });

  // Handle content change and detect @mentions
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      const cursorPos = e.target.selectionStart;
      setContent(value);

      // Check for @mention trigger
      const textBeforeCursor = value.slice(0, cursorPos);
      const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9._-]*)$/);

      if (mentionMatch) {
        setMentionQuery(mentionMatch[1]);
        setMentionStartIndex(mentionMatch.index ?? null);
        setShowMentionPopup(true);
        setSelectedMentionIndex(0);
      } else {
        setShowMentionPopup(false);
        setMentionQuery("");
        setMentionStartIndex(null);
      }
    },
    []
  );

  // Handle mention selection
  const handleSelectMention = useCallback(
    (user: UserMention) => {
      if (mentionStartIndex === null) return;

      const beforeMention = content.slice(0, mentionStartIndex);
      const afterMention = content.slice(
        mentionStartIndex + mentionQuery.length + 1
      );
      const newContent = `${beforeMention}@${user.name} ${afterMention}`;

      setContent(newContent);
      setShowMentionPopup(false);
      setMentionQuery("");
      setMentionStartIndex(null);

      // Focus textarea and move cursor after mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = beforeMention.length + user.name.length + 2;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    },
    [content, mentionStartIndex, mentionQuery]
  );

  // Handle keyboard navigation in mention popup
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (!showMentionPopup || users.length === 0) {
        // Submit on Cmd/Ctrl + Enter
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          if (content.trim() && !isSubmitting) {
            handleSubmit();
          }
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedMentionIndex((prev) =>
            prev < users.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedMentionIndex((prev) =>
            prev > 0 ? prev - 1 : users.length - 1
          );
          break;
        case "Enter":
        case "Tab":
          e.preventDefault();
          if (users[selectedMentionIndex]) {
            handleSelectMention(users[selectedMentionIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setShowMentionPopup(false);
          break;
      }
    },
    [showMentionPopup, users, selectedMentionIndex, handleSelectMention, content, isSubmitting]
  );

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isSubmitting) return;

    try {
      await onSubmit(trimmedContent);
      setContent("");
      setShowMentionPopup(false);
    } catch (error) {
      // Error handling is done by parent component
      console.error("Failed to submit comment:", error);
    }
  }, [content, isSubmitting, onSubmit]);

  // Close mention popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowMentionPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSubmitting}
            className="min-h-[80px] resize-none pr-12"
            rows={3}
          />

          {/* Submit button inside textarea */}
          <Button
            type="button"
            size="icon"
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="absolute bottom-2 right-2 h-8 w-8"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>

          {/* Mention popup */}
          {showMentionPopup && (
            <div className="absolute bottom-full left-0 mb-1 w-64 max-h-48 overflow-y-auto rounded-lg border bg-popover shadow-lg z-50">
              {isSearchingUsers ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Searching...
                </div>
              ) : users.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  {mentionQuery.length < 2
                    ? "Type at least 2 characters..."
                    : "No users found"}
                </div>
              ) : (
                <ul className="py-1">
                  {users.map((user, index) => (
                    <li key={user.name}>
                      <button
                        type="button"
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors",
                          index === selectedMentionIndex && "bg-accent"
                        )}
                        onClick={() => handleSelectMention(user)}
                        onMouseEnter={() => setSelectedMentionIndex(index)}
                      >
                        <Avatar className="h-6 w-6">
                          {user.user_image && (
                            <AvatarImage
                              src={user.user_image}
                              alt={user.full_name}
                            />
                          )}
                          <AvatarFallback className="text-xs">
                            {user.full_name?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left truncate">
                          <div className="font-medium truncate">
                            {user.full_name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {user.name}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Helper text */}
      <p className="mt-1 text-xs text-muted-foreground">
        Press Cmd+Enter to submit
      </p>
    </div>
  );
}

export default CommentInput;
