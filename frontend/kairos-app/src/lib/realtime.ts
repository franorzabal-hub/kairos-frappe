/**
 * Realtime Client
 *
 * Socket.io client for Frappe realtime communication.
 * Handles connection, authentication, and event subscriptions.
 */

import { io, Socket } from "socket.io-client";

// ============================================================================
// Types
// ============================================================================

export interface RealtimeConfig {
  /** Frappe server URL (e.g., "http://kairos.localhost:8000") */
  url: string;
  /** Enable automatic reconnection */
  autoConnect?: boolean;
  /** Reconnection attempts */
  reconnectionAttempts?: number;
  /** Reconnection delay in ms */
  reconnectionDelay?: number;
}

export interface DocUpdateEvent {
  doctype: string;
  name: string;
  modified?: string;
  modified_by?: string;
}

export interface ListUpdateEvent {
  doctype: string;
}

export interface NotificationEvent {
  type: string;
  message: string;
  title?: string;
  doc_type?: string;
  doc_name?: string;
}

export interface ProgressEvent {
  percent: number;
  title?: string;
  description?: string;
}

export type RealtimeEventType =
  | "doc_update"
  | "list_update"
  | "notification"
  | "progress"
  | "msgprint"
  | "eval_js"
  | "publish_progress"
  | "task_progress"
  | "task_failure"
  | "task_success";

export type RealtimeEventData =
  | DocUpdateEvent
  | ListUpdateEvent
  | NotificationEvent
  | ProgressEvent
  | unknown;

export type RealtimeEventHandler<T = RealtimeEventData> = (data: T) => void;

export interface Subscription {
  unsubscribe: () => void;
}

// ============================================================================
// Realtime Client Class
// ============================================================================

class RealtimeClient {
  private socket: Socket | null = null;
  private config: RealtimeConfig | null = null;
  private eventHandlers: Map<string, Set<RealtimeEventHandler>> = new Map();
  private docSubscriptions: Map<string, Set<RealtimeEventHandler<DocUpdateEvent>>> = new Map();
  private listSubscriptions: Map<string, Set<RealtimeEventHandler<ListUpdateEvent>>> = new Map();
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;

  /**
   * Initialize the realtime client with configuration
   */
  init(config: RealtimeConfig): void {
    this.config = {
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      ...config,
    };
  }

  /**
   * Connect to Frappe Socket.io server
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    if (!this.config) {
      throw new Error("RealtimeClient not initialized. Call init() first.");
    }

    this.isConnecting = true;

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // Frappe uses Socket.io on the same host
        const socketUrl = this.config!.url;

        this.socket = io(socketUrl, {
          withCredentials: true, // Send cookies (sid) for authentication
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: this.config!.reconnectionAttempts,
          reconnectionDelay: this.config!.reconnectionDelay,
          timeout: 20000,
          path: "/socket.io",
        });

        // Connection events
        this.socket.on("connect", () => {
          console.log("[Realtime] Connected to Frappe Socket.io");
          this.isConnecting = false;
          resolve();
        });

        this.socket.on("disconnect", (reason) => {
          console.log("[Realtime] Disconnected:", reason);
        });

        this.socket.on("connect_error", (error) => {
          console.warn("[Realtime] Connection error (non-critical):", error.message);
          this.isConnecting = false;
          // Don't reject - realtime is optional, app works without it
          resolve();
        });

        this.socket.on("reconnect", (attempt) => {
          console.log("[Realtime] Reconnected after", attempt, "attempts");
          // Re-subscribe to all document rooms after reconnection
          this.resubscribeToRooms();
        });

        this.socket.on("reconnect_error", (error) => {
          console.warn("[Realtime] Reconnection error (non-critical):", error.message);
        });

        // Frappe realtime events
        this.setupFrappeEventHandlers();
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.connectionPromise = null;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get the socket instance (for advanced usage)
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  // ==========================================================================
  // Event Handlers Setup
  // ==========================================================================

  private setupFrappeEventHandlers(): void {
    if (!this.socket) return;

    // Document update event
    this.socket.on("doc_update", (data: DocUpdateEvent) => {
      this.handleDocUpdate(data);
    });

    // List update event (new doc, deleted doc)
    this.socket.on("list_update", (data: ListUpdateEvent) => {
      this.handleListUpdate(data);
    });

    // User notification
    this.socket.on("notification", (data: NotificationEvent) => {
      this.emitToHandlers("notification", data);
    });

    // Progress updates (for long-running tasks)
    this.socket.on("progress", (data: ProgressEvent) => {
      this.emitToHandlers("progress", data);
    });

    this.socket.on("publish_progress", (data: ProgressEvent) => {
      this.emitToHandlers("publish_progress", data);
    });

    // Task events
    this.socket.on("task_progress", (data: unknown) => {
      this.emitToHandlers("task_progress", data);
    });

    this.socket.on("task_success", (data: unknown) => {
      this.emitToHandlers("task_success", data);
    });

    this.socket.on("task_failure", (data: unknown) => {
      this.emitToHandlers("task_failure", data);
    });

    // Frappe msgprint (server-side messages)
    this.socket.on("msgprint", (data: unknown) => {
      this.emitToHandlers("msgprint", data);
    });

    // Server-side eval_js (usually for UI updates)
    this.socket.on("eval_js", (data: unknown) => {
      this.emitToHandlers("eval_js", data);
    });
  }

  // ==========================================================================
  // Document Subscriptions
  // ==========================================================================

  /**
   * Subscribe to document changes
   * Joins the Frappe room for a specific document
   */
  subscribeToDoc(
    doctype: string,
    docname: string,
    handler: RealtimeEventHandler<DocUpdateEvent>
  ): Subscription {
    const roomKey = `${doctype}:${docname}`;

    // Add handler to the subscription map
    if (!this.docSubscriptions.has(roomKey)) {
      this.docSubscriptions.set(roomKey, new Set());
    }
    this.docSubscriptions.get(roomKey)!.add(handler);

    // Join the Frappe room for this document
    if (this.socket?.connected) {
      this.joinDocRoom(doctype, docname);
    }

    return {
      unsubscribe: () => {
        const handlers = this.docSubscriptions.get(roomKey);
        if (handlers) {
          handlers.delete(handler);
          if (handlers.size === 0) {
            this.docSubscriptions.delete(roomKey);
            if (this.socket?.connected) {
              this.leaveDocRoom(doctype, docname);
            }
          }
        }
      },
    };
  }

  /**
   * Subscribe to list changes for a doctype
   */
  subscribeToList(
    doctype: string,
    handler: RealtimeEventHandler<ListUpdateEvent>
  ): Subscription {
    // Add handler to the subscription map
    if (!this.listSubscriptions.has(doctype)) {
      this.listSubscriptions.set(doctype, new Set());
    }
    this.listSubscriptions.get(doctype)!.add(handler);

    // Join the Frappe room for this doctype's list
    if (this.socket?.connected) {
      this.joinListRoom(doctype);
    }

    return {
      unsubscribe: () => {
        const handlers = this.listSubscriptions.get(doctype);
        if (handlers) {
          handlers.delete(handler);
          if (handlers.size === 0) {
            this.listSubscriptions.delete(doctype);
            if (this.socket?.connected) {
              this.leaveListRoom(doctype);
            }
          }
        }
      },
    };
  }

  // ==========================================================================
  // Event Subscriptions
  // ==========================================================================

  /**
   * Subscribe to a specific event type
   */
  on<T = RealtimeEventData>(
    event: RealtimeEventType | string,
    handler: RealtimeEventHandler<T>
  ): Subscription {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler as RealtimeEventHandler);

    return {
      unsubscribe: () => {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
          handlers.delete(handler as RealtimeEventHandler);
          if (handlers.size === 0) {
            this.eventHandlers.delete(event);
          }
        }
      },
    };
  }

  /**
   * Emit an event to the server
   */
  emit(event: string, data?: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn("[Realtime] Cannot emit - not connected");
    }
  }

  // ==========================================================================
  // Room Management
  // ==========================================================================

  private joinDocRoom(doctype: string, docname: string): void {
    // Frappe room format: "doctype:docname"
    const room = `${doctype}:${docname}`;
    this.socket?.emit("doctype_subscribe", doctype);
    this.socket?.emit("doc_subscribe", room);
    console.log("[Realtime] Joined doc room:", room);
  }

  private leaveDocRoom(doctype: string, docname: string): void {
    const room = `${doctype}:${docname}`;
    this.socket?.emit("doc_unsubscribe", room);
    console.log("[Realtime] Left doc room:", room);
  }

  private joinListRoom(doctype: string): void {
    // Subscribe to doctype for list updates
    this.socket?.emit("doctype_subscribe", doctype);
    console.log("[Realtime] Joined list room:", doctype);
  }

  private leaveListRoom(doctype: string): void {
    // Only unsubscribe if no doc subscriptions for this doctype
    const hasDocSubs = Array.from(this.docSubscriptions.keys()).some((key) =>
      key.startsWith(`${doctype}:`)
    );
    if (!hasDocSubs) {
      this.socket?.emit("doctype_unsubscribe", doctype);
      console.log("[Realtime] Left list room:", doctype);
    }
  }

  private resubscribeToRooms(): void {
    // Resubscribe to all document rooms
    for (const roomKey of this.docSubscriptions.keys()) {
      const [doctype, docname] = roomKey.split(":");
      if (doctype && docname) {
        this.joinDocRoom(doctype, docname);
      }
    }

    // Resubscribe to all list rooms
    for (const doctype of this.listSubscriptions.keys()) {
      this.joinListRoom(doctype);
    }
  }

  // ==========================================================================
  // Event Handling
  // ==========================================================================

  private handleDocUpdate(data: DocUpdateEvent): void {
    const roomKey = `${data.doctype}:${data.name}`;
    const handlers = this.docSubscriptions.get(roomKey);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }

    // Also emit to general doc_update listeners
    this.emitToHandlers("doc_update", data);
  }

  private handleListUpdate(data: ListUpdateEvent): void {
    const handlers = this.listSubscriptions.get(data.doctype);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }

    // Also emit to general list_update listeners
    this.emitToHandlers("list_update", data);
  }

  private emitToHandlers(event: string, data: RealtimeEventData): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/**
 * Global realtime client instance
 */
export const realtimeClient = new RealtimeClient();

/**
 * Get the default Frappe URL from environment or fallback
 */
export function getDefaultFrappeUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_FRAPPE_URL || "http://kairos.localhost:8000";
  }
  return "http://kairos.localhost:8000";
}
