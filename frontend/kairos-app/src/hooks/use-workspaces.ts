/**
 * useWorkspaces Hook
 *
 * Fetches workspace sidebar items from Frappe API
 * Returns workspaces organized for sidebar navigation
 */

"use client";

import { useMemo } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Workspace shortcut/link item
 */
export interface WorkspaceShortcut {
  name: string;
  label: string;
  link_type: "DocType" | "Report" | "Page" | "URL";
  link_to: string;
  type?: "Link" | "Card Break" | "Shortcut" | "Spacer";
  icon?: string;
  color?: string;
  description?: string;
  restrict_to_domain?: string;
  onboard?: 0 | 1;
  only_for?: string;
  hidden?: 0 | 1;
}

/**
 * Workspace page data from Frappe
 */
export interface WorkspacePage {
  name: string;
  title: string;
  icon?: string;
  module?: string;
  parent_page?: string;
  public?: 0 | 1;
  is_hidden?: 0 | 1;
  for_user?: string;
  sequence_id?: number;
  shortcuts?: WorkspaceShortcut[];
  links?: WorkspaceShortcut[];
}

/**
 * Response from get_workspace_sidebar_items
 */
interface WorkspaceSidebarResponse {
  pages: WorkspacePage[];
  has_access: boolean;
  has_create_access: boolean;
  workspace_setup_completed: boolean;
}

/**
 * Processed workspace for sidebar display
 */
export interface SidebarWorkspace {
  name: string;
  title: string;
  icon?: string;
  href: string;
  isPublic: boolean;
  module?: string;
  children: SidebarWorkspace[];
}

interface UseWorkspacesResult {
  workspaces: SidebarWorkspace[];
  publicWorkspaces: SidebarWorkspace[];
  privateWorkspaces: SidebarWorkspace[];
  isLoading: boolean;
  error: Error | null;
  hasAccess: boolean;
  hasCreateAccess: boolean;
}

/**
 * Convert Frappe icon name to a CSS-friendly format
 */
function normalizeIconName(icon?: string): string | undefined {
  if (!icon) return undefined;
  // Remove fa-, icon-, octicon- prefixes
  return icon.replace(/^(fa-|icon-|octicon-)/, "");
}

/**
 * Build href for a workspace
 */
function buildWorkspaceHref(workspace: WorkspacePage): string {
  // Use the workspace name as the route
  // Frappe uses /app/workspace-name format
  const slug = workspace.name.toLowerCase().replace(/\s+/g, "-");
  return `/workspace/${slug}`;
}

export function useWorkspaces(): UseWorkspacesResult {
  const { data, error, isLoading } = useFrappeGetCall<{
    message: WorkspaceSidebarResponse;
  }>("frappe.desk.desktop.get_workspace_sidebar_items", {}, "workspaces");

  const response = data?.message;

  // Process workspaces into hierarchical structure
  const { publicWorkspaces, privateWorkspaces, workspaces } = useMemo(() => {
    if (!response?.pages) {
      return { publicWorkspaces: [], privateWorkspaces: [], workspaces: [] };
    }

    const pages = response.pages;

    // Build parent-child relationships
    const pagesByName = new Map<string, WorkspacePage>();
    const childrenByParent = new Map<string, WorkspacePage[]>();

    for (const page of pages) {
      pagesByName.set(page.name, page);
      if (page.parent_page) {
        const children = childrenByParent.get(page.parent_page) || [];
        children.push(page);
        childrenByParent.set(page.parent_page, children);
      }
    }

    // Convert to SidebarWorkspace format
    const toSidebarWorkspace = (page: WorkspacePage): SidebarWorkspace => {
      const children = childrenByParent.get(page.name) || [];
      return {
        name: page.name,
        title: page.title || page.name,
        icon: normalizeIconName(page.icon),
        href: buildWorkspaceHref(page),
        isPublic: page.public === 1,
        module: page.module,
        children: children
          .sort((a, b) => (a.sequence_id ?? 0) - (b.sequence_id ?? 0))
          .map(toSidebarWorkspace),
      };
    };

    // Filter to root-level pages (no parent)
    const rootPages = pages.filter((p) => !p.parent_page && p.is_hidden !== 1);

    // Sort by sequence_id
    rootPages.sort((a, b) => (a.sequence_id ?? 0) - (b.sequence_id ?? 0));

    // Separate public and private
    const publicPages = rootPages.filter((p) => p.public === 1);
    const privatePages = rootPages.filter((p) => p.public !== 1);

    return {
      publicWorkspaces: publicPages.map(toSidebarWorkspace),
      privateWorkspaces: privatePages.map(toSidebarWorkspace),
      workspaces: rootPages.map(toSidebarWorkspace),
    };
  }, [response]);

  return {
    workspaces,
    publicWorkspaces,
    privateWorkspaces,
    isLoading,
    error: error ? new Error(String(error)) : null,
    hasAccess: response?.has_access ?? false,
    hasCreateAccess: response?.has_create_access ?? false,
  };
}

/**
 * Icon mapping from Frappe icon names to Lucide equivalents
 * This is a subset - extend as needed
 */
export const iconMapping: Record<string, string> = {
  home: "Home",
  users: "Users",
  settings: "Settings",
  file: "File",
  folder: "Folder",
  calendar: "Calendar",
  chart: "BarChart",
  "bar-chart": "BarChart",
  mail: "Mail",
  message: "MessageSquare",
  star: "Star",
  heart: "Heart",
  check: "Check",
  "check-circle": "CheckCircle",
  alert: "AlertTriangle",
  info: "Info",
  help: "HelpCircle",
  search: "Search",
  filter: "Filter",
  edit: "Edit",
  trash: "Trash2",
  plus: "Plus",
  minus: "Minus",
  refresh: "RefreshCw",
  download: "Download",
  upload: "Upload",
  link: "Link",
  external: "ExternalLink",
  copy: "Copy",
  clipboard: "Clipboard",
  code: "Code",
  terminal: "Terminal",
  database: "Database",
  server: "Server",
  cloud: "Cloud",
  lock: "Lock",
  unlock: "Unlock",
  key: "Key",
  shield: "Shield",
  eye: "Eye",
  "eye-off": "EyeOff",
  bell: "Bell",
  clock: "Clock",
  timer: "Timer",
  zap: "Zap",
  activity: "Activity",
  trending: "TrendingUp",
  dollar: "DollarSign",
  credit: "CreditCard",
  shopping: "ShoppingCart",
  package: "Package",
  truck: "Truck",
  map: "Map",
  pin: "MapPin",
  globe: "Globe",
  building: "Building2",
  briefcase: "Briefcase",
  tool: "Wrench",
  wrench: "Wrench",
  hammer: "Hammer",
  cpu: "Cpu",
  monitor: "Monitor",
  smartphone: "Smartphone",
  tablet: "Tablet",
  printer: "Printer",
  camera: "Camera",
  image: "Image",
  video: "Video",
  music: "Music",
  headphones: "Headphones",
  mic: "Mic",
  volume: "Volume2",
  play: "Play",
  pause: "Pause",
  stop: "Square",
  skip: "SkipForward",
  book: "Book",
  bookmark: "Bookmark",
  tag: "Tag",
  hash: "Hash",
  at: "AtSign",
  percent: "Percent",
  infinity: "Infinity",
  grid: "Grid",
  list: "List",
  layout: "Layout",
  layers: "Layers",
  box: "Box",
  archive: "Archive",
  inbox: "Inbox",
  send: "Send",
  share: "Share2",
  rss: "Rss",
  wifi: "Wifi",
  bluetooth: "Bluetooth",
  battery: "Battery",
  power: "Power",
  sun: "Sun",
  moon: "Moon",
  thermometer: "Thermometer",
  droplet: "Droplet",
  wind: "Wind",
  umbrella: "Umbrella",
  award: "Award",
  trophy: "Trophy",
  flag: "Flag",
  target: "Target",
  crosshair: "Crosshair",
  compass: "Compass",
  navigation: "Navigation",
  anchor: "Anchor",
  lifebuoy: "LifeBuoy",
  rocket: "Rocket",
  plane: "Plane",
  car: "Car",
  bike: "Bike",
  train: "Train",
  bus: "Bus",
  ship: "Ship",
  coffee: "Coffee",
  beer: "Beer",
  pizza: "Pizza",
  utensils: "Utensils",
  gift: "Gift",
  cake: "Cake",
  flower: "Flower",
  tree: "TreeDeciduous",
  leaf: "Leaf",
  feather: "Feather",
  bug: "Bug",
  skull: "Skull",
  ghost: "Ghost",
  smile: "Smile",
  frown: "Frown",
  meh: "Meh",
  angry: "Angry",
  laugh: "Laugh",
};
