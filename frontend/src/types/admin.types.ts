import type { UserRole } from './auth.types';
import type { TaskPriority, TaskStatus } from './task.types';

// ── Platform stats ──────────────────────────────────────────────────────────
export interface AdminUserStats {
  total: number;
  active: number;
  inactive: number;
  newToday: number;
}

export interface AdminTaskStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  createdToday: number;
  completionRate: number;
}

export interface AdminPlatformStats {
  users: AdminUserStats;
  tasks: AdminTaskStats;
}

// ── User list ────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  tasksAssigned: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AdminUserListResponse {
  items: AdminUser[];
  pagination: AdminUserPagination;
}

// ── User detail ──────────────────────────────────────────────────────────────
export interface AdminUserTaskPreview {
  id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
}

export interface AdminUserDetail {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    tasksAssigned: number;
    tasksCreated: number;
  };
  recentTasks: AdminUserTaskPreview[];
}

// ── Assignment user (for task form dropdown) ─────────────────────────────────
export interface AssignmentUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

// ── Request DTOs ─────────────────────────────────────────────────────────────
export interface UpdateUserStatusDto {
  isActive: boolean;
}

export interface UpdateUserRoleDto {
  role: UserRole;
}

export interface AdminGetUsersQuery {
  search?: string;
  page?: number;
  limit?: number;
  status?: "ACTIVE" | "INACTIVE";
  sortBy?: "createdAt" | "fullName" | "tasksAssigned";
  sortOrder?: "asc" | "desc";
}
