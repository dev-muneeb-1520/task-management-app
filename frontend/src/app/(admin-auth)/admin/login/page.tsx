"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ShieldCheck, Lock, BarChart3, Users, ArrowLeft } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const features = [
  { icon: BarChart3, text: "Platform-wide analytics & insights" },
  { icon: Users,     text: "Manage all users and their tasks"   },
  { icon: Lock,      text: "Full control over task assignments"  },
];

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AdminLoginSkeleton />}>
      <AdminLoginContent />
    </Suspense>
  );
}

function AdminLoginContent() {
  const router = useRouter();
  const { login, logout, isLoading, error, isAuthenticated, user, clearError } = useAuth();

  const [form,         setForm]         = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [touched,      setTouched]      = useState({ email: false, password: false });
  const [accessDenied, setAccessDenied] = useState(false);
  const redirectedRef = useRef(false);

  // After login succeeds, check if the user is actually an admin
  useEffect(() => {
    if (!isAuthenticated || !user || redirectedRef.current) return;

    if (user.role === "ADMIN") {
      redirectedRef.current = true;
      router.replace("/admin");
    } else {
      // Logged in but not admin — sign them out and show denial message
      setAccessDenied(true);
      void logout();
    }
  }, [isAuthenticated, user, router, logout]);

  const emailError    = touched.email    && !EMAIL_REGEX.test(form.email) ? "Enter a valid email address" : "";
  const passwordError = touched.password && form.password.length === 0    ? "Password is required"        : "";
  const isValid       = EMAIL_REGEX.test(form.email) && form.password.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setAccessDenied(false);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isValid) return;
    setAccessDenied(false);
    await login(form);
  };

  const inputBase = "w-full h-12 rounded-xl border px-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200";
  const inputOk   = "border-gray-600/40 bg-white/10 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20";
  const inputErr  = "border-red-400/60 bg-red-900/20 text-white placeholder-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-400/20";

  const displayError = accessDenied
    ? "Access denied — this account does not have admin privileges."
    : error;

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[48%] bg-[#1e0a3c] relative overflow-hidden flex-col justify-between p-14">
        {/* glow orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-purple-600/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/40">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">TaskFlow Admin</span>
          </div>
        </div>

        {/* Copy */}
        <div className="relative z-10 animate-slide-in-left">
          <h2 className="text-4xl font-bold text-white leading-snug mb-4">
            Admin control<br />
            <span className="text-purple-400">centre.</span>
          </h2>
          <p className="text-purple-200/70 text-base mb-10 leading-relaxed">
            Sign in to manage your team, assign tasks, and track overall progress.
          </p>
          <div className="space-y-4">
            {features.map(({ icon: Icon, text }, i) => (
              <div
                key={text}
                className="flex items-center gap-3 animate-fade-in-up"
                style={{ animationDelay: `${i * 100 + 200}ms` }}
              >
                <div className="h-9 w-9 rounded-xl bg-purple-600/20 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-purple-400" />
                </div>
                <span className="text-purple-100/80 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 animate-fade-in" style={{ animationDelay: "600ms" }} />
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 sm:py-12 bg-[#130828] overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-8 w-8 rounded-xl bg-purple-600 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">TaskFlow Admin</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Admin sign in</h1>
            <p className="mt-1.5 text-sm text-purple-200/60">
              Use your administrator credentials to continue.
            </p>
          </div>

          {/* Error / access denied */}
          {displayError && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-300 animate-fade-in">
              {displayError}
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-purple-200/70 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="admin@example.com"
                autoComplete="email"
                className={`${inputBase} ${emailError ? inputErr : inputOk}`}
              />
              {emailError && (
                <p className="mt-1.5 text-xs text-red-400">{emailError}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-purple-200/70 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`${inputBase} pr-11 ${passwordError ? inputErr : inputOk}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300/60 hover:text-purple-200 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1.5 text-xs text-red-400">{passwordError}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-purple-600 text-white text-sm font-semibold shadow-lg shadow-purple-900/40 hover:bg-purple-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-purple-300 border-t-white animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in as Admin"
              )}
            </button>
          </form>

          {/* Back to user login */}
          <p className="mt-6 text-center text-xs text-purple-200/40">
            Not an admin?{" "}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1 transition-colors">
              <ArrowLeft className="h-3 w-3" />
              Back to user login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function AdminLoginSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#130828]">
      <div className="h-8 w-8 rounded-full border-2 border-purple-700 border-t-purple-400 animate-spin" />
    </div>
  );
}
