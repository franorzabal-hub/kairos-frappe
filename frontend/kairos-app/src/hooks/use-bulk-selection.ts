/**
 * useBulkSelection Hook
 *
 * React hook for managing bulk selection state in list views.
 * Supports:
 * - Single item selection/deselection
 * - Select all / deselect all
 * - Range selection (Shift+click)
 * - Selection persistence across pagination (with clear warning)
 */

"use client";

import { useState, useCallback, useMemo, useRef } from "react";

// ============================================================================
// Types
// ============================================================================

export interface BulkSelectionState<T = string> {
  /** Set of selected item IDs */
  selectedIds: Set<T>;
  /** The last clicked item ID (for range selection) */
  lastClickedId: T | null;
}

export interface UseBulkSelectionOptions {
  /** Whether to clear selection when pagination changes */
  clearOnPaginationChange?: boolean;
}

export interface UseBulkSelectionResult<T = string> {
  /** Set of currently selected item IDs */
  selectedIds: Set<T>;
  /** Array of currently selected item IDs */
  selectedIdsArray: T[];
  /** Number of selected items */
  selectedCount: number;
  /** Whether any items are selected */
  hasSelection: boolean;
  /** Whether all visible items are selected */
  isAllSelected: boolean;
  /** Whether some (but not all) visible items are selected */
  isPartiallySelected: boolean;
  /** Check if a specific item is selected */
  isSelected: (id: T) => boolean;
  /** Toggle selection for a single item */
  toggleSelection: (id: T, event?: React.MouseEvent) => void;
  /** Select a single item */
  select: (id: T) => void;
  /** Deselect a single item */
  deselect: (id: T) => void;
  /** Toggle select all for the current page */
  toggleSelectAll: (currentPageIds: T[]) => void;
  /** Select all items on the current page */
  selectAll: (ids: T[]) => void;
  /** Deselect all items */
  deselectAll: () => void;
  /** Handle range selection (Shift+click) */
  handleRangeSelection: (
    clickedId: T,
    currentPageIds: T[],
    event: React.MouseEvent
  ) => void;
  /** Clear selection with optional confirmation callback */
  clearSelection: () => void;
  /** Notify that pagination has changed (may trigger warning) */
  notifyPaginationChange: () => boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useBulkSelection<T = string>(
  options: UseBulkSelectionOptions = {}
): UseBulkSelectionResult<T> {
  const { clearOnPaginationChange = false } = options;

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set());
  const lastClickedIdRef = useRef<T | null>(null);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const selectedIdsArray = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const selectedCount = selectedIds.size;
  const hasSelection = selectedCount > 0;

  // ============================================================================
  // Selection Methods
  // ============================================================================

  /**
   * Check if a specific item is selected
   */
  const isSelected = useCallback(
    (id: T): boolean => {
      return selectedIds.has(id);
    },
    [selectedIds]
  );

  /**
   * Select a single item
   */
  const select = useCallback((id: T) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    lastClickedIdRef.current = id;
  }, []);

  /**
   * Deselect a single item
   */
  const deselect = useCallback((id: T) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  /**
   * Toggle selection for a single item
   * Supports Shift+click for range selection
   */
  const toggleSelection = useCallback(
    (id: T, event?: React.MouseEvent) => {
      if (isSelected(id)) {
        deselect(id);
      } else {
        select(id);
      }
    },
    [isSelected, select, deselect]
  );

  /**
   * Handle range selection (Shift+click)
   * Selects all items between the last clicked item and the current item
   */
  const handleRangeSelection = useCallback(
    (clickedId: T, currentPageIds: T[], event: React.MouseEvent) => {
      if (!event.shiftKey || lastClickedIdRef.current === null) {
        // No shift key or no previous selection - just toggle
        toggleSelection(clickedId, event);
        return;
      }

      // Find indices of last clicked and current clicked items
      const lastIndex = currentPageIds.indexOf(lastClickedIdRef.current);
      const currentIndex = currentPageIds.indexOf(clickedId);

      if (lastIndex === -1 || currentIndex === -1) {
        // One of the items is not on the current page - just toggle
        toggleSelection(clickedId, event);
        return;
      }

      // Determine range bounds
      const startIndex = Math.min(lastIndex, currentIndex);
      const endIndex = Math.max(lastIndex, currentIndex);

      // Select all items in range
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (let i = startIndex; i <= endIndex; i++) {
          next.add(currentPageIds[i]);
        }
        return next;
      });

      // Update last clicked
      lastClickedIdRef.current = clickedId;
    },
    [toggleSelection]
  );

  /**
   * Select all items on the current page
   */
  const selectAll = useCallback((ids: T[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  /**
   * Deselect all items
   */
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
    lastClickedIdRef.current = null;
  }, []);

  /**
   * Toggle select all for the current page
   * If all page items are selected, deselects them
   * Otherwise, selects all page items
   */
  const toggleSelectAll = useCallback(
    (currentPageIds: T[]) => {
      const allPageSelected = currentPageIds.every((id) => selectedIds.has(id));

      if (allPageSelected) {
        // Deselect all page items
        setSelectedIds((prev) => {
          const next = new Set(prev);
          currentPageIds.forEach((id) => next.delete(id));
          return next;
        });
      } else {
        // Select all page items
        selectAll(currentPageIds);
      }
    },
    [selectedIds, selectAll]
  );

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    deselectAll();
  }, [deselectAll]);

  /**
   * Notify that pagination has changed
   * Returns true if selection was cleared, false otherwise
   */
  const notifyPaginationChange = useCallback((): boolean => {
    if (clearOnPaginationChange && hasSelection) {
      clearSelection();
      return true;
    }
    return false;
  }, [clearOnPaginationChange, hasSelection, clearSelection]);

  // Return static values for isAllSelected and isPartiallySelected
  // These will be recalculated in the component with actual page data
  const isAllSelected = false;
  const isPartiallySelected = hasSelection;

  return {
    selectedIds,
    selectedIdsArray,
    selectedCount,
    hasSelection,
    isAllSelected,
    isPartiallySelected,
    isSelected,
    toggleSelection,
    select,
    deselect,
    toggleSelectAll,
    selectAll,
    deselectAll,
    handleRangeSelection,
    clearSelection,
    notifyPaginationChange,
  };
}

// ============================================================================
// Helper Hook for Page-Specific Selection State
// ============================================================================

/**
 * Hook to compute selection state for the current page
 */
export function usePageSelectionState<T = string>(
  selectedIds: Set<T>,
  currentPageIds: T[]
): {
  isAllPageSelected: boolean;
  isPartiallySelected: boolean;
  selectedOnPage: number;
} {
  return useMemo(() => {
    const selectedOnPage = currentPageIds.filter((id) =>
      selectedIds.has(id)
    ).length;

    const isAllPageSelected =
      currentPageIds.length > 0 && selectedOnPage === currentPageIds.length;
    const isPartiallySelected = selectedOnPage > 0 && !isAllPageSelected;

    return {
      isAllPageSelected,
      isPartiallySelected,
      selectedOnPage,
    };
  }, [selectedIds, currentPageIds]);
}

export default useBulkSelection;
