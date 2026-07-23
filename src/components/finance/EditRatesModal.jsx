"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";

export default function EditRatesModal({ currentClientFee, currentProviderCommission, onClose, onSave }) {
  const [clientFee, setClientFee] = useState(currentClientFee);
  const [providerCommission, setProviderCommission] = useState(currentProviderCommission);
  const [reason, setReason] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const clientVal = parseFloat(clientFee);
    const providerVal = parseFloat(providerCommission);

    if (isNaN(clientVal) || clientVal < 0 || clientVal > 100) {
      toast.error("Client fee must be a valid number between 0 and 100.");
      return;
    }
    if (isNaN(providerVal) || providerVal < 0 || providerVal > 100) {
      toast.error("Provider commission must be a valid number between 0 and 100.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for the rate change.");
      return;
    }

    onSave({
      clientFee: clientVal,
      providerCommission: providerVal,
      reason: reason.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-border-main shadow-xl overflow-hidden flex flex-col animate-scale-up">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-main">
          <h3 className="text-sm font-semibold text-text-primary">Edit rates</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 rounded-full bg-text-primary text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">

          <div className="space-y-1">
            <label className="text-xs text-text-primary block">Client fee (%) <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type="number"
                value={clientFee}
                onChange={(e) => setClientFee(e.target.value)}
                placeholder="5"
                min="0"
                max="100"
                step="0.1"
                className="w-full bg-white border border-border-main rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary pr-8 text-xs"
                required
              />
              <span className="absolute right-3 top-3 text-text-muted font-medium">%</span>
            </div>
            <span className="text-[10px] text-text-muted block">0-100</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-primary block">Provider commission (%) <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type="number"
                value={providerCommission}
                onChange={(e) => setProviderCommission(e.target.value)}
                placeholder="15"
                min="0"
                max="100"
                step="0.1"
                className="w-full bg-white border border-border-main rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary pr-8 text-xs"
                required
              />
              <span className="absolute right-3 top-3 text-text-muted font-medium">%</span>
            </div>
            <span className="text-[10px] text-text-muted block">0-100</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-primary block">Reason for Change <span className="text-red-500">*</span></label>
            <textarea
              placeholder="eg, board approves Q3 rate adjustment to improve provider retention..."
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-white border border-border-main text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted resize-none"
              required
            />
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
              className="flex-1 bg-primary-bg hover:opacity-90 text-white font-medium text-xs py-2.5 rounded-xl transition cursor-pointer text-center"
            >
              Save Rates
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
