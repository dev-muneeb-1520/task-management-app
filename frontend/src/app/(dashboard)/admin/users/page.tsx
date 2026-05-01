"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, AlertCircle, ChevronLeft, ChevronRight, Loader2, UserCheck, UserX } from "lucide-react";
import { useAdmin } from "@/features/admin/useAdmin";
import type { AdminGetUsersQuery } from "@/types/admin.types";
import { cn } from "@/lib/utils";
import CustomSelect from "@/components/ui/CustomSelect";

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700 ring-1 ring-purple-200",
  USER:  "bg-gray-100  text-gray-600  ring-1 ring-gray-200",
};

export default function AdminUsersPage() {
  const {
    users, pagination, isUsersLoading, isMutating, error,
    fetchUsers, updateUserStatus,
  } = useAdmin();

  const [query, setQuery] = useState<AdminGetUsersQuery>({ page: 1, limit: 10 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [sortBy, setSortBy] = useState<"createdAt" | "fullName" | "tasksAssigned">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isSearching, setIsSearching] = useState(false);

  const load = useCallback(
    (q: AdminGetUsersQuery) => fetchUsers(q).catch(() => undefined),
    [fetchUsers]
  );

  // Initial load
  useEffect(() => {
    const initialQuery: AdminGetUsersQuery = {
      page: 1,
      limit: query.limit,
      search: undefined,
      status: undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
    };
    setQuery(initialQuery);
    load(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced live search
  useEffect(() => {
    const normalizedSearch = search.trim() || undefined;
    if (normalizedSearch === query.search) return;

    const timer = setTimeout(() => {
      const next: AdminGetUsersQuery = {
        ...query,
        page: 1,
        limit: query.limit,
        search: normalizedSearch,
      };
      setQuery(next);
      load(next).finally(() => setIsSearching(false));
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const setPage = (page: number) => {
    const next = { ...query, page };
    setQuery(next);
    load(next);
  };

  const applyFiltersAndSort = useCallback(
    (
      nextStatus: "ALL" | "ACTIVE" | "INACTIVE",
      nextSortBy: "createdAt" | "fullName" | "tasksAssigned",
      nextSortOrder: "asc" | "desc"
    ) => {
      setIsSearching(true);
      const next: AdminGetUsersQuery = {
        page: 1,
        limit: query.limit,
        search: search.trim() || undefined,
        status: nextStatus === "ALL" ? undefined : nextStatus,
        sortBy: nextSortBy,
        sortOrder: nextSortOrder,
      };
      setQuery(next);
      load(next).finally(() => setIsSearching(false));
    },
    [load, query.limit, search]
  );

  const handleToggleStatus = async (id: string, current: boolean) => {
    await updateUserStatus(id, { isActive: !current });
  };

  const totalUsers = pagination?.total ?? users.length;
  const activeUsers = users.filter((user) => user.isActive).length;
  const inactiveUsers = Math.max(0, totalUsers - activeUsers);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white/95 shadow-sm p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Users</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage user activity and quickly access user detail pages.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200">
              {totalUsers} total
            </span>
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
              {activeUsers} active
            </span>
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600 ring-1 ring-gray-200">
              {inactiveUsers} inactive
            </span>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2.5 shadow-sm">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => {
              setIsSearching(true);
              setSearch(e.target.value);
            }}
            className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50/40 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 focus:bg-white transition"
          />
        </div>
        <div className="flex gap-2">
          <CustomSelect
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value as "ALL" | "ACTIVE" | "INACTIVE");
              applyFiltersAndSort(value as "ALL" | "ACTIVE" | "INACTIVE", sortBy, sortOrder);
            }}
            options={[
              { value: "ALL", label: "All status" },
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
            tone="purple"
            className="w-32"
            size="sm"
            usePortal={false}
          />
          <CustomSelect
            value={sortBy}
            onChange={(value) => {
              setSortBy(value as "createdAt" | "fullName" | "tasksAssigned");
              applyFiltersAndSort(statusFilter, value as "createdAt" | "fullName" | "tasksAssigned", sortOrder);
            }}
            options={[
              { value: "createdAt", label: "Newest" },
              { value: "fullName", label: "Name" },
              { value: "tasksAssigned", label: "Tasks" },
            ]}
            tone="purple"
            className="w-32"
            size="sm"
            usePortal={false}
          />
          <CustomSelect
            value={sortOrder}
            onChange={(value) => {
              setSortOrder(value as "asc" | "desc");
              applyFiltersAndSort(statusFilter, sortBy, value as "asc" | "desc");
            }}
            options={[
              { value: "desc", label: "Desc" },
              { value: "asc", label: "Asc" },
            ]}
            tone="purple"
            className="w-24"
            size="sm"
            usePortal={false}
          />
        </div>
        {search && (
          <button
            type="button"
            onClick={() => {
              setIsSearching(true);
              setSearch("");
            }}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {(isSearching || isUsersLoading) && (
        <div className="flex items-center gap-2 text-xs text-gray-500 transition-opacity duration-200">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Updating results...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm overflow-hidden">
        {isUsersLoading ? (
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-36 bg-gray-200 rounded-full" />
                  <div className="h-3 w-48 bg-gray-100 rounded-full" />
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400">No users found.</div>
        ) : (
          <div
            key={`${query.search ?? "all"}-${query.status ?? "all"}-${query.sortBy ?? "createdAt"}-${query.sortOrder ?? "desc"}-${pagination?.page ?? 1}`}
            className={cn(
              "divide-y divide-gray-100 transition-opacity duration-200",
              isSearching || isUsersLoading ? "opacity-70" : "opacity-100"
            )}
          >
            {users.map((user) => {
              const initials = user.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={user.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-linear-to-r hover:from-indigo-50/40 hover:to-purple-50/30 transition-colors"
                >
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-linear-to-br from-purple-500 to-indigo-600 shadow-sm flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>

                  {/* Tasks */}
                  <div className="hidden sm:flex flex-col items-end text-right shrink-0 min-w-13">
                    <span className="text-sm font-semibold text-gray-900">{user.tasksAssigned}</span>
                    <span className="text-xs text-gray-400">tasks</span>
                  </div>

                  {/* Role badge */}
                  <span className={cn("hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", ROLE_BADGE[user.role])}>
                    {user.role}
                  </span>

                  {/* Status badge */}
                  <span
                    className={cn(
                      "hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                      user.isActive
                        ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-gray-100 text-gray-500 ring-1 ring-gray-200"
                    )}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggleStatus(user.id, user.isActive)}
                      disabled={isMutating}
                      title={user.isActive ? "Deactivate" : "Activate"}
                      className={cn(
                        "h-8 w-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 ring-1 ring-transparent",
                        user.isActive
                          ? "text-gray-400 hover:text-rose-500 hover:bg-rose-50 hover:ring-rose-100"
                          : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 hover:ring-emerald-100"
                      )}
                    >
                      {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </button>

                    <Link
                      href={`/admin/users/${user.id}`}
                      className="h-8 px-3 inline-flex items-center rounded-lg text-xs font-semibold text-purple-600 bg-purple-50/60 hover:bg-purple-100 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(pagination.page - 1)}
              disabled={!pagination.hasPreviousPage || isUsersLoading}
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(pagination.page + 1)}
              disabled={!pagination.hasNextPage || isUsersLoading}
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
