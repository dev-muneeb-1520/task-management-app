"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  LogOut,
  CheckCircle2,
  ChevronRight,
  Users,
  Bell,
} from "lucide-react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/useAuth";

const userNavItems = [
  { href: "/dashboard",       label: "Dashboard",   icon: LayoutDashboard },
  { href: "/dashboard/tasks", label: "My Tasks",    icon: CheckSquare },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
];

const adminMenuItems = [
  { href: "/admin",           label: "Dashboard",   icon: LayoutDashboard },
  { href: "/dashboard/tasks", label: "Users Tasks", icon: CheckSquare },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
];

const adminSectionItems = [
  { href: "/admin/users", label: "Users", icon: Users },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname   = usePathname();
  const router     = useRouter();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.replace("/login");
  };

  return (
    <aside className="flex flex-col w-64 h-screen sticky top-0 overflow-y-auto bg-gray-900 border-r border-gray-800 shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center justify-between">
        <Link href={user?.role === "ADMIN" ? "/admin" : "/dashboard"} onClick={onClose} className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">TaskFlow</span>
        </Link>
              {onClose && (
                <button
                  onClick={onClose}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        <p className="px-3 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
          Menu
        </p>
        {(user?.role === "ADMIN" ? adminMenuItems : userNavItems).map(({ href, label, icon: Icon }) => {
          // Use exact match for top-level dashboard/admin routes so nested routes don't double-highlight.
          const isExactMatchRoute = href === "/admin" || href === "/dashboard";
          const isActive = isExactMatchRoute
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("h-5 w-5 shrink-0 transition-transform duration-200", !isActive && "group-hover:scale-110")} />
                {label}
              </div>
              {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
            </Link>
          );
        })}

        {user?.role === "ADMIN" && (
          <>
            <p className="px-3 mt-4 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
              Admin
            </p>
            {adminSectionItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={cn(
                    "group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-5 w-5 shrink-0 transition-transform duration-200", !isActive && "group-hover:scale-110")} />
                    {label}
                  </div>
                  {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-800/60 mb-2">
          <div className="h-8 w-8 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="group flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 disabled:opacity-50"
        >
          <LogOut className={cn("h-4 w-4 shrink-0 transition-transform duration-300", loggingOut ? "animate-spin" : "group-hover:-translate-x-0.5")} />
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
