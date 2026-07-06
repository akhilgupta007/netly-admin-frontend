"use client";

import React, { useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";
import { getInitials } from "@/lib/utils";

export default function AdjustBalanceModal({ wallet, isOpen, onClose, onSubmit }) {
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState("Add Credit"); // 'Add Credit' | 'Deduct'
  const [adjustReason, setAdjustReason] = useState("");

  if (!isOpen || !wallet) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (adjustReason.trim().length < 20) {
      toast.error("Justification text must contain at least 20 characters.");
      return;
    }
    const val = parseFloat(adjustAmount);
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    onSubmit({
      walletId: wallet.id,
      amount: val,
      type: adjustType,
      reason: adjustReason
    });
    // Clear state
    setAdjustAmount("");
    setAdjustReason("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-onest">
      <div className="absolute inset-0 bg-alt-bg/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-lg p-4 shadow-2xl z-10 border border-secondary-bg animate-scale-up">
        <div className="flex justify-between items-center pb-2 mb-4 border-b border-border-main">
          <h3 className="text-lg font-semibold text-text-primary">Adjust Balance</h3>
          <button 
            onClick={onClose} 
            className="w-5 h-5 rounded-full bg-alt-bg text-white flex items-center justify-center hover:opacity-90 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client / Available balance header blocks */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-page-bg rounded-2xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-text-muted">Client</span>
                  <Link
                    href="/accounts" 
                    className="text-[10px] text-primary-bg hover:underline font-light flex items-center gap-0.5"
                  >
                    View account <ArrowUpRight size={10} />
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary-bg text-white flex items-center justify-center text-xs font-semibold font-mono">
                    {getInitials(wallet.client.name)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">{wallet.client.name}</h4>
                    <p className="text-xs text-text-muted font-light">{wallet.client.email}</p>
                  </div>
                </div>
              </div>
              <div className="bg-primary-bg-muted/15 rounded-2xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-text-muted block font-medium">Available balance</span>
                <strong className="text-xl text-text-primary font-bold block -mb-1">${wallet.balance.toFixed(2)}</strong>
              </div>
            </div>

          <div className="space-y-1">
            <label className="text-xs text-text-primary block">Amount <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-text-primary select-none">$</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="w-full bg-white border border-secondary-bg text-xs rounded-xl pl-7 pr-3 py-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-text-primary block">Type <span className="text-red-500">*</span></label>
            <div className="flex gap-4 px-4">
              {["Add Credit", "Deduct"].map((t) => (
                <label key={t} className="flex items-center gap-2 text-xs text-text-muted cursor-pointer select-none">
                  <input
                    type="radio"
                    name="adjustType"
                    value={t}
                    checked={adjustType === t}
                    onChange={() => setAdjustType(t)}
                    className="sr-only"
                  />
                  <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition ${
                    adjustType === t ? "border-primary-bg" : "border-text-muted/30"
                  }`}>
                    {adjustType === t && (
                      <div className="w-3 h-3 rounded-full bg-primary-bg" />
                    )}
                  </div>
                  {t}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-primary block">Reason <span className="text-red-500">*</span></label>
            <textarea
              placeholder="Justification for this manual balance adjustment..."
              rows={3}
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full bg-white border border-secondary-bg text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted resize-none"
              required
            />
            <span className="text-[10px] text-text-muted block">Minimum 20 characters.</span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-secondary-bg text-text-primary hover:bg-border-main font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary-bg text-white hover:opacity-90 font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer text-center"
            >
              Confirm Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
