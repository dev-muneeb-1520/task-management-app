"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2, Clock, AlertTriangle, ListTodo,
  TrendingUp, ArrowRight, CalendarDays, Flame,
} from "lucide-react";
import { useTasks } from "@/features/tasks/useTasks";
import { useAuth } from "@/features/auth/useAuth";
import type { DashboardTaskPreview, TaskPriority } from "@/types/task.types";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function isOverdue(t: DashboardTaskPreview) {
  return t.dueDate && t.status !== "DONE" && new Date(t.dueDate) < new Date();
}

const priorityConfig: Record<TaskPriority, { label: string; bar: string; text: string; bg: string }> = {
  HIGH:   { label: "High",   bar: "bg-red-500",    text: "text-red-600",    bg: "bg-red-50"    },
  MEDIUM: { label: "Medium", bar: "bg-yellow-500", text: "text-yellow-600", bg: "bg-yellow-50" },
  LOW:    { label: "Low",    bar: "bg-green-500",  text: "text-green-600",  bg: "bg-green-50"  },
};

export default function DashboardPage() {
  const { user, isInitialized, isAuthenticated } = useAuth();
  const { dashboard, isDashboardLoading, error, fetchTaskDashboard } = useTasks();

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;
    void fetchTaskDashboard().catch(() => {});
  }, [fetchTaskDashboard, isAuthenticated, isInitialized]);

  const statsData = dashboard?.stats;
  const completion = dashboard?.completionRate;
  const priorityBreakdown = dashboard?.priorityBreakdown;
  const statusBreakdown = dashboard?.statusBreakdown;
  const recentTasks = dashboard?.recentTasks ?? [];
  const attentionNeeded = dashboard?.attentionNeeded ?? [];

  const total = completion?.total ?? 0;
  const done = completion?.done ?? 0;
  const pct = completion?.percentage ?? 0;
  const inProgress = statsData?.inProgress ?? 0;
  const highCount = statsData?.highPriority ?? 0;
  const medCount = priorityBreakdown?.medium.count ?? 0;
  const lowCount = priorityBreakdown?.low.count ?? 0;

  const stats = [
    { label: "Total Tasks",   value: statsData?.totalTasks ?? 0, icon: ListTodo,      color: "bg-blue-500",   ring: "ring-blue-100",  text: "text-blue-600"  },
    { label: "Completed",     value: statsData?.completed ?? 0, icon: CheckCircle2,  color: "bg-green-500",  ring: "ring-green-100", text: "text-green-600" },
    { label: "In Progress",   value: inProgress, icon: TrendingUp,    color: "bg-indigo-500", ring: "ring-indigo-100",text: "text-indigo-600"},
    { label: "High Priority", value: highCount, icon: Flame,         color: "bg-red-500",    ring: "ring-red-100",   text: "text-red-600"   },
  ];

  // SVG ring
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (pct / 100) * circumference;

  if (isDashboardLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="text-sm text-gray-400">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? "Unable to load dashboard at the moment."}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold text-gray-900">
          {getGreeting()}, {user?.fullName?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="mt-1 text-gray-500 text-sm">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, ring, text }, i) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-in-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center shadow-sm`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ${ring} ${text} bg-white`}>
                {total > 0 && label !== "Total Tasks" ? `${Math.round((value / total) * 100)}%` : "—"}
              </span>
            </div>
            <p className={`text-3xl font-bold ${text}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Middle row: progress + priority ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Progress ring */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "320ms" }}>
          <svg width="100" height="100" className="-rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="10" />
            <circle
              cx="50" cy="50" r={radius} fill="none"
              stroke="url(#prog)" strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              className="transition-all duration-700"
            />
            <defs>
              <linearGradient id="prog" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="text-center -mt-2">
            <p className="text-4xl font-bold text-gray-900">{pct}%</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Completion rate</p>
            <p className="text-xs text-gray-500 mt-1">{done} of {total} tasks done</p>
          </div>
        </div>

        {/* Priority breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <h2 className="text-sm font-bold text-gray-700 mb-5 uppercase tracking-wider">Priority Breakdown</h2>
          <div className="space-y-4">
            {(["HIGH", "MEDIUM", "LOW"] as TaskPriority[]).map((p) => {
              const count = p === "HIGH" ? highCount : p === "MEDIUM" ? medCount : lowCount;
              const cfg   = priorityConfig[p];
              const pctBar =
                p === "HIGH"
                  ? priorityBreakdown?.high.percentage ?? 0
                  : p === "MEDIUM"
                    ? priorityBreakdown?.medium.percentage ?? 0
                    : priorityBreakdown?.low.percentage ?? 0;
              return (
                <div key={p}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                    <span className="text-xs text-gray-400">{count} tasks · {pctBar}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cfg.bar} transition-all duration-700`}
                      style={{ width: `${pctBar}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-gray-100">
            {[
              { label: "To Do",       count: statusBreakdown?.todo ?? 0,       color: "text-gray-700",   dot: "bg-gray-400"   },
              { label: "In Progress", count: statusBreakdown?.inProgress ?? 0, color: "text-indigo-600", dot: "bg-indigo-500" },
              { label: "Done",        count: statusBreakdown?.done ?? 0,       color: "text-green-600",  dot: "bg-green-500"  },
            ].map(({ label, count, color, dot }) => (
              <div key={label} className="text-center">
                <div className={`flex items-center justify-center gap-1 mb-1`}>
                  <span className={`h-2 w-2 rounded-full ${dot} shrink-0`} />
                  <span className="text-xs text-gray-400">{label}</span>
                </div>
                <p className={`text-xl font-bold ${color}`}>{count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom row: recent tasks + alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: "480ms" }}>

        {/* Recent tasks */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Recent Tasks</h2>
            <Link
              href="/dashboard/tasks"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors group"
            >
              View all <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          {recentTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <ListTodo className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">No tasks yet</p>
              <p className="text-xs text-gray-400 mt-1">Create your first task on the Tasks page</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recentTasks.map((task) => {
                const statusIcon = task.status === "DONE"
                  ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  : task.status === "IN_PROGRESS"
                  ? <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
                  : <ListTodo className="h-4 w-4 text-gray-400 shrink-0" />;
                return (
                  <li key={task.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50/80 transition-colors">
                    {statusIcon}
                    <span className={`flex-1 text-sm truncate ${task.status === "DONE" ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {task.dueDate && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        task.priority === "HIGH"   ? "bg-red-50 text-red-600" :
                        task.priority === "MEDIUM" ? "bg-yellow-50 text-yellow-600" :
                        "bg-green-50 text-green-600"}`}>
                        {task.priority}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Attention Needed</h2>
          </div>
          {attentionNeeded.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <div className="h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm font-semibold text-gray-700">All clear!</p>
              <p className="text-xs text-gray-400 mt-1">No overdue or upcoming tasks</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {attentionNeeded.map((task) => {
                const overdue = isOverdue(task);
                return (
                  <li
                    key={task.id}
                    className={`flex items-start gap-3 px-5 py-3.5 transition-colors ${
                      overdue
                        ? "bg-red-50/50 hover:bg-red-50"
                        : "bg-yellow-50/50 hover:bg-yellow-50"
                    }`}
                  >
                    {overdue ? (
                      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold truncate ${
                          overdue ? "text-red-700" : "text-yellow-700"
                        }`}
                      >
                        {task.title}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${
                          overdue ? "text-red-400" : "text-yellow-500"
                        }`}
                      >
                        {overdue ? "Overdue" : "Needs attention"}
                        {task.dueDate
                          ? ` · ${new Date(task.dueDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}`
                          : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
