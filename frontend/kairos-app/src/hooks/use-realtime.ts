/**
 * Realtime Hooks
 *
 * React hooks for subscribing to Frappe realtime events.
 * These hooks integrate with the RealtimeProvider context.
 */

"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useRealtime } from "@/providers/realtime-provider";
import type {
  DocUpdateEvent,
  ListUpdateEvent,
  NotificationEvent,
  RealtimeEventData,
  RealtimeEventType,
} from "@/lib/realtime";

// ============================================================================
// useRealtimeDoc - Subscribe to document changes
// ============================================================================

export interface UseRealtimeDocOptions {
  /** Called when the document is updated */
  onUpdate?: (event: DocUpdateEvent) => void;
  /** Whether to enable the subscription */
  enabled?: boolean;
}

export interface UseRealtimeDocResult {
  /** Whether we're connected to the realtime server */
  isConnected: boolean;
  /** Last update event received */
  lastUpdate: DocUpdateEvent | null;
}

/**
 * Subscribe to realtime updates for a specific document
 *
 * @example
 * ```tsx
 * const { lastUpdate, isConnected } = useRealtimeDoc("Student", "STU-001", {
 *   onUpdate: (event) => {
 *     console.log("Document updated:", event);
 *     refetch(); // Refetch the document data
 *   },
 * });
 * ```
 */
export function useRealtimeDoc(
  doctype: string,
  docname: string,
  options: UseRealtimeDocOptions = {}
): UseRealtimeDocResult {
  const { onUpdate, enabled = true } = options;
  const { client, isConnected } = useRealtime();
  const [lastUpdate, setLastUpdate] = useState<DocUpdateEvent | null>(null);

  // Store callback in ref to avoid re-subscribing on every render
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!enabled || !client || !doctype || !docname) {
      return;
    }

    const subscription = client.subscribeToDoc(doctype, docname, (event) => {
      setLastUpdate(event);
      onUpdateRef.current?.(event);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [client, doctype, docname, enabled]);

  return {
    isConnected,
    lastUpdate,
  };
}

// ============================================================================
// useRealtimeList - Subscribe to list changes
// ============================================================================

export interface UseRealtimeListOptions {
  /** Called when the list should be refreshed */
  onUpdate?: (event: ListUpdateEvent) => void;
  /** Whether to enable the subscription */
  enabled?: boolean;
}

export interface UseRealtimeListResult {
  /** Whether we're connected to the realtime server */
  isConnected: boolean;
  /** Last update event received */
  lastUpdate: ListUpdateEvent | null;
  /** Number of updates received */
  updateCount: number;
}

/**
 * Subscribe to realtime updates for a doctype list
 * Notifies when documents are created, updated, or deleted
 *
 * @example
 * ```tsx
 * const { updateCount, isConnected } = useRealtimeList("Student", {
 *   onUpdate: (event) => {
 *     console.log("List updated:", event);
 *     refetchList(); // Refetch the list data
 *   },
 * });
 * ```
 */
export function useRealtimeList(
  doctype: string,
  options: UseRealtimeListOptions = {}
): UseRealtimeListResult {
  const { onUpdate, enabled = true } = options;
  const { client, isConnected } = useRealtime();
  const [lastUpdate, setLastUpdate] = useState<ListUpdateEvent | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  // Store callback in ref to avoid re-subscribing on every render
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!enabled || !client || !doctype) {
      return;
    }

    const subscription = client.subscribeToList(doctype, (event) => {
      setLastUpdate(event);
      setUpdateCount((count) => count + 1);
      onUpdateRef.current?.(event);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [client, doctype, enabled]);

  return {
    isConnected,
    lastUpdate,
    updateCount,
  };
}

// ============================================================================
// useRealtimeEvent - Subscribe to custom events
// ============================================================================

export interface UseRealtimeEventOptions<T = RealtimeEventData> {
  /** Called when the event is received */
  onEvent?: (data: T) => void;
  /** Whether to enable the subscription */
  enabled?: boolean;
}

export interface UseRealtimeEventResult<T = RealtimeEventData> {
  /** Whether we're connected to the realtime server */
  isConnected: boolean;
  /** Last event data received */
  lastEvent: T | null;
  /** Number of events received */
  eventCount: number;
}

/**
 * Subscribe to a specific realtime event type
 *
 * @example
 * ```tsx
 * // Subscribe to notifications
 * const { lastEvent } = useRealtimeEvent<NotificationEvent>("notification", {
 *   onEvent: (notification) => {
 *     toast.info(notification.message);
 *   },
 * });
 *
 * // Subscribe to progress updates
 * const { lastEvent: progress } = useRealtimeEvent<ProgressEvent>("progress", {
 *   onEvent: (data) => {
 *     setProgress(data.percent);
 *   },
 * });
 * ```
 */
export function useRealtimeEvent<T = RealtimeEventData>(
  event: RealtimeEventType | string,
  options: UseRealtimeEventOptions<T> = {}
): UseRealtimeEventResult<T> {
  const { onEvent, enabled = true } = options;
  const { client, isConnected } = useRealtime();
  const [lastEvent, setLastEvent] = useState<T | null>(null);
  const [eventCount, setEventCount] = useState(0);

  // Store callback in ref to avoid re-subscribing on every render
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !client || !event) {
      return;
    }

    const subscription = client.on<T>(event, (data) => {
      setLastEvent(data);
      setEventCount((count) => count + 1);
      onEventRef.current?.(data);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [client, event, enabled]);

  return {
    isConnected,
    lastEvent,
    eventCount,
  };
}

// ============================================================================
// useRealtimeNotification - Convenience hook for notifications
// ============================================================================

export interface UseRealtimeNotificationOptions {
  /** Called when a notification is received */
  onNotification?: (notification: NotificationEvent) => void;
  /** Whether to enable the subscription */
  enabled?: boolean;
}

/**
 * Convenience hook specifically for Frappe notifications
 *
 * @example
 * ```tsx
 * useRealtimeNotification({
 *   onNotification: (notification) => {
 *     toast({
 *       title: notification.title,
 *       description: notification.message,
 *     });
 *   },
 * });
 * ```
 */
export function useRealtimeNotification(
  options: UseRealtimeNotificationOptions = {}
) {
  return useRealtimeEvent<NotificationEvent>("notification", {
    onEvent: options.onNotification,
    enabled: options.enabled,
  });
}

// ============================================================================
// useRealtimeConnection - Hook to check connection status
// ============================================================================

/**
 * Hook to monitor the realtime connection status
 *
 * @example
 * ```tsx
 * const { isConnected, connect, disconnect } = useRealtimeConnection();
 *
 * return (
 *   <div>
 *     Status: {isConnected ? "Connected" : "Disconnected"}
 *     <button onClick={connect}>Reconnect</button>
 *   </div>
 * );
 * ```
 */
export function useRealtimeConnection() {
  const { isConnected, isConnecting, error, connect, disconnect } =
    useRealtime();

  const reconnect = useCallback(async () => {
    disconnect();
    await connect();
  }, [connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    reconnect,
  };
}

// ============================================================================
// useRealtimeEmit - Hook to emit events to the server
// ============================================================================

/**
 * Hook to emit events to the Frappe Socket.io server
 *
 * @example
 * ```tsx
 * const emit = useRealtimeEmit();
 *
 * // Emit a custom event
 * emit("my_event", { data: "value" });
 * ```
 */
export function useRealtimeEmit() {
  const { client, isConnected } = useRealtime();

  const emit = useCallback(
    (event: string, data?: unknown) => {
      if (client && isConnected) {
        client.emit(event, data);
      } else {
        console.warn("[useRealtimeEmit] Not connected, cannot emit");
      }
    },
    [client, isConnected]
  );

  return emit;
}
