/**
 * View Context Menu Component
 *
 * Context menu for individual view actions:
 * - Add to favorites (with folder selection)
 * - Remove from favorites
 * - Rename
 * - Duplicate
 * - Delete
 */

"use client";

import * as React from "react";
import {
  Star,
  StarOff,
  Pencil,
  Copy,
  Trash2,
  ChevronRight,
  FolderPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FavoriteFolder } from "@/hooks/use-favorite-folders";

// ============================================================================
// Types
// ============================================================================

interface ViewContextMenuProps {
  viewId: string;
  isFavorite: boolean;
  folders: FavoriteFolder[];
  onRename?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onAddToFavorites: (viewId: string, folderId?: string) => void;
  onRemoveFromFavorites: (viewId: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

export function ViewContextMenu({
  viewId,
  isFavorite,
  folders,
  onRename,
  onDuplicate,
  onDelete,
  onAddToFavorites,
  onRemoveFromFavorites,
  open,
  onOpenChange,
  children,
}: ViewContextMenuProps) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Favorites */}
        {isFavorite ? (
          <DropdownMenuItem
            onClick={() => onRemoveFromFavorites(viewId)}
            className="gap-2"
          >
            <StarOff className="h-4 w-4" />
            <span>Remove from favorites</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <Star className="h-4 w-4" />
              <span>Add to favorites</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-40">
              {/* No folder option */}
              <DropdownMenuItem
                onClick={() => onAddToFavorites(viewId)}
                className="gap-2"
              >
                <span>No folder</span>
              </DropdownMenuItem>

              {/* Existing folders */}
              {folders.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  {folders.map((folder) => (
                    <DropdownMenuItem
                      key={folder.name}
                      onClick={() => onAddToFavorites(viewId, folder.name)}
                      className="gap-2"
                    >
                      <span>{folder.folder_name}</span>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        <DropdownMenuSeparator />

        {/* Rename */}
        {onRename && (
          <DropdownMenuItem onClick={onRename} className="gap-2">
            <Pencil className="h-4 w-4" />
            <span>Rename</span>
          </DropdownMenuItem>
        )}

        {/* Duplicate */}
        {onDuplicate && (
          <DropdownMenuItem onClick={onDuplicate} className="gap-2">
            <Copy className="h-4 w-4" />
            <span>Duplicate</span>
          </DropdownMenuItem>
        )}

        {/* Delete */}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ViewContextMenu;
