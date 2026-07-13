"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";

export default function ChangeRoleModal({ user, isOpen, onClose, onChangeRole }) {
  const [role, setRole] = useState("Moderator");

  useEffect(() => {
    if (user) {
      setRole(user.role || "Moderator");
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onChangeRole(user, role);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl border border-secondary-bg shadow-xl overflow-hidden flex flex-col animate-scale-up">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-bg">
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
                <option value="Finance Admin">Finance Admin</option>
                <option value="Compliance Admin">Compliance Admin</option>
                <option value="Moderator">Moderator</option>
                <option value="Support Admin">Support Admin</option>
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
