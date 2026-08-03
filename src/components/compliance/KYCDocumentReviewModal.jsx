"use client";

import React, { useState, useEffect } from "react";
import { X, ShieldAlert, FileText, Check, Send } from "lucide-react";
import { toast } from "react-toastify";
import { logDataAccess } from "@/lib/callables";
import { getInitials } from "@/lib/utils";

export default function KYCDocumentReviewModal({ item, isOpen, onClose, onApprove, onReject, onRequestResubmission, isPending }) {
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [reasonCategory, setReasonCategory] = useState("Blurry");
  const [rejectionReason, setRejectionReason] = useState("");
  const [zoom, setZoom] = useState(100);
  const [docIndex, setDocIndex] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRejectMode(false);
      setReasonCategory("Blurry");
      setRejectionReason("");
      setZoom(100);
      setDocIndex(0);
      setLoadFailed(false);
    }
  }, [isOpen, item]);

  // Record that this personal data was viewed. Fire-and-forget: a
  // logging failure must never block the reviewer.
  useEffect(() => {
    if (!isOpen || !item?.uid) return;
    logDataAccess({
      dataType: "KYC Document",
      recordId: item.uid,
      subjectUid: item.uid,
      reason: "Opened from the admin panel",
    }).catch((e) => console.warn("data access log failed:", e.message));
  }, [isOpen, item?.uid]);

  if (!isOpen || !item) return null;

  // Only files with a usable URL can be reviewed. Schema v3.0 §6 shape:
  // { name, url, storagePath, contentType, size }
  const docs = Array.isArray(item.verificationDocuments)
    ? item.verificationDocuments.filter((d) => d && d.url)
    : [];
  const activeDoc = docs[docIndex] || docs[0] || null;
  const isImage =
    Boolean(activeDoc?.contentType?.startsWith("image/")) ||
    /\.(png|jpe?g|webp|gif|heic)(\?|$)/i.test(activeDoc?.name || activeDoc?.url || "");

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-onest">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-alt-bg/40 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl max-w-xl w-full p-3 shadow-2xl z-10 border border-border-main animate-scale-up mx-4 max-h-[95vh] flex flex-col">

        {/* Modal Header */}
        <div className="flex justify-between items-center p-1 pb-2 mb-4 border-b border-border-main shrink-0">
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
        <div className="space-y-4 overflow-y-auto p-1 flex-1 scrollbar-thin">

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
          {!isRejectMode && ["Expired", "Rejected"].includes(item.status) && (
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
                {docs.length > 0
                  ? `${docs.length} file${docs.length > 1 ? "s" : ""} attached`
                  : "No files attached"}
              </span>
            </div>
          )}

          {/* Uploaded file selector. Multiple documents can be attached to one
              submission (governmentId + proofOfAddress, etc). */}
          {docs.length > 1 && (
            <div className="flex gap-1.5 flex-wrap shrink-0">
              {docs.map((doc, i) => (
                <button
                  key={doc.storagePath || doc.url || i}
                  type="button"
                  onClick={() => { setDocIndex(i); setZoom(100); }}
                  className={`px-2.5 py-1.5 rounded-lg border text-[10px] transition cursor-pointer ${
                    i === docIndex
                      ? "border-primary-bg bg-primary-bg-muted/20 text-text-primary"
                      : "border-border-main text-text-muted hover:bg-page-bg"
                  }`}
                >
                  {doc.name || `Document ${i + 1}`}
                </button>
              ))}
            </div>
          )}

          <div className="bg-primary-bg-muted/20 rounded-xl p-3.5 flex items-center justify-between text-xs shrink-0 gap-3">
            <div className="flex items-center gap-2 text-text-primary min-w-0">
              <FileText size={16} color="blue" className="shrink-0" />
              <span className="truncate">
                {activeDoc?.name || item.docFile || "No file attached"}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activeDoc?.size > 0 && (
                <span className="text-text-muted font-light text-[10px]">
                  {(activeDoc.size / 1024 / 1024).toFixed(2)} MB
                </span>
              )}
              {activeDoc?.url && (
                <a
                  href={activeDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-blue-500 text-blue-500 bg-blue-50 px-2.5 py-1 rounded-lg text-[10px] hover:bg-blue-100 transition"
                >
                  Open original
                </a>
              )}
            </div>
          </div>

          {/* Document View Preview — renders the provider's actual upload.
              verificationDocuments carries { name, url, storagePath,
              contentType, size } per Schema v3.0 §6. */}
          <div className="space-y-1">
            {!activeDoc?.url ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 bg-gray-50 rounded-2xl border border-border-main/50 text-center">
                <FileText size={22} className="text-text-muted/60" />
                <p className="text-xs text-text-primary font-medium">No document uploaded</p>
                <p className="text-[10px] text-text-muted font-light max-w-xs">
                  This provider has not submitted any verification documents yet.
                  There is nothing to approve.
                </p>
              </div>
            ) : isImage ? (
              <div className="bg-gray-50 rounded-2xl border border-border-main/50 overflow-hidden">
                <div className="flex items-center justify-between text-[10px] text-text-muted px-3 py-2 border-b border-border-main/50">
                  <span>{activeDoc.contentType || "Image"}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(z - 25, 50))}
                      disabled={zoom <= 50}
                      className="hover:text-text-primary cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                    >
                      Zoom -
                    </button>
                    <span className="w-8 text-center">{zoom}%</span>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(z + 25, 300))}
                      disabled={zoom >= 300}
                      className="hover:text-text-primary cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                    >
                      Zoom +
                    </button>
                  </div>
                </div>
                <div className="overflow-auto max-h-72 bg-white flex items-start justify-center p-3">
                  {/* Plain <img>: the source is a Firebase Storage URL that
                      next/image cannot optimise without a configured domain. */}
                  <img
                    src={activeDoc.url}
                    alt={activeDoc.name || "Verification document"}
                    onError={() => setLoadFailed(true)}
                    style={{ width: `${zoom}%` }}
                    className="max-w-none object-contain rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl border border-border-main/50 overflow-hidden">
                <div className="text-[10px] text-text-muted px-3 py-2 border-b border-border-main/50">
                  {activeDoc.contentType || "Document"}
                </div>
                <iframe
                  src={activeDoc.url}
                  title={activeDoc.name || "Verification document"}
                  className="w-full h-72 bg-white"
                />
              </div>
            )}

            {loadFailed && (
              <p className="text-[10px] text-red-500 pt-1">
                Could not load this file. It may have been removed, or admin read
                access to Storage may not be granted. Use &quot;Open original&quot; to check.
              </p>
            )}
          </div>

          {/* Rejection Form fields (conditional on Reject Mode) */}
          {isRejectMode && (
            <form onSubmit={handleConfirmRejectionSubmit} className="space-y-3.5 border-t border-border-main pt-4 shrink-0">
              <div className="space-y-1">
                <label className="text-xs text-text-primary block">Reason Category <span className="text-red-500">*</span></label>
                <select
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  className="w-full bg-white border border-border-main text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary cursor-pointer"
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
                  className="w-full bg-white border border-border-main text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted resize-none"
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
                  disabled={isPending}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer text-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPending ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          )}

          {/* Action trigger footer blocks */}
          {!isRejectMode && (
            <div className="border-t border-border-main pt-4 shrink-0">
              {item.status === "Approved" ? (
                <div className="text-center text-emerald-600 font-semibold text-xs py-2">
                  Document approved – no further action required
                </div>
              ) : item.status === "Expired" ? (
                <button
                  onClick={() => onRequestResubmission(item.id)}
                  disabled={isPending}
                  className="w-full bg-primary-bg hover:opacity-90 text-white font-medium text-xs py-2.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Send size={13} /> Request Resubmission
                </button>
              ) : item.status === "Rejected" ? (
                <div className="space-y-3">
                  <div className="text-center text-red-500 font-semibold text-xs py-1">
                    Document rejected – awaiting resubmission
                  </div>
                  <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 text-xs text-text-primary">
                    <span className="font-semibold block text-[10px] text-red-500 uppercase tracking-wide">Previous Rejection Feedback</span>
                    <strong className="block mt-0.5 text-text-primary font-medium">Category: {item.rejectCategory || "Blurry"}</strong>
                    <p className="mt-1 text-text-muted font-light">{item.rejectReason || "The document is blurred. Please upload a clear copy."}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onApprove(item.id)}
                      disabled={isPending}
                      className="flex-1 bg-primary-bg hover:opacity-90 text-white font-medium text-xs py-2.5 rounded-lg transition cursor-pointer text-center disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Override & Approve
                    </button>
                    <button
                      onClick={() => onRequestResubmission(item.id)}
                      disabled={isPending}
                      className="flex-1 bg-white border border-border-main text-text-primary hover:bg-page-bg font-medium text-xs py-2.5 rounded-lg transition cursor-pointer text-center disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Resend Resubmission Email
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => onApprove(item.id)}
                    // Approving grants kycStatus:verified, which is what makes a
                    // provider payable. Never allow it with nothing to inspect.
                    disabled={isPending || !activeDoc}
                    title={!activeDoc ? "No document has been submitted to review" : undefined}
                    className="w-full bg-primary-bg hover:opacity-90 text-white font-medium text-xs py-2.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Check size={13} /> {isPending ? "Working..." : "Approve Document"}
                  </button>
                  <button
                    onClick={() => setIsRejectMode(true)}
                    className="w-full bg-white border border-red-200 text-red-500 hover:bg-red-50 font-medium text-xs py-2.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <X size={13} /> Reject Document
                  </button>
                  <button
                    onClick={() => onRequestResubmission(item.id)}
                    disabled={isPending}
                    className="w-full bg-white border border-primary-bg-muted text-primary-bg hover:bg-page-bg font-medium text-xs py-2.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
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
