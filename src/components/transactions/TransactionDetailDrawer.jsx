"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { 
  Copy, 
  X, 
  ArrowUpRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldAlert,
  Zap, 
  Wallet,
  Flag,
  BrushCleaning
} from "lucide-react";

// Helper to copy text to clipboard
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  toast.success(`Copied Transaction ID to clipboard!`, {
    position: "top-right",
    autoClose: 2000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: false,
  });
};

// Helper to get initials
const getInitials = (name) => {
  if (!name) return "";
  const parts = name.split(" ");
  return parts.map(p => p[0]).join("").toUpperCase().substring(0, 2);
};

// Helper to get dynamic status history timeline matching Figma designs
const getTimelineSteps = (tx) => {
  const requestDate = "June 10, 2026 • 09:45 AM";
  const providerAcceptDate = tx.status === "Hour Adjustment Pending" ? "June 10, 2026 • 01:15 PM" : "June 10, 2026 • 09:45 AM";
  const paymentConfirmDate = tx.status === "Hour Adjustment Pending" ? "June 10, 2026 • 04:15 PM" : "June 10, 2026 • 09:45 AM";
  
  switch (tx.status) {
    case "Pending Provider Acceptance":
      return [
        { status: "Request Submitted", date: requestDate }
      ];
      
    case "Pending Payment":
      return [
        { status: "Request Submitted", date: requestDate },
        { status: "Provider Accepted", date: providerAcceptDate, note: "Provider confirmed availability and accepted at listed rate." }
      ];
      
    case "Quote Pending":
      return [
        { status: "Request Submitted", date: requestDate },
        { status: "Quote Submitted by Provider", date: providerAcceptDate }
      ];
      
    case "Quote Declined":
      return [
        { status: "Request Submitted", date: requestDate },
        { status: "Quote Submitted by Provider", date: providerAcceptDate },
        { status: "Quote Declined by Client", date: "June 11, 2026 • 09:45 AM" }
      ];
      
    case "Rejected / Expired":
      return [
        { status: "Request Submitted", date: requestDate },
        { status: "Rejected by Provider", date: providerAcceptDate, note: tx.rejectionReason || "No availability in the requested window." }
      ];
      
    case "Confirmed":
      return [
        { status: "Request Submitted", date: requestDate },
        { status: "Provider Accepted", date: providerAcceptDate },
        { status: "Payment Confirmed", date: paymentConfirmDate }
      ];
      
    case "In Progress":
      return [
        { status: "Request Submitted", date: requestDate },
        { status: "Provider Accepted", date: providerAcceptDate },
        { status: "Payment Confirmed", date: paymentConfirmDate },
        { status: "Service Started", date: paymentConfirmDate }
      ];
      
    case "Hour Adjustment Pending":
      return [
        { status: "Request Submitted", date: requestDate },
        { status: "Provider Accepted", date: providerAcceptDate },
        { status: "Payment Confirmed", date: paymentConfirmDate },
        { status: "Service Started", date: "June 11, 2026 • 09:45 AM" },
        { status: "Hour Adjustment Requested by Provider", date: "June 11, 2026 • 10:30 AM" }
      ];
      
    case "Cancelled Pending Admin Review":
      return [
        { status: "Request Submitted", date: requestDate },
        { status: "Provider Accepted", date: providerAcceptDate },
        { status: "Payment Confirmed", date: paymentConfirmDate },
        { 
          status: tx.cancelledBy === "Client" ? "Cancelled by Client" : "Cancelled by Provider", 
          date: paymentConfirmDate,
          note: tx.cancelledBy === "Client" 
            ? "Client cancelled < 2h before start. 5% fee retained." 
            : "Provider no-show. Full refund applicable." 
        }
      ];
      
    case "Completed":
      return [
        { status: "Request Submitted", date: requestDate },
        { status: "Provider Accepted", date: providerAcceptDate },
        { status: "Payment Confirmed", date: paymentConfirmDate },
        { status: "Service Started", date: paymentConfirmDate },
        { status: "Service Completed", date: "June 10, 2026 • 12:00 PM" }
      ];
      
    case "Wallet Credited — Client Fault":
      return [
        { status: "Request Submitted", date: requestDate },
        { status: "Provider Accepted", date: providerAcceptDate },
        { status: "Payment Confirmed", date: paymentConfirmDate },
        { status: "Cancelled by Client", date: paymentConfirmDate, note: "Client cancelled < 2h before start. 5% fee retained." },
        { status: "Wallet Credit Approved", date: "June 11, 2026 • 12:00 PM" }
      ];
      
    case "Wallet Credited — Provider Fault":
      return [
        { status: "Request Submitted", date: requestDate },
        { status: "Provider Accepted", date: providerAcceptDate },
        { status: "Payment Confirmed", date: paymentConfirmDate },
        { status: "Cancelled by Provider", date: paymentConfirmDate, note: "Provider no-show. Full refund applicable." },
        { status: "Wallet Credit Approved", date: "June 11, 2026 • 12:00 PM" }
      ];
      
    case "Refund Requested":
      return [
        { status: "Request Submitted", date: requestDate },
        { status: "Provider Accepted", date: providerAcceptDate },
        { status: "Payment Confirmed", date: paymentConfirmDate },
        { status: "Service Completed", date: "June 10, 2026 • 12:00 PM" },
        { status: "Refund Requested by Client", date: "June 10, 2026 • 02:00 PM" }
      ];
      
    case "Processing":
      return [
        { status: "Request Submitted", date: requestDate },
        { status: "Provider Accepted", date: providerAcceptDate },
        { status: "Payment Confirmed", date: paymentConfirmDate },
        { status: "Service Completed", date: "June 10, 2026 • 12:00 PM" },
        { status: "Refund Requested by Client", date: "June 10, 2026 • 02:00 PM" },
        { status: "Refund Processing", date: "June 10, 2026 • 02:15 PM" }
      ];
      
    case "Refunded":
      return [
        { status: "Request Submitted", date: requestDate },
        { status: "Provider Accepted", date: providerAcceptDate },
        { status: "Payment Confirmed", date: paymentConfirmDate },
        { status: "Service Completed", date: "June 10, 2026 • 12:00 PM" },
        { status: "Refund Requested by Client", date: "June 10, 2026 • 02:00 PM" },
        { status: "Refunded via Stripe", date: "June 10, 2026 • 02:30 PM" }
      ];
      
    case "Dispute":
      return [
        { status: "Request Submitted", date: requestDate },
        { status: "Provider Accepted", date: providerAcceptDate },
        { status: "Payment Confirmed", date: paymentConfirmDate },
        { status: "Service Completed", date: "June 10, 2026 • 12:00 PM" },
        { status: "Dispute Opened by Admin", date: "June 11, 2026 • 09:45 AM" }
      ];
      
    default:
      return tx.history || [];
  }
};

export default function TransactionDetailDrawer({ tx, onClose, onActionClick }) {
  const [justification, setJustification] = useState("");

  if (!tx) return null;

  // Basic calculations
  const getCommission = (amount) => amount * 0.15;
  const getFee = (amount) => amount * 0.05;
  const getTotalCharged = (amount, tip = 0) => amount + getFee(amount) + tip;

  // Status Color classes for detail badge
  const statusBadgeColors = {
    "Pending Provider Acceptance": "bg-orange-50 text-orange-600",
    "Pending Payment": "bg-orange-50 text-orange-600",
    "Quote Pending": "bg-orange-50 text-orange-600",
    "Quote Declined": "bg-orange-50 text-orange-600",
    "Rejected / Expired": "bg-orange-50 text-orange-600",
    "Confirmed": "bg-emerald-50 text-emerald-600",
    "In Progress": "bg-orange-50 text-orange-600",
    "Hour Adjustment Pending": "bg-orange-50 text-orange-600",
    "Completed": "bg-emerald-50 text-emerald-600",
    "Cancelled Pending Admin Review": "bg-red-50 text-red-600",
    "Wallet Credited — Client Fault": "bg-emerald-50 text-emerald-600",
    "Wallet Credited — Provider Fault": "bg-emerald-50 text-emerald-600",
    "Refund Requested": "bg-blue-50 text-blue-600",
    "Processing": "bg-blue-50 text-blue-600",
    "Refunded": "bg-blue-50 text-blue-600",
    "Dispute": "bg-red-50 text-red-600"
  };

  const badgeClass = statusBadgeColors[tx.status] || "bg-secondary-bg text-text-muted";

  // Determine if pricing details use Quote cards layout
  const isQuoteLayout = ["Quote Pending", "Quote Declined"].includes(tx.status);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-onest">
      {/* Drawer Overlay */}
      <div 
        className="absolute inset-0 bg-alt-bg/20 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-lg md:max-w-xl bg-white flex flex-col shadow-2xl h-full transition-transform duration-300">
          
          {/* Drawer Header */}
          <div className="p-4 border-b border-secondary-bg flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-text-muted font-light">Transaction Detail</span>
              <h2 className="text-base font-medium text-text-primary flex items-center gap-1.5">
                {tx.id}
                <button 
                  onClick={() => copyToClipboard(tx.id)}
                  className="text-text-muted hover:text-text-primary p-0.5 rounded transition"
                  title="Copy ID"
                >
                  <Copy size={12} />
                </button>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
                {tx.status}
              </span>
              <button 
                onClick={onClose}
                className="w-5 h-5 rounded-full bg-alt-bg text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            
            {/* Warning banner for processing state */}
            {tx.status === "Processing" && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex gap-2">
                <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={16} />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-amber-800 uppercase">Stripe API Warning</span>
                  <p className="text-[10px] text-amber-700 leading-tight">
                    Stripe may still be processing. Check Stripe dashboard before retrying.
                  </p>
                </div>
              </div>
            )}

            {/* Participant Client & Provider Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client block */}
              <div className="bg-page-bg rounded-2xl p-4 space-y-3">
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
                    {getInitials(tx.client.name)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">{tx.client.name}</h4>
                    <p className="text-xs text-text-muted font-light">{tx.client.email}</p>
                  </div>
                </div>
              </div>

              {/* Provider block */}
              <div className="bg-page-bg rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-text-muted">Provider</span>
                  <Link 
                    href="/accounts" 
                    className="text-[10px] text-primary-bg hover:underline font-light flex items-center gap-0.5"
                  >
                    View account <ArrowUpRight size={10} />
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary-bg text-white flex items-center justify-center text-xs font-semibold font-mono">
                    {getInitials(tx.provider.name)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">{tx.provider.name}</h4>
                    <p className="text-xs text-text-muted font-light">{tx.provider.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount details cards */}
            {!isQuoteLayout ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="border border-border-main rounded-2xl p-4">
                    <span className="text-xs text-text-muted block font-light">Service amount</span>
                    <strong className="text-lg text-text-primary font-bold block mt-1">${tx.serviceAmount.toFixed(2)}</strong>
                  </div>
                  <div className="border border-border-main rounded-2xl p-4">
                    <span className="text-xs text-text-muted block font-light">Provider commission</span>
                    <strong className="text-lg text-text-primary font-bold block mt-1">${getCommission(tx.serviceAmount).toFixed(2)}</strong>
                  </div>
                  <div className="border border-border-main rounded-2xl p-4">
                    <span className="text-xs text-text-muted block font-light">Client fee</span>
                    <strong className="text-lg text-text-primary font-bold block mt-1">${getFee(tx.serviceAmount).toFixed(2)}</strong>
                  </div>
                </div>
                <div className="bg-[#F0FEFF] rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-xs text-text-muted block font-light">Total client charged</span>
                  <strong className="text-lg text-text-primary font-bold block mt-1">${getTotalCharged(tx.serviceAmount, tx.tip).toFixed(2)}</strong>
                </div>
              </div>
            ) : (
              // Quote layouts (Status 3, 4, etc.)
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-border-main rounded-2xl p-4">
                    <span className="text-[10px] text-text-muted block font-medium">Quote Price</span>
                    <strong className="text-base text-text-primary font-bold block mt-1">
                      ${(tx.quotedPrice || tx.serviceAmount).toFixed(2)}
                    </strong>
                  </div>
                  <div className="border border-border-main rounded-2xl p-4">
                    <span className="text-[10px] text-text-muted block font-medium">Quoted duration</span>
                    <strong className="text-base text-text-primary font-bold block mt-1">
                      {tx.quotedDuration || "4 hours/visit"}
                    </strong>
                  </div>
                </div>

                {tx.status === "Quote Pending" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-border-main rounded-2xl p-4">
                      <span className="text-[10px] text-text-muted block font-medium">Quote submitted</span>
                      <strong className="text-xs text-text-primary font-semibold block mt-1">
                        {tx.quoteSubmittedAt || "Jun 24, 2027 09:00 AM"}
                      </strong>
                    </div>
                    <div className="border border-border-main rounded-2xl p-4">
                      <span className="text-[10px] text-text-muted block font-medium">Quote expires</span>
                      <strong className="text-xs text-orange-500 font-semibold block mt-1">
                        {tx.quoteExpiresAt || "Jun 26, 2027 09:00 AM"}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Horizontal parameters aligned columns */}
            <div className="flex divide-x divide-border-main py-4 text-center">
              <div className="flex-1">
                <span className="text-xs text-text-muted block font-light mb-0.5">Date</span>
                <strong className="text-text-primary text-sm font-normal">{tx.date}</strong>
              </div>
              <div className="flex-1">
                <span className="text-xs text-text-muted block font-light mb-0.5">Time</span>
                <strong className="text-text-primary text-sm font-normal">{tx.time}</strong>
              </div>
              <div className="flex-1">
                <span className="text-xs text-text-muted block font-light mb-0.5">Category</span>
                <strong className="text-text-primary text-sm font-normal">{tx.category}</strong>
              </div>
              <div className="flex-1">
                <span className="text-xs text-text-muted block font-light mb-0.5">Pricing</span>
                <strong className="text-text-primary text-sm font-normal">
                  {tx.pricingType === "Quote" ? "Quote Based" : tx.pricingType}
                </strong>
              </div>
            </div>

            {/* Cancelled by banner details */}
            {tx.status === "Cancelled Pending Admin Review" && (
              <div className="bg-red-50/50 text-text-primary rounded-xl p-3 border border-red-100 flex items-center text-xs">
                <span className="text-xs text-text-primary">Cancelled by:</span>
                <span className={`inline-block px-1 rounded-full text-xs text-red-700`}>
                  {tx.cancelledBy}
                </span>
              </div>
            )}

            {/* Hour Adjustment Pending cards */}
            {tx.status === "Hour Adjustment Pending" && (
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-border-main rounded-2xl p-4">
                  <span className="text-xs text-text-muted block font-light">Original hours</span>
                  <strong className="text-text-primary font-semibold block mt-1">{tx.originalHours || "2h"}</strong>
                </div>
                <div className="border border-border-main rounded-2xl p-4">
                  <span className="text-xs text-text-muted block font-light">Requested hours</span>
                  <strong className="text-amber-600 font-semibold block mt-1">{tx.requestedHours || "3h"}</strong>
                </div>
                <div className="border border-border-main rounded-2xl p-4">
                  <span className="text-xs text-text-muted block font-light">Revised total</span>
                  <strong className="text-amber-600 font-semibold block mt-1">
                    ${tx.revisedAmount ? tx.revisedAmount.toFixed(2) : "156.00"}
                  </strong>
                </div>
              </div>
            )}

            {/* Rejection Reason display if Quote Declined / Expired */}
            {tx.status === "Quote Declined" && (
              <div className="space-y-1">
                <span className="text-xs text-text-muted font-light block">Rejection Reason (by Client)</span>
                <p className="text-xs font-normal text-text-primary">
                  {tx.rejectionReason || "price too high."}
                </p>
              </div>
            )}

            {tx.status === "Rejected / Expired" && (
              <div className="space-y-1">
                <span className="text-xs text-text-muted font-light block">Rejection Reason (by Provider)</span>
                <p className="text-xs font-normal text-text-primary">
                  {tx.rejectionReason || "No availability in the requested window."}
                </p>
              </div>
            )}

            {/* Booking notes */}
            {tx.description && (
              <div className="space-y-1">
                <span className="text-xs text-text-muted font-light block">Booking notes</span>
                <p className="text-xs font-normal text-text-primary">{tx.description}</p>
              </div>
            )}

            {/* Status History Timeline */}
            <div className="space-y-4">
              <span className="text-xs text-text-muted font-light block">Status history</span>              
              <div className="relative pl-8 space-y-4">
                {/* Timeline vertical connector line */}
                <div className="absolute left-2.5 top-2.5 bottom-2.5 w-[1.5px] bg-primary-bg/20"></div>

                {getTimelineSteps(tx).map((step, idx) => {
                  const isDeclined = step.status.toLowerCase().includes("declined") || step.status.toLowerCase().includes("rejected") || step.status.toLowerCase().includes("cancelled");
                  const isPending = step.status.toLowerCase().includes("requested") || step.status.toLowerCase().includes("pending");
                  const isServiceStarted = step.status === "Service Started";
                  
                  return (
                    <div key={idx} className="relative flex flex-col space-y-0.5">
                      {/* Avatar icon state indicator */}
                      <div className="absolute -left-8.5">
                        {isDeclined ? (
                          <XCircle className="fill-red-500 text-white" size={24} />
                        ) : isServiceStarted ? (
                          <div className="w-6 h-6 rounded-full bg-page-bg text-text-muted flex items-center justify-center">
                            <BrushCleaning size={12} />
                          </div>
                        ) : isPending ? (
                          <Clock className="fill-orange-400 text-white" size={24} />
                        ) : (
                          <CheckCircle2 className="fill-green-600 text-white" size={24} strokeWidth={1.5} />
                        )}
                      </div>
                      <span className="text-sm font-normal text-text-primary">{step.status}</span>
                      <span className="text-xs font-light text-text-muted">{step.date}</span>
                      {step.note && (
                        <p className="text-xs font-light text-text-muted mt-0.5">{step.note}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Decision Card Block for Cancelled review (Slides 1 & 2) */}
            {tx.status === "Cancelled Pending Admin Review" && (
              <div className="bg-[#F0FEFF] border border-border-main rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="text-primary-bg">
                    <Wallet size={26} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">
                      {tx.cancelledBy === "Client" ? "Client Cancelled" : "Provider Cancelled"}
                    </h4>
                    <p className="text-xs text-text-muted font-light">
                      {tx.cancelledBy === "Client" ? "5% platform fee retained." : "Full credit (including 5%)"}
                    </p>
                  </div>
                </div>

                <div className="bg-primary-bg/15 rounded-xl px-3 py-2 text-xs font-medium text-text-primary">
                  Credit to wallet: ${tx.creditAmount ? tx.creditAmount.toFixed(2) : (tx.serviceAmount * (tx.cancelledBy === "Client" ? 0.95 : 1.05)).toFixed(2)}
                </div>

                {/* Written reason input area */}
                <div className="space-y-1">
                  <textarea
                    placeholder="Written reason required..."
                    rows={3}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="w-full bg-white border border-border-main text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted resize-none"
                    required
                  />
                </div>

                {/* Approve / Reject buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      if (justification.trim().length < 20) {
                        alert("Justification of at least 20 characters is required.");
                        return;
                      }
                      onActionClick("approveCredit");
                    }}
                    className="w-full bg-primary-bg hover:opacity-90 text-white font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer text-center"
                  >
                    Approve & Credit Wallet
                  </button>
                  <button
                    onClick={() => {
                      if (justification.trim().length < 20) {
                        alert("Justification of at least 20 characters is required.");
                        return;
                      }
                      onActionClick("rejectCancel");
                    }}
                    className="w-full bg-white border border-red-200 text-red-500 hover:bg-red-50 font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer text-center"
                  >
                    Reject & Open Dispute
                  </button>
                </div>
              </div>
            )}

            {/* General Administrative actions control footer */}
            <div className="space-y-3 pt-4 border-t border-secondary-bg">
              <div className="flex flex-col gap-2">
                
                 {/* Standard buttons for Confirmed & In Progress */}
                {tx.status === "Confirmed" && (
                  <button
                    onClick={() => onActionClick("dispute")}
                    className="w-full bg-white border border-red-200 text-red-500 hover:bg-red-50 font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Flag size={16} /> Flag as Dispute
                  </button>
                )}

                {tx.status === "In Progress" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onActionClick("dispute")}
                      className="flex-1 bg-white border border-red-200 text-red-500 hover:bg-red-50 font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Flag size={16} /> Flag as Dispute
                    </button>
                    <button
                      onClick={() => onActionClick("refund")}
                      className="flex-1 bg-white border border-border-main text-primary-bg hover:bg-page-bg font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Zap size={16} /> Force Manual Transfer
                    </button>
                  </div>
                )}

                {/* Hour Adjustment Pending actions */}
                {tx.status === "Hour Adjustment Pending" && (
                  <button
                    onClick={() => onActionClick("refund")}
                    className="w-full bg-white border border-border-main text-primary-bg hover:bg-page-bg font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Zap size={16} /> Force Manual Transfer
                  </button>
                )}

                {/* Dispute navigation */}
                {tx.status === "Dispute" && (
                  <Link
                    href="/compliance/disputes"
                    className="w-full bg-alt-bg text-white hover:opacity-90 font-semibold text-xs py-2 px-3 rounded-xl transition text-center block cursor-pointer"
                  >
                    View Dispute Detail
                  </Link>
                )}

                {/* Processing retry action */}
                {tx.status === "Processing" && (
                  <button
                    onClick={() => onActionClick("processRefund")}
                    className="w-full bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition rounded-xl py-2 px-3 text-xs font-semibold cursor-pointer"
                  >
                    Retry Stripe Refund Call
                  </button>
                )}

                {/* Refund Requested approval card */}
                {tx.status === "Refund Requested" && (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onActionClick("processRefund")}
                        className="bg-primary-bg text-white hover:opacity-90 font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer text-center"
                      >
                        Approve Refund
                      </button>
                      <button
                        onClick={() => onActionClick("rejectRefund")}
                        className="bg-white border border-red-200 text-red-500 hover:bg-red-50 font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer text-center"
                      >
                        Reject Refund Request
                      </button>
                    </div>
                    <button
                      onClick={() => onActionClick("refund")}
                      className="w-full bg-white border border-secondary-bg hover:bg-page-bg text-text-primary font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer text-center"
                    >
                      Force Manual Refund (Override)
                    </button>
                  </div>
                )}

                {/* Force manual refund override for cancelled / fault statuses */}
                {["Cancelled Pending Admin Review", "Wallet Credited — Client Fault", "Wallet Credited — Provider Fault"].includes(tx.status) && (
                  <button
                    onClick={() => onActionClick("refund")}
                    className="w-full bg-white border border-border-main text-primary-bg hover:bg-page-bg font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Zap size={16} /> Force Manual Refund
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
