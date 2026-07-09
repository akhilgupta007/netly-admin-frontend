"use client";

import React from "react";
import { X } from "lucide-react";

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in font-onest">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-secondary-bg shadow-xl p-6 space-y-6 animate-scale-up relative text-center">
        
        {/* Close button top right */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-page-bg transition cursor-pointer"
        >
          <X size={14} />
        </button>

        {/* Modal Title */}
        <h3 className="text-base font-semibold text-text-primary pt-2">Logout ?</h3>

        {/* Warning description text */}
        <p className="text-xs text-text-muted/80 font-light px-2 leading-relaxed">
          Are you sure you want to logout ?
        </p>

        {/* Action buttons footer */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-white border border-secondary-bg hover:bg-page-bg text-text-primary font-medium text-xs py-2.5 rounded-xl transition cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium text-xs py-2.5 rounded-xl transition cursor-pointer text-center shadow-2xs"
          >
            Logout
          </button>
        </div>

      </div>
    </div>
  );
}
