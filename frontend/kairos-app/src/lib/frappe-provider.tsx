/**
 * Frappe Provider
 *
 * React context provider for Frappe configuration.
 * Uses local API proxy to handle authentication.
 */

"use client";

import { ReactNode } from "react";
import { FrappeProvider as FrappeSdkProvider } from "frappe-react-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ============================================================================
// Query Client
// ============================================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ============================================================================
// Main Provider
// ============================================================================

interface FrappeProviderProps {
  children: ReactNode;
}

/**
 * Main Frappe Provider - uses /api/frappe proxy for authenticated requests
 */
export function FrappeProvider({ children }: FrappeProviderProps) {
  // Use /api/frappe as base - our proxy will forward to Frappe with cookies
  const baseUrl = "/api/frappe";
  
  return (
    <QueryClientProvider client={queryClient}>
      <FrappeSdkProvider
        url={baseUrl}
        enableSocket={false}
        socketPort=""
      >
        {children}
      </FrappeSdkProvider>
    </QueryClientProvider>
  );
}

// ============================================================================
// Auth Hook
// ============================================================================

export function useAuth() {
  const getUserFromStorage = () => {
    if (typeof window === "undefined") return null;
    const userInfo = localStorage.getItem("kairos_user");
    if (userInfo) {
      try {
        return JSON.parse(userInfo);
      } catch {
        return null;
      }
    }
    return null;
  };

  const user = getUserFromStorage();

  return {
    user,
    isLoading: false,
    isAuthenticated: !!user,
    error: null,
    logout: async () => {
      localStorage.removeItem("kairos_user");
      document.cookie = "sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
    },
  };
}

export { useFrappeAuth } from "frappe-react-sdk";
export const frappeUrl = "/api/frappe";
