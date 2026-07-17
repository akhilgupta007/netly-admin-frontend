"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";

export default function InviteClientModal({ isOpen, onClose, onInvite }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Client");

  useEffect(() => {
    if (isOpen) {
      setName("");
      setEmail("");
      setRole("Client");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
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
      name: name.trim(),
      email: email.trim(),
      type: "Client",
      role: role
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-4 relative flex flex-col animate-scale-up font-onest">
        
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
          
          {/* Name input */}
          <div className="space-y-1.5">
            <label className="text-xs text-text-primary block font-medium">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Enter User Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-border-main text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted/50"
            />
          </div>

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs text-text-primary block font-medium">
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
            <label className="text-xs text-text-primary block font-medium">
              Role <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-white border border-border-main text-xs rounded-xl p-3.5 pr-10 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary appearance-none cursor-pointer"
              >
                <option value="Client">Client</option>
                <option value="Professional">Professional</option>
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
