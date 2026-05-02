export type NotificationType =
  | 'USER_REGISTERED'
  | 'USER_STATUS_CHANGED'
  | 'TASK_ASSIGNED'
  | 'TASK_UPDATED'
  | 'TASK_COMPLETED'
  | 'TASK_DUE_SOON'
  | 'TASK_OVERDUE'
  | 'ACCOUNT_STATUS_CHANGED'
  | 'SYSTEM_NOTICE';

export type NotificationReadStatus = 'ALL' | 'READ' | 'UNREAD';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  recipientUserId: string;
  entityType?: string | null;
  entityId?: string | null;
  actionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  pagination: NotificationPagination;
}

export interface NotificationListQuery {
  page?: number;
  limit?: number;
  status?: NotificationReadStatus;
  type?: NotificationType;
}

export interface NotificationUnreadCountResponse {
  unreadCount: number;
}

export interface MarkNotificationReadResponse {
  id: string;
  isRead: boolean;
  readAt?: string | null;
  unreadCount: number;
}

export interface MarkAllNotificationsReadResponse {
  affectedCount: number;
  unreadCount: number;
}
