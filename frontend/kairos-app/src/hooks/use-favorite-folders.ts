/**
 * useFavoriteFolders Hook
 *
 * React hook for managing favorite folders.
 * Folders can be used to organize favorite views.
 */

"use client";

import { useMemo, useCallback } from "react";
import {
  useFrappeGetDocList,
  useFrappeCreateDoc,
  useFrappeUpdateDoc,
  useFrappeDeleteDoc,
} from "frappe-react-sdk";

// ============================================================================
// Types
// ============================================================================

export interface FavoriteFolder {
  name: string;
  folder_name: string;
  owner: string;
  creation: string;
  modified: string;
}

export interface FavoriteFolderInput {
  folder_name: string;
}

interface UseFavoriteFoldersOptions {
  enabled?: boolean;
}

interface UseFavoriteFoldersResult {
  folders: FavoriteFolder[];
  isLoading: boolean;
  error: Error | null;
  createFolder: (name: string) => Promise<FavoriteFolder>;
  renameFolder: (id: string, newName: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  refresh: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useFavoriteFolders({
  enabled = true,
}: UseFavoriteFoldersOptions = {}): UseFavoriteFoldersResult {
  // Fetch all folders for current user
  const { data, error, isLoading, mutate } = useFrappeGetDocList<FavoriteFolder>(
    "Favorite Folder",
    {
      fields: ["name", "folder_name", "owner", "creation", "modified"],
      orderBy: {
        field: "folder_name",
        order: "asc",
      },
    },
    enabled ? "favorite_folders" : null
  );

  const folders = useMemo(() => data || [], [data]);

  // CRUD mutations
  const { createDoc } = useFrappeCreateDoc();
  const { updateDoc } = useFrappeUpdateDoc();
  const { deleteDoc } = useFrappeDeleteDoc();

  // Create a new folder
  const createFolder = useCallback(
    async (folderName: string): Promise<FavoriteFolder> => {
      const doc = await createDoc("Favorite Folder", {
        folder_name: folderName,
      } as Record<string, unknown>);
      await mutate();
      return doc as unknown as FavoriteFolder;
    },
    [createDoc, mutate]
  );

  // Rename a folder
  const renameFolder = useCallback(
    async (id: string, newName: string): Promise<void> => {
      await updateDoc("Favorite Folder", id, {
        folder_name: newName,
      });
      await mutate();
    },
    [updateDoc, mutate]
  );

  // Delete a folder
  const deleteFolder = useCallback(
    async (id: string): Promise<void> => {
      await deleteDoc("Favorite Folder", id);
      await mutate();
    },
    [deleteDoc, mutate]
  );

  return {
    folders,
    isLoading,
    error: error ? new Error(String(error)) : null,
    createFolder,
    renameFolder,
    deleteFolder,
    refresh: mutate,
  };
}
