/**
 * useNotifications Hook
 *
 * React hook for fetching and managing Frappe Notification Log entries
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { getList, updateDoc } from "@/lib/api";

export type NotificationType =
  | "Assignment"
  | "Share"
  | "Mention"
  | "Alert"
  | "Energy Point";

export interface Notification {
  name: string;
  for_user: string;
  from_user: string;
  type: NotificationType;
  subject: string;
  email_content?: string;
  document_type?: string;
  document_name?: string;
  read: 0 | 1;
  creation: string;
  modified: string;
}

interface UseNotificationsOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  markAsRead: (notificationName: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications({
  limit = 20,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: UseNotificationsOptions = {}): UseNotificationsResult {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      const data = await getList<Notification>("Notification Log", {
        fields: [
          "name",
          "for_user",
          "from_user",
          "type",
          "subject",
          "email_content",
          "document_type",
          "document_name",
          "read",
          "creation",
          "modified",
        ],
        orderBy: "creation desc",
        limit,
      });
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch notifications"));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchNotifications, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchNotifications]);

  const markAsRead = useCallback(async (notificationName: string) => {
    try {
      await updateDoc("Notification Log", notificationName, { read: 1 });
      setNotifications((prev) =>
        prev.map((n) => (n.name === notificationName ? { ...n, read: 1 } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter((n) => n.read === 0);

    try {
      await Promise.all(
        unreadNotifications.map((n) =>
          updateDoc("Notification Log", n.name, { read: 1 })
        )
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      throw err;
    }
  }, [notifications]);

  const unreadCount = notifications.filter((n) => n.read === 0).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
