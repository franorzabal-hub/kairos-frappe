/**
 * NotificationBell Component
 *
 * Bell icon button with unread count badge that opens notification popover
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationList } from "./notification-list";
import { useNotifications, Notification } from "@/hooks/use-notifications";
import { doctypeToSlug } from "@/lib/utils";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications();

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (notification.read === 0) {
      await markAsRead(notification.name);
    }

    // Navigate to the related document if available
    if (notification.document_type && notification.document_name) {
      const slug = doctypeToSlug(notification.document_type);
      router.push("/" + slug + "/" + notification.document_name);
      setOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const ariaLabel = unreadCount > 0
    ? "Notifications (" + unreadCount + " unread)"
    : "Notifications";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label={ariaLabel}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] font-bold"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[380px] p-0"
        align="end"
        sideOffset={8}
      >
        <NotificationList
          notifications={notifications}
          loading={loading}
          error={error}
          onNotificationClick={handleNotificationClick}
          onMarkAllAsRead={handleMarkAllAsRead}
          onRefresh={refresh}
          unreadCount={unreadCount}
        />
      </PopoverContent>
    </Popover>
  );
}
