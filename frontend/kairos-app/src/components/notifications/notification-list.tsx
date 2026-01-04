/**
 * NotificationList Component
 *
 * Displays a list of notifications with loading and empty states
 */

"use client";

import { CheckCheck, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { NotificationItem } from "./notification-item";
import { Notification } from "@/hooks/use-notifications";

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  error: Error | null;
  onNotificationClick: (notification: Notification) => void;
  onMarkAllAsRead: () => void;
  onRefresh: () => void;
  unreadCount: number;
}

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3">
      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function NotificationList({
  notifications,
  loading,
  error,
  onNotificationClick,
  onMarkAllAsRead,
  onRefresh,
  unreadCount,
}: NotificationListProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <p className="text-sm text-destructive mb-2">
          Failed to load notifications
        </p>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">Notifications</h3>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="h-8 text-xs"
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRefresh}
            className={cn(loading && "animate-spin")}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh notifications</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="h-[400px]">
        {loading && notifications.length === 0 ? (
          <div className="p-2 space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <NotificationSkeleton key={i} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <CheckCheck className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">
              You have no notifications at the moment.
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {notifications.map((notification, index) => (
              <div key={notification.name}>
                <NotificationItem
                  notification={notification}
                  onClick={onNotificationClick}
                />
                {index < notifications.length - 1 && (
                  <Separator className="my-1" />
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
