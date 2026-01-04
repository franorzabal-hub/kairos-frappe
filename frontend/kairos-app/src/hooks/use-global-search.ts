/**
 * useGlobalSearch Hook
 *
 * Custom hook for global search functionality.
 * Loads initial records on mount and searches as user types.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================================
// Types
// ============================================================================

export interface GlobalSearchResult {
  doctype: string;
  name: string;
  content: string;
  description?: string;
  route?: string;
}

export interface RecentItem {
  doctype: string;
  name: string;
  label: string;
  timestamp: number;
}

export interface UseGlobalSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: GlobalSearchResult[];
  isLoading: boolean;
  error: string | null;
  recentItems: RecentItem[];
  addRecentItem: (item: Omit<RecentItem, "timestamp">) => void;
  clearRecentItems: () => void;
  clear: () => void;
  loadInitialRecords: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const RECENT_ITEMS_KEY = "kairos_recent_items";
const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || "http://kairos.localhost:8000";

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

// ============================================================================
// Hook Implementation
// ============================================================================

export function useGlobalSearch(): UseGlobalSearchReturn {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [initialRecords, setInitialRecords] = useState<GlobalSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ============================================================================
  // Recent Items Management
  // ============================================================================

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_ITEMS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentItem[];
        const sorted = parsed
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);
        setRecentItems(sorted);
      }
    } catch (err) {
      console.error("Failed to load recent items:", err);
    }
  }, []);

  const saveRecentItems = useCallback((items: RecentItem[]) => {
    try {
      localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(items));
    } catch (err) {
      console.error("Failed to save recent items:", err);
    }
  }, []);

  const addRecentItem = useCallback(
    (item: Omit<RecentItem, "timestamp">) => {
      setRecentItems((prev) => {
        const filtered = prev.filter(
          (i) => !(i.doctype === item.doctype && i.name === item.name)
        );
        const newItem: RecentItem = { ...item, timestamp: Date.now() };
        const updated = [newItem, ...filtered].slice(0, 10);
        saveRecentItems(updated);
        return updated;
      });
    },
    [saveRecentItems]
  );

  const clearRecentItems = useCallback(() => {
    setRecentItems([]);
    try {
      localStorage.removeItem(RECENT_ITEMS_KEY);
    } catch (err) {
      console.error("Failed to clear recent items:", err);
    }
  }, []);

  // ============================================================================
  // Load Initial Records
  // ============================================================================

  const loadInitialRecords = useCallback(async () => {
    if (hasLoadedInitial) return;

    setIsLoading(true);
    setError(null);

    try {
      const allRecords: GlobalSearchResult[] = [];

      // Fetch records from each DocType in parallel
      const fetchPromises = SEARCHABLE_DOCTYPES.map(async (doctype) => {
        try {
          const response = await fetch(
            `${FRAPPE_URL}/api/method/frappe.client.get_list`,
            {
              method: "POST",
              credentials: "include",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                doctype,
                fields: ["name", "modified"],
                limit_page_length: 10,
                order_by: "modified desc",
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const items = data.message || [];
            return items.map((item: { name: string }): GlobalSearchResult => ({
              doctype,
              name: item.name,
              content: item.name,
            }));
          }
        } catch (err) {
          console.warn(`Failed to load ${doctype}:`, err);
        }
        return [];
      });

      const resultsArrays = await Promise.all(fetchPromises);

      // Flatten and sort by doctype, then by name
      resultsArrays.forEach((arr) => {
        allRecords.push(...arr);
      });

      setInitialRecords(allRecords);
      setResults(allRecords);
      setHasLoadedInitial(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load records");
    } finally {
      setIsLoading(false);
    }
  }, [hasLoadedInitial]);

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
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      // If query is empty, show initial records
      if (!debouncedQuery) {
        setResults(initialRecords);
        setError(null);
        return;
      }

      // If query is too short, filter locally
      if (debouncedQuery.length < 2) {
        const filtered = initialRecords.filter((item) =>
          item.name.toLowerCase().includes(debouncedQuery.toLowerCase())
        );
        setResults(filtered);
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
        // Search each DocType in parallel
        const searchPromises = SEARCHABLE_DOCTYPES.map(async (doctype) => {
          try {
            const response = await fetch(
              `${FRAPPE_URL}/api/method/frappe.client.get_list`,
              {
                method: "POST",
                credentials: "include",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  doctype,
                  filters: [["name", "like", `%${debouncedQuery}%`]],
                  fields: ["name"],
                  limit_page_length: 10,
                  order_by: "modified desc",
                }),
                signal: abortControllerRef.current?.signal,
              }
            );

            if (response.ok) {
              const data = await response.json();
              const items = data.message || [];
              return items.map((item: { name: string }): GlobalSearchResult => ({
                doctype,
                name: item.name,
                content: item.name,
              }));
            }
          } catch (err) {
            if ((err as Error).name !== "AbortError") {
              console.warn(`Search failed for ${doctype}:`, err);
            }
          }
          return [];
        });

        const resultsArrays = await Promise.all(searchPromises);
        const allResults: GlobalSearchResult[] = [];
        resultsArrays.forEach((arr) => allResults.push(...arr));

        setResults(allResults);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery, initialRecords]);

  // Clear search
  const clear = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    setResults(initialRecords);
    setError(null);
  }, [initialRecords]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    recentItems,
    addRecentItem,
    clearRecentItems,
    clear,
    loadInitialRecords,
  };
}
