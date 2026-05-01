"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Users,
  CheckSquare,
  TrendingUp,
  UserCheck,
  UserX,
  AlertCircle,
  ArrowRight,
  Plus,
} from "lucide-react";
import { useAdmin } from "@/features/admin/useAdmin";

export default function AdminDashboardPage() {
  const { stats, isStatsLoading, error, fetchStats } = useAdmin();

  useEffect(() => {
    fetchStats().catch(() => undefined);
  }, [fetchStats]);

  if (isStatsLoading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
            ))}
          </div>
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
      </div>
    );
  }

  const userCards = [
    {
      label: "Total Users",
      value: stats?.users.total ?? 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      ring: "ring-blue-200",
    },
    {
      label: "Active Users",
      value: stats?.users.active ?? 0,
      icon: UserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      ring: "ring-emerald-200",
    },
    {
      label: "Inactive Users",
      value: stats?.users.inactive ?? 0,
      icon: UserX,
      color: "text-rose-500",
      bg: "bg-rose-50",
      ring: "ring-rose-200",
    },
    {
      label: "New Today",
      value: stats?.users.newToday ?? 0,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
      ring: "ring-purple-200",
    },
  ];

  const taskCards = [
    {
      label: "Total Tasks",
      value: stats?.tasks.total ?? 0,
      icon: CheckSquare,
      color: "text-blue-600",
      bg: "bg-blue-50",
      ring: "ring-blue-200",
    },
    {
      label: "Completed",
      value: stats?.tasks.completed ?? 0,
      icon: CheckSquare,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      ring: "ring-emerald-200",
    },
    {
      label: "In Progress",
      value: stats?.tasks.inProgress ?? 0,
      icon: CheckSquare,
      color: "text-amber-500",
      bg: "bg-amber-50",
      ring: "ring-amber-200",
    },
    {
      label: "Completion Rate",
      value: `${Math.round(stats?.tasks.completionRate ?? 0)}%`,
      icon: TrendingUp,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      ring: "ring-indigo-200",
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Platform-wide overview</p>
        </div>
        <Link
          href="/admin/users"
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors"
        >
          <Users className="h-4 w-4" />
          Manage Users
        </Link>
      </div>

      {/* User stats */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">Users</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {userCards.map(({ label, value, icon: Icon, color, bg, ring }) => (
            <div key={label} className={`rounded-2xl p-5 bg-white ring-1 ${ring} shadow-sm`}>
              <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Task stats */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">Tasks</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {taskCards.map(({ label, value, icon: Icon, color, bg, ring }) => (
            <div key={label} className={`rounded-2xl p-5 bg-white ring-1 ${ring} shadow-sm`}>
              <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Today at a glance */}
      {stats && (
        <section className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm p-5 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Today at a glance</h3>
            <div className="divide-y divide-gray-100">
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-500">New users registered</span>
                <span className="font-semibold text-gray-900">{stats.users.newToday}</span>
              </div>
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-500">Tasks created today</span>
                <span className="font-semibold text-gray-900">{stats.tasks.createdToday}</span>
              </div>
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-500">Platform completion rate</span>
                <span className="font-semibold text-emerald-600">
                  {Math.round(stats.tasks.completionRate)}%
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm p-5 flex flex-col justify-between">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Quick actions</h3>
            <div className="space-y-2">
              <Link
                href="/admin/users"
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 hover:bg-purple-50 hover:text-purple-700 transition-colors text-sm font-medium text-gray-700 group"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  View all users
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href="/dashboard/tasks"
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-700 transition-colors text-sm font-medium text-gray-700 group"
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create a task
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
