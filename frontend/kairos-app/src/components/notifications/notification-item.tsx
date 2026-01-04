/**
 * NotificationItem Component
 *
 * Displays a single notification with appropriate icon and styling
 */

"use client";

import { formatDistanceToNow } from "date-fns";
import {
  UserPlus,
  Share2,
  AtSign,
  AlertCircle,
  Zap,
  Bell,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Notification, NotificationType } from "@/hooks/use-notifications";

interface NotificationItemProps {
  notification: Notification;
  onClick?: (notification: Notification) => void;
}

const notificationIcons: Record<NotificationType, React.ElementType> = {
  Assignment: UserPlus,
  Share: Share2,
  Mention: AtSign,
  Alert: AlertCircle,
  "Energy Point": Zap,
};

const notificationColors: Record<NotificationType, string> = {
  Assignment: "text-blue-500 bg-blue-50 dark:bg-blue-950",
  Share: "text-green-500 bg-green-50 dark:bg-green-950",
  Mention: "text-purple-500 bg-purple-50 dark:bg-purple-950",
  Alert: "text-orange-500 bg-orange-50 dark:bg-orange-950",
  "Energy Point": "text-yellow-500 bg-yellow-50 dark:bg-yellow-950",
};

export function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const Icon = notificationIcons[notification.type] || Bell;
  const colorClass = notificationColors[notification.type] || "text-muted-foreground bg-muted";
  const isUnread = notification.read === 0;

  const timeAgo = formatDistanceToNow(new Date(notification.creation), {
    addSuffix: true,
  });

  const handleClick = () => {
    onClick?.(notification);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-accent rounded-md",
        isUnread && "bg-accent/50"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          colorClass
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-sm line-clamp-2",
              isUnread ? "font-medium" : "font-normal text-muted-foreground"
            )}
          >
            {notification.subject}
          </p>
          {isUnread && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{notification.type}</span>
          <span>-</span>
          <span>{timeAgo}</span>
        </div>
        {notification.document_type && notification.document_name && (
          <p className="text-xs text-muted-foreground truncate">
            {notification.document_type}: {notification.document_name}
          </p>
        )}
      </div>
    </button>
  );
}
