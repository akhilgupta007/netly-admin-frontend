"use client";

import React from "react";
import { X } from "lucide-react";

export default function PartnerDetailModal({ partner, isOpen, onClose }) {
  if (!isOpen || !partner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-secondary-bg shadow-xl overflow-hidden flex flex-col animate-scale-up">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-bg">
          <h3 className="text-sm font-semibold text-text-primary">Partner details</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-page-bg transition cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Badges */}
          <div className="flex items-center gap-1.5">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
              partner.status === "Active" ? "text-emerald-500 bg-emerald-50" :
              partner.status === "Invited" ? "text-blue-500 bg-blue-50" :
              partner.status === "Declined" ? "text-text-muted bg-page-bg" :
              "text-red-500 bg-red-50"
            }`}>
              {partner.status}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-blue-500 bg-blue-50">
              Founding Member
            </span>
          </div>

          {/* Partner Split Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-b border-secondary-bg py-4 text-text-primary">
            <div className="space-y-1">
              <span className="text-[10px] text-text-muted font-light block">Partner Name</span>
              <strong className="font-semibold block text-text-primary">{partner.name}</strong>
              <span className="text-[10px] text-text-muted font-light block break-all">{partner.email}</span>
            </div>

            <div className="space-y-1 md:border-l md:border-secondary-bg md:pl-4">
              <span className="text-[10px] text-text-muted font-light block">Equity Share</span>
              <strong className="font-semibold block text-text-primary">0.5% Pre-Launch Equity</strong>
              <span className="text-[10px] text-text-muted font-light block">Class A Common Shares</span>
            </div>

            <div className="space-y-1 md:border-l md:border-secondary-bg md:pl-4">
              <span className="text-[10px] text-text-muted font-light block">Sign Up Date</span>
              <strong className="font-semibold block text-text-primary">{partner.date}</strong>
            </div>
          </div>

          {/* Audit Verification status cards */}
          <div className="bg-page-bg/40 rounded-2xl p-4 space-y-2.5 border border-secondary-bg/50">
            <span className="text-[10px] text-text-muted font-medium block">Administrative Audit Status</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] text-text-muted font-light block">Stripe Connect Payouts</span>
                <span className="text-xs font-semibold text-emerald-500 block mt-0.5">✓ Verification Passed</span>
              </div>
              <div className="sm:border-l sm:border-secondary-bg sm:pl-4">
                <span className="text-[9px] text-text-muted font-light block">KYC / Identity Documents</span>
                <span className="text-xs font-semibold text-emerald-500 block mt-0.5">✓ Documents Approved</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
