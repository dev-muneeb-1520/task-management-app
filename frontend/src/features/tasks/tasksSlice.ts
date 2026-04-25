import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { taskService } from "@/services/taskService";
import type { RootState } from "@/store";
import type {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
  TaskListQuery,
  TaskPagination,
  TaskDashboardData,
} from "@/types/task.types";

interface TasksState {
  items: Task[];
  currentTask: Task | null;
  dashboard: TaskDashboardData | null;
  query: TaskListQuery;
  pagination: TaskPagination;
  isLoading: boolean;
  isDashboardLoading: boolean;
  isRefreshing: boolean;
  isSaving: boolean;
  error: string | null;
}

const DEFAULT_QUERY: TaskListQuery = {
  page: 1,
  limit: 10,
};

const DEFAULT_PAGINATION: TaskPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

const getErrorMessage = (err: unknown, fallback: string) => {
  const error = err as {
    response?: {
      data?: {
        error?: { message?: string };
        message?: string;
      };
    };
    message?: string;
  };

  return (
    error.response?.data?.error?.message ??
    error.response?.data?.message ??
    error.message ??
    fallback
  );
};

const initialState: TasksState = {
  items: [],
  currentTask: null,
  dashboard: null,
  query: DEFAULT_QUERY,
  pagination: DEFAULT_PAGINATION,
  isLoading: false,
  isDashboardLoading: false,
  isRefreshing: false,
  isSaving: false,
  error: null,
};

export const fetchTasks = createAsyncThunk(
  "tasks/fetchAll",
  async (query: TaskListQuery | undefined, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const nextQuery = { ...state.tasks.query, ...query };
      return await taskService.getAll(nextQuery);
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Failed to fetch tasks"));
    }
  }
);

export const fetchTaskById = createAsyncThunk(
  "tasks/fetchById",
  async (id: string, { rejectWithValue }) => {
    try {
      return await taskService.getById(id);
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Failed to fetch task details"));
    }
  }
);

export const fetchTaskDashboard = createAsyncThunk(
  "tasks/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      return await taskService.getDashboard();
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Failed to fetch dashboard"));
    }
  }
);

export const createTask = createAsyncThunk(
  "tasks/create",
  async (dto: CreateTaskDto, { dispatch, getState, rejectWithValue }) => {
    try {
      const task = await taskService.create(dto);
      const state = getState() as RootState;
      await dispatch(fetchTasks(state.tasks.query));
      return task;
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Failed to create task"));
    }
  }
);

export const updateTask = createAsyncThunk(
  "tasks/update",
  async (
    { id, dto }: { id: string; dto: UpdateTaskDto },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      const task = await taskService.update(id, dto);
      const state = getState() as RootState;
      await dispatch(fetchTasks(state.tasks.query));
      return task;
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Failed to update task"));
    }
  }
);

export const updateTaskStatus = createAsyncThunk(
  "tasks/updateStatus",
  async (
    { id, dto }: { id: string; dto: UpdateTaskStatusDto },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      const task = await taskService.updateStatus(id, dto);
      const state = getState() as RootState;
      await dispatch(fetchTasks(state.tasks.query));
      return task;
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Failed to update task status"));
    }
  }
);

export const deleteTask = createAsyncThunk(
  "tasks/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await taskService.delete(id);
      return id;
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Failed to delete task"));
    }
  }
);

export const deleteAllTasks = createAsyncThunk(
  "tasks/deleteAll",
  async (_, { rejectWithValue }) => {
    try {
      return await taskService.deleteAll();
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Failed to delete all tasks"));
    }
  }
);

export const deleteSelectedTasks = createAsyncThunk(
  "tasks/deleteSelected",
  async (taskIds: string[], { rejectWithValue }) => {
    try {
      const summary = await taskService.deleteSelected({ taskIds });
      return { taskIds, summary };
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Failed to delete selected tasks"));
    }
  }
);

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    clearTaskError(state) {
      state.error = null;
    },
    clearCurrentTask(state) {
      state.currentTask = null;
    },
  },
  extraReducers: (builder) => {
    // fetchTasks
    builder
      .addCase(fetchTasks.pending, (state, action) => {
        state.isLoading = state.items.length === 0;
        state.isRefreshing = state.items.length > 0;
        state.error = null;
        state.query = {
          ...state.query,
          ...action.meta.arg,
        };
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchTaskById.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.currentTask = action.payload;
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchTaskDashboard.pending, (state) => {
        state.isDashboardLoading = true;
        state.error = null;
      })
      .addCase(fetchTaskDashboard.fulfilled, (state, action) => {
        state.isDashboardLoading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchTaskDashboard.rejected, (state, action) => {
        state.isDashboardLoading = false;
        state.error = action.payload as string;
      });

    // createTask
    builder
      .addCase(createTask.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.isSaving = false;
        state.currentTask = action.payload;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });

    // updateTask
    builder
      .addCase(updateTask.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.isSaving = false;
        state.currentTask = action.payload;
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(updateTaskStatus.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        state.isSaving = false;
        state.currentTask = action.payload;
      })
      .addCase(updateTaskStatus.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });

    // deleteTask
    builder
      .addCase(deleteTask.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.isSaving = false;
        state.items = state.items.filter((t) => t.id !== action.payload);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
        state.pagination.totalPages = Math.max(
          1,
          Math.ceil(state.pagination.total / state.pagination.limit)
        );
        state.pagination.hasNextPage = state.pagination.page < state.pagination.totalPages;
        state.pagination.hasPreviousPage = state.pagination.page > 1;
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(deleteAllTasks.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(deleteAllTasks.fulfilled, (state) => {
        state.isSaving = false;
        state.items = [];
        state.pagination = {
          ...state.pagination,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      })
      .addCase(deleteAllTasks.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(deleteSelectedTasks.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(deleteSelectedTasks.fulfilled, (state, action) => {
        state.isSaving = false;
        const { taskIds, summary } = action.payload;
        const idsToDelete = new Set(taskIds);
        state.items = state.items.filter((task) => !idsToDelete.has(task.id));

        state.pagination.total = Math.max(0, state.pagination.total - summary.deletedCount);
        state.pagination.totalPages = Math.max(
          1,
          Math.ceil(state.pagination.total / state.pagination.limit)
        );
        state.pagination.hasNextPage = state.pagination.page < state.pagination.totalPages;
        state.pagination.hasPreviousPage = state.pagination.page > 1;
      })
      .addCase(deleteSelectedTasks.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearTaskError, clearCurrentTask } = tasksSlice.actions;
export default tasksSlice.reducer;
