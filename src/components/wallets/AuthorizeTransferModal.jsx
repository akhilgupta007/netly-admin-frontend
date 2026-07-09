"use client";

import React, { useState, useEffect } from "react";
import { ArrowUpRight, X, Zap } from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";
import { getInitials } from "@/lib/utils";

export default function AuthorizeTransferModal({ queueItem, activeTab, isOpen, onClose, onSubmit }) {
  const [authAmount, setAuthAmount] = useState("");
  const [authReason, setAuthReason] = useState("");

  useEffect(() => {
    if (queueItem) {
      setAuthAmount("");
      setAuthReason("");
    }
  }, [queueItem]);

  if (!isOpen || !queueItem) return null;

  const clientOrProviderName = activeTab === "credit" ? queueItem.client.name : queueItem.provider.name;
  const clientOrProviderEmail = activeTab === "credit" ? queueItem.client.email : queueItem.provider.email;

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(authAmount);
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    onSubmit({
      itemId: queueItem.id,
      amount: val,
      reason: authReason
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-onest">
      <div className="absolute inset-0 bg-alt-bg/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-xl p-4 shadow-2xl z-10 border border-secondary-bg animate-scale-up">
        
        <div className="flex justify-between items-center pb-2 mb-4 border-b border-border-main">
          <h3 className="text-lg font-semibold text-text-primary">Authorize Transfer</h3>
          <button 
            onClick={onClose} 
            className="w-5 h-5 rounded-full bg-alt-bg text-white flex items-center justify-center hover:opacity-90 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client / Transfer amount header blocks */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-page-bg rounded-2xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-muted">
                  {activeTab === "credit" ? "Client" : "Provider"}
                </span>
                <Link
                  href="/accounts" 
                  className="text-[10px] text-primary-bg hover:underline font-light flex items-center gap-0.5"
                >
                  View account <ArrowUpRight size={10} />
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary-bg-muted text-white flex items-center justify-center text-[10px]">
                  {getInitials(clientOrProviderName)}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-text-primary">{clientOrProviderName}</h4>
                  <p className="text-[10px] text-text-muted font-light">{clientOrProviderEmail}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-primary-bg-muted/15 rounded-2xl p-3 flex flex-col justify-between">
              <span className="text-[10px] text-text-muted block">Wallet balance</span>
              <strong className="text-xl text-text-primary font-semibold block -mb-1">${queueItem.amount.toFixed(2)}</strong>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-primary block">Transfer Amount <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-text-primary select-none">$</span>
              <input
                type="number"
                placeholder="0.00"
                value={authAmount}
                onChange={(e) => setAuthAmount(e.target.value)}
                className="w-full bg-white border border-secondary-bg text-xs rounded-xl pl-7 pr-3 py-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
                required
              />
            </div>
            <span className="text-[10px] text-text-muted block">Max: ${queueItem.amount.toFixed(2)}</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-primary block">Reason <span className="text-red-500">*</span></label>
            <textarea
              placeholder="Authorization reason..."
              rows={3}
              value={authReason}
              onChange={(e) => setAuthReason(e.target.value)}
              className="w-full bg-white border border-secondary-bg text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted resize-none"
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-secondary-bg text-text-primary hover:bg-border-main font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary-bg-muted text-black hover:bg-primary-bg font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 text-center"
            >
              <Zap size={14} /> Authorize transfer via Stripe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
