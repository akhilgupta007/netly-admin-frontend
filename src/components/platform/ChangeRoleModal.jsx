"use client";

import React, { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import {
  ADMIN_ROLES,
  ASSIGNABLE_ADMIN_ROLES,
  roleLabel,
} from "@/lib/adminRoles";

export default function ChangeRoleModal({ user, isOpen, onClose, onChangeRole }) {
  // Slugs, not labels. The options used to carry display text ("Finance
  // Admin"), which meant two things: the current role — stored as a slug —
  // matched no option, so the select fell back to the first one and showed
  // Finance Admin for everybody; and submitting sent the label to
  // updateAdminRole, which only accepts slugs and rejected it.
  const [role, setRole] = useState(ADMIN_ROLES.MODERATOR);
  const [lastUid, setLastUid] = useState(user?.uid ?? null);

  // Adjusted during render rather than in an effect: an effect ran a pass late,
  // so the select briefly showed the previous admin's role when the modal was
  // reopened on a different row.
  if ((user?.uid ?? null) !== lastUid) {
    setLastUid(user?.uid ?? null);
    setRole(user?.role || ADMIN_ROLES.MODERATOR);
  }

  if (!isOpen || !user) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onChangeRole(user, role);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl border border-border-main shadow-xl overflow-hidden flex flex-col animate-scale-up">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-main">
          <h3 className="text-base font-semibold text-text-primary">Change Role</h3>
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
          {/* User details card */}
          <div className="rounded-xl p-3 border border-border-main">
            <h4 className="text-xs text-text-primary">{user.name}</h4>
            <p className="text-[10px] mt-2 text-text-muted">{user.email}</p>
          </div>

          {/* Role select */}
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
                  <option key={slug} value={slug}>
                    {roleLabel(slug)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-text-muted pointer-events-none" />
            </div>
          </div>

          {/* Full-width action button */}
          <button
            type="submit"
            className="w-full bg-primary-bg hover:opacity-90 text-white font-medium text-xs py-2.5 rounded-lg transition cursor-pointer text-center mt-2"
          >
            Change Role
          </button>
        </form>

      </div>
    </div>
  );
}
