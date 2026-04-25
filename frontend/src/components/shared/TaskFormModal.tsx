"use client";

import { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { useTasks } from "@/features/tasks/useTasks";
import type { Task, TaskPriority, TaskStatus } from "@/types/task.types";

interface Props {
  onClose: () => void;
  initialData?: Task;
}

export default function TaskFormModal({ onClose, initialData }: Props) {
  const { createTask, updateTask, error, clearError } = useTasks();
  const isEditing = Boolean(initialData);

  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title:       initialData?.title       ?? "",
    description: initialData?.description ?? "",
    priority:    initialData?.priority    ?? ("MEDIUM" as TaskPriority),
    status:      initialData?.status      ?? ("TODO"   as TaskStatus),
    dueDate:     initialData?.dueDate
      ? new Date(initialData.dueDate).toISOString().split("T")[0]
      : "",
  });

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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up overflow-hidden">
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
                <select
                  id="priority"
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition cursor-pointer bg-white"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition cursor-pointer bg-white"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
            </div>

            {/* Due date */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Due date <span className="text-red-500">*</span>
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
              />
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
