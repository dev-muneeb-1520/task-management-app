import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearNotificationsError,
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from './notificationsSlice';
import type { NotificationListQuery } from '@/types/notification.types';

export function useNotifications() {
  const dispatch = useAppDispatch();
  const state = useAppSelector((root) => root.notifications);

  return {
    ...state,
    fetchNotifications: useCallback(
      (query?: NotificationListQuery) => dispatch(fetchNotifications(query)).unwrap(),
      [dispatch]
    ),
    fetchUnreadCount: useCallback(
      () => dispatch(fetchUnreadCount()).unwrap(),
      [dispatch]
    ),
    markNotificationRead: useCallback(
      (id: string) => dispatch(markNotificationRead(id)).unwrap(),
      [dispatch]
    ),
    markAllNotificationsRead: useCallback(
      () => dispatch(markAllNotificationsRead()).unwrap(),
      [dispatch]
    ),
    clearError: useCallback(() => dispatch(clearNotificationsError()), [dispatch]),
  };
}
