"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, Search, ListTodo, CheckCircle2, Clock, Flame, Eye } from "lucide-react";
import TaskDetailsModal from "@/components/shared/TaskDetailsModal";
import { useTasks } from "@/features/tasks/useTasks";
import { useAuth } from "@/features/auth/useAuth";
import TaskFormModal from "@/components/shared/TaskFormModal";
import CustomSelect from "@/components/ui/CustomSelect";
import type { Task, TaskStatus, TaskPriority } from "@/types/task.types";

const STATUS_TABS: { key: "ALL" | TaskStatus; label: string }[] = [
  { key: "ALL",         label: "All"         },
  { key: "TODO",        label: "To Do"       },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "DONE",        label: "Done"        },
];

const PRIORITY_OPTIONS: { key: "ALL" | TaskPriority; label: string }[] = [
  { key: "ALL",    label: "All Priorities" },
  { key: "HIGH",   label: "High"           },
  { key: "MEDIUM", label: "Medium"         },
  { key: "LOW",    label: "Low"            },
];

function StatusBadge({ status }: { status: TaskStatus }) {
  if (status === "DONE")        return <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700"><CheckCircle2 className="h-3 w-3" />Done</span>;
  if (status === "IN_PROGRESS") return <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700"><Clock className="h-3 w-3" />In Progress</span>;
  return <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600"><ListTodo className="h-3 w-3" />To Do</span>;
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  if (priority === "HIGH")   return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600"><Flame className="h-3 w-3" />High</span>;
  if (priority === "MEDIUM") return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600">Medium</span>;
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600">Low</span>;
}

export default function TasksPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const TASKS_PAGE_LIMIT = 10;

  const { user, isInitialized, isAuthenticated } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const {
    tasks,
    error,
    pagination,
    isLoading,
    isSaving,
    isRefreshing,
    fetchTasks,
    fetchTaskById,
    updateTaskStatus,
    deleteTask,
    deleteAllTasks,
    deleteSelectedTasks,
    clearError,
  } = useTasks();

  const [showModal,     setShowModal]     = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingTask,   setEditingTask]   = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [activeTab,     setActiveTab]     = useState<"ALL" | TaskStatus>("ALL");
  const [priorityFilter,setPriorityFilter]= useState<"ALL" | TaskPriority>("ALL");
  const [deletingId,    setDeletingId]    = useState<string | null>(null);
  const [removingTaskIds, setRemovingTaskIds] = useState<string[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showDeleteSelectedConfirm, setShowDeleteSelectedConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const selectedTaskIdParam = searchParams.get("taskId");

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;

    void fetchTasks({
      page,
      limit: TASKS_PAGE_LIMIT,
      search: deferredSearchQuery.trim() || undefined,
      status: activeTab === "ALL" ? undefined : activeTab,
      priority: priorityFilter === "ALL" ? undefined : priorityFilter,
    }).catch(() => {});
  }, [
    activeTab,
    deferredSearchQuery,
    fetchTasks,
    isAuthenticated,
    isInitialized,
    page,
    priorityFilter,
  ]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, deferredSearchQuery, priorityFilter]);

  useEffect(() => {
    const visibleTaskIds = new Set(tasks.map((task) => task.id));
    setSelectedTaskIds((prev) => prev.filter((id) => visibleTaskIds.has(id)));
  }, [tasks]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !selectedTaskIdParam) return;

    const openFromQuery = async () => {
      setViewingId(selectedTaskIdParam);
      clearError();

      try {
        const fullTask = await fetchTaskById(selectedTaskIdParam);
        setSelectedTask(fullTask);
        setShowDetailsModal(true);
      } catch {
        // Ignore invalid/deleted task IDs from query string.
      } finally {
        setViewingId(null);
      }
    };

    void openFromQuery();
  }, [clearError, fetchTaskById, isAuthenticated, isInitialized, selectedTaskIdParam]);

  const handleDelete = async (id: string) => {
    const ANIMATION_MS = 220;

    setDeletingId(id);
    setRemovingTaskIds([id]);
    clearError();

    try {
      await new Promise((resolve) => window.setTimeout(resolve, ANIMATION_MS));
      await deleteTask(id);
      if (selectedTask?.id === id) {
        setShowDetailsModal(false);
        setSelectedTask(null);
      }
      if (editingTask?.id === id) {
        setShowModal(false);
        setEditingTask(null);
      }
    } finally {
      setRemovingTaskIds([]);
      setDeletingId(null);
    }
  };

  const executeDeleteSelected = async () => {
    if (selectedTaskIds.length === 0 || isBulkDeleting) return;

    const ANIMATION_MS = 240;

    setIsBulkDeleting(true);
    setRemovingTaskIds(selectedTaskIds);
    clearError();

    try {
      await new Promise((resolve) => window.setTimeout(resolve, ANIMATION_MS));
      const result = await deleteSelectedTasks(selectedTaskIds);

      const deletedCount = result.summary.deletedCount;
      const remainingTotal = Math.max(0, pagination.total - deletedCount);
      const nextTotalPages = Math.max(1, Math.ceil(remainingTotal / TASKS_PAGE_LIMIT));
      const nextPage = Math.min(page, nextTotalPages);

      if (remainingTotal > 0) {
        if (nextPage !== page) {
          setPage(nextPage);
        } else {
          await fetchTasks({
            page: nextPage,
            limit: TASKS_PAGE_LIMIT,
            search: deferredSearchQuery.trim() || undefined,
            status: activeTab === "ALL" ? undefined : activeTab,
            priority: priorityFilter === "ALL" ? undefined : priorityFilter,
          });
        }
      }

      if (selectedTask && selectedTaskIds.includes(selectedTask.id)) {
        setShowDetailsModal(false);
        setSelectedTask(null);
      }

      if (editingTask && selectedTaskIds.includes(editingTask.id)) {
        setShowModal(false);
        setEditingTask(null);
      }

      setSelectedTaskIds([]);
    } finally {
      setRemovingTaskIds([]);
      setIsBulkDeleting(false);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedTaskIds.length === 0 || isBulkDeleting) return;
    setShowDeleteSelectedConfirm(true);
  };

  const executeDeleteAll = async () => {
    if (tasks.length === 0 || isBulkDeleting) return;

    const ANIMATION_MS = 260;

    setIsBulkDeleting(true);
    setRemovingTaskIds(tasks.map((task) => task.id));
    clearError();

    try {
      await new Promise((resolve) => window.setTimeout(resolve, ANIMATION_MS));
      await deleteAllTasks();
      setShowDetailsModal(false);
      setSelectedTask(null);
      setShowModal(false);
      setEditingTask(null);
      setSelectedTaskIds([]);
    } finally {
      setRemovingTaskIds([]);
      setIsBulkDeleting(false);
    }
  };

  const handleDeleteAll = () => {
    if (tasks.length === 0 || isBulkDeleting) return;
    setShowDeleteAllConfirm(true);
  };

  const isAllVisibleSelected = tasks.length > 0 && selectedTaskIds.length === tasks.length;

  const toggleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      setSelectedTaskIds([]);
      return;
    }
    setSelectedTaskIds(tasks.map((task) => task.id));
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    if (task.status === newStatus) return;

    setStatusUpdatingId(task.id);
    clearError();
    try {
      await updateTaskStatus(task.id, { status: newStatus });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleEdit = async (task: Task) => {
    clearError();
    setEditingId(task.id);
    try {
      const fullTask = await fetchTaskById(task.id);
      setEditingTask(fullTask);
    } catch {
      setEditingTask(task);
    } finally {
      setEditingId(null);
      setShowModal(true);
    }
  };

  const handleView = async (task: Task) => {
    clearError();
    setViewingId(task.id);
    try {
      const fullTask = await fetchTaskById(task.id);
      setSelectedTask(fullTask);
    } catch {
      setSelectedTask(task);
    } finally {
      setViewingId(null);
      setShowDetailsModal(true);
    }
  };

  const handleEditFromDetails = (task: Task) => {
    setShowDetailsModal(false);
    setSelectedTask(null);
    setEditingTask(task);
    setShowModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedTask(null);

    if (selectedTaskIdParam) {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("taskId");
      const nextQuery = nextParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
    }

    void fetchTasks({
      page,
      limit: TASKS_PAGE_LIMIT,
      search: deferredSearchQuery.trim() || undefined,
      status: activeTab === "ALL" ? undefined : activeTab,
      priority: priorityFilter === "ALL" ? undefined : priorityFilter,
    }).catch(() => {});
  };

  return (
    <>
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isAdmin
              ? `${pagination.total} total · page ${pagination.page} of ${pagination.totalPages}`
              : `${pagination.total} task${pagination.total === 1 ? "" : "s"} assigned to you`}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleDeleteSelected()}
              disabled={selectedTaskIds.length === 0 || isBulkDeleting || isSaving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-sm font-semibold hover:bg-amber-100 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBulkDeleting && selectedTaskIds.length > 0 ? (
                <div className="h-4 w-4 rounded-full border-2 border-amber-300 border-t-amber-600 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete Selected ({selectedTaskIds.length})
            </button>

            <button
              type="button"
              onClick={handleDeleteAll}
              disabled={tasks.length === 0 || isBulkDeleting || isSaving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-semibold hover:bg-red-100 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBulkDeleting ? (
                <div className="h-4 w-4 rounded-full border-2 border-red-300 border-t-red-600 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete All
            </button>

            <button
              onClick={() => { setEditingTask(null); setShowModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-sm shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all duration-150"
            >
              <Plus className="h-4 w-4" />
              New Task
            </button>
          </div>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
          />
        </div>
        {/* Priority filter */}
        <CustomSelect
          value={priorityFilter}
          onChange={(value) => setPriorityFilter(value as "ALL" | TaskPriority)}
          options={PRIORITY_OPTIONS.map((option) => ({
            value: option.key,
            label: option.label,
          }))}
          className="w-36 sm:w-40"
          size="sm"
          usePortal={true}
        />
      </div>

      {/* ── Status tabs ── */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5 w-fit animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              clearError();
              setActiveTab(key);
            }}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-fade-in">
          {error}
        </div>
      )}

      {isRefreshing && (
        <div className="mb-5 flex items-center gap-2 text-sm text-gray-500 animate-fade-in">
          <div className="h-4 w-4 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" />
          Updating results…
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="h-8 w-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-56 text-center bg-white rounded-2xl border border-gray-100 animate-fade-in">
          <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <ListTodo className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700">
            {searchQuery || activeTab !== "ALL" || priorityFilter !== "ALL" ? "No tasks match your filters" : "No tasks assigned yet"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {searchQuery || activeTab !== "ALL" || priorityFilter !== "ALL"
              ? "Try adjusting your search or filters"
              : isAdmin ? "Click \"New Task\" to create your first one" : "Your admin will assign tasks to you"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                {isAdmin && (
                  <th className="text-left px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={isAllVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500/30"
                      aria-label="Select all tasks on this page"
                    />
                  </th>
                )}
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-5/12">Task</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Due Date</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tasks.map((task, i) => (
                <tr
                  key={task.id}
                  className={`group transition-all duration-200 ease-out ${
                    removingTaskIds.includes(task.id)
                      ? "opacity-0 translate-x-2"
                      : "opacity-100 translate-x-0 hover:bg-blue-50/30"
                  }`}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {isAdmin && (
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.includes(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500/30"
                        aria-label={`Select task ${task.title}`}
                      />
                    </td>
                  )}
                  <td className="px-5 py-4">
                    <div>
                      <p className={`font-medium text-gray-900 truncate max-w-xs ${task.status === "DONE" ? "line-through text-gray-400" : ""}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{task.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <>
                      <div className="flex items-center gap-2">
                        <CustomSelect
                          value={task.status}
                          onChange={(value) => void handleStatusChange(task, value as TaskStatus)}
                          options={[
                            { value: "TODO", label: "To Do" },
                            { value: "IN_PROGRESS", label: "In Progress" },
                            { value: "DONE", label: "Done" },
                          ]}
                          disabled={statusUpdatingId === task.id}
                          size="sm"
                          variant="ghost"
                          triggerClassName="!px-0 !py-0 text-xs font-semibold"
                          menuClassName="w-40"
                        />
                        {statusUpdatingId === task.id && (
                          <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
                        )}
                      </div>
                      <div className="mt-1"><StatusBadge status={task.status} /></div>
                    </>
                  </td>
                  <td className="px-4 py-4"><PriorityBadge priority={task.priority} /></td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    {task.dueDate ? (
                      <span className="text-xs text-gray-500">
                        {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => void handleView(task)}
                        disabled={viewingId === task.id}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-150 active:scale-90 disabled:opacity-40"
                        title="View task"
                      >
                        {viewingId === task.id
                          ? <div className="h-3.5 w-3.5 rounded-full border-2 border-indigo-300 border-t-indigo-500 animate-spin" />
                          : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      {isAdmin && <button
                        onClick={() => void handleEdit(task)}
                        disabled={editingId === task.id}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all duration-150 active:scale-90 disabled:opacity-40"
                        title="Edit task"
                      >
                        {editingId === task.id
                          ? <div className="h-3.5 w-3.5 rounded-full border-2 border-blue-300 border-t-blue-500 animate-spin" />
                          : <Pencil className="h-3.5 w-3.5" />}
                      </button>}
                      {isAdmin && <button
                        onClick={() => handleDelete(task.id)}
                        disabled={deletingId === task.id}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-150 active:scale-90 disabled:opacity-40"
                        title="Delete task"
                      >
                        {deletingId === task.id
                          ? <div className="h-3.5 w-3.5 rounded-full border-2 border-red-300 border-t-red-500 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />
                        }
                      </button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Showing {tasks.length} of {pagination.total} task{pagination.total === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={!pagination.hasPreviousPage || isRefreshing}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={!pagination.hasNextPage || isRefreshing}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal */}
      {isAdmin && showModal && (
        <TaskFormModal
          onClose={() => { setShowModal(false); setEditingTask(null); }}
          initialData={editingTask ?? undefined}
        />
      )}

      {showDetailsModal && selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          isAdmin={isAdmin}
          onClose={closeDetailsModal}
          onEdit={handleEditFromDetails}
        />
      )}

      {showDeleteSelectedConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-5 shadow-2xl animate-fade-in-up">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Trash2 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Selected Tasks?</h3>
            <p className="mt-2 text-sm text-gray-600">
              You are about to delete {selectedTaskIds.length} selected task{selectedTaskIds.length === 1 ? "" : "s"}. This action cannot be undone.
            </p>
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              Warning: This will permanently remove selected tasks and their checklist data.
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteSelectedConfirm(false)}
                disabled={isBulkDeleting}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteSelectedConfirm(false);
                  void executeDeleteSelected();
                }}
                disabled={isBulkDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {isBulkDeleting ? (
                  <div className="h-4 w-4 rounded-full border-2 border-red-300 border-t-white animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-5 shadow-2xl animate-fade-in-up">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700">
              <Trash2 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Delete All Tasks?</h3>
            <p className="mt-2 text-sm text-gray-600">
              You are about to delete all {pagination.total} task{pagination.total === 1 ? "" : "s"}. This action cannot be undone.
            </p>
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              Warning: This will permanently remove all tasks and checklist data.
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllConfirm(false)}
                disabled={isBulkDeleting}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteAllConfirm(false);
                  void executeDeleteAll();
                }}
                disabled={isBulkDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {isBulkDeleting ? (
                  <div className="h-4 w-4 rounded-full border-2 border-red-300 border-t-white animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
