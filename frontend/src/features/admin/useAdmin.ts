import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchAdminStats,
  fetchAdminUsers,
  fetchAdminUserById,
  fetchAssignmentUsers,
  updateAdminUserStatus,
  updateAdminUserRole,
  clearAdminError,
  clearUserDetail,
} from './adminSlice';
import type { UpdateUserStatusDto, UpdateUserRoleDto, AdminGetUsersQuery } from '@/types/admin.types';

export function useAdmin() {
  const dispatch = useAppDispatch();
  const {
    stats,
    users,
    userDetail,
    assignmentUsers,
    pagination,
    isStatsLoading,
    isUsersLoading,
    isDetailLoading,
    isAssignmentLoading,
    isMutating,
    error,
  } = useAppSelector((state) => state.admin);

  return {
    stats,
    users,
    userDetail,
    assignmentUsers,
    pagination,
    isStatsLoading,
    isUsersLoading,
    isDetailLoading,
    isAssignmentLoading,
    isMutating,
    error,

    fetchStats: useCallback(() => dispatch(fetchAdminStats()).unwrap(), [dispatch]),
    fetchUsers: useCallback(
      (query?: AdminGetUsersQuery) => dispatch(fetchAdminUsers(query)).unwrap(),
      [dispatch]
    ),
    fetchUserById: useCallback(
      (id: string) => dispatch(fetchAdminUserById(id)).unwrap(),
      [dispatch]
    ),
    fetchAssignmentUsers: useCallback(
      () => dispatch(fetchAssignmentUsers()).unwrap(),
      [dispatch]
    ),
    updateUserStatus: useCallback(
      (id: string, dto: UpdateUserStatusDto) =>
        dispatch(updateAdminUserStatus({ id, dto })).unwrap(),
      [dispatch]
    ),
    updateUserRole: useCallback(
      (id: string, dto: UpdateUserRoleDto) =>
        dispatch(updateAdminUserRole({ id, dto })).unwrap(),
      [dispatch]
    ),
    clearError: useCallback(() => dispatch(clearAdminError()), [dispatch]),
    clearUserDetail: useCallback(() => dispatch(clearUserDetail()), [dispatch]),
  };
}
