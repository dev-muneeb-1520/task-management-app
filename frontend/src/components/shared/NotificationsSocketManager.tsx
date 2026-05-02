"use client";

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { authTokenStorage } from '@/lib/authTokens';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchNotifications,
  fetchUnreadCount,
  prependIncomingNotification,
  setUnreadCount,
  updateNotificationReadState,
} from '@/features/notifications/notificationsSlice';
import { notificationService } from '@/services/notificationService';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/+$/, '');

export default function NotificationsSocketManager() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;

    const accessToken = authTokenStorage.getAccessToken();
    if (!accessToken) return;

    const socket = io(`${API_BASE_URL}/notifications`, {
      transports: ['websocket'],
      auth: { token: accessToken },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      void dispatch(fetchUnreadCount());
      void dispatch(fetchNotifications({ page: 1, limit: 20 }));
    });

    socket.on('notification:new', (payload: unknown) => {
      const incoming = notificationService.normalizeIncoming(payload);
      if (!incoming) return;
      dispatch(prependIncomingNotification(incoming));
    });

    socket.on('notification:updated', (payload: unknown) => {
      if (!payload || typeof payload !== 'object') return;
      const candidate = payload as { id?: string; isRead?: boolean; readAt?: string | null };
      if (!candidate.id || candidate.isRead === undefined) return;

      dispatch(
        updateNotificationReadState({
          id: candidate.id,
          isRead: candidate.isRead,
          readAt: candidate.readAt ?? null,
        })
      );
    });

    socket.on('notifications:read-all', () => {
      dispatch(setUnreadCount(0));
      void dispatch(fetchNotifications({ page: 1 }));
    });

    socket.on('notifications:unread-count', (payload: unknown) => {
      if (!payload || typeof payload !== 'object') return;
      const unreadCount = (payload as { unreadCount?: number }).unreadCount;
      if (typeof unreadCount !== 'number') return;
      dispatch(setUnreadCount(unreadCount));
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [dispatch, isAuthenticated, isInitialized]);

  return null;
}
