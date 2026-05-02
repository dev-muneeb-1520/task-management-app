import apiClient from '@/lib/apiClient';
import type {
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
  NotificationItem,
  NotificationListQuery,
  NotificationListResponse,
  NotificationUnreadCountResponse,
} from '@/types/notification.types';

const buildQueryParams = (query?: NotificationListQuery) => {
  if (!query) return undefined;
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== '')
  );
};

export const notificationService = {
  getAll: async (query?: NotificationListQuery): Promise<NotificationListResponse> => {
    const { data } = await apiClient.get<NotificationListResponse>('/notifications', {
      params: buildQueryParams(query),
    });
    return data;
  },

  getUnreadCount: async (): Promise<NotificationUnreadCountResponse> => {
    const { data } = await apiClient.get<NotificationUnreadCountResponse>(
      '/notifications/unread-count'
    );
    return data;
  },

  markAsRead: async (id: string): Promise<MarkNotificationReadResponse> => {
    const { data } = await apiClient.patch<MarkNotificationReadResponse>(
      `/notifications/${id}/read`
    );
    return data;
  },

  markAllAsRead: async (): Promise<MarkAllNotificationsReadResponse> => {
    const { data } = await apiClient.patch<MarkAllNotificationsReadResponse>(
      '/notifications/read-all'
    );
    return data;
  },

  normalizeIncoming: (payload: unknown): NotificationItem | null => {
    if (!payload || typeof payload !== 'object') return null;

    const candidate = payload as Partial<NotificationItem>;
    if (!candidate.id || !candidate.title || !candidate.message || !candidate.type || !candidate.createdAt) {
      return null;
    }

    return {
      id: candidate.id,
      title: candidate.title,
      message: candidate.message,
      type: candidate.type,
      recipientUserId: candidate.recipientUserId ?? '',
      entityType: candidate.entityType ?? null,
      entityId: candidate.entityId ?? null,
      actionUrl: candidate.actionUrl ?? null,
      metadata: (candidate.metadata as Record<string, unknown> | null | undefined) ?? null,
      isRead: candidate.isRead ?? false,
      readAt: candidate.readAt ?? null,
      createdAt: candidate.createdAt,
    };
  },
};
