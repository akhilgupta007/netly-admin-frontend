"use client";

import React from "react";
import { X, Download } from "lucide-react";
import { toast } from "react-toastify";
import { getInitials } from "@/lib/utils";

export default function T4APreviewModal({ slip, onClose }) {
  const handleDownload = () => {
    toast.success(`Downloading T4A slip PDF for ${slip.provider || "Provider"}...`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-secondary-bg shadow-xl overflow-hidden flex flex-col animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-bg">
          <h3 className="text-sm font-semibold text-text-primary">T4A Preview</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-page-bg transition cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 text-xs">
          
          {/* User profile banner row */}
          <div className="bg-page-bg/40 rounded-2xl p-4 border border-secondary-bg/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-bg text-white flex items-center justify-center text-xs font-semibold">
              {getInitials(slip.provider || "PR")}
            </div>
            <strong className="text-sm font-semibold text-text-primary">{slip.provider}</strong>
          </div>

          {/* Statement details box layout */}
          <div className="border border-secondary-bg rounded-2xl p-4 space-y-3 bg-white shadow-2xs">
            <div className="border-b border-page-bg pb-2">
              <h4 className="font-semibold text-text-primary text-[11px] uppercase tracking-wide">T4A Statement of Pension, Retirement, Annuity</h4>
              <span className="text-[10px] text-text-muted font-light block mt-0.5">Tax year {slip.taxYear || "2026"}</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted font-light">Recipient name</span>
                <strong className="text-text-primary font-normal">{slip.provider}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted font-light">Tax Year</span>
                <strong className="text-text-primary font-normal">{slip.taxYear || "2026"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted font-light">Fees for services</span>
                <strong className="text-text-primary font-semibold">$12,840.00</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted font-light">Self-employed commissions</span>
                <strong className="text-text-primary font-semibold">$0.00</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted font-light">Payer name</span>
                <strong className="text-text-primary font-normal">Netly Technologies Inc.</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted font-light">Payer BN</span>
                <strong className="text-text-primary font-normal">123456789 RT0001</strong>
              </div>
            </div>

            <p className="pt-2 border-t border-page-bg text-[10px] text-text-muted italic leading-relaxed">
              This is a system-generated preview. Download the final PDF for the official slip.
            </p>
          </div>

          <button
            onClick={handleDownload}
            className="w-full bg-primary-bg hover:opacity-90 text-white font-medium text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Download size={13} /> Download PDF
          </button>

        </div>
      </div>
    </div>
  );
}
