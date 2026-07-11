"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";

export default function InviteUserModal({ isOpen, onClose, onInvite, defaultType }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Professional");

  useEffect(() => {
    if (isOpen) {
      setRole(defaultType === "Provider" || defaultType === "Professional" ? "Professional" : "Client");
      setEmail("");
    }
  }, [isOpen, defaultType]);

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

    onInvite({
      email: email.trim(),
      type: role === "Professional" ? "Provider" : "Client"
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 relative flex flex-col animate-scale-up font-onest">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-b-border-main">
          <h3 className="text-xl font-semibold text-text-primary tracking-tight">Invite user</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 rounded-full bg-[#0F172A] text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs text-text-primary">
          
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs text-text-primary block">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-border-main text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted/50"
            />
          </div>

          {/* Role selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-text-primary block">
              Role <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-white border border-border-main text-xs rounded-xl p-3.5 pr-10 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary appearance-none cursor-pointer"
              >
                <option value="Professional">Professional</option>
                <option value="Client">Client</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-4 h-4 w-4 text-text-muted pointer-events-none" />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full bg-[#93d6db] hover:bg-[#80c5cb] text-text-primary font-bold text-xs py-3.5 rounded-lg transition cursor-pointer text-center shadow-2xs mt-2"
          >
            Send Invite
          </button>
        </form>

      </div>
    </div>
  );
}
