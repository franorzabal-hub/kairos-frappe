/**
 * Auth Utilities
 *
 * Client-side authentication utilities for session management
 */

/**
 * Check if the current session is valid by calling Frappe's logged_user API
 * Returns the logged in user or null if not authenticated
 */
export async function checkSession(): Promise<string | null> {
  try {
    const response = await fetch("/api/frappe/method/frappe.auth.get_logged_user", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.message || null;
  } catch {
    return null;
  }
}

/**
 * Refresh the session by making a keep-alive call
 * This extends the session if it's still valid
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const user = await checkSession();
    return user !== null && user !== "Guest";
  } catch {
    return false;
  }
}

/**
 * Get the stored user info from localStorage
 */
export function getStoredUser(): {
  username: string;
  fullName: string;
  loggedInAt: string;
  rememberMe: boolean;
} | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem("kairos_user");
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Clear all auth-related storage (logout cleanup)
 */
export function clearAuthStorage(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem("kairos_user");
  // Note: kairos_remembered_user is kept for "remember me" functionality
}

/**
 * Session refresh interval (15 minutes)
 */
export const SESSION_REFRESH_INTERVAL = 15 * 60 * 1000;
