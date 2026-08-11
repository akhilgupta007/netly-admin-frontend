"use client";

import React from "react";
import { X, Loader2 } from "lucide-react";

export default function ConfirmDeactivationModal({
  item,
  count,
  isOpen,
  onClose,
  onConfirm,
  isPending = false,
}) {
  if (!isOpen || !item) return null;

  // The real figure. This used to read `count || 67`, so anything with no
  // listings claimed 67 of them — and 67 was never a real number for any
  // category.
  const listings = Number(count) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl border border-border-main shadow-xl overflow-hidden flex flex-col animate-scale-up font-onest">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-main">
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
          <div className="bg-page-bg rounded-2xl p-3 space-y-2 border border-border-main/50">
            <div className="block text-text-primary font-medium">
              {item.name || "Untitled"}
            </div>
            <span className="text-[10px] text-text-muted font-light block leading-relaxed mt-0.5">
              {listings === 0
                ? "No provider listings use this yet, so nothing will be hidden."
                : `${listings} listing${listings === 1 ? "" : "s"} using this will be hidden from search.`}
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
              disabled={isPending}
              className="flex-1 bg-page-bg hover:bg-secondary-bg text-text-primary font-medium text-xs py-2.5 rounded-lg transition cursor-pointer text-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => !isPending && onConfirm(item)}
              disabled={isPending}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium text-xs py-2.5 rounded-lg transition cursor-pointer text-center shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending && <Loader2 size={13} className="animate-spin" />}
              {isPending ? "Deactivating…" : "Yes, Deactivate"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
