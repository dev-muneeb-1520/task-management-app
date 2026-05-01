import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminService } from '@/services/adminService';
import { toast } from '@/lib/toast';
import type {
  AdminPlatformStats,
  AdminUser,
  AdminUserDetail,
  AdminUserListResponse,
  AssignmentUser,
  UpdateUserStatusDto,
  UpdateUserRoleDto,
  AdminGetUsersQuery,
} from '@/types/admin.types';

interface AdminState {
  stats: AdminPlatformStats | null;
  users: AdminUser[];
  userDetail: AdminUserDetail | null;
  assignmentUsers: AssignmentUser[];
  pagination: AdminUserListResponse['pagination'] | null;
  query: AdminGetUsersQuery;
  isStatsLoading: boolean;
  isUsersLoading: boolean;
  isDetailLoading: boolean;
  isAssignmentLoading: boolean;
  isMutating: boolean;
  error: string | null;
}

const initialState: AdminState = {
  stats: null,
  users: [],
  userDetail: null,
  assignmentUsers: [],
  pagination: null,
  query: { page: 1, limit: 10 },
  isStatsLoading: false,
  isUsersLoading: false,
  isDetailLoading: false,
  isAssignmentLoading: false,
  isMutating: false,
  error: null,
};

const getErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as { response?: { data?: { message?: string | string[] } }; message?: string };
  const msg = e.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  return msg ?? e.message ?? fallback;
};

export const fetchAdminStats = createAsyncThunk(
  'admin/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      return await adminService.getStats();
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Failed to load stats'));
    }
  }
);

export const fetchAdminUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (query: AdminGetUsersQuery | undefined, { rejectWithValue }) => {
    try {
      return await adminService.getUsers(query);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Failed to load users'));
    }
  }
);

export const fetchAdminUserById = createAsyncThunk(
  'admin/fetchUserById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await adminService.getUserById(id);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Failed to load user'));
    }
  }
);

export const fetchAssignmentUsers = createAsyncThunk(
  'admin/fetchAssignmentUsers',
  async (_, { rejectWithValue }) => {
    try {
      return await adminService.getAllUsersForAssignment();
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Failed to load users for assignment'));
    }
  }
);

export const updateAdminUserStatus = createAsyncThunk(
  'admin/updateUserStatus',
  async ({ id, dto }: { id: string; dto: UpdateUserStatusDto }, { rejectWithValue }) => {
    try {
      return await adminService.updateUserStatus(id, dto);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Failed to update user status'));
    }
  }
);

export const updateAdminUserRole = createAsyncThunk(
  'admin/updateUserRole',
  async ({ id, dto }: { id: string; dto: UpdateUserRoleDto }, { rejectWithValue }) => {
    try {
      return await adminService.updateUserRole(id, dto);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Failed to update user role'));
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError(state) {
      state.error = null;
    },
    clearUserDetail(state) {
      state.userDetail = null;
    },
  },
  extraReducers: (builder) => {
    // stats
    builder
      .addCase(fetchAdminStats.pending, (state) => { state.isStatsLoading = true; state.error = null; })
      .addCase(fetchAdminStats.fulfilled, (state, action) => { state.isStatsLoading = false; state.stats = action.payload; })
      .addCase(fetchAdminStats.rejected, (state, action) => { state.isStatsLoading = false; state.error = action.payload as string; });

    // users list
    builder
      .addCase(fetchAdminUsers.pending, (state) => { state.isUsersLoading = true; state.error = null; })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.isUsersLoading = false;
        state.users = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => { state.isUsersLoading = false; state.error = action.payload as string; });

    // user detail
    builder
      .addCase(fetchAdminUserById.pending, (state) => { state.isDetailLoading = true; state.error = null; })
      .addCase(fetchAdminUserById.fulfilled, (state, action) => { state.isDetailLoading = false; state.userDetail = action.payload; })
      .addCase(fetchAdminUserById.rejected, (state, action) => { state.isDetailLoading = false; state.error = action.payload as string; });

    // assignment users
    builder
      .addCase(fetchAssignmentUsers.pending, (state) => { state.isAssignmentLoading = true; })
      .addCase(fetchAssignmentUsers.fulfilled, (state, action) => { state.isAssignmentLoading = false; state.assignmentUsers = action.payload; })
      .addCase(fetchAssignmentUsers.rejected, (state) => { state.isAssignmentLoading = false; });

    // status mutation — update in-list user optimistically
    builder
      .addCase(updateAdminUserStatus.pending, (state) => { state.isMutating = true; state.error = null; })
      .addCase(updateAdminUserStatus.fulfilled, (state, action) => {
        state.isMutating = false;
        const idx = state.users.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.users[idx] = { ...state.users[idx], ...action.payload };
        if (state.userDetail?.id === action.payload.id) {
          state.userDetail = { ...state.userDetail, ...action.payload };
        }
        const status = action.payload.isActive ? 'activated' : 'deactivated';
        toast.success(`User account ${status}.`);
      })
      .addCase(updateAdminUserStatus.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.payload as string;
        toast.error(action.payload as string ?? 'Failed to update user status');
      });

    // role mutation
    builder
      .addCase(updateAdminUserRole.pending, (state) => { state.isMutating = true; state.error = null; })
      .addCase(updateAdminUserRole.fulfilled, (state, action) => {
        state.isMutating = false;
        const idx = state.users.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.users[idx] = { ...state.users[idx], ...action.payload };
        if (state.userDetail?.id === action.payload.id) {
          state.userDetail = { ...state.userDetail, ...action.payload };
        }
        toast.success(`User role updated to ${action.payload.role}.`);
      })
      .addCase(updateAdminUserRole.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.payload as string;
        toast.error(action.payload as string ?? 'Failed to update user role');
      });
  },
});

export const { clearAdminError, clearUserDetail } = adminSlice.actions;
export default adminSlice.reducer;
