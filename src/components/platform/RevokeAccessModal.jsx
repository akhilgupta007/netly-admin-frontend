"use client";

import React from "react";
import { X } from "lucide-react";

export default function RevokeAccessModal({ user, isOpen, onClose, onRevoke }) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl border border-border-main shadow-xl overflow-hidden flex flex-col animate-scale-up">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-main">
          <h3 className="text-sm font-semibold text-text-primary">Revoke Access</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 rounded-full bg-text-primary text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer"
          >
            <X size={12} strokeWidth={2.5} />
          </button>

        </div>

        {/* Modal Form */}
        <div className="p-4 space-y-4 text-xs text-text-primary font-onest">
          {/* User details card */}
          <div className="rounded-xl p-3 border border-border-main">
            <h4 className="text-xs font-semibold text-text-primary">{user.name}</h4>
            <p className="text-[10px] text-text-muted font-light mt-0.5">{user.email}</p>
          </div>

          {/* Warning banner block */}
          <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 space-y-2">
            <div className="text-text-primary block">This action will:</div>
            <ul className="list-disc pl-4 space-y-0.5 text-text-muted font-light text-[10px] leading-relaxed">
              <li>Disable their Authentication account</li>
              <li>Remove their admin role claim</li>
              <li>Log to audit logs</li>
            </ul>
          </div>

          {/* Full-width solid red revoke button */}
          <button
            onClick={() => onRevoke(user)}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium text-xs py-2.5 rounded-lg transition cursor-pointer text-center mt-2"
          >
            Confirm Revoke Access
          </button>
        </div>

      </div>
    </div>
  );
}
