"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle2, ArrowRight, Check, X } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import Spinner from "@/components/ui/Spinner";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PASSWORD_RULES = [
  { id: "length",  label: "At least 8 characters",   test: (p: string) => p.length >= 8 },
  { id: "upper",   label: "One uppercase letter",     test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower",   label: "One lowercase letter",     test: (p: string) => /[a-z]/.test(p) },
  { id: "number",  label: "One number",               test: (p: string) => /\d/.test(p) },
  { id: "special", label: "One special character",    test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const STRENGTH_CONFIG = [
  { label: "",            color: "bg-gray-200",    text: "text-gray-400"   },
  { label: "Very weak",   color: "bg-red-500",     text: "text-red-500"    },
  { label: "Weak",        color: "bg-orange-500",  text: "text-orange-500" },
  { label: "Fair",        color: "bg-yellow-500",  text: "text-yellow-600" },
  { label: "Strong",      color: "bg-blue-500",    text: "text-blue-600"   },
  { label: "Very strong", color: "bg-green-500",   text: "text-green-600"  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, isAuthenticated, clearError } = useAuth();

  const [form,              setForm]              = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [showPassword,      setShowPassword]      = useState(false);
  const [showConfirm,       setShowConfirm]       = useState(false);
  const [touched,           setTouched]           = useState({ fullName: false, email: false, password: false, confirmPassword: false });
  const [passwordFocused,   setPasswordFocused]   = useState(false);

  const passed   = PASSWORD_RULES.map((r) => r.test(form.password));
  const strength = passed.filter(Boolean).length;
  const allPassed = strength === PASSWORD_RULES.length;

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  const nameError           = touched.fullName        && form.fullName.trim().length < 2          ? "Full name must be at least 2 characters" : "";
  const emailError          = touched.email           && !EMAIL_REGEX.test(form.email)            ? "Enter a valid email address" : "";
  const passwordError       = touched.password        && !allPassed                               ? "Password doesn't meet all requirements" : "";
  const confirmPasswordError = touched.confirmPassword && form.confirmPassword !== form.password   ? "Passwords do not match" : "";
  const isValid = form.fullName.trim().length >= 2 && EMAIL_REGEX.test(form.email) && allPassed && form.confirmPassword === form.password && form.confirmPassword.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) =>
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });
    if (!isValid) return;
    await register({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      confirmPassword: form.confirmPassword,
    });
  };

  const inputBase  = "w-full h-12 rounded-xl border px-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200";
  const inputOk    = "border-gray-300 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100";
  const inputErr   = "border-red-400 bg-red-50/60 focus:border-red-500 focus:ring-2 focus:ring-red-100";

  return (
    <div className="min-h-screen flex">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[48%] bg-[#0f172a] relative overflow-hidden flex-col justify-between p-14">
        {/* glow orbs */}
        <div className="absolute -top-24 -right-24 w-105 h-105 rounded-full bg-purple-600/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/40">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">TaskFlow</span>
          </div>
        </div>

        {/* Copy */}
        <div className="relative z-10 animate-slide-in-left">
          <h2 className="text-4xl font-bold text-white leading-snug mb-4">
            Start organizing<br />
            <span className="text-purple-400">your work today.</span>
          </h2>
          <p className="text-slate-400 text-base mb-10 leading-relaxed">
            Join thousands who use TaskFlow to get things done.
          </p>

          {/* Testimonial */}
          <div
            className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            <div className="flex gap-0.5 mb-3">
              {[...Array(5)].map((_, i) => <span key={i} className="text-yellow-400 text-sm">★</span>)}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              &ldquo;TaskFlow transformed how I manage my projects. The interface is clean and my team loves it.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                SL
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Sarah L.</p>
                <p className="text-slate-500 text-xs">Product Manager</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 animate-fade-in" style={{ animationDelay: "500ms" }}>
          <p className="text-slate-500 text-xs">No credit card required · Free forever</p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 sm:py-12 bg-white overflow-y-auto">
        <div className="w-full max-w-105 animate-fade-in-up">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="h-8 w-8 rounded-xl bg-purple-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">TaskFlow</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-1">Create an account</h1>
          <p className="text-gray-500 text-sm mb-8">Get started with TaskFlow for free</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* API Error */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                <span className="shrink-0 text-base">⚠</span>
                {error}
              </div>
            )}

            {/* Full name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700">Full name</label>
              <input
                id="name" name="fullName" type="text" autoComplete="name"
                placeholder="John Doe"
                value={form.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${inputBase} ${nameError ? inputErr : inputOk}`}
              />
              {nameError && <p className="text-xs text-red-600 flex items-center gap-1"><span>⚠</span> {nameError}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email address</label>
              <input
                id="email" name="email" type="email" autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${inputBase} ${emailError ? inputErr : inputOk}`}
              />
              {emailError && <p className="text-xs text-red-600 flex items-center gap-1"><span>⚠</span> {emailError}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">Password</label>
              <div className="relative">
                <input
                  id="password" name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={(e) => { handleBlur(e); setPasswordFocused(false); }}
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

              {/* Strength bar — only show when user is typing */}
              {form.password.length > 0 && (
                <div className="space-y-1.5 animate-fade-in">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? STRENGTH_CONFIG[strength].color : "bg-gray-200"}`}
                      />
                    ))}
                  </div>
                  {strength > 0 && (
                    <p className={`text-xs font-semibold ${STRENGTH_CONFIG[strength].text}`}>
                      {STRENGTH_CONFIG[strength].label}
                    </p>
                  )}
                </div>
              )}

              {/* Password rules checklist */}
              {(passwordFocused || form.password.length > 0 || touched.password) && (
                <div className="grid grid-cols-1 gap-1.5 p-3 bg-gray-50 rounded-xl border border-gray-100 animate-fade-in">
                  {PASSWORD_RULES.map((rule, i) => (
                    <div key={rule.id} className="flex items-center gap-2.5">
                      <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${passed[i] ? "bg-green-100" : "bg-gray-200"}`}>
                        {passed[i]
                          ? <Check className="h-2.5 w-2.5 text-green-600" />
                          : <X    className="h-2.5 w-2.5 text-gray-400" />
                        }
                      </div>
                      <span className={`text-xs transition-colors duration-200 ${passed[i] ? "text-green-700 font-medium" : "text-gray-500"}`}>
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {passwordError && (
                <p className="text-xs text-red-600 flex items-center gap-1"><span>⚠</span> {passwordError}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">Confirm password</label>
              <div className="relative">
                <input
                  id="confirmPassword" name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${inputBase} pr-11 ${confirmPasswordError ? inputErr : form.confirmPassword.length > 0 && form.confirmPassword === form.password ? "border-green-400 bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100" : inputOk}`}
                />
                <button
                  type="button" tabIndex={-1}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Match indicator */}
              {form.confirmPassword.length > 0 && (
                <div className="flex items-center gap-1.5 animate-fade-in">
                  {form.confirmPassword === form.password ? (
                    <>
                      <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <Check className="h-2.5 w-2.5 text-green-600" />
                      </div>
                      <span className="text-xs text-green-700 font-medium">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <div className="h-4 w-4 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <X className="h-2.5 w-2.5 text-red-500" />
                      </div>
                      <span className="text-xs text-red-600">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
              {confirmPasswordError && (
                <p className="text-xs text-red-600 flex items-center gap-1"><span>⚠</span> {confirmPasswordError}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
            >
              {isLoading ? <Spinner /> : (
                <>
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
