/**
 * Activity Icon Component
 *
 * Displays appropriate icons for different timeline activity types
 */

"use client";

import { TimelineItemType } from "@/types/timeline";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Pencil,
  Plus,
  UserPlus,
  Share2,
  Paperclip,
  Mail,
  GitBranch,
  Heart,
  Info,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface ActivityIconProps {
  type: TimelineItemType;
  className?: string;
  size?: "sm" | "md" | "lg";
}

// ============================================================================
// Icon Configuration
// ============================================================================

const iconConfig: Record<
  TimelineItemType,
  {
    icon: React.ComponentType<{ className?: string }>;
    bgColor: string;
    iconColor: string;
  }
> = {
  Comment: {
    icon: MessageSquare,
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  Edit: {
    icon: Pencil,
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  Creation: {
    icon: Plus,
    bgColor: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
  },
  Assignment: {
    icon: UserPlus,
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  Share: {
    icon: Share2,
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  Attachment: {
    icon: Paperclip,
    bgColor: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-600 dark:text-slate-400",
  },
  Email: {
    icon: Mail,
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
  Workflow: {
    icon: GitBranch,
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  Like: {
    icon: Heart,
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
    iconColor: "text-pink-600 dark:text-pink-400",
  },
  Info: {
    icon: Info,
    bgColor: "bg-gray-100 dark:bg-gray-800",
    iconColor: "text-gray-600 dark:text-gray-400",
  },
};

const sizeClasses = {
  sm: {
    container: "h-6 w-6",
    icon: "h-3 w-3",
  },
  md: {
    container: "h-8 w-8",
    icon: "h-4 w-4",
  },
  lg: {
    container: "h-10 w-10",
    icon: "h-5 w-5",
  },
};

// ============================================================================
// Component
// ============================================================================

export function ActivityIcon({
  type,
  className,
  size = "md",
}: ActivityIconProps) {
  const config = iconConfig[type] || iconConfig.Info;
  const Icon = config.icon;
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full",
        config.bgColor,
        sizes.container,
        className
      )}
    >
      <Icon className={cn(config.iconColor, sizes.icon)} />
    </div>
  );
}

export default ActivityIcon;
