"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { getInitials } from "@/lib/utils";

export default function SuspendBanModal({
  account,
  activeTab,
  isOpen,
  onClose,
  onSubmit,
  isPending,
}) {
  const [actionType, setActionType] = useState("Suspend (Temporary)"); // 'Suspend (Temporary)' | 'Ban (Permanent)'
  const [duration, setDuration] = useState("");
  const [reason, setReason] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(true);

  useEffect(() => {
    if (account) {
      setActionType("Suspend (Temporary)");
      setDuration("");
      setReason("");
      setNotifyEmail(true);
    }
  }, [account]);

  if (!isOpen || !account) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim().length < 20) {
      toast.error(
        "Reason justification text must contain at least 20 characters.",
      );
      return;
    }

    onSubmit({
      // uid is the Firestore/Auth id the callables need; account.id is only a
      // display code like "CL-a1b2c3".
      uid: account.uid,
      accountId: account.id,
      actionType,
      duration:
        actionType === "Suspend (Temporary)" ? parseInt(duration) : null,
      reason,
      notifyEmail,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-onest">
      <div
        className="absolute inset-0 bg-alt-bg/40 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl w-full max-w-lg p-4 shadow-2xl z-10 border border-border-main animate-scale-up mx-4">
        <div className="flex justify-between items-center pb-2 mb-4 border-b border-border-main">
          <h3 className="font-semibold text-text-primary">
            Suspend/Ban Account
          </h3>
          <button
            onClick={onClose}
            className="w-5 h-5 rounded-full bg-alt-bg text-white flex items-center justify-center hover:opacity-90 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User metadata header card matching RejectTransferModal styling */}
          <div className="bg-page-bg rounded-2xl p-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary-bg-muted text-white flex items-center justify-center text-[10px]">
              {getInitials(account.name)}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-text-primary">
                {account.name}
              </h4>
              <p className="text-[10px] text-text-muted font-light">
                {account.email}
              </p>
            </div>
          </div>

          {/* Action Type selection */}
          <div className="space-y-2">
            <label className="text-xs text-text-primary block">
              Action Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4 px-1">
              {["Suspend (Temporary)", "Ban (Permanent)"].map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 text-xs text-text-muted cursor-pointer select-none"
                >
                  <input
                    type="radio"
                    name="actionType"
                    value={type}
                    checked={actionType === type}
                    onChange={() => setActionType(type)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition ${
                      actionType === type
                        ? "border-primary-bg"
                        : "border-text-muted/30"
                    }`}
                  >
                    {actionType === type && (
                      <div className="w-3 h-3 rounded-full bg-primary-bg" />
                    )}
                  </div>
                  {type}
                </label>
              ))}
            </div>
          </div>

          {/* Duration in days (only for suspension) */}
          {actionType === "Suspend (Temporary)" && (
            <div className="space-y-1.5 animate-scale-up">
              <label className="text-xs text-text-primary block">
                Duration (days) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="7"
                className="w-full bg-white border border-border-main text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
                required
              />
            </div>
          )}

          {/* Reason text area */}
          <div className="space-y-1">
            <label className="text-xs text-text-primary block">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="Provide a clear reason for this action..."
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-white border border-border-main text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted resize-none"
              required
            />
            <span className="text-[10px] text-text-muted block">
              Minimum 20 characters. This action is recorded in compliance logs.
            </span>
          </div>

          {/* Email notifications checkbox option */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 text-xs text-text-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition ${
                  notifyEmail
                    ? "border-primary-bg bg-primary-bg text-white"
                    : "border-text-muted/30"
                }`}
              >
                {notifyEmail && (
                  <span className="text-[10px] font-bold">✓</span>
                )}
              </div>
              Notify user via email.
            </label>
          </div>

          {/* Dialog Action button footers matching RejectTransferModal styling */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 bg-secondary-bg text-text-primary hover:bg-border-main font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer text-center disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer text-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending
                ? "Working..."
                : `Confirm ${actionType === "Suspend (Temporary)" ? "Suspension" : "Ban"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
