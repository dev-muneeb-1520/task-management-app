"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useNotifications } from '@/features/notifications/useNotifications';
import type { NotificationItem } from '@/types/notification.types';

interface NotificationsBellProps {
  notificationsPath: string;
}

export default function NotificationsBell({ notificationsPath }: NotificationsBellProps) {
  const router = useRouter();
  const {
    items,
    unreadCount,
    isMarking,
    fetchNotifications,
    fetchUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const recent = useMemo(() => items.slice(0, 6), [items]);

  const getNotificationActionUrl = (notification: NotificationItem) => {
    if (notification.actionUrl) return notification.actionUrl;

    // Backward compatibility for older TASK notifications created before deep-link actionUrl support.
    if (notification.entityType === 'TASK' && notification.entityId) {
      return `/dashboard/tasks?taskId=${encodeURIComponent(notification.entityId)}`;
    }

    return null;
  };

  const handleOpenNotification = async (notification: NotificationItem) => {
    const actionUrl = getNotificationActionUrl(notification);
    if (!actionUrl) return;

    if (!notification.isRead) {
      try {
        await markNotificationRead(notification.id);
      } catch {
        // Navigation should still proceed even if marking read fails.
      }
    }

    setOpen(false);
    router.push(actionUrl);
  };

  useEffect(() => {
    void fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!open) return;
    void fetchNotifications({ page: 1, limit: 6 });
  }, [fetchNotifications, open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative h-10 w-10 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
        aria-label="Open notifications"
      >
        <Bell className="h-5 w-5 mx-auto" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white shadow-2xl z-50 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void markAllNotificationsRead()}
                disabled={isMarking || unreadCount === 0}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-40"
              >
                {isMarking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                Mark all
              </button>
              <Link
                href={notificationsPath}
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                View all
              </Link>
            </div>
          </div>

          {recent.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500">No notifications yet.</p>
          ) : (
            <ul className="max-h-80 overflow-auto divide-y divide-gray-100">
              {recent.map((notification) => (
                <li
                  key={notification.id}
                  className={`px-4 py-3 transition-colors ${
                    getNotificationActionUrl(notification)
                      ? 'cursor-pointer hover:bg-blue-50/60'
                      : notification.isRead
                        ? 'bg-white'
                        : 'bg-blue-50/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 rounded-full ${notification.isRead ? 'bg-gray-300' : 'bg-blue-500'}`} />
                    {getNotificationActionUrl(notification) ? (
                      <button
                        type="button"
                        onClick={() => void handleOpenNotification(notification)}
                        className="flex-1 min-w-0 text-left rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                        title="Open related item"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">{notification.title}</p>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 shrink-0">
                            Open
                            <ArrowUpRight className="h-3 w-3" />
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 wrap-break-word">{notification.message}</p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </button>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{notification.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5 wrap-break-word">{notification.message}</p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={() => void markNotificationRead(notification.id)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
