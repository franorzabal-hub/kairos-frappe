/**
 * useGlobalSearch Hook
 *
 * Custom hook for global search functionality using Frappe's search_global API.
 * Provides debounced search across multiple DocTypes with proper loading and error states.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================================
// Types
// ============================================================================

/**
 * Individual search result item from Frappe
 */
export interface GlobalSearchResult {
  doctype: string;
  name: string;
  content: string;
  description?: string;
  route?: string;
}

/**
 * Grouped search results by DocType
 */
export interface GroupedSearchResults {
  [doctype: string]: GlobalSearchResult[];
}

/**
 * Recent item stored in localStorage
 */
export interface RecentItem {
  doctype: string;
  name: string;
  label: string;
  timestamp: number;
}

/**
 * Quick action for creating new documents
 */
export interface QuickAction {
  doctype: string;
  label: string;
  icon?: string;
}

/**
 * Hook options
 */
export interface UseGlobalSearchOptions {
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Maximum number of results per DocType (default: 5) */
  limitPerDoctype?: number;
  /** Base Frappe URL */
  frappeUrl?: string;
  /** Maximum recent items to store (default: 10) */
  maxRecentItems?: number;
}

/**
 * Hook return value
 */
export interface UseGlobalSearchReturn {
  /** Current search query */
  query: string;
  /** Function to update search query */
  setQuery: (query: string) => void;
  /** Search results grouped by DocType */
  results: GroupedSearchResults;
  /** Flat array of all results */
  flatResults: GlobalSearchResult[];
  /** Whether search is currently loading */
  isLoading: boolean;
  /** Error message if search failed */
  error: string | null;
  /** Recent items from localStorage */
  recentItems: RecentItem[];
  /** Add item to recent items */
  addRecentItem: (item: Omit<RecentItem, "timestamp">) => void;
  /** Clear all recent items */
  clearRecentItems: () => void;
  /** Available quick actions */
  quickActions: QuickAction[];
  /** Clear search query and results */
  clear: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const RECENT_ITEMS_KEY = "kairos_recent_items";

/**
 * DocTypes available for search in Kairos
 */
export const SEARCHABLE_DOCTYPES = [
  "Student",
  "Guardian",
  "Institution",
  "Message",
  "News",
  "School Event",
  "Grade",
  "Enrollment",
  "Guardian Invite",
] as const;

/**
 * Quick actions for creating new documents
 */
export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { doctype: "Student", label: "New Student" },
  { doctype: "Guardian", label: "New Guardian" },
  { doctype: "Institution", label: "New Institution" },
  { doctype: "Message", label: "New Message" },
  { doctype: "News", label: "New News Article" },
  { doctype: "School Event", label: "New Event" },
  { doctype: "Guardian Invite", label: "New Guardian Invite" },
];

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Global search hook for Kairos Desk.
 *
 * Uses Frappe's search_global API to search across multiple DocTypes.
 * Includes debouncing, recent items management, and quick actions.
 *
 * @example
 * ```tsx
 * const {
 *   query,
 *   setQuery,
 *   results,
 *   isLoading,
 *   recentItems,
 *   addRecentItem,
 *   quickActions,
 * } = useGlobalSearch();
 * ```
 */
export function useGlobalSearch({
  debounceMs = 300,
  limitPerDoctype = 5,
  frappeUrl = process.env.NEXT_PUBLIC_FRAPPE_URL || "http://kairos.localhost:8000",
  maxRecentItems = 10,
}: UseGlobalSearchOptions = {}): UseGlobalSearchReturn {
  // State
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<GroupedSearchResults>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  // Refs
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ============================================================================
  // Recent Items Management
  // ============================================================================

  // Load recent items from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_ITEMS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentItem[];
        // Sort by timestamp descending and limit
        const sorted = parsed
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, maxRecentItems);
        setRecentItems(sorted);
      }
    } catch (err) {
      console.error("Failed to load recent items:", err);
    }
  }, [maxRecentItems]);

  // Save recent items to localStorage
  const saveRecentItems = useCallback((items: RecentItem[]) => {
    try {
      localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(items));
    } catch (err) {
      console.error("Failed to save recent items:", err);
    }
  }, []);

  // Add item to recent items
  const addRecentItem = useCallback(
    (item: Omit<RecentItem, "timestamp">) => {
      setRecentItems((prev) => {
        // Remove existing item with same doctype and name
        const filtered = prev.filter(
          (i) => !(i.doctype === item.doctype && i.name === item.name)
        );
        // Add new item at the beginning
        const newItem: RecentItem = {
          ...item,
          timestamp: Date.now(),
        };
        const updated = [newItem, ...filtered].slice(0, maxRecentItems);
        saveRecentItems(updated);
        return updated;
      });
    },
    [maxRecentItems, saveRecentItems]
  );

  // Clear all recent items
  const clearRecentItems = useCallback(() => {
    setRecentItems([]);
    try {
      localStorage.removeItem(RECENT_ITEMS_KEY);
    } catch (err) {
      console.error("Failed to clear recent items:", err);
    }
  }, []);

  // ============================================================================
  // Search Logic
  // ============================================================================

  // Debounce the search query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, debounceMs]);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      // Clear results if query is empty
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults({});
        setError(null);
        return;
      }

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsLoading(true);
      setError(null);

      try {
        // Call Frappe's search_global API
        const response = await fetch(
          `${frappeUrl}/api/method/frappe.utils.global_search.search`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: debouncedQuery,
              start: 0,
              limit: limitPerDoctype * SEARCHABLE_DOCTYPES.length,
            }),
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) {
          // Fall back to individual doctype search if global search fails
          await performFallbackSearch(debouncedQuery);
          return;
        }

        const data = await response.json();
        const searchResults: GlobalSearchResult[] = data.message || [];

        // Group results by DocType
        const grouped: GroupedSearchResults = {};
        for (const result of searchResults) {
          if (!grouped[result.doctype]) {
            grouped[result.doctype] = [];
          }
          if (grouped[result.doctype].length < limitPerDoctype) {
            grouped[result.doctype].push(result);
          }
        }

        setResults(grouped);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        
        // Try fallback search on error
        try {
          await performFallbackSearch(debouncedQuery);
        } catch (fallbackErr) {
          setError(
            fallbackErr instanceof Error ? fallbackErr.message : "Search failed"
          );
          setResults({});
        }
      } finally {
        setIsLoading(false);
      }
    };

    /**
     * Fallback search using individual DocType queries
     * Used when global_search is not available or fails
     */
    const performFallbackSearch = async (searchText: string) => {
      const grouped: GroupedSearchResults = {};

      // Search each DocType individually (in parallel)
      const searchPromises = SEARCHABLE_DOCTYPES.map(async (doctype) => {
        try {
          const response = await fetch(
            `${frappeUrl}/api/method/frappe.client.get_list`,
            {
              method: "POST",
              credentials: "include",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                doctype,
                filters: {
                  name: ["like", `%${searchText}%`],
                },
                fields: ["name"],
                limit_page_length: limitPerDoctype,
                order_by: "modified desc",
              }),
              signal: abortControllerRef.current?.signal,
            }
          );

          if (response.ok) {
            const data = await response.json();
            const items = data.message || [];
            if (items.length > 0) {
              grouped[doctype] = items.map(
                (item: { name: string }): GlobalSearchResult => ({
                  doctype,
                  name: item.name,
                  content: item.name,
                })
              );
            }
          }
        } catch (err) {
          // Silently fail for individual doctypes
          console.warn(`Search failed for ${doctype}:`, err);
        }
      });

      await Promise.all(searchPromises);
      setResults(grouped);
    };

    performSearch();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery, frappeUrl, limitPerDoctype]);

  // ============================================================================
  // Computed Values
  // ============================================================================

  // Flatten results into a single array
  const flatResults: GlobalSearchResult[] = Object.values(results).flat();

  // Clear search
  const clear = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    setResults({});
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    flatResults,
    isLoading,
    error,
    recentItems,
    addRecentItem,
    clearRecentItems,
    quickActions: DEFAULT_QUICK_ACTIONS,
    clear,
  };
}
