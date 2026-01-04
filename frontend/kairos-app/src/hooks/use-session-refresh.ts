/**
 * useSessionRefresh Hook
 *
 * Periodically refreshes the session to keep it alive
 * Redirects to login if session expires
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  refreshSession,
  getStoredUser,
  clearAuthStorage,
  SESSION_REFRESH_INTERVAL,
} from "@/lib/auth";

interface UseSessionRefreshOptions {
  /** Enable/disable auto-refresh (default: true) */
  enabled?: boolean;
  /** Custom refresh interval in ms (default: 15 minutes) */
  interval?: number;
  /** Callback when session expires */
  onExpire?: () => void;
}

export function useSessionRefresh(options: UseSessionRefreshOptions = {}) {
  const {
    enabled = true,
    interval = SESSION_REFRESH_INTERVAL,
    onExpire,
  } = options;

  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleExpire = useCallback(() => {
    clearAuthStorage();
    onExpire?.();
    router.push("/login");
  }, [onExpire, router]);

  const doRefresh = useCallback(async () => {
    const user = getStoredUser();

    // Only refresh if user was remembered or recently active
    if (!user) {
      return;
    }

    const isValid = await refreshSession();

    if (!isValid) {
      handleExpire();
    }
  }, [handleExpire]);

  useEffect(() => {
    if (!enabled) return;

    // Skip initial check - trust localStorage on first load
    // Only start periodic refresh after a delay to let the session stabilize
    const startDelay = setTimeout(() => {
      // Set up periodic refresh (don't check immediately)
      intervalRef.current = setInterval(doRefresh, interval);
    }, 5000); // Wait 5 seconds before starting refresh cycle

    // Also refresh on window focus (user returning to tab)
    // But only after the initial delay
    const handleFocus = () => {
      if (intervalRef.current) {
        doRefresh();
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearTimeout(startDelay);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener("focus", handleFocus);
    };
  }, [enabled, interval, doRefresh]);

  return {
    refresh: doRefresh,
  };
}
