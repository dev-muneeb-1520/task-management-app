"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Check,
  Users,
} from "lucide-react";
import { useTasks } from "@/features/tasks/useTasks";
import { useAuth } from "@/features/auth/useAuth";
import { useAdmin } from "@/features/admin/useAdmin";
import type { Task, TaskPriority, TaskStatus } from "@/types/task.types";

interface Props {
  onClose: () => void;
  initialData?: Task;
  preselectedUserId?: string;
}

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInputValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatCalendarHeader(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatDueDateDisplay(value: string) {
  if (!value) return "dd/mm/yyyy";
  const date = parseDateInputValue(value);
  if (!date) return "dd/mm/yyyy";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function TaskFormModal({ onClose, initialData, preselectedUserId }: Props) {
  const { createTask, updateTask, error, clearError } = useTasks();
  const { user } = useAuth();
  const { assignmentUsers, fetchAssignmentUsers } = useAdmin();
  const isAdmin = user?.role === "ADMIN";
  const isEditing = Boolean(initialData);

  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title:        initialData?.title        ?? "",
    description:  initialData?.description  ?? "",
    priority:     initialData?.priority     ?? ("MEDIUM" as TaskPriority),
    status:       initialData?.status       ?? ("TODO"   as TaskStatus),
    dueDate:      initialData?.dueDate
      ? new Date(initialData.dueDate).toISOString().split("T")[0]
      : "",
    assignedToId: preselectedUserId ?? initialData?.assignedToId ?? "",
  });
  const [assigneeMenuOpen, setAssigneeMenuOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(() => {
    const parsedDate = parseDateInputValue(
      initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split("T")[0] : ""
    );
    const seed = parsedDate ?? new Date();
    return new Date(seed.getFullYear(), seed.getMonth(), 1);
  });
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => startOfLocalDay(new Date()), []);

  const isAtCurrentMonth =
    displayMonth.getFullYear() === today.getFullYear() &&
    displayMonth.getMonth() === today.getMonth();

  const calendarDays = useMemo(() => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = firstDayOfMonth.getDay();

    const days: Array<Date | null> = Array.from({ length: leadingBlanks }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [displayMonth]);

  const selectedAssignee = useMemo(
    () => assignmentUsers.find((u) => u.id === form.assignedToId) ?? null,
    [assignmentUsers, form.assignedToId]
  );

  const filteredAssignmentUsers = useMemo(() => {
    const term = assigneeSearch.trim().toLowerCase();
    if (!term) return assignmentUsers;

    return assignmentUsers.filter((u) => {
      const fullName = u.fullName.toLowerCase();
      const email = u.email.toLowerCase();
      return fullName.includes(term) || email.includes(term);
    });
  }, [assignmentUsers, assigneeSearch]);

  const priorityOptions: Array<{ value: TaskPriority; label: string }> = [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
  ];

  const statusOptions: Array<{ value: TaskStatus; label: string }> = [
    { value: "TODO", label: "To Do" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "DONE", label: "Done" },
  ];

  const selectedPriorityLabel =
    priorityOptions.find((option) => option.value === form.priority)?.label ?? "Medium";

  const selectedStatusLabel =
    statusOptions.find((option) => option.value === form.status)?.label ?? "To Do";

  useEffect(() => {
    if (isAdmin && !isEditing) {
      fetchAssignmentUsers().catch(() => undefined);
    }
  }, [isAdmin, isEditing, fetchAssignmentUsers]);

  useEffect(() => {
    if (!assigneeMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!assigneeDropdownRef.current) return;
      if (!assigneeDropdownRef.current.contains(event.target as Node)) {
        setAssigneeMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAssigneeMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [assigneeMenuOpen]);

  useEffect(() => {
    if (!isDatePickerOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!datePickerRef.current) return;
      if (!datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDatePickerOpen]);

  useEffect(() => {
    if (!priorityMenuOpen && !statusMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (priorityDropdownRef.current && priorityDropdownRef.current.contains(target)) {
        return;
      }

      if (statusDropdownRef.current && statusDropdownRef.current.contains(target)) {
        return;
      }

      setPriorityMenuOpen(false);
      setStatusMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPriorityMenuOpen(false);
        setStatusMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [priorityMenuOpen, statusMenuOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormError(null);
    clearError();
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toIsoDate = (value: string) => {
    if (!value) return undefined;
    return new Date(`${value}T23:59:59.000Z`).toISOString();
  };

  const handleAssigneeSelect = (id: string) => {
    setForm((prev) => ({ ...prev, assignedToId: id }));
    setAssigneeSearch("");
    setAssigneeMenuOpen(false);
  };

  const handlePrioritySelect = (priority: TaskPriority) => {
    setForm((prev) => ({ ...prev, priority }));
    setPriorityMenuOpen(false);
    setFormError(null);
    clearError();
  };

  const handleStatusSelect = (status: TaskStatus) => {
    setForm((prev) => ({ ...prev, status }));
    setStatusMenuOpen(false);
    setFormError(null);
    clearError();
  };

  const selectDueDate = (date: Date) => {
    const normalized = startOfLocalDay(date);
    if (normalized < today) return;

    setForm((prev) => ({ ...prev, dueDate: toDateInputValue(normalized) }));
    setIsDatePickerOpen(false);
    setFormError(null);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!form.title.trim()) {
      setFormError("Task title is required.");
      return;
    }

    if (!form.description.trim()) {
      setFormError("Task description is required.");
      return;
    }

    if (!form.dueDate) {
      setFormError("Due date is required.");
      return;
    }

    if (isAdmin && !isEditing) {
      const selectedDate = parseDateInputValue(form.dueDate);
      if (!selectedDate || startOfLocalDay(selectedDate) < today) {
        setFormError("Please select today or a future due date.");
        return;
      }
    }

    if (isAdmin && !isEditing && !form.assignedToId) {
      setFormError("Please select a user to assign this task to.");
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing && initialData) {
        await updateTask(initialData.id, {
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
          status: form.status,
          dueDate: toIsoDate(form.dueDate),
        });
      } else {
        await createTask({
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
          status: form.status,
          dueDate: toIsoDate(form.dueDate)!,
          ...(isAdmin && form.assignedToId ? { assignedToId: form.assignedToId } : {}),
        });
      }

      onClose();
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Failed to save task.";
      setFormError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up overflow-visible">
        {/* Gradient top bar */}
        <div className="h-1.5 w-full bg-linear-to-r from-blue-500 to-indigo-600" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center">
                <CheckCircle2 className="h-4.5 w-4.5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                {isEditing ? "Edit Task" : "Create New Task"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150 active:scale-90"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {(formError || error) && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                {formError ?? error}
              </div>
            )}

            {/* Assignee — admin only, create mode */}
            {isAdmin && !isEditing && (
              <div>
                <label htmlFor="assignedToId" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Assign to <span className="text-red-500">*</span>
                </label>
                <div ref={assigneeDropdownRef} className="relative">
                  <button
                    type="button"
                    id="assignedToId"
                    onClick={() => setAssigneeMenuOpen((prev) => !prev)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        {selectedAssignee ? (
                          <>
                            <p className="text-sm font-medium text-gray-900 truncate">{selectedAssignee.fullName}</p>
                            <p className="text-xs text-gray-500 truncate">{selectedAssignee.email}</p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-400">Select a user...</p>
                        )}
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform ${assigneeMenuOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>

                  {assigneeMenuOpen && (
                    <div className="absolute z-30 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden animate-fade-in">
                      <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={assigneeSearch}
                            onChange={(e) => setAssigneeSearch(e.target.value)}
                            placeholder="Search user by name or email"
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="max-h-56 overflow-y-auto py-1">
                        {filteredAssignmentUsers.length === 0 ? (
                          <p className="px-3 py-2 text-sm text-gray-500">No users found.</p>
                        ) : (
                          filteredAssignmentUsers.map((u) => {
                            const isSelected = form.assignedToId === u.id;
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => handleAssigneeSelect(u.id)}
                                className={`w-full px-3 py-2.5 flex items-start gap-2 text-left transition-colors ${
                                  isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                                }`}
                              >
                                <span className="pt-0.5">
                                  {isSelected ? (
                                    <Check className="h-4 w-4 text-blue-600" />
                                  ) : (
                                    <span className="block h-4 w-4 rounded-full border border-gray-300" />
                                  )}
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium text-gray-900 truncate">{u.fullName}</span>
                                  <span className="block text-xs text-gray-500 truncate">{u.email}</span>
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Task title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="What needs to be done?"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Add more details…"
                value={form.description}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition resize-none"
              />
            </div>

            {/* Priority + Status row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
                <div ref={priorityDropdownRef} className="relative">
                  <button
                    id="priority"
                    type="button"
                    onClick={() => {
                      setPriorityMenuOpen((prev) => !prev);
                      setStatusMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-900">{selectedPriorityLabel}</p>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform ${priorityMenuOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>

                  {priorityMenuOpen && (
                    <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden animate-fade-in py-1">
                      {priorityOptions.map((option) => {
                        const isSelected = form.priority === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handlePrioritySelect(option.value)}
                            className={`w-full px-3 py-2.5 flex items-center gap-2 text-left transition-colors ${
                              isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                            }`}
                          >
                            <span className="h-4 w-4 flex items-center justify-center">
                              {isSelected ? (
                                <Check className="h-4 w-4 text-blue-600" />
                              ) : null}
                            </span>
                            <span className="text-sm text-gray-900">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                <div ref={statusDropdownRef} className="relative">
                  <button
                    id="status"
                    type="button"
                    onClick={() => {
                      setStatusMenuOpen((prev) => !prev);
                      setPriorityMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-900">{selectedStatusLabel}</p>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform ${statusMenuOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>

                  {statusMenuOpen && (
                    <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden animate-fade-in py-1">
                      {statusOptions.map((option) => {
                        const isSelected = form.status === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleStatusSelect(option.value)}
                            className={`w-full px-3 py-2.5 flex items-center gap-2 text-left transition-colors ${
                              isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                            }`}
                          >
                            <span className="h-4 w-4 flex items-center justify-center">
                              {isSelected ? (
                                <Check className="h-4 w-4 text-blue-600" />
                              ) : null}
                            </span>
                            <span className="text-sm text-gray-900">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Due date */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Due date <span className="text-red-500">*</span>
              </label>
              <div ref={datePickerRef} className="relative">
                <button
                  id="dueDate"
                  type="button"
                  onClick={() => {
                    const seed = parseDateInputValue(form.dueDate) ?? today;
                    const monthSeed = seed < today ? today : seed;
                    setDisplayMonth(new Date(monthSeed.getFullYear(), monthSeed.getMonth(), 1));
                    setIsDatePickerOpen((prev) => !prev);
                  }}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 text-left text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition bg-white"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className={form.dueDate ? "text-gray-900" : "text-gray-400"}>
                      {formatDueDateDisplay(form.dueDate)}
                    </span>
                    <CalendarDays className="h-4 w-4 text-gray-400" />
                  </span>
                </button>

                {isDatePickerOpen && (
                  <div className="absolute z-30 bottom-full mb-2 w-full rounded-xl border border-gray-200 bg-white shadow-xl p-3 animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (isAtCurrentMonth) return;
                          setDisplayMonth(
                            (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                          );
                        }}
                        disabled={isAtCurrentMonth}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <p className="text-sm font-semibold text-gray-900">{formatCalendarHeader(displayMonth)}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setDisplayMonth(
                            (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                          );
                        }}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {WEEKDAY_LABELS.map((dayLabel) => (
                        <span
                          key={dayLabel}
                          className="h-8 text-[11px] font-semibold text-gray-500 flex items-center justify-center"
                        >
                          {dayLabel}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((dayDate, index) => {
                        if (!dayDate) {
                          return <span key={`blank-${index}`} className="h-9" />;
                        }

                        const dayValue = toDateInputValue(dayDate);
                        const isSelected = form.dueDate === dayValue;
                        const isPastDate = dayDate < today;

                        return (
                          <button
                            key={dayValue}
                            type="button"
                            disabled={isPastDate}
                            onClick={() => selectDueDate(dayDate)}
                            className={`h-9 rounded-lg text-sm font-medium transition-colors ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : isPastDate
                                  ? "text-gray-300 cursor-not-allowed"
                                  : "text-gray-700 hover:bg-blue-50"
                            }`}
                          >
                            {dayDate.getDate()}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => selectDueDate(today)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDatePickerOpen(false)}
                        className="text-xs font-medium text-gray-500 hover:text-gray-700"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-150 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !form.title.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : null}
                {isLoading ? "Saving…" : isEditing ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
