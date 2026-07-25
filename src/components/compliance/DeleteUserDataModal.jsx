"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";

export default function DeleteUserDataModal({ user, onClose, onDeleteConfirm }) {
  const [deleteReason, setDeleteReason] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (deleteReason.trim().length < 20) {
      toast.error("Reason for deletion must contain at least 20 characters.");
      return;
    }
    onDeleteConfirm(user.email, deleteReason.trim());
    setDeleteReason("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-border-main shadow-xl overflow-hidden flex flex-col animate-scale-up">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-main">
          <h3 className="text-base font-semibold text-text-primary">Delete User Data</h3>
          <button
            onClick={onClose}
            className="w-5 h-5 rounded-full bg-alt-bg text-white flex items-center justify-center hover:opacity-90 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-secondary-bg/40 rounded-2xl p-4">
            <h4 className="text-xs font-semibold text-text-primary">{user.name}</h4>
            <p className="text-[10px] text-text-muted font-light mt-0.5">{user.email}</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-primary block">Reason <span className="text-red-500">*</span></label>
            <textarea
              placeholder="Explain the reason for deletion..."
              rows={4}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              className="w-full bg-white border border-border-main text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted resize-none"
              required
            />
            <span className="text-[10px] text-text-muted block">Minimum 20 characters.</span>
          </div>

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
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium text-xs py-2.5 rounded-xl transition cursor-pointer text-center"
            >
              Yes, Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
