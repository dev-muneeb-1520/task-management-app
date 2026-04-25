import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useCallback } from "react";
import {
  fetchTasks,
  fetchTaskById,
  fetchTaskDashboard,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  deleteAllTasks,
  deleteSelectedTasks,
  clearTaskError,
  clearCurrentTask,
} from "./tasksSlice";
import type {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
  TaskListQuery,
} from "@/types/task.types";

export function useTasks() {
  const dispatch = useAppDispatch();
  const {
    items,
    currentTask,
    dashboard,
    query,
    pagination,
    isLoading,
    isDashboardLoading,
    isRefreshing,
    isSaving,
    error,
  } =
    useAppSelector((state) => state.tasks);

  const fetchAllTasks = useCallback(
    (nextQuery?: TaskListQuery) => dispatch(fetchTasks(nextQuery)).unwrap(),
    [dispatch]
  );
  const fetchTaskDetails = useCallback(
    (id: string) => dispatch(fetchTaskById(id)).unwrap(),
    [dispatch]
  );
  const fetchDashboardData = useCallback(
    () => dispatch(fetchTaskDashboard()).unwrap(),
    [dispatch]
  );
  const createNewTask = useCallback(
    (dto: CreateTaskDto) => dispatch(createTask(dto)).unwrap(),
    [dispatch]
  );
  const updateExistingTask = useCallback(
    (id: string, dto: UpdateTaskDto) => dispatch(updateTask({ id, dto })).unwrap(),
    [dispatch]
  );
  const updateExistingTaskStatus = useCallback(
    (id: string, dto: UpdateTaskStatusDto) =>
      dispatch(updateTaskStatus({ id, dto })).unwrap(),
    [dispatch]
  );
  const deleteExistingTask = useCallback(
    (id: string) => dispatch(deleteTask(id)).unwrap(),
    [dispatch]
  );
  const deleteAllExistingTasks = useCallback(
    () => dispatch(deleteAllTasks()).unwrap(),
    [dispatch]
  );
  const deleteSelectedExistingTasks = useCallback(
    (taskIds: string[]) => dispatch(deleteSelectedTasks(taskIds)).unwrap(),
    [dispatch]
  );
  const clearError = useCallback(() => dispatch(clearTaskError()), [dispatch]);
  const clearSelectedTask = useCallback(() => dispatch(clearCurrentTask()), [dispatch]);

  return {
    tasks: items,
    currentTask,
    dashboard,
    query,
    pagination,
    isLoading,
    isDashboardLoading,
    isRefreshing,
    isSaving,
    error,
    fetchTasks: fetchAllTasks,
    fetchTaskById: fetchTaskDetails,
    fetchTaskDashboard: fetchDashboardData,
    createTask: createNewTask,
    updateTask: updateExistingTask,
    updateTaskStatus: updateExistingTaskStatus,
    deleteTask: deleteExistingTask,
    deleteAllTasks: deleteAllExistingTasks,
    deleteSelectedTasks: deleteSelectedExistingTasks,
    clearError,
    clearCurrentTask: clearSelectedTask,
  };
}
