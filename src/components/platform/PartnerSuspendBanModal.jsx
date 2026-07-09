"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";

export default function PartnerSuspendBanModal({ partner, isOpen, onClose, onSubmit }) {
  const [actionType, setActionType] = useState("Suspend (Temporary)");
  const [duration, setDuration] = useState("");
  const [reason, setReason] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(true);

  useEffect(() => {
    if (partner) {
      setActionType("Suspend (Temporary)");
      setDuration("");
      setReason("");
      setNotifyEmail(true);
    }
  }, [partner]);

  if (!isOpen || !partner) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim().length < 20) {
      toast.error("Reason justification text must contain at least 20 characters.");
      return;
    }

    onSubmit(partner, {
      actionType,
      duration: actionType === "Suspend (Temporary)" ? parseInt(duration) : null,
      reason: reason.trim(),
      notifyEmail
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-secondary-bg shadow-xl overflow-hidden flex flex-col animate-scale-up">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-bg">
          <h3 className="text-sm font-semibold text-text-primary">Suspend/Ban Account</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-page-bg transition cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          
          {/* User profile preview block card */}
          <div className="bg-page-bg/40 rounded-2xl p-4 flex items-center gap-3 border border-secondary-bg/50">
            <div className="w-8 h-8 rounded-xl bg-[#6FB5BD] text-white flex items-center justify-center font-bold text-xs select-none">
              {partner.name.charAt(0)}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-text-primary">{partner.name}</h4>
              <p className="text-[10px] text-text-muted font-light mt-0.5">{partner.email}</p>
            </div>
          </div>

          {/* Action selection */}
          <div className="space-y-2">
            <label className="text-xs text-text-primary block">Action Type <span className="text-red-500">*</span></label>
            <div className="flex gap-4 px-1">
              {["Suspend (Temporary)", "Ban (Permanent)"].map((type) => (
                <label key={type} className="flex items-center gap-2 text-xs text-text-muted cursor-pointer select-none">
                  <input
                    type="radio"
                    name="actionType"
                    value={type}
                    checked={actionType === type}
                    onChange={() => setActionType(type)}
                    className="sr-only"
                  />
                  <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition ${
                    actionType === type ? "border-[#6FB5BD]" : "border-text-muted/30"
                  }`}>
                    {actionType === type && (
                      <div className="w-3 h-3 rounded-full bg-[#6FB5BD]" />
                    )}
                  </div>
                  {type}
                </label>
              ))}
            </div>
          </div>

          {/* Duration (only for suspension) */}
          {actionType === "Suspend (Temporary)" && (
            <div className="space-y-1.5 animate-scale-up">
              <label className="text-xs text-text-primary block">Duration (days) <span className="text-red-500">*</span></label>
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="7"
                className="w-full bg-white border border-secondary-bg text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
                required
              />
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1">
            <label className="text-xs text-text-primary block">Reason <span className="text-red-500">*</span></label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a clear reason for this action..."
              className="w-full bg-white border border-secondary-bg text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted resize-none"
            />
            <span className="text-[10px] text-text-muted block mt-0.5">
              Minimum 20 characters. This action is recorded in compliance logs.
            </span>
          </div>

          {/* Email notify */}
          <div className="pt-1 select-none">
            <label className="flex items-center gap-2.5 text-xs text-text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition ${
                notifyEmail ? "border-[#6FB5BD] bg-[#6FB5BD] text-white" : "border-text-muted/30"
              }`}>
                {notifyEmail && <span className="text-[10px] font-bold">✓</span>}
              </div>
              Notify user via email.
            </label>
          </div>

          {/* Footer buttons */}
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
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium text-xs py-2.5 rounded-xl transition cursor-pointer text-center shadow-2xs"
            >
              Confirm {actionType === "Suspend (Temporary)" ? "Suspension" : "Ban"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
