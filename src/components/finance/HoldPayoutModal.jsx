"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

export default function HoldPayoutModal({ isOpen, onClose, payout, onConfirm }) {
  const [holdReason, setHoldReason] = useState("");

  if (!isOpen || !payout) return null;

  const handleConfirm = () => {
    if (holdReason.length < 10) return;
    onConfirm(holdReason);
    setHoldReason("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-4 max-w-xl w-full space-y-4 shadow-xl relative animate-scale-up font-onest">
        <div className="flex justify-between pb-2 border-b border-border-main">
          <h2 className="text-lg font-bold text-text-primary pr-8">Hold Provider Payout</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 rounded-full bg-[#0F172A] text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
        <p className="text-[10px] text-text-muted">
          This provider's earnings will remain safely in their wallet and will automatically be included in the next payout after the hold is removed.
        </p>
        <div className="bg-[#F7F9FA] p-3 rounded-2xl flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-primary-bg-muted text-white flex items-center justify-center font-semibold text-[11px] select-none uppercase shrink-0">
            {payout.initials}
          </div>
          <div className="space-y-0.5">
            <span className="font-medium text-xs text-text-primary block leading-none">{payout.provider}</span>
            <span className="text-[10px] text-text-muted block">
              Wallet Balance: <strong className="font-semibold text-text-primary">${payout.walletBalance.toFixed(2)}</strong>
            </span>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-text-primary block">Reason for Hold</label>
          <textarea
            value={holdReason}
            onChange={(e) => setHoldReason(e.target.value)}
            placeholder="Explain why this payout should be held..."
            rows={4}
            className="w-full text-xs border border-border-main rounded-2xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary resize-none font-light"
          />
          {holdReason.length < 10 && (
            <span className="text-[10px] text-amber-500 block font-light">
              Minimum 10 characters ({10 - holdReason.length} more)
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 bg-secondary-bg hover:bg-page-bg text-text-primary py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={holdReason.length < 10}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-xs transition text-center text-white ${
              holdReason.length >= 10
                ? "bg-primary-bg-muted hover:bg-primary-bg cursor-pointer"
                : "bg-primary-bg-muted/60 cursor-not-allowed"
            }`}
          >
            Confirm Hold
          </button>
        </div>
      </div>
    </div>
  );
}
