"use client";

import React, { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

export default function ChangePasswordModal({ isOpen, onClose, onUpdate }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);

  if (!isOpen) return null;

  // Strength indicators helper
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const isLongEnough = newPassword.length >= 12;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Current password is required.");
      return;
    }
    if (newPassword.length < 12) {
      toast.error("New password must be at least 12 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Confirm password does not match.");
      return;
    }

    onUpdate(currentPassword, newPassword);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl border border-secondary-bg shadow-xl overflow-hidden flex flex-col animate-scale-up">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-bg">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Change Password</h3>
            <p className="text-[10px] text-text-muted font-light mt-0.5">
              Choose a strong password you haven't used before.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-page-bg transition cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-text-primary font-onest">
          
          {/* Current password */}
          <div className="space-y-1">
            <label className="text-xs text-text-primary block font-medium">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-white border border-secondary-bg text-xs rounded-xl p-3 pr-10 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-3 text-text-muted hover:text-text-primary transition"
              >
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="space-y-1">
            <label className="text-xs text-text-primary block font-medium">New Password</label>
            <input
              type="password"
              required
              placeholder="Min. 12 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white border border-secondary-bg text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted/60"
            />
          </div>

          {/* Confirm new password */}
          <div className="space-y-1">
            <label className="text-xs text-text-primary block font-medium">Confirm New Password</label>
            <input
              type="password"
              required
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white border border-secondary-bg text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted/60"
            />
          </div>

          {/* Password strength checkers row */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { label: "Uppercase", active: hasUppercase },
              { label: "Lowercase", active: hasLowercase },
              { label: "Number", active: hasNumber },
              { label: "12+ chars", active: isLongEnough }
            ].map((rule, idx) => (
              <span
                key={idx}
                className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold border transition duration-150 select-none ${
                  rule.active
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-page-bg text-text-muted border-secondary-bg/60"
                }`}
              >
                {rule.label}
              </span>
            ))}
          </div>

          {/* Action buttons footer */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-page-bg hover:bg-secondary-bg text-text-primary font-medium text-xs py-2.5 rounded-xl transition cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#6FB5BD] hover:bg-[#5da0a8] text-white font-medium text-xs py-2.5 rounded-xl transition cursor-pointer text-center shadow-2xs"
            >
              Update Password
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
