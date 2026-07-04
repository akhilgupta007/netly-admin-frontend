"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    // API call will be added later
    console.log("Reset link sent to:", email);
    router.push("/check-email");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-lg font-medium text-text-primary">
          Forgot your password?
        </h1>
        <p className="text-xs text-text-muted">
          Enter your email to receive a reset link.
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
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-bg/40 focus:border-primary-bg transition"
        />
      </div>

      <div className="space-y-4">
        {/* Submit */}
        <button
          type="submit"
          className="w-full rounded-xl bg-primary-bg py-2.5 text-sm font-medium text-white hover:opacity-90 transition cursor-pointer"
        >
          Send Reset Link
        </button>

        {/* Back to login */}
        <div className="text-center">
          <Link
            href="/login"
            className="text-xs text-primary-bg hover:underline font-medium"
          >
            Back to Log In
          </Link>
        </div>
      </div>
    </form>
  );
}
