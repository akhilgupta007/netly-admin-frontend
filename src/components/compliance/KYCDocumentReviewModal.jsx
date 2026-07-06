"use client";

import React, { useState, useEffect } from "react";
import { X, ShieldAlert, FileText, Check, Send } from "lucide-react";
import { toast } from "react-toastify";
import { getInitials } from "@/lib/utils";

export default function KYCDocumentReviewModal({ item, isOpen, onClose, onApprove, onReject, onRequestResubmission }) {
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [reasonCategory, setReasonCategory] = useState("Blurry");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (isOpen) {
      setIsRejectMode(false);
      setReasonCategory("Blurry");
      setRejectionReason("");
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleConfirmRejectionSubmit = (e) => {
    e.preventDefault();
    if (rejectionReason.trim().length < 20) {
      toast.error("Rejection reason must contain at least 20 characters.");
      return;
    }
    onReject(item.id, reasonCategory, rejectionReason);
    setIsRejectMode(false);
  };

  const getStatusDotClass = (status) => {
    switch (status) {
      case "Approved":
        return "text-emerald-600 bg-emerald-50";
      case "In Review":
        return "text-blue-600 bg-blue-50";
      case "Pending":
        return "text-amber-600 bg-amber-50";
      case "Expired":
        return "text-red-600 bg-red-50";
      default:
        return "text-red-600 bg-red-50";
    }
  };

  const getFormatBadge = (docType) => {
    return docType === "ID" ? "JPEG" : "PDF";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-onest">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-alt-bg/40 backdrop-blur-xs" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl max-w-xl w-full p-4 shadow-2xl z-10 border border-secondary-bg animate-scale-up mx-4 max-h-[95vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-2 mb-4 border-b border-border-main shrink-0">
          <h3 className="text-lg font-semibold text-text-primary">
            {isRejectMode ? "Reject Document" : "Document Review"}
          </h3>
          <button 
            onClick={onClose} 
            className="w-5 h-5 rounded-full bg-alt-bg text-white flex items-center justify-center hover:opacity-90 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1 scrollbar-thin">
          
          {/* User metadata header card */}
          <div className="bg-page-bg rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary-bg-muted text-white flex items-center justify-center text-xs font-semibold">
                {getInitials(item.name)}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-primary">{item.name}</h4>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] ${getStatusDotClass(item.status)}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              {item.status}
            </span>
          </div>

          {/* User metadata columns */}
          {!isRejectMode && (
            <div className="grid grid-cols-3 divide-x divide-border-main text-xs py-2">
              <div className="pr-6">
                <span className="text-[10px] text-text-muted block font-light">Email Address</span>
                <strong className="text-text-primary font-normal block mt-1 break-all">{item.email}</strong>
              </div>
              <div className="px-6">
                <span className="text-[10px] text-text-muted block font-light">Phone</span>
                <strong className="text-text-primary font-normal block mt-1">{item.phone || "+233 24 123 4567"}</strong>
              </div>
              <div className="pl-6">
                <span className="text-[10px] text-text-muted block font-light">Joined</span>
                <strong className="text-text-primary font-normal block mt-1">{item.joined || "Jan 12, 2027"}</strong>
              </div>
            </div>
          )}

          {/* Validation Warnings (conditional based on status) */}
          {!isRejectMode && ["Pending", "In Review", "Expired", "Rejected"].includes(item.status) && (
            <div className="text-red-500 rounded-xl py-2 text-xs flex items-center gap-2 shrink-0">
              <ShieldAlert size={14} className="shrink-0 text-red-500" />
              <span>Cannot perform payouts, pending KYC approval.</span>
            </div>
          )}

          {/* Document Submission Header Banner */}
          {!isRejectMode && (
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-block bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                  • {item.docType}
                </span>
                <span className="text-text-primary">Submitted {item.submittedDate}</span>
              </div>
              <span className="text-text-muted font-light">
                {item.docType === "ID" ? "Image (JPEG/PNG)" : "PDF Document"}
              </span>
            </div>
          )}

          {/* File Attachment Name Bar */}
          <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-3.5 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 text-primary-bg font-semibold">
              <FileText size={14} />
              <span>{item.docFile}</span>
            </div>
            <span className="border border-blue-200 text-blue-500 bg-white px-2.5 py-0.5 rounded-lg text-[10px] font-bold">
              {getFormatBadge(item.docType)}
            </span>
          </div>

          {/* Document View Preview Container */}
          <div className="space-y-1">
            {item.docType === "ID" ? (
              /* Slate National ID Image Mock card layout */
              <div className="flex flex-col items-center justify-center py-4 bg-gray-50 rounded-2xl relative border border-secondary-bg/50">
                <div className="relative w-80 h-44 bg-slate-800 rounded-2xl p-4 text-white shadow-lg font-mono text-[10px] flex flex-col justify-between select-none">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[7px] text-slate-400 block tracking-wider uppercase font-bold">National ID Card</span>
                      <strong className="text-xs font-bold uppercase tracking-wide">ID</strong>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-700/60 border border-slate-600 flex items-center justify-center text-[10px] text-slate-300">
                      👤
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center text-xs text-white uppercase font-bold font-sans">
                      {getInitials(item.name)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs leading-none">{item.name}</h4>
                      <p className="text-[7px] text-slate-400 mt-1">ID No: KYC-09-2027</p>
                    </div>
                  </div>

                  <div className="flex justify-between text-[7px] border-t border-slate-700/50 pt-1.5 text-slate-400">
                    <div>
                      <span className="block text-[5px] uppercase">Issued</span>
                      <strong>Jun 19, 2027</strong>
                    </div>
                    <div>
                      <span className="block text-[5px] uppercase">Expires</span>
                      <strong>Jun 20, 2032</strong>
                    </div>
                  </div>
                </div>
                <span className="text-[9px] text-text-muted mt-2">Inline preview · no download</span>
              </div>
            ) : (
              /* PDF Mock documents layout */
              <div className="bg-gray-50 rounded-2xl p-4 border border-secondary-bg/50 flex flex-col justify-between max-h-65 relative">
                <div className="flex items-center justify-between text-[10px] text-text-muted pb-2 border-b border-secondary-bg/50 shrink-0">
                  <span>Page 1 of 1</span>
                  <div className="flex items-center gap-2">
                    <button type="button" className="hover:text-text-primary cursor-pointer">Zoom -</button>
                    <span>100%</span>
                    <button type="button" className="hover:text-text-primary cursor-pointer">Zoom +</button>
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center p-3 bg-white border border-secondary-bg/30 rounded-xl shadow-xs mt-2 relative select-none">
                  <div className="w-64 border border-border-main rounded-xl p-3 text-[10px] space-y-2.5 font-sans relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[8px] text-text-muted uppercase tracking-wider block font-light">Official Document</span>
                        <strong className="text-text-primary font-semibold text-xs">{item.docType}</strong>
                      </div>
                      <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center text-xs">
                        🛡️
                      </div>
                    </div>

                    <div className="space-y-1 text-text-primary">
                      <div className="flex justify-between border-b border-page-bg py-0.5">
                        <span className="text-text-muted font-light text-[8px]">Full Name</span>
                        <span>{item.name}</span>
                      </div>
                      <div className="flex justify-between border-b border-page-bg py-0.5">
                        <span className="text-text-muted font-light text-[8px]">Document Type</span>
                        <span>{item.docType}</span>
                      </div>
                      <div className="flex justify-between border-b border-page-bg py-0.5">
                        <span className="text-text-muted font-light text-[8px]">Issued</span>
                        <span>May 30, 2027</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-text-muted font-light text-[8px]">Reference</span>
                        <span className="font-mono">DOC-KYC-08</span>
                      </div>
                    </div>

                    <div className="text-[8px] text-text-muted text-center pt-1.5 border-t border-border-main/50 uppercase tracking-widest font-light">
                      Document Preview
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rejection Form fields (conditional on Reject Mode) */}
          {isRejectMode && (
            <form onSubmit={handleConfirmRejectionSubmit} className="space-y-3.5 border-t border-secondary-bg pt-4 shrink-0">
              <div className="space-y-1">
                <label className="text-xs text-text-primary block">Reason Category <span className="text-red-500">*</span></label>
                <select
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  className="w-full bg-white border border-secondary-bg text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary cursor-pointer"
                >
                  <option value="Blurry">Blurry</option>
                  <option value="Expired">Expired</option>
                  <option value="Incorrect Name">Incorrect Name</option>
                  <option value="Illegible">Illegible</option>
                  <option value="Invalid Document Type">Invalid Document Type</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-text-primary block">Rejection Reason <span className="text-red-500">*</span></label>
                <textarea
                  placeholder="Explain why this document is being rejected..."
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-white border border-secondary-bg text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted resize-none"
                  required
                />
                <span className="text-[10px] text-text-muted block">
                  Minimum 20 characters. This will be sent to the client.
                </span>
              </div>

              {/* Dialog buttons for confirm reject */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectMode(false)}
                  className="flex-1 bg-secondary-bg text-text-primary hover:bg-border-main font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer text-center"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          )}

          {/* Action trigger footer blocks */}
          {!isRejectMode && (
            <div className="border-t border-secondary-bg pt-4 shrink-0">
              {item.status === "Approved" ? (
                <div className="text-center text-emerald-600 font-semibold text-xs py-2">
                  Document approved – no further action required
                </div>
              ) : item.status === "Expired" ? (
                <button
                  onClick={() => onRequestResubmission(item.id)}
                  className="w-full bg-primary-bg hover:opacity-90 text-white font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send size={13} /> Request Resubmission
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => onApprove(item.id)}
                    className="w-full bg-primary-bg hover:opacity-90 text-white font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check size={13} /> Approve Document
                  </button>
                  <button
                    onClick={() => setIsRejectMode(true)}
                    className="w-full bg-white border border-red-200 text-red-500 hover:bg-red-50 font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <X size={13} /> Reject Document
                  </button>
                  <button
                    onClick={() => onRequestResubmission(item.id)}
                    className="w-full bg-white border border-border-main text-text-primary hover:bg-page-bg font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send size={13} /> Request Resubmission
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
