"use client";

import React, { useState } from "react";
import { X, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { ADMIN_ROLES, ASSIGNABLE_ADMIN_ROLES, roleLabel } from "@/lib/adminRoles";

export default function InviteAdminModal({ isOpen, onClose, onInvite, isPending }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(ADMIN_ROLES.MODERATOR);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email address is required.");
      return;
    }
    // simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    // Not cleared here — the parent unmounts this modal on success, so state
    // resets naturally. Clearing on submit would wipe the form on a failed
    // invite (duplicate email, SendGrid down) while the modal stays open.
    onInvite({
      email: email.trim(),
      role
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl border border-border-main shadow-xl overflow-hidden flex flex-col animate-scale-up">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-main">
          <h3 className="text-sm font-semibold text-text-primary">Invite admin user</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 rounded-full bg-text-primary text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs text-text-primary font-onest">

          {/* Email input */}
          <div className="space-y-1">
            <label className="text-xs text-text-primary block font-medium">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-border-main text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted/60"
            />
          </div>

          {/* Role selector */}
          <div className="space-y-1">
            <label className="text-xs text-text-primary block font-medium">
              Role <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-white border border-border-main text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary appearance-none cursor-pointer"
              >
                {ASSIGNABLE_ADMIN_ROLES.map((slug) => (
                  <option key={slug} value={slug}>{roleLabel(slug)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-text-muted pointer-events-none" />
            </div>
          </div>

          {/* Full width button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-primary-bg hover:opacity-90 text-white font-medium text-xs py-2.5 rounded-lg transition cursor-pointer text-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending && <Loader2 size={13} className="animate-spin" />}
            {isPending ? "Sending Invite..." : "Send Invite"}
          </button>
        </form>

      </div>
    </div>
  );
}
