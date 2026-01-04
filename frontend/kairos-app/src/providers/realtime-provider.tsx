/**
 * Realtime Provider
 *
 * React context provider for Frappe realtime (Socket.io) connection.
 * Manages the lifecycle of the realtime client and provides hooks access.
 */

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import {
  realtimeClient,
  getDefaultFrappeUrl,
  type RealtimeConfig,
} from "@/lib/realtime";

// ============================================================================
// Types
// ============================================================================

interface RealtimeContextValue {
  /** The realtime client instance */
  client: typeof realtimeClient | null;
  /** Whether the client is connected */
  isConnected: boolean;
  /** Whether the client is currently connecting */
  isConnecting: boolean;
  /** Connection error, if any */
  error: Error | null;
  /** Manually connect to the server */
  connect: () => Promise<void>;
  /** Disconnect from the server */
  disconnect: () => void;
}

interface RealtimeProviderProps {
  children: ReactNode;
  /** Custom Frappe URL (defaults to NEXT_PUBLIC_FRAPPE_URL or kairos.localhost:8000) */
  url?: string;
  /** Whether to connect automatically on mount */
  autoConnect?: boolean;
  /** Whether to enable realtime (set to false to disable entirely) */
  enabled?: boolean;
}

// ============================================================================
// Context
// ============================================================================

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

/**
 * Provider component for Frappe realtime functionality
 *
 * @example
 * ```tsx
 * // In your layout or app root:
 * <RealtimeProvider url="http://kairos.localhost:8000" autoConnect>
 *   <App />
 * </RealtimeProvider>
 * ```
 */
export function RealtimeProvider({
  children,
  url,
  autoConnect = true,
  enabled = true,
}: RealtimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the client
  useEffect(() => {
    if (!enabled) return;

    const frappeUrl = url || getDefaultFrappeUrl();
    
    const config: RealtimeConfig = {
      url: frappeUrl,
      autoConnect: false, // We'll handle connection manually
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    };

    realtimeClient.init(config);
    setIsInitialized(true);

    return () => {
      realtimeClient.disconnect();
      setIsConnected(false);
    };
  }, [url, enabled]);

  // Handle connection
  const connect = useCallback(async () => {
    if (!enabled || !isInitialized) return;

    setIsConnecting(true);
    setError(null);

    try {
      await realtimeClient.connect();
      setIsConnected(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("[RealtimeProvider] Connection failed:", error);
    } finally {
      setIsConnecting(false);
    }
  }, [enabled, isInitialized]);

  // Handle disconnection
  const disconnect = useCallback(() => {
    realtimeClient.disconnect();
    setIsConnected(false);
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && enabled && isInitialized && !isConnected && !isConnecting) {
      connect();
    }
  }, [autoConnect, enabled, isInitialized, isConnected, isConnecting, connect]);

  // Listen for connection state changes
  useEffect(() => {
    if (!enabled || !isInitialized) return;

    const socket = realtimeClient.getSocket();
    if (!socket) return;

    const handleConnect = () => {
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleError = (err: Error) => {
      setError(err);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleError);
    };
  }, [enabled, isInitialized]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<RealtimeContextValue>(
    () => ({
      client: enabled ? realtimeClient : null,
      isConnected,
      isConnecting,
      error,
      connect,
      disconnect,
    }),
    [enabled, isConnected, isConnecting, error, connect, disconnect]
  );

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access the realtime context
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { client, isConnected, connect, disconnect } = useRealtime();
 *
 *   if (!isConnected) {
 *     return <button onClick={connect}>Connect to Realtime</button>;
 *   }
 *
 *   return <div>Connected!</div>;
 * }
 * ```
 */
export function useRealtime(): RealtimeContextValue {
  const context = useContext(RealtimeContext);

  if (!context) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }

  return context;
}

// ============================================================================
// Optional: Conditional Provider
// ============================================================================

/**
 * A provider that only enables realtime for authenticated users
 * Wraps RealtimeProvider with authentication check
 */
export function AuthenticatedRealtimeProvider({
  children,
  ...props
}: Omit<RealtimeProviderProps, "enabled">) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated (has session)
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        // Check for Frappe session cookie or local storage auth
        const hasSession = document.cookie.includes("sid=");
        const hasUserInfo = localStorage.getItem("kairos_user");
        setIsAuthenticated(hasSession || !!hasUserInfo);
      }
    };

    checkAuth();

    // Re-check on storage changes (login/logout)
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  return (
    <RealtimeProvider {...props} enabled={isAuthenticated}>
      {children}
    </RealtimeProvider>
  );
}
