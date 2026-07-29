"use client";

import React from "react";
import {
  X,
  CreditCard,
  Key,
  ShieldAlert,
  ShieldCheck,
  Award,
  Star,
} from "lucide-react";
import { toast } from "react-toastify";
import { getInitials } from "@/lib/utils";

export default function ProviderDetailModal({
  provider,
  isOpen,
  onClose,
  onSuspendBanTrigger,
  onReactivateTrigger,
  onResetPassword,
  isResettingPassword,
}) {
  if (!isOpen || !provider) return null;

  // Mock static questions list matching layout (Slide 7)
  const providerQuestions = [
    { num: 1, text: "How many bedrooms need cleaning?" },
    { num: 2, text: "How many bathrooms?" },
    { num: 3, text: "Property Type?" },
    { num: 4, text: "Approximate Area?" },
  ];
  const getKycClass = (kyc) => {
    switch (kyc) {
      case "Verified":
        return "text-emerald-500 bg-emerald-50";
      case "Pending":
        return "text-amber-500 bg-amber-50";
      default:
        return "text-red-500 bg-red-50";
    }
  };
  return (
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center font-onest">
      <div
        className="absolute inset-0 bg-alt-bg/40 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl max-w-xl w-full p-4 shadow-2xl z-10 border border-border-main animate-scale-up max-h-[95vh] flex flex-col font-onest">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-2 mb-4 border-b border-border-main shrink-0">
          <h3 className="text-xl font-bold text-text-primary tracking-tight">
            Provider Detail
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 rounded-full bg-[#0F172A] text-white flex items-center justify-center hover:opacity-90 cursor-pointer transition text-xs"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>

        {/* Inner scrollable wrapper */}
        <div className="space-y-4 overflow-y-auto pr-2 flex-1 scrollbar-thin">
          {/* User metadata header box */}
          <div className="bg-page-bg rounded-2xl p-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary-bg-muted text-white flex items-center justify-center text-[10px] font-light">
              {getInitials(provider.name)}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text-primary">
                {provider.name}
              </h4>
            </div>
          </div>

          {/* Details layout with vertical column dividers (x-axis separators) */}
          <div className="pb-4 space-y-4 border-b border-border-main">
            {/* Row 1 */}
            <div className="grid sm:grid-cols-3 sm:divide-x divide-border-main text-xs gap-2">
              <div className="sm:pr-4">
                <span className="text-[10px] text-text-muted block font-light">
                  Email Address
                </span>
                <strong className="text-text-primary font-normal block mt-0.5 break-all">
                  {provider.email}
                </strong>
              </div>
              <div className="sm:px-4">
                <span className="text-[10px] text-text-muted block font-light">
                  Phone
                </span>
                <strong className="text-text-primary font-normal block mt-0.5">
                  +233 24 123 4567
                </strong>
              </div>
              <div className="sm:pl-4">
                <span className="text-[10px] text-text-muted block font-light">
                  Joined
                </span>
                <strong className="text-text-primary font-normal block mt-0.5">
                  {provider.joinDate || "Jan 12, 2027"}
                </strong>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid sm:grid-cols-3 sm:divide-x divide-border-main text-xs gap-2">
              <div className="sm:pr-4">
                <span className="text-[10px] text-text-muted block font-light">
                  Category
                </span>
                <strong className="text-text-primary font-normal block mt-0.5">
                  {provider.category || "Home, Furniture, Maintenance"}
                </strong>
              </div>
              <div className="sm:px-4">
                <span className="text-[10px] text-text-muted block font-light">
                  City
                </span>
                <strong className="text-text-primary font-normal block mt-0.5">
                  {provider.city || "Accra"}
                </strong>
              </div>
              <div className="sm:pl-4">
                <span className="text-[10px] text-text-muted block font-light">
                  Rating
                </span>
                <strong className="text-text-primary font-normal flex items-center gap-1">
                  <span className="text-base text-amber-500">★</span>
                  {provider.rating || "4.9"} / 5.0
                </strong>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid sm:grid-cols-3 sm:divide-x divide-border-main text-xs gap-2">
              <div className="sm:pr-4">
                <span className="text-[10px] text-text-muted block font-light font-onest">
                  Cancelled Reservations
                </span>
                <strong className="text-text-primary font-normal block mt-0.5">
                  {provider.cancelledReservations || 10}
                </strong>
              </div>
              <div className="sm:px-4">
                <span className="text-[10px] text-text-muted block font-light">
                  Number of Disputes
                </span>
                <strong className="text-text-primary font-normal block mt-0.5">
                  {provider.disputes || 5}
                </strong>
              </div>
              <div className="sm:pl-4">
                <span className="text-[10px] text-text-muted block font-light">
                  Language
                </span>
                <strong className="text-text-primary font-normal block mt-0.5">
                  {provider.language || "French"}
                </strong>
              </div>
            </div>
          </div>

          {/* Services Offered block */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-text-muted block">
              Services Offered
            </span>
            <div className="flex flex-wrap gap-1.5">
              {["Deep Clean", "Move-Out", "Post-Construction"].map((s, idx) => (
                <span
                  key={idx}
                  className="bg-blue-50 text-blue-500 text-[10px] px-2.5 py-1 rounded-full"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Questions by Provider section */}
          <div className="space-y-2 border border-border-main rounded-2xl p-3">
            <span className="text-[10px] text-text-muted block">
              Questions by provider
            </span>
            <div className="space-y-3">
              {providerQuestions.map((q, idx) => (
                <div key={idx} className="text-xs space-y-0.5">
                  <span className="text-[9px] text-text-muted block">
                    Question {q.num}
                  </span>
                  <strong className="text-text-primary font-normal block">
                    {q.text}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          {/* Provider badges */}
          <div className="space-y-1.5 border border-border-main rounded-2xl p-3">
            <span className="text-[10px] text-text-muted block">
              Provider badges
            </span>
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                <ShieldCheck size={11} className="shrink-0" /> Verified
              </span>
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                <Award size={11} className="shrink-0" /> Pro
              </span>
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                <Star size={10} className="shrink-0 fill-current" /> Founding
                Provider
              </span>
            </div>
          </div>

          {/* KYC verification status */}
          <div className="flex justify-between items-center border border-border-main rounded-2xl p-3 pt-3.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted">KYC Status</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] ${getKycClass(provider.kyc || "Verified")}`}
              >
                {provider.kyc || "Verified"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => toast.info("Opening documents viewer...")}
              className="text-primary-bg underline text-xs cursor-pointer"
            >
              View Documents
            </button>
          </div>

          {/* Moderate stacked action controls */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() =>
                toast.success(
                  `KYC documents for ${provider.name} verified successfully!`,
                )
              }
              className="w-full bg-[#93d6db] hover:bg-[#80c5cb] text-text-primary font-bold text-xs py-3.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              View KYC Documents
            </button>

            <button
              onClick={() =>
                toast.info(`Viewing Payouts reports for ${provider.name}...`)
              }
              className="w-full bg-white border border-primary-bg-muted text-primary-bg hover:bg-page-bg font-semibold text-xs py-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CreditCard size={14} /> View Payouts
            </button>

            <button
              onClick={() => onResetPassword(provider)}
              disabled={isResettingPassword}
              className="w-full bg-white border border-primary-bg-muted text-primary-bg hover:bg-page-bg font-semibold text-xs py-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Key size={14} />{" "}
              {isResettingPassword ? "Sending..." : "Reset Password"}
            </button>

            {["Suspended", "Banned"].includes(provider.status) ? (
              <button
                onClick={() => onReactivateTrigger(provider)}
                className="w-full bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-semibold text-xs py-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                ✓ Reactivate Account
              </button>
            ) : (
              <button
                onClick={() => onSuspendBanTrigger(provider)}
                className="w-full bg-white border border-red-200 text-red-500 hover:bg-red-50 font-semibold text-xs py-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                🚫 Suspend/Ban Account
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
