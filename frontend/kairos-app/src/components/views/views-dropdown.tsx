/**
 * Views Dropdown Component
 *
 * Dropdown for selecting and managing saved views.
 * Features:
 * - Search views
 * - Select active view
 * - Context menu per view (favorites, rename, duplicate, delete)
 * - Create new view
 */

"use client";

import * as React from "react";
import { ChevronDown, Grid3X3, Plus, Search, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SavedView } from "@/hooks/use-saved-views";
import { FavoriteFolder } from "@/hooks/use-favorite-folders";
import { ViewContextMenu } from "./view-context-menu";

// ============================================================================
// Types
// ============================================================================

interface ViewsDropdownProps {
  doctype: string;
  doctypeLabel: string;
  views: SavedView[];
  currentViewId: string | null;
  onViewSelect: (viewId: string | null) => void;
  onCreateView: () => void;
  onRenameView: (viewId: string) => void;
  onDuplicateView: (view: SavedView) => void;
  onDeleteView: (viewId: string) => void;
  onAddToFavorites: (viewId: string, folderId?: string) => void;
  onRemoveFromFavorites: (viewId: string) => void;
  folders: FavoriteFolder[];
  isLoading?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function ViewsDropdown({
  doctype,
  doctypeLabel,
  views,
  currentViewId,
  onViewSelect,
  onCreateView,
  onRenameView,
  onDuplicateView,
  onDeleteView,
  onAddToFavorites,
  onRemoveFromFavorites,
  folders,
  isLoading = false,
}: ViewsDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // Find current view
  const currentView = currentViewId
    ? views.find((v) => v.name === currentViewId)
    : null;

  // Filter views by search
  const filteredViews = React.useMemo(() => {
    if (!search.trim()) return views;
    const searchLower = search.toLowerCase();
    return views.filter((v) =>
      v.title.toLowerCase().includes(searchLower)
    );
  }, [views, search]);

  // Handle view selection
  const handleSelect = React.useCallback(
    (viewId: string | null) => {
      onViewSelect(viewId);
      setOpen(false);
      setSearch("");
    },
    [onViewSelect]
  );

  // Display name
  const displayName = currentView?.title || `All ${doctypeLabel}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="gap-2 px-3 h-9 text-base font-medium"
        >
          <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          <span>{displayName}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        {/* Search */}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search views..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>

        {/* Views List */}
        <ScrollArea className="max-h-[300px]">
          <div className="p-1">
            {/* "All" view (virtual, always first) */}
            <ViewItem
              title={`All ${doctypeLabel}`}
              isActive={currentViewId === null}
              onSelect={() => handleSelect(null)}
              isVirtual
              onAddToFavorites={onAddToFavorites}
              onRemoveFromFavorites={onRemoveFromFavorites}
              folders={folders}
            />

            {/* Saved views */}
            {isLoading ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Loading views...
              </div>
            ) : filteredViews.length === 0 && search.trim() ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No views found
              </div>
            ) : (
              filteredViews.map((view) => (
                <ViewItem
                  key={view.name}
                  id={view.name}
                  title={view.title}
                  isActive={currentViewId === view.name}
                  isFavorite={view.is_favorite}
                  isDefault={view.is_default}
                  onSelect={() => handleSelect(view.name)}
                  onRename={() => onRenameView(view.name)}
                  onDuplicate={() => onDuplicateView(view)}
                  onDelete={() => onDeleteView(view.name)}
                  onAddToFavorites={onAddToFavorites}
                  onRemoveFromFavorites={onRemoveFromFavorites}
                  folders={folders}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Create new view */}
        <div className="p-1 border-t">
          <button
            onClick={() => {
              onCreateView();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create new view</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// View Item Component
// ============================================================================

interface ViewItemProps {
  id?: string;
  title: string;
  isActive: boolean;
  isFavorite?: boolean;
  isDefault?: boolean;
  isVirtual?: boolean;
  onSelect: () => void;
  onRename?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onAddToFavorites: (viewId: string, folderId?: string) => void;
  onRemoveFromFavorites: (viewId: string) => void;
  folders: FavoriteFolder[];
}

function ViewItem({
  id,
  title,
  isActive,
  isFavorite = false,
  isDefault = false,
  isVirtual = false,
  onSelect,
  onRename,
  onDuplicate,
  onDelete,
  onAddToFavorites,
  onRemoveFromFavorites,
  folders,
}: ViewItemProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div
      className={cn(
        "group flex items-center justify-between rounded-md transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "hover:bg-accent"
      )}
    >
      <button
        onClick={onSelect}
        className="flex-1 flex items-center gap-2 px-2 py-1.5 text-sm text-left"
      >
        <Grid3X3 className={cn(
          "h-4 w-4",
          isActive ? "text-primary" : "text-muted-foreground"
        )} />
        <span className={cn(isActive && "font-medium")}>{title}</span>
        {isDefault && (
          <span className="text-xs text-muted-foreground">(Default)</span>
        )}
      </button>

      {/* Context menu trigger - only for saved views */}
      {!isVirtual && (
        <ViewContextMenu
          viewId={id!}
          isFavorite={isFavorite}
          folders={folders}
          onRename={onRename}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onAddToFavorites={onAddToFavorites}
          onRemoveFromFavorites={onRemoveFromFavorites}
          open={menuOpen}
          onOpenChange={setMenuOpen}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(true);
            }}
            className="p-1 rounded-sm hover:bg-muted mr-1"
          >
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </ViewContextMenu>
      )}
    </div>
  );
}

export default ViewsDropdown;
