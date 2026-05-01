"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  ListTodo,
  Pencil,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import { taskService } from "@/services/taskService";
import type { ChecklistItem, ChecklistProgress, Task } from "@/types/task.types";

interface Props {
  task: Task;
  isAdmin?: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
}

function StatusBadge({ status }: { status: Task["status"] }) {
  if (status === "DONE") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700">
        <CheckCircle2 className="h-3 w-3" />
        Done
      </span>
    );
  }

  if (status === "IN_PROGRESS") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
        <Clock className="h-3 w-3" />
        In Progress
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
      <ListTodo className="h-3 w-3" />
      To Do
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Task["priority"] }) {
  if (priority === "HIGH") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
        <Flame className="h-3 w-3" />
        High
      </span>
    );
  }

  if (priority === "MEDIUM") {
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600">Medium</span>;
  }

  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600">Low</span>;
}

export default function TaskDetailsModal({ task, isAdmin = false, onClose, onEdit }: Props) {
  const [taskStatus, setTaskStatus] = useState<Task["status"]>(task.status);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [progress, setProgress] = useState<ChecklistProgress>({
    totalItems: 0,
    completedItems: 0,
    percentage: 0,
  });
  const [isChecklistLoading, setIsChecklistLoading] = useState(true);
  const [checklistError, setChecklistError] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [editingChecklistItemId, setEditingChecklistItemId] = useState<string | null>(null);
  const [editingChecklistTitle, setEditingChecklistTitle] = useState("");
  const checklistItemRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const previousPositionsRef = useRef<Record<string, number>>({});

  const loadChecklist = async () => {
    setChecklistError(null);
    setIsChecklistLoading(true);
    try {
      const data = await taskService.getChecklistItems(task.id);
      setChecklist(data.items);
      setProgress(data.progress);
      if (data.taskStatus) {
        setTaskStatus(data.taskStatus);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load checklist items.";
      setChecklistError(message);
    } finally {
      setIsChecklistLoading(false);
    }
  };

  useEffect(() => {
    void loadChecklist();
  }, [task.id]);

  useEffect(() => {
    setTaskStatus(task.status);
  }, [task.status]);

  useLayoutEffect(() => {
    const previousPositions = previousPositionsRef.current;
    const hasCapturedPositions = Object.keys(previousPositions).length > 0;
    if (!hasCapturedPositions) return;

    checklist.forEach((item) => {
      const element = checklistItemRefs.current[item.id];
      const previousTop = previousPositions[item.id];

      if (!element || previousTop === undefined) return;

      const currentTop = element.getBoundingClientRect().top;
      const deltaY = previousTop - currentTop;

      if (Math.abs(deltaY) < 0.5) return;

      element.style.transition = "none";
      element.style.transform = `translateY(${deltaY}px)`;
      element.style.willChange = "transform";

      requestAnimationFrame(() => {
        element.style.transition = "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)";
        element.style.transform = "translateY(0)";

        const cleanup = () => {
          element.style.transition = "";
          element.style.willChange = "";
          element.removeEventListener("transitionend", cleanup);
        };

        element.addEventListener("transitionend", cleanup);
      });
    });

    previousPositionsRef.current = {};
  }, [checklist]);

  const formatDate = (value?: string) => {
    if (!value) return "-";

    return new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAddChecklistItem = async () => {
    const title = newItemTitle.trim();
    if (!title) return;

    setChecklistError(null);
    setIsCreatingItem(true);
    try {
      const response = await taskService.createChecklistItem(task.id, { title });
      setChecklist((prev) => [...prev, response.item].sort((a, b) => a.position - b.position));
      setProgress(response.progress);
      if (response.taskStatus) {
        setTaskStatus(response.taskStatus);
      }
      setNewItemTitle("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create checklist item.";
      setChecklistError(message);
    } finally {
      setIsCreatingItem(false);
    }
  };

  const handleToggleChecklistItem = async (item: ChecklistItem) => {
    setChecklistError(null);
    setBusyItemId(item.id);
    try {
      const response = await taskService.updateChecklistItem(task.id, item.id, {
        isCompleted: !item.isCompleted,
      });

      setChecklist((prev) =>
        prev.map((existing) =>
          existing.id === response.item.id ? response.item : existing
        )
      );
      setProgress(response.progress);
      if (response.taskStatus) {
        setTaskStatus(response.taskStatus);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update checklist item.";
      setChecklistError(message);
    } finally {
      setBusyItemId(null);
    }
  };

  const startChecklistItemEdit = (item: ChecklistItem) => {
    setEditingChecklistItemId(item.id);
    setEditingChecklistTitle(item.title);
  };

  const cancelChecklistItemEdit = () => {
    setEditingChecklistItemId(null);
    setEditingChecklistTitle("");
  };

  const saveChecklistItemTitle = async (item: ChecklistItem) => {
    const title = editingChecklistTitle.trim();
    if (!title || title === item.title) {
      cancelChecklistItemEdit();
      return;
    }

    setChecklistError(null);
    setBusyItemId(item.id);
    try {
      const response = await taskService.updateChecklistItem(task.id, item.id, { title });

      setChecklist((prev) =>
        prev.map((existing) =>
          existing.id === response.item.id ? response.item : existing
        )
      );
      setProgress(response.progress);
      if (response.taskStatus) {
        setTaskStatus(response.taskStatus);
      }
      cancelChecklistItemEdit();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to rename checklist item.";
      setChecklistError(message);
    } finally {
      setBusyItemId(null);
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    const ANIMATION_MS = 220;

    setChecklistError(null);
    setDeletingItemId(itemId);
    setBusyItemId(itemId);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, ANIMATION_MS));
      const response = await taskService.deleteChecklistItem(task.id, itemId);

      if (editingChecklistItemId === itemId) {
        cancelChecklistItemEdit();
      }

      setChecklist((prev) => prev.filter((item) => item.id !== itemId));
      setProgress(response.progress);
      if (response.taskStatus) {
        setTaskStatus(response.taskStatus);
      }
    } catch (error) {
      setDeletingItemId(null);
      const message =
        error instanceof Error ? error.message : "Failed to delete checklist item.";
      setChecklistError(message);
    } finally {
      setDeletingItemId(null);
      setBusyItemId(null);
    }
  };

  const handleReorderChecklistItem = async (item: ChecklistItem, direction: "up" | "down") => {
    const currentIndex = checklist.findIndex((entry) => entry.id === item.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= checklist.length) return;

    previousPositionsRef.current = checklist.reduce<Record<string, number>>((acc, entry) => {
      const element = checklistItemRefs.current[entry.id];
      if (element) {
        acc[entry.id] = element.getBoundingClientRect().top;
      }
      return acc;
    }, {});

    const previousChecklist = checklist;
    const reorderedChecklist = [...checklist];
    const [movedItem] = reorderedChecklist.splice(currentIndex, 1);
    reorderedChecklist.splice(targetIndex, 0, movedItem);
    const normalizedChecklist = reorderedChecklist.map((entry, index) => ({
      ...entry,
      position: index,
    }));

    const movedAfterSwap = normalizedChecklist[targetIndex];
    const swappedAfterSwap = normalizedChecklist[currentIndex];

    setChecklist(normalizedChecklist);

    setChecklistError(null);
    setBusyItemId(item.id);
    try {
      const updates = [
        taskService.reorderChecklistItem(task.id, movedAfterSwap.id, {
          position: targetIndex,
        }),
      ];

      if (swappedAfterSwap) {
        updates.push(
          taskService.reorderChecklistItem(task.id, swappedAfterSwap.id, {
            position: currentIndex,
          })
        );
      }

      await Promise.all(updates);
    } catch (error) {
      setChecklist(previousChecklist);
      const message =
        error instanceof Error ? error.message : "Failed to reorder checklist item.";
      setChecklistError(message);
    } finally {
      setBusyItemId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl animate-fade-in-up overflow-hidden">
        <div className="h-1.5 w-full bg-linear-to-r from-blue-500 to-indigo-600" />

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Task Details</h2>
              <p className="text-xs text-gray-500 mt-0.5">Review task info fetched from server.</p>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150 active:scale-90"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{task.title}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</p>
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{task.description || "-"}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</p>
                <StatusBadge status={taskStatus} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Priority</p>
                <PriorityBadge priority={task.priority} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</p>
                <p className="mt-1 text-sm text-gray-700 inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                  {formatDate(task.dueDate)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</p>
                <p className="mt-1 text-sm text-gray-700 inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  {task.assignedTo?.fullName ?? task.assignedToId ?? "-"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</p>
                <p className="mt-1 text-sm text-gray-700">{formatDate(task.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Updated At</p>
                <p className="mt-1 text-sm text-gray-700">{formatDate(task.updatedAt)}</p>
              </div>
            </div>

              <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Checklist
                </p>
                <span className="text-xs text-gray-500">
                  {progress.completedItems}/{progress.totalItems} complete ({progress.percentage}%)
                </span>
              </div>

              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={newItemTitle}
                    onChange={(event) => setNewItemTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleAddChecklistItem();
                      }
                    }}
                    placeholder="Add checklist item"
                    className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => void handleAddChecklistItem()}
                    disabled={isCreatingItem || !newItemTitle.trim()}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>
              )}

              {checklistError && (
                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {checklistError}
                </div>
              )}

              {isChecklistLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                  <div className="h-4 w-4 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" />
                  Loading checklist...
                </div>
              ) : checklist.length === 0 ? (
                <p className="text-sm text-gray-500 py-3">No checklist items yet.</p>
              ) : (
                <ul className="space-y-2 max-h-60 overflow-auto pr-1">
                  {checklist.map((item, index) => {
                    const isBusy = busyItemId === item.id;
                    const isEditing = editingChecklistItemId === item.id;
                    const isDeleting = deletingItemId === item.id;

                    return (
                      <li
                        key={item.id}
                        ref={(element) => {
                          checklistItemRefs.current[item.id] = element;
                        }}
                        className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-all duration-200 ease-out overflow-hidden ${
                          isDeleting
                            ? "opacity-0 -translate-x-2 max-h-0 py-0 border-transparent"
                            : "opacity-100 translate-x-0 max-h-20 border-gray-100"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => void handleToggleChecklistItem(item)}
                          disabled={isBusy}
                          className={`h-5 w-5 rounded border flex items-center justify-center transition ${
                            item.isCompleted
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-gray-300 text-transparent"
                          } disabled:opacity-50`}
                          aria-label={item.isCompleted ? "Mark incomplete" : "Mark complete"}
                        >
                          <Check className="h-3 w-3" />
                        </button>

                        {isEditing ? (
                          <input
                            type="text"
                            value={editingChecklistTitle}
                            onChange={(event) => setEditingChecklistTitle(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                void saveChecklistItemTitle(item);
                              }
                              if (event.key === "Escape") {
                                event.preventDefault();
                                cancelChecklistItemEdit();
                              }
                            }}
                            className="flex-1 px-2 py-1 text-sm rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            autoFocus
                          />
                        ) : (
                          <span
                            className={`flex-1 text-sm ${
                              item.isCompleted ? "line-through text-gray-400" : "text-gray-800"
                            }`}
                          >
                            {item.title}
                          </span>
                        )}

                        <div className="flex items-center gap-1">
                          {isAdmin && isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => void saveChecklistItemTitle(item)}
                                disabled={isBusy || !editingChecklistTitle.trim()}
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                                title="Save"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={cancelChecklistItemEdit}
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100"
                                title="Cancel"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : isAdmin ? (
                            <>
                              <button
                                type="button"
                                onClick={() => void handleReorderChecklistItem(item, "up")}
                                disabled={isBusy || index === 0}
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
                                title="Move up"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleReorderChecklistItem(item, "down")}
                                disabled={isBusy || index === checklist.length - 1}
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
                                title="Move down"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => startChecklistItemEdit(item)}
                                disabled={isBusy}
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 disabled:opacity-40"
                                title="Rename"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteChecklistItem(item.id)}
                                disabled={isBusy}
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 disabled:opacity-40"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-150 active:scale-95"
            >
              Close
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all duration-150 active:scale-95"
              >
                Edit Task
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
