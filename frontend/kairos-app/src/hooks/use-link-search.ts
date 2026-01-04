/**
 * useLinkSearch Hook
 *
 * Reusable hook for searching Frappe documents with debounce.
 * Used primarily by the LinkField component for autocomplete functionality.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";

// ============================================================================
// Types
// ============================================================================

export interface LinkSearchResult {
  value: string;
  description?: string;
}

export interface UseLinkSearchOptions {
  /** The DocType to search in */
  doctype: string;
  /** Search query string */
  searchText: string;
  /** Additional filters to apply */
  filters?: Record<string, unknown>;
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Maximum number of results to return (default: 10) */
  limit?: number;
  /** Whether to enable the search (default: true) */
  enabled?: boolean;
}

export interface UseLinkSearchResult {
  /** Array of search results */
  results: LinkSearchResult[];
  /** Whether the search is currently loading */
  isLoading: boolean;
  /** Error message if search failed */
  error: string | null;
  /** Whether the search has been triggered at least once */
  hasSearched: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for searching Frappe documents with debounce support.
 *
 * Uses Frappe's frappe.client.get_list to search documents.
 * The search is performed on the 'name' field and optionally on
 * fields specified in the DocType's search_fields.
 *
 * @example
 * ```tsx
 * const { results, isLoading, error } = useLinkSearch({
 *   doctype: "Institution",
 *   searchText: "school",
 *   filters: { enabled: 1 },
 *   debounceMs: 300,
 * });
 * ```
 */
export function useLinkSearch({
  doctype,
  searchText,
  filters = {},
  debounceMs = 300,
  limit = 10,
  enabled = true,
}: UseLinkSearchOptions): UseLinkSearchResult {
  const [debouncedSearchText, setDebouncedSearchText] = useState(searchText);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce the search text
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchText(searchText);
      if (searchText.length > 0) {
        setHasSearched(true);
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchText, debounceMs]);

  // Prepare filters with search text
  const searchFilters = useCallback(() => {
    if (!debouncedSearchText) {
      return filters;
    }

    // Use Frappe's "like" operator for search
    // This searches in the 'name' field by default
    return {
      ...filters,
      name: ["like", `%${debouncedSearchText}%`],
    };
  }, [debouncedSearchText, filters]);

  // Build the SWR key - only fetch when there's a search term and search is enabled
  const shouldFetch = enabled && debouncedSearchText.length > 0;

  // Use Frappe's get_list method via frappe.client.get_list
  const { data, error, isLoading, isValidating } = useFrappeGetCall<{
    message: Array<{ name: string; [key: string]: unknown }>;
  }>(
    "frappe.client.get_list",
    shouldFetch
      ? {
          doctype,
          filters: searchFilters(),
          fields: ["name"],
          limit_page_length: limit,
          order_by: "modified desc",
        }
      : undefined,
    shouldFetch
      ? `link_search_${doctype}_${debouncedSearchText}_${JSON.stringify(filters)}`
      : undefined
  );

  // Transform results
  const results: LinkSearchResult[] = (data?.message || []).map((item) => ({
    value: item.name,
    description: undefined, // Could be extended to show additional info
  }));

  return {
    results,
    isLoading: isLoading || isValidating,
    error: error ? String(error) : null,
    hasSearched,
  };
}

// ============================================================================
// Alternative Direct Fetch Hook (without frappe-react-sdk)
// ============================================================================

/**
 * Alternative hook using direct fetch for more control over the search.
 * Useful when frappe-react-sdk context is not available.
 *
 * @example
 * ```tsx
 * const { results, isLoading, error, search } = useLinkSearchDirect({
 *   doctype: "Institution",
 *   frappeUrl: "http://localhost:8000",
 * });
 *
 * // Trigger search manually
 * search("school");
 * ```
 */
export interface UseLinkSearchDirectOptions {
  /** The DocType to search in */
  doctype: string;
  /** Base Frappe URL */
  frappeUrl?: string;
  /** Additional filters to apply */
  filters?: Record<string, unknown>;
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Maximum number of results to return (default: 10) */
  limit?: number;
}

export interface UseLinkSearchDirectResult {
  /** Array of search results */
  results: LinkSearchResult[];
  /** Whether the search is currently loading */
  isLoading: boolean;
  /** Error message if search failed */
  error: string | null;
  /** Current search text */
  searchText: string;
  /** Function to update search text (triggers debounced search) */
  setSearchText: (text: string) => void;
  /** Function to clear results and search text */
  clear: () => void;
}

export function useLinkSearchDirect({
  doctype,
  frappeUrl = process.env.NEXT_PUBLIC_FRAPPE_URL || "http://kairos.localhost:8000",
  filters = {},
  debounceMs = 300,
  limit = 10,
}: UseLinkSearchDirectOptions): UseLinkSearchDirectResult {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [results, setResults] = useState<LinkSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce the search text
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchText, debounceMs]);

  // Perform the search when debounced text changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchText) {
        setResults([]);
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
        // Build search filters
        const searchFilters = {
          ...filters,
          name: ["like", `%${debouncedSearchText}%`],
        };

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
              filters: searchFilters,
              fields: ["name"],
              limit_page_length: limit,
              order_by: "modified desc",
            }),
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }

        const data = await response.json();
        const message = data.message || [];

        setResults(
          message.map((item: { name: string }) => ({
            value: item.name,
            description: undefined,
          }))
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // Request was cancelled, ignore
          return;
        }
        setError(err instanceof Error ? err.message : "Search failed");
        setResults([]);
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
  }, [debouncedSearchText, doctype, filters, frappeUrl, limit]);

  const clear = useCallback(() => {
    setSearchText("");
    setDebouncedSearchText("");
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    isLoading,
    error,
    searchText,
    setSearchText,
    clear,
  };
}
