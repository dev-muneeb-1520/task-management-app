"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle2, ArrowRight, Zap, Shield, Users } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import Spinner from "@/components/ui/Spinner";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const features = [
  { icon: Zap,    text: "Smart task prioritization" },
  { icon: Shield, text: "Secure & private workspace" },
  { icon: Users,  text: "Built for teams & individuals" },
];

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const { login, isLoading, error, isAuthenticated, clearError } = useAuth();

  const [form,          setForm]          = useState({ email: "", password: "" });
  const [showPassword,  setShowPassword]  = useState(false);
  const [touched,       setTouched]       = useState({ email: false, password: false });
  const [passwordFocused, setPasswordFocused] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.replace(redirect);
    }
  }, [isAuthenticated, router, searchParams]);

  const emailError    = touched.email    && !EMAIL_REGEX.test(form.email)  ? "Enter a valid email address" : "";
  const passwordError = touched.password && form.password.length === 0 ? "Password is required" : "";
  const isValid = EMAIL_REGEX.test(form.email) && form.password.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
    if (e.target.name === "password") setPasswordFocused(false);
  };
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.name === "password") setPasswordFocused(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isValid) return;
    await login(form);
  };

  const inputBase =
    "w-full h-12 rounded-xl border px-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200";
  const inputOk   = "border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  const inputErr  = "border-red-400 bg-red-50/60 focus:border-red-500 focus:ring-2 focus:ring-red-100";

  return (
    <div className="min-h-screen flex">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[48%] bg-[#0f172a] relative overflow-hidden flex-col justify-between p-14">
        {/* glow orbs */}
        <div className="absolute -top-24 -left-24 w-105 h-105 rounded-full bg-blue-600/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/40">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">TaskFlow</span>
          </div>
        </div>

        {/* Copy */}
        <div className="relative z-10 animate-slide-in-left">
          <h2 className="text-4xl font-bold text-white leading-snug mb-4">
            Manage tasks,<br />
            <span className="text-blue-400">ship faster.</span>
          </h2>
          <p className="text-slate-400 text-base mb-10 leading-relaxed">
            Your all-in-one workspace for tracking work that matters.
          </p>
          <div className="space-y-4">
            {features.map(({ icon: Icon, text }, i) => (
              <div
                key={text}
                className="flex items-center gap-3 animate-fade-in-up"
                style={{ animationDelay: `${i * 100 + 200}ms` }}
              >
                <div className="h-9 w-9 rounded-xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-slate-300 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 animate-fade-in" style={{ animationDelay: "600ms" }} />
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 sm:py-12 bg-white overflow-y-auto">
        <div className="w-full max-w-105 animate-fade-in-up">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">TaskFlow</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm mb-8">Sign in to continue to your workspace</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* API Error */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                <span className="shrink-0 text-base">⚠</span>
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Email address
              </label>
              <input
                id="email" name="email" type="email" autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${inputBase} ${emailError ? inputErr : inputOk}`}
              />
              {emailError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <span>⚠</span> {emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password" name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  ref={passwordRef}
                  className={`${inputBase} pr-11 ${passwordError ? inputErr : inputOk}`}
                />
                <button
                  type="button" tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordFocused && form.password.length === 0 && (
                <p className="text-xs text-gray-500">Enter your account password.</p>
              )}
              {passwordError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <span>⚠</span> {passwordError}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
            >
              {isLoading ? <Spinner /> : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              Create one
            </Link>
          </p>

          <p className="mt-3 text-center text-xs text-gray-400">
            Are you an admin?{" "}
            <Link href="/admin/login" className="text-purple-600 hover:text-purple-700 font-semibold transition-colors">
              Admin sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function LoginPageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        <p className="text-sm text-gray-400">Preparing sign in…</p>
      </div>
    </div>
  );
}
