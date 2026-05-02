"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, CheckCheck, Loader2 } from 'lucide-react';
import { useNotifications } from '@/features/notifications/useNotifications';
import type { NotificationItem, NotificationReadStatus } from '@/types/notification.types';

interface NotificationsCenterProps {
  title: string;
}

const STATUS_OPTIONS: Array<{ value: NotificationReadStatus; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'UNREAD', label: 'Unread' },
  { value: 'READ', label: 'Read' },
];

export default function NotificationsCenter({ title }: NotificationsCenterProps) {
  const router = useRouter();
  const {
    items,
    pagination,
    unreadCount,
    query,
    isLoading,
    isRefreshing,
    isMarking,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useNotifications();

  const [status, setStatus] = useState<NotificationReadStatus>(query.status ?? 'ALL');

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
        // Still navigate even if marking as read fails.
      }
    }

    router.push(actionUrl);
  };

  useEffect(() => {
    void fetchNotifications({ page: 1, status });
    void fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount, status]);

  const goToPage = (page: number) => {
    void fetchNotifications({ page, status });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{unreadCount} unread notifications</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1 rounded-xl bg-gray-100 inline-flex">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  status === option.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void markAllNotificationsRead()}
            disabled={isMarking || unreadCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {isMarking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
            Mark all as read
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {(isLoading || isRefreshing) && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading notifications...
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <p className="px-5 py-10 text-sm text-gray-500 text-center">No notifications found.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((notification) => (
              <li
                key={notification.id}
                className={`px-5 py-4 transition-colors ${
                  getNotificationActionUrl(notification)
                    ? 'cursor-pointer hover:bg-blue-50/60'
                    : notification.isRead
                      ? 'bg-white'
                      : 'bg-blue-50/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 h-2.5 w-2.5 rounded-full ${notification.isRead ? 'bg-gray-300' : 'bg-blue-500'}`} />
                  {getNotificationActionUrl(notification) ? (
                    <button
                      type="button"
                      onClick={() => void handleOpenNotification(notification)}
                      className="flex-1 min-w-0 text-left rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                      title="Open related item"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{notification.title}</p>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 shrink-0">
                          Open
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5 wrap-break-word">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </button>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{notification.title}</p>
                      <p className="text-sm text-gray-600 mt-0.5 wrap-break-word">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {!notification.isRead && (
                    <button
                      type="button"
                      onClick={() => void markNotificationRead(notification.id)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Page {pagination.page} of {pagination.totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(Math.max(1, pagination.page - 1))}
            disabled={!pagination.hasPreviousPage || isRefreshing}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => goToPage(pagination.page + 1)}
            disabled={!pagination.hasNextPage || isRefreshing}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
