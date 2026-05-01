import apiClient from '@/lib/apiClient';
import type {
  AdminPlatformStats,
  AdminUserListResponse,
  AdminUserDetail,
  AssignmentUser,
  UpdateUserStatusDto,
  UpdateUserRoleDto,
  AdminGetUsersQuery,
  AdminUser,
} from '@/types/admin.types';

const buildQueryParams = (query?: AdminGetUsersQuery) => {
  if (!query) return undefined;
  return Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== '')
  );
};

export const adminService = {
  getStats: async (): Promise<AdminPlatformStats> => {
    const { data } = await apiClient.get<AdminPlatformStats>('/admin/stats');
    return data;
  },

  getUsers: async (query?: AdminGetUsersQuery): Promise<AdminUserListResponse> => {
    const { data } = await apiClient.get<AdminUserListResponse>('/admin/users', {
      params: buildQueryParams(query),
    });
    return data;
  },

  getAllUsersForAssignment: async (): Promise<AssignmentUser[]> => {
    const { data } = await apiClient.get<AssignmentUser[]>('/admin/users/all');
    return data;
  },

  getUserById: async (id: string): Promise<AdminUserDetail> => {
    const { data } = await apiClient.get<AdminUserDetail>(`/admin/users/${id}`);
    return data;
  },

  updateUserStatus: async (id: string, dto: UpdateUserStatusDto): Promise<AdminUser> => {
    const { data } = await apiClient.patch<AdminUser>(`/admin/users/${id}/status`, dto);
    return data;
  },

  updateUserRole: async (id: string, dto: UpdateUserRoleDto): Promise<AdminUser> => {
    const { data } = await apiClient.patch<AdminUser>(`/admin/users/${id}/role`, dto);
    return data;
  },
};
