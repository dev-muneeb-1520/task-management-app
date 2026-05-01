"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, AlertCircle, UserCheck, UserX, CheckSquare, Clock,
} from "lucide-react";
import { useAdmin } from "@/features/admin/useAdmin";
import TaskFormModal from "@/components/shared/TaskFormModal";
import { cn } from "@/lib/utils";

const PRIORITY_BADGE: Record<string, string> = {
  HIGH:   "bg-rose-100   text-rose-700   ring-1 ring-rose-200",
  MEDIUM: "bg-amber-100  text-amber-700  ring-1 ring-amber-200",
  LOW:    "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
};

const STATUS_BADGE: Record<string, string> = {
  TODO:        "bg-gray-100  text-gray-600  ring-1 ring-gray-200",
  IN_PROGRESS: "bg-blue-100  text-blue-700  ring-1 ring-blue-200",
  DONE:        "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
};

const STATUS_LABEL: Record<string, string> = {
  TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done",
};

export default function AdminUserDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const id       = params.id as string;

  const {
    userDetail, isDetailLoading, isMutating, error,
    fetchUserById, updateUserStatus, clearUserDetail,
  } = useAdmin();

  const [showTaskModal, setShowTaskModal] = useState(false);

  useEffect(() => {
    fetchUserById(id).catch(() => undefined);
    return () => { clearUserDetail(); };
  }, [id, fetchUserById, clearUserDetail]);

  const handleToggleStatus = async () => {
    if (!userDetail) return;
    await updateUserStatus(id, { isActive: !userDetail.isActive });
    fetchUserById(id).catch(() => undefined);
  };

  if (isDetailLoading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-5 w-28 bg-gray-200 rounded-full" />
        <div className="h-36 bg-gray-200 rounded-2xl" />
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-48 bg-gray-200 rounded-2xl" />
          <div className="h-48 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
        <button onClick={() => router.back()} className="mt-4 text-sm text-purple-600 hover:underline">
          ← Go back
        </button>
      </div>
    );
  }

  if (!userDetail) return null;

  const initials = userDetail.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Back link */}
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>

        {/* Profile card */}
        <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{userDetail.fullName}</h1>
            <p className="text-sm text-gray-500 truncate">{userDetail.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                  userDetail.role === "ADMIN"
                    ? "bg-purple-100 text-purple-700 ring-1 ring-purple-200"
                    : "bg-gray-100 text-gray-600 ring-1 ring-gray-200"
                )}
              >
                {userDetail.role}
              </span>
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                  userDetail.isActive
                    ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-gray-100 text-gray-500 ring-1 ring-gray-200"
                )}
              >
                {userDetail.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400 shrink-0">
            Joined {new Date(userDetail.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </p>
        </div>

        {/* Stats + controls */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Stats */}
          <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Stats</h2>
            <div className="divide-y divide-gray-100">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckSquare className="h-4 w-4 text-blue-500" />
                  Tasks assigned
                </div>
                <span className="text-sm font-semibold text-gray-900">{userDetail.stats.tasksAssigned}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-purple-500" />
                  Tasks created
                </div>
                <span className="text-sm font-semibold text-gray-900">{userDetail.stats.tasksCreated}</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Controls</h2>
            <div className="space-y-3">
              {/* Status toggle */}
              <button
                onClick={handleToggleStatus}
                disabled={isMutating}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50",
                  userDetail.isActive
                    ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                )}
              >
                {userDetail.isActive ? (
                  <><UserX className="h-4 w-4" /> Deactivate account</>
                ) : (
                  <><UserCheck className="h-4 w-4" /> Activate account</>
                )}
              </button>

              {/* Create task for user */}
              <button
                onClick={() => setShowTaskModal(true)}
                className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
              >
                <CheckSquare className="h-4 w-4" />
                Create task for this user
              </button>
            </div>
          </div>
        </div>

        {/* Recent tasks */}
        {userDetail.recentTasks.length > 0 && (
          <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Recent Tasks</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {userDetail.recentTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    {task.dueDate && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Due {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  <span className={cn("shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold", PRIORITY_BADGE[task.priority])}>
                    {task.priority}
                  </span>
                  <span className={cn("shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold", STATUS_BADGE[task.status])}>
                    {STATUS_LABEL[task.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showTaskModal && (
        <TaskFormModal
          onClose={() => setShowTaskModal(false)}
          preselectedUserId={userDetail.id}
        />
      )}
    </>
  );
}
