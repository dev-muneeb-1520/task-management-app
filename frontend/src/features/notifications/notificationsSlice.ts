import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { notificationService } from '@/services/notificationService';
import type { RootState } from '@/store';
import type {
  NotificationItem,
  NotificationListQuery,
  NotificationPagination,
  NotificationReadStatus,
  NotificationType,
} from '@/types/notification.types';

interface NotificationsState {
  items: NotificationItem[];
  pagination: NotificationPagination;
  query: NotificationListQuery;
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  isMarking: boolean;
  error: string | null;
}

const DEFAULT_QUERY: NotificationListQuery = {
  page: 1,
  limit: 20,
  status: 'ALL',
};

const DEFAULT_PAGINATION: NotificationPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

const initialState: NotificationsState = {
  items: [],
  pagination: DEFAULT_PAGINATION,
  query: DEFAULT_QUERY,
  unreadCount: 0,
  isLoading: false,
  isRefreshing: false,
  isMarking: false,
  error: null,
};

const getErrorMessage = (err: unknown, fallback: string) => {
  const error = err as {
    response?: {
      data?: {
        error?: { message?: string | string[] };
        message?: string | string[];
      };
    };
    message?: string;
  };

  const message = error.response?.data?.error?.message ?? error.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message ?? error.message ?? fallback;
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (query: NotificationListQuery | undefined, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const nextQuery = { ...state.notifications.query, ...query };
      return await notificationService.getAll(nextQuery);
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, 'Failed to fetch notifications'));
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      return await notificationService.getUnreadCount();
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, 'Failed to fetch unread count'));
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (id: string, { rejectWithValue }) => {
    try {
      return await notificationService.markAsRead(id);
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, 'Failed to mark notification as read'));
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      return await notificationService.markAllAsRead();
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, 'Failed to mark all notifications as read'));
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotificationsError(state) {
      state.error = null;
    },
    resetNotificationsState() {
      return initialState;
    },
    prependIncomingNotification(state, action: { payload: NotificationItem }) {
      const incoming = action.payload;
      const exists = state.items.some((item) => item.id === incoming.id);
      if (!exists) {
        state.items = [incoming, ...state.items];
        state.pagination.total += 1;
      }
      if (!incoming.isRead) {
        state.unreadCount += 1;
      }
    },
    updateNotificationReadState(
      state,
      action: { payload: { id: string; isRead: boolean; readAt?: string | null } }
    ) {
      const target = state.items.find((item) => item.id === action.payload.id);
      if (!target) return;

      const wasRead = target.isRead;
      target.isRead = action.payload.isRead;
      target.readAt = action.payload.readAt ?? null;

      if (!wasRead && target.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    setUnreadCount(state, action: { payload: number }) {
      state.unreadCount = Math.max(0, action.payload);
    },
    setNotificationFilter(
      state,
      action: { payload: { status?: NotificationReadStatus; type?: NotificationType } }
    ) {
      state.query = {
        ...state.query,
        page: 1,
        status: action.payload.status ?? state.query.status,
        type: action.payload.type,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state, action) => {
        state.isLoading = state.items.length === 0;
        state.isRefreshing = state.items.length > 0;
        state.error = null;
        state.query = {
          ...state.query,
          ...action.meta.arg,
        };
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(markNotificationRead.pending, (state) => {
        state.isMarking = true;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        state.isMarking = false;
        const target = state.items.find((item) => item.id === action.payload.id);
        if (target) {
          target.isRead = true;
          target.readAt = action.payload.readAt ?? null;
        }
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(markNotificationRead.rejected, (state, action) => {
        state.isMarking = false;
        state.error = action.payload as string;
      })
      .addCase(markAllNotificationsRead.pending, (state) => {
        state.isMarking = true;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state, action) => {
        state.isMarking = false;
        state.items = state.items.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt ?? new Date().toISOString(),
        }));
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(markAllNotificationsRead.rejected, (state, action) => {
        state.isMarking = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearNotificationsError,
  resetNotificationsState,
  prependIncomingNotification,
  updateNotificationReadState,
  setUnreadCount,
  setNotificationFilter,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
