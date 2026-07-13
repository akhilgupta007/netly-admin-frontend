"use client";

import React from "react";
import { X } from "lucide-react";

export default function ConfirmDeactivationModal({ item, count, isOpen, onClose, onConfirm }) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl border border-secondary-bg shadow-xl overflow-hidden flex flex-col animate-scale-up font-onest">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-bg">
          <h3 className="font-semibold text-text-primary">Confirm Deactivation</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 rounded-full bg-[#0F172A] text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 space-y-4 text-xs">
          {/* Warning card preview */}
          <div className="bg-page-bg rounded-2xl p-3 space-y-2 border border-secondary-bg/50">
            <div className="block text-text-primary font-medium">{item.name}</div>
            <span className="text-[10px] text-text-muted font-light block leading-relaxed mt-0.5">
              {count || 67} active listings under this category will be hidden from search.
            </span>
          </div>

          <p className="text-xs text-text-muted leading-relaxed font-light">
            Are you sure you want to proceed with deactivation?
          </p>

          {/* Action buttons footer */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-page-bg hover:bg-secondary-bg text-text-primary font-medium text-xs py-2.5 rounded-lg transition cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(item)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium text-xs py-2.5 rounded-lg transition cursor-pointer text-center shadow-2xs"
            >
              Yes, Deactivate
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
