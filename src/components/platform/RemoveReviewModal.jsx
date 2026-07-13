"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

export default function RemoveReviewModal({ review, isOpen, onClose, onRemove }) {
  const [reason, setReason] = useState("");

  if (!isOpen || !review) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onRemove(review, reason);
    setReason("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-secondary-bg shadow-xl overflow-hidden flex flex-col animate-scale-up">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-bg">
          <h3 className="font-semibold text-text-primary">Remove Review</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 rounded-full bg-[#0F172A] text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          {/* Review preview card */}
          <div className="bg-page-bg rounded-2xl p-3 space-y-2 border border-secondary-bg/50">
            <div className="block text-text-primary">{review.client || review.reportedBy || "Reported User"}</div>
            <p className="text-[10px] text-text-muted font-light leading-relaxed mt-0.5">
              "{review.reviewText || review.content}"
            </p>
          </div>

          {/* Reason field */}
          <div className="space-y-1">
            <label className="text-xs text-text-primary block">
              Reason
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why this review is being removed..."
              className="w-full bg-white border border-secondary-bg text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted resize-none"
            />
          </div>

          {/* Action buttons row */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-page-bg hover:bg-secondary-bg text-text-primary font-medium text-xs py-2.5 rounded-lg transition cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium text-xs py-2.5 rounded-lg transition cursor-pointer text-center shadow-2xs"
            >
              Yes, Remove
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
