"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { loginAPI } from "@/services/authService";
import { useAuthStore } from "@/store/useAuthStore";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async () => {
      // 1. Authenticate with backend Cloud Function
      const result = await loginAPI(email, password);
      
      // 2. Synchronize client-side Firebase Auth state to authorize Firestore requests
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (authError) {
        console.warn("Client-side Firebase Auth signin sync warning:", authError.message);
      }
      
      return result;
    },
    onSuccess: (result) => {
      // Save credentials in global Zustand store
      setAuth({
        token: result.idToken,
        uid: result.uid,
        role: result.role || "Admin",
        email: email,
      });

      // Initialize admin profile settings locally if not already set
      const storedProfile = localStorage.getItem("netly_admin_profile");
      if (!storedProfile) {
        const emailPrefix = email.split("@")[0];
        const capitalizedPrefix = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
        localStorage.setItem(
          "netly_admin_profile",
          JSON.stringify({
            firstName: capitalizedPrefix,
            lastName: "Admin",
            email: email,
            phone: "+1 (555) 019-2834",
          })
        );
      }

      toast.success("Successfully logged in!");
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Invalid email or password.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-lg font-medium text-text-primary">Welcome back</h1>
        <p className="text-xs text-text-muted">
          Sign in to manage articles, projects, and team members.
        </p>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-sm text-text-primary"
        >
          Email Address
        </label>
        <input
          id="email"
          type="email"
          placeholder="Enter your work email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loginMutation.isPending}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-bg/40 focus:border-primary-bg transition disabled:opacity-60"
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-sm text-text-primary"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loginMutation.isPending}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-bg/40 focus:border-primary-bg transition disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loginMutation.isPending}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs mt-2 text-red-400 hover:underline font-medium"
          >
            Forgot Password?
          </Link>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-bg py-2.5 mt-4 text-sm font-medium text-white hover:opacity-90 transition cursor-pointer disabled:opacity-60"
      >
        {loginMutation.isPending && <Loader2 size={16} className="animate-spin" />}
        {loginMutation.isPending ? "Signing In..." : "Sign In"}
      </button>
    </form>
  );
}
