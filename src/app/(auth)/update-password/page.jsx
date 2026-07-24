"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Key, Check, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { updatePasswordAPI } from "@/services/authService";

function UpdatePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Extract token/oobCode from search parameters
  const token = searchParams.get("oobCode") || searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Strength indicators helper
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const isLongEnough = newPassword.length >= 12;
  const passwordsMatch = newPassword && newPassword === confirmPassword;
  
  const isPasswordValid = hasUppercase && hasLowercase && hasNumber && isLongEnough && passwordsMatch;

  const updatePasswordMutation = useMutation({
    mutationFn: () => updatePasswordAPI(token, newPassword),
    onSuccess: () => {
      toast.success("Password updated successfully! Please log in with your new password.");
      router.push("/login");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update password. Link may be expired.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Invalid or missing password reset verification token.");
      return;
    }
    if (!isPasswordValid) {
      toast.error("Please ensure all password requirements are met.");
      return;
    }
    updatePasswordMutation.mutate();
  };

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center text-red-500">
          <AlertCircle size={48} />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-medium text-text-primary">Invalid Reset Link</h1>
          <p className="text-xs text-text-muted">
            The password reset token is missing or invalid. Please request a new password reset link.
          </p>
        </div>
        <div className="text-center pt-2">
          <Link
            href="/forgot-password"
            className="text-xs text-primary-bg hover:underline font-medium"
          >
            Request Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-lg font-medium text-text-primary">Update your password</h1>
        <p className="text-xs text-text-muted">
          Please enter and confirm your new password below.
        </p>
      </div>

      {/* New Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="new-password"
          className="block text-sm text-text-primary"
        >
          New Password
        </label>
        <div className="relative">
          <input
            id="new-password"
            type={showNew ? "text" : "password"}
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={updatePasswordMutation.isPending}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-bg/40 focus:border-primary-bg transition disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            disabled={updatePasswordMutation.isPending}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
          >
            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="confirm-password"
          className="block text-sm text-text-primary"
        >
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="confirm-password"
            type={showConfirm ? "text" : "password"}
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={updatePasswordMutation.isPending}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-bg/40 focus:border-primary-bg transition disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            disabled={updatePasswordMutation.isPending}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Password requirements checker */}
      <div className="bg-page-bg rounded-2xl p-3 border border-border-main/50 space-y-2 text-xs">
        <span className="text-[10px] text-text-muted block font-medium">Password Requirements:</span>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${isLongEnough ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
              <Check size={10} strokeWidth={3} />
            </span>
            <span className={isLongEnough ? "text-text-primary" : "text-text-muted"}>Min 12 characters</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${hasUppercase ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
              <Check size={10} strokeWidth={3} />
            </span>
            <span className={hasUppercase ? "text-text-primary" : "text-text-muted"}>One uppercase letter</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${hasLowercase ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
              <Check size={10} strokeWidth={3} />
            </span>
            <span className={hasLowercase ? "text-text-primary" : "text-text-muted"}>One lowercase letter</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${hasNumber ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
              <Check size={10} strokeWidth={3} />
            </span>
            <span className={hasNumber ? "text-text-primary" : "text-text-muted"}>One numeric digit</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 pt-1.5 border-t border-border-main/50 text-[10px]">
          <span className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${passwordsMatch ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
            <Check size={10} strokeWidth={3} />
          </span>
          <span className={passwordsMatch ? "text-text-primary" : "text-text-muted"}>Passwords match</span>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={updatePasswordMutation.isPending || !isPasswordValid}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-bg py-2.5 text-sm font-medium text-white hover:opacity-90 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {updatePasswordMutation.isPending && <Loader2 size={16} className="animate-spin" />}
        {updatePasswordMutation.isPending ? "Updating Password..." : "Update Password"}
      </button>
    </form>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <Loader2 size={32} className="animate-spin text-primary-bg" />
          <span className="text-xs text-text-muted">Loading page...</span>
        </div>
      }
    >
      <UpdatePasswordForm />
    </Suspense>
  );
}
