import apiClient from "@/lib/apiClient";
import type {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
  TaskListQuery,
  TaskListResponse,
  TaskDashboardData,
  ChecklistListResponse,
  ChecklistMutationResponse,
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
  ReorderChecklistItemDto,
  DeleteChecklistItemResponse,
  DeleteAllTasksResponse,
  DeleteSelectedTasksDto,
  DeleteSelectedTasksResponse,
} from "@/types/task.types";

const buildTaskQueryParams = (query?: TaskListQuery) => {
  if (!query) return undefined;

  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== "")
  );
};

export const taskService = {
  getAll: async (query?: TaskListQuery): Promise<TaskListResponse> => {
    const { data } = await apiClient.get<TaskListResponse>("/tasks", {
      params: buildTaskQueryParams(query),
    });
    return data;
  },

  getDashboard: async (): Promise<TaskDashboardData> => {
    const { data } = await apiClient.get<TaskDashboardData>("/tasks/dashboard");
    return data;
  },

  getById: async (id: string): Promise<Task> => {
    const { data } = await apiClient.get<Task>(`/tasks/${id}`);
    return data;
  },

  create: async (dto: CreateTaskDto): Promise<Task> => {
    const { data } = await apiClient.post<Task>("/tasks", dto);
    return data;
  },

  update: async (id: string, dto: UpdateTaskDto): Promise<Task> => {
    const { data } = await apiClient.patch<Task>(`/tasks/${id}`, dto);
    return data;
  },

  updateStatus: async (id: string, dto: UpdateTaskStatusDto): Promise<Task> => {
    const { data } = await apiClient.patch<Task>(`/tasks/${id}/status`, dto);
    return data;
  },

  getChecklistItems: async (taskId: string): Promise<ChecklistListResponse> => {
    const { data } = await apiClient.get<ChecklistListResponse>(`/tasks/${taskId}/checklist`);
    return data;
  },

  createChecklistItem: async (
    taskId: string,
    dto: CreateChecklistItemDto
  ): Promise<ChecklistMutationResponse> => {
    const { data } = await apiClient.post<ChecklistMutationResponse>(`/tasks/${taskId}/checklist`, dto);
    return data;
  },

  updateChecklistItem: async (
    taskId: string,
    itemId: string,
    dto: UpdateChecklistItemDto
  ): Promise<ChecklistMutationResponse> => {
    const { data } = await apiClient.patch<ChecklistMutationResponse>(
      `/tasks/${taskId}/checklist/${itemId}`,
      dto
    );
    return data;
  },

  reorderChecklistItem: async (
    taskId: string,
    itemId: string,
    dto: ReorderChecklistItemDto
  ): Promise<ChecklistMutationResponse> => {
    const { data } = await apiClient.patch<ChecklistMutationResponse>(
      `/tasks/${taskId}/checklist/${itemId}/reorder`,
      dto
    );
    return data;
  },

  deleteChecklistItem: async (
    taskId: string,
    itemId: string
  ): Promise<DeleteChecklistItemResponse> => {
    const { data } = await apiClient.delete<DeleteChecklistItemResponse>(
      `/tasks/${taskId}/checklist/${itemId}`
    );
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },

  deleteAll: async (): Promise<DeleteAllTasksResponse> => {
    const { data } = await apiClient.delete<DeleteAllTasksResponse>("/tasks");
    return data;
  },

  deleteSelected: async (dto: DeleteSelectedTasksDto): Promise<DeleteSelectedTasksResponse> => {
    const { data } = await apiClient.delete<DeleteSelectedTasksResponse>("/tasks/bulk", {
      data: dto,
    });
    return data;
  },
};
