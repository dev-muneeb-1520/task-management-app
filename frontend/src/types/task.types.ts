export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface TaskUser {
  id: string;
  fullName: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assignedToId?: string;
  createdById?: string;
  assignedTo?: TaskUser;
  createdBy?: TaskUser;
  createdAt: string;
  updatedAt: string;
}

export interface TaskPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface TaskListQuery {
  search?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assignedToId?: string;
  page?: number;
  limit?: number;
}

export interface TaskListResponse {
  items: Task[];
  pagination: TaskPagination;
}

export interface DeleteAllTasksResponse {
  message: string;
  deletedCount: number;
}

export interface DeleteSelectedTasksDto {
  taskIds: string[];
}

export interface DeleteSelectedTasksResponse {
  message: string;
  requestedCount: number;
  deletedCount: number;
  notFoundCount: number;
}

export interface DashboardStatBlock {
  totalTasks: number;
  completed: number;
  inProgress: number;
  highPriority: number;
}

export interface DashboardCompletionRate {
  percentage: number;
  done: number;
  total: number;
}

export interface DashboardPriorityItem {
  count: number;
  percentage: number;
}

export interface DashboardPriorityBreakdown {
  high: DashboardPriorityItem;
  medium: DashboardPriorityItem;
  low: DashboardPriorityItem;
}

export interface DashboardStatusBreakdown {
  todo: number;
  inProgress: number;
  done: number;
}

export interface DashboardTaskPreview {
  id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  createdAt?: string;
}

export interface TaskDashboardData {
  stats: DashboardStatBlock;
  completionRate: DashboardCompletionRate;
  priorityBreakdown: DashboardPriorityBreakdown;
  statusBreakdown: DashboardStatusBreakdown;
  recentTasks: DashboardTaskPreview[];
  attentionNeeded: DashboardTaskPreview[];
}

export interface ChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
  position: number;
  taskId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistProgress {
  totalItems: number;
  completedItems: number;
  percentage: number;
}

export interface ChecklistListResponse {
  items: ChecklistItem[];
  progress: ChecklistProgress;
  taskStatus?: TaskStatus;
}

export interface ChecklistMutationResponse {
  item: ChecklistItem;
  progress: ChecklistProgress;
  taskStatus?: TaskStatus;
}

export interface DeleteChecklistItemResponse {
  message: string;
  progress: ChecklistProgress;
  taskStatus?: TaskStatus;
}

export interface CreateChecklistItemDto {
  title: string;
}

export interface UpdateChecklistItemDto {
  title?: string;
  isCompleted?: boolean;
}

export interface ReorderChecklistItemDto {
  position: number;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  status?: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignedToId?: string;
}

export type UpdateTaskDto = Partial<CreateTaskDto>;

export interface UpdateTaskStatusDto {
  status: TaskStatus;
}
