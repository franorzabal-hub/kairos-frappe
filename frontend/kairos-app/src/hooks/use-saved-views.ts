/**
 * useSavedViews Hook
 *
 * React hook for managing saved views for a specific DocType.
 * Uses frappe-react-sdk for CRUD operations with the Saved View DocType.
 */

"use client";

import { useMemo, useCallback } from "react";
import {
  useFrappeGetDocList,
  useFrappeCreateDoc,
  useFrappeUpdateDoc,
  useFrappeDeleteDoc,
} from "frappe-react-sdk";
import { SortingState } from "@tanstack/react-table";

// ============================================================================
// Types
// ============================================================================

export interface SavedViewFilter {
  fieldname: string;
  operator: string;
  value: string | number | boolean | null;
}

export type ViewType = "Table" | "Kanban";

export interface VisibleColumn {
  fieldname: string;
  label?: string; // Custom label override
  width?: number;
}

export interface SavedView {
  name: string;
  title: string;
  for_doctype: string;
  view_type: ViewType;
  kanban_field?: string;
  filters: SavedViewFilter[];
  sorting: SortingState;
  column_order: string[];
  visible_columns: VisibleColumn[];
  page_size: number;
  is_default: boolean;
  is_favorite: boolean;
  favorite_folder?: string;
  owner: string;
  creation: string;
  modified: string;
}

export interface SavedViewInput {
  title: string;
  for_doctype: string;
  view_type?: ViewType;
  kanban_field?: string;
  filters?: SavedViewFilter[];
  sorting?: SortingState;
  column_order?: string[];
  visible_columns?: VisibleColumn[];
  page_size?: number;
  is_default?: boolean;
  is_favorite?: boolean;
  favorite_folder?: string;
}

interface UseSavedViewsOptions {
  doctype: string;
  enabled?: boolean;
}

interface UseSavedViewsResult {
  views: SavedView[];
  isLoading: boolean;
  error: Error | null;
  defaultView: SavedView | null;
  createView: (input: SavedViewInput) => Promise<SavedView>;
  updateView: (name: string, updates: Partial<SavedViewInput>) => Promise<void>;
  deleteView: (name: string) => Promise<void>;
  duplicateView: (view: SavedView, newTitle: string) => Promise<SavedView>;
  setDefaultView: (name: string | null) => Promise<void>;
  addToFavorites: (name: string, folderId?: string) => Promise<void>;
  removeFromFavorites: (name: string) => Promise<void>;
  refresh: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useSavedViews({
  doctype,
  enabled = true,
}: UseSavedViewsOptions): UseSavedViewsResult {
  // Fetch saved views for this doctype
  const { data, error, isLoading, mutate } = useFrappeGetDocList<SavedView>(
    "Saved View",
    {
      fields: [
        "name",
        "title",
        "for_doctype",
        "view_type",
        "kanban_field",
        "filters",
        "sorting",
        "column_order",
        "visible_columns",
        "page_size",
        "is_default",
        "is_favorite",
        "favorite_folder",
        "owner",
        "creation",
        "modified",
      ],
      filters: [["for_doctype", "=", doctype]],
      orderBy: {
        field: "modified",
        order: "desc",
      },
    },
    enabled ? `saved_views_${doctype}` : null
  );

  // Parse JSON fields
  const views = useMemo(() => {
    if (!data) return [];
    return data.map((view) => ({
      ...view,
      view_type: (view.view_type || "Table") as ViewType,
      filters: typeof view.filters === "string" ? JSON.parse(view.filters || "[]") : (view.filters || []),
      sorting: typeof view.sorting === "string" ? JSON.parse(view.sorting || "[]") : (view.sorting || []),
      column_order: typeof view.column_order === "string" ? JSON.parse(view.column_order || "[]") : (view.column_order || []),
      visible_columns: typeof view.visible_columns === "string" ? JSON.parse(view.visible_columns || "[]") : (view.visible_columns || []),
      is_default: Boolean(view.is_default),
      is_favorite: Boolean(view.is_favorite),
    }));
  }, [data]);

  // Get default view
  const defaultView = useMemo(() => {
    return views.find((v) => v.is_default) || null;
  }, [views]);

  // CRUD mutations
  const { createDoc } = useFrappeCreateDoc();
  const { updateDoc } = useFrappeUpdateDoc();
  const { deleteDoc } = useFrappeDeleteDoc();

  // Create a new view
  const createView = useCallback(
    async (input: SavedViewInput): Promise<SavedView> => {
      const doc = await createDoc("Saved View", {
        title: input.title,
        for_doctype: input.for_doctype,
        view_type: input.view_type || "Table",
        kanban_field: input.kanban_field || null,
        filters: JSON.stringify(input.filters || []),
        sorting: JSON.stringify(input.sorting || []),
        column_order: JSON.stringify(input.column_order || []),
        visible_columns: JSON.stringify(input.visible_columns || []),
        page_size: input.page_size || 20,
        is_default: input.is_default ? 1 : 0,
        is_favorite: input.is_favorite ? 1 : 0,
        favorite_folder: input.favorite_folder || null,
      } as Record<string, unknown>);
      await mutate();
      return doc as unknown as SavedView;
    },
    [createDoc, mutate]
  );

  // Update an existing view
  const updateView = useCallback(
    async (name: string, updates: Partial<SavedViewInput>): Promise<void> => {
      const updateData: Record<string, unknown> = {};

      if (updates.title !== undefined) {
        updateData.title = updates.title;
      }
      if (updates.view_type !== undefined) {
        updateData.view_type = updates.view_type;
      }
      if (updates.kanban_field !== undefined) {
        updateData.kanban_field = updates.kanban_field || null;
      }
      if (updates.filters !== undefined) {
        updateData.filters = JSON.stringify(updates.filters);
      }
      if (updates.sorting !== undefined) {
        updateData.sorting = JSON.stringify(updates.sorting);
      }
      if (updates.column_order !== undefined) {
        updateData.column_order = JSON.stringify(updates.column_order);
      }
      if (updates.visible_columns !== undefined) {
        updateData.visible_columns = JSON.stringify(updates.visible_columns);
      }
      if (updates.page_size !== undefined) {
        updateData.page_size = updates.page_size;
      }
      if (updates.is_default !== undefined) {
        updateData.is_default = updates.is_default ? 1 : 0;
      }
      if (updates.is_favorite !== undefined) {
        updateData.is_favorite = updates.is_favorite ? 1 : 0;
      }
      if (updates.favorite_folder !== undefined) {
        updateData.favorite_folder = updates.favorite_folder || null;
      }

      await updateDoc("Saved View", name, updateData);
      await mutate();
    },
    [updateDoc, mutate]
  );

  // Delete a view
  const deleteView = useCallback(
    async (name: string): Promise<void> => {
      await deleteDoc("Saved View", name);
      await mutate();
    },
    [deleteDoc, mutate]
  );

  // Duplicate a view
  const duplicateView = useCallback(
    async (view: SavedView, newTitle: string): Promise<SavedView> => {
      return createView({
        title: newTitle,
        for_doctype: view.for_doctype,
        view_type: view.view_type,
        kanban_field: view.kanban_field,
        filters: view.filters,
        sorting: view.sorting,
        column_order: view.column_order,
        visible_columns: view.visible_columns,
        page_size: view.page_size,
        is_default: false,
        is_favorite: false,
      });
    },
    [createView]
  );

  // Set a view as default
  const setDefaultView = useCallback(
    async (name: string | null): Promise<void> => {
      if (name) {
        await updateView(name, { is_default: true });
      }
      // The backend will automatically unset other defaults
    },
    [updateView]
  );

  // Add view to favorites
  const addToFavorites = useCallback(
    async (name: string, folderId?: string): Promise<void> => {
      await updateView(name, {
        is_favorite: true,
        favorite_folder: folderId,
      });
    },
    [updateView]
  );

  // Remove from favorites
  const removeFromFavorites = useCallback(
    async (name: string): Promise<void> => {
      await updateView(name, {
        is_favorite: false,
        favorite_folder: undefined,
      });
    },
    [updateView]
  );

  return {
    views,
    isLoading,
    error: error ? new Error(String(error)) : null,
    defaultView,
    createView,
    updateView,
    deleteView,
    duplicateView,
    setDefaultView,
    addToFavorites,
    removeFromFavorites,
    refresh: mutate,
  };
}
