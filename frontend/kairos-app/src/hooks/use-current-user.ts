/**
 * useCurrentUser Hook
 *
 * Hook for fetching and managing the current logged-in user data
 */

"use client";

import { useMemo } from "react";
import { useFrappeGetCall, useFrappeAuth } from "frappe-react-sdk";

interface UserData {
  name: string;
  email: string;
  full_name: string;
  user_image: string | null;
  roles: string[];
}

interface UseCurrentUserResult {
  user: {
    name: string;
    email: string;
    fullName: string;
    avatar: string | null;
    initials: string;
    roles: string[];
  } | null;
  isLoading: boolean;
  error: { message: string } | null;
  logout: () => Promise<void>;
  isLoggingOut: boolean;
}

/**
 * Get user initials from full name
 */
function getInitials(fullName: string): string {
  if (!fullName) return "??";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Hook to get current user data and handle logout
 */
export function useCurrentUser(): UseCurrentUserResult {
  const { logout: frappeLogout, currentUser, isLoading: authLoading } = useFrappeAuth();

  // Fetch user details
  const {
    data: userData,
    error: userError,
    isLoading: userLoading,
  } = useFrappeGetCall<{ message: UserData }>(
    "frappe.client.get",
    {
      doctype: "User",
      name: currentUser,
      filters: JSON.stringify({ name: currentUser }),
    },
    currentUser ? `user_${currentUser}` : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Transform user data
  const user = useMemo(() => {
    if (!currentUser) return null;

    const data = userData?.message;
    const fullName = data?.full_name || currentUser || "User";

    return {
      name: currentUser,
      email: data?.email || currentUser,
      fullName,
      avatar: data?.user_image || null,
      initials: getInitials(fullName),
      roles: data?.roles || [],
    };
  }, [currentUser, userData]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await frappeLogout();
      // Clear local storage
      localStorage.removeItem("kairos_user");
      // Redirect to login
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      // Force redirect anyway
      localStorage.removeItem("kairos_user");
      window.location.href = "/login";
    }
  };

  return {
    user,
    isLoading: authLoading || userLoading,
    error: userError ? { message: String(userError) } : null,
    logout: handleLogout,
    isLoggingOut: false,
  };
}
