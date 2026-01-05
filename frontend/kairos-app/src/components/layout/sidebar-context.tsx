"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = "kairos_sidebar";
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 256;
const COLLAPSED_WIDTH = 0;

// ============================================================================
// Types
// ============================================================================

interface SidebarState {
  width: number;
  isCollapsed: boolean;
}

interface SidebarContextValue {
  width: number;
  isCollapsed: boolean;
  isResizing: boolean;
  minWidth: number;
  maxWidth: number;
  collapse: () => void;
  expand: () => void;
  toggle: () => void;
  setWidth: (width: number) => void;
  startResizing: () => void;
  stopResizing: () => void;
}

// ============================================================================
// Context
// ============================================================================

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

interface SidebarProviderProps {
  children: ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [width, setWidthState] = useState(DEFAULT_WIDTH);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: SidebarState = JSON.parse(stored);
        setWidthState(state.width);
        setIsCollapsed(state.isCollapsed);
      }
    } catch {
      // Ignore errors
    }
    setIsHydrated(true);
  }, []);

  // Save state to localStorage
  const saveState = useCallback((newWidth: number, collapsed: boolean) => {
    try {
      const state: SidebarState = { width: newWidth, isCollapsed: collapsed };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore errors
    }
  }, []);

  const collapse = useCallback(() => {
    setIsCollapsed(true);
    saveState(width, true);
  }, [width, saveState]);

  const expand = useCallback(() => {
    setIsCollapsed(false);
    saveState(width, false);
  }, [width, saveState]);

  const toggle = useCallback(() => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    saveState(width, newCollapsed);
  }, [isCollapsed, width, saveState]);

  const setWidth = useCallback(
    (newWidth: number) => {
      const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
      setWidthState(clampedWidth);
      saveState(clampedWidth, isCollapsed);
    },
    [isCollapsed, saveState]
  );

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Don't render children until hydrated to avoid layout shift
  if (!isHydrated) {
    return null;
  }

  return (
    <SidebarContext.Provider
      value={{
        width: isCollapsed ? COLLAPSED_WIDTH : width,
        isCollapsed,
        isResizing,
        minWidth: MIN_WIDTH,
        maxWidth: MAX_WIDTH,
        collapse,
        expand,
        toggle,
        setWidth,
        startResizing,
        stopResizing,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
