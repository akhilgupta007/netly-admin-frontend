"use client";

import React from "react";
import { X } from "lucide-react";

export default function ConfirmDeactivationModal({ item, count, isOpen, onClose, onConfirm }) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl border border-secondary-bg shadow-xl p-6 space-y-5 animate-scale-up relative text-center font-onest">
        
        {/* Close button top right */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-page-bg transition cursor-pointer"
        >
          <X size={14} />
        </button>

        {/* Modal Title */}
        <h3 className="text-base font-semibold text-text-primary pt-2">Confirm deactivation</h3>

        {/* Warning text */}
        <p className="text-xs text-text-muted/80 font-light leading-relaxed px-4">
          {count || 67} active listings under {item.name} will be hidden from search. Continue?
        </p>

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
            type="button"
            onClick={() => onConfirm(item)}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium text-xs py-2.5 rounded-xl transition cursor-pointer text-center shadow-2xs"
          >
            Yes, Deactivate
          </button>
        </div>

      </div>
    </div>
  );
}
