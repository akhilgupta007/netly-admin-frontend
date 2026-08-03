"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useTransaction } from "@/hooks/useTransactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { raiseDispute } from "@/lib/callables";
import { toast } from "react-toastify";
import { getInitials } from "@/lib/utils";
import {
  ArrowLeft,
  Copy,
  X,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  Flag,
  Zap,
  MessageSquare
} from "lucide-react";

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [justification, setJustification] = useState("");

  const { transaction: tx, isLoading, isError, error, notFound } = useTransaction(id);

  const queryClient = useQueryClient();

  const disputeMutation = useMutation({
    mutationFn: raiseDispute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transaction", id] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setDisputeModalOpen(false);
      setJustification("");
      toast.success("Dispute raised.");
    },
    onError: (error) => toast.error(error.message)
  });

  // There is no admin refund endpoint. Refunds only happen inside
  // processCancellation (party-authenticated, amount set by policy) or
  // resolveDispute. Saying so beats a success toast that moves no money.
  const notImplementedRefund = () =>
    toast.error(
      "No admin refund endpoint exists yet — refunds are issued by cancellation or dispute resolution."
    );


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-bg" />
        <p className="text-xs text-text-muted">Loading transaction details...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-2 text-center px-4">
        <h3 className="text-sm font-semibold text-red-600">Could not load this transaction</h3>
        <p className="text-xs text-text-muted font-light max-w-sm">
          {error?.message || "Check your connection and try again."}
        </p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-3 text-center px-4">
        <h3 className="text-sm font-semibold text-text-primary">Transaction not found</h3>
        <p className="text-xs text-text-muted font-light">
          No booking exists with id <span className="font-mono">{id}</span>.
        </p>
        <button
          onClick={() => router.push("/transactions")}
          className="text-xs text-primary-bg hover:underline cursor-pointer"
        >
          Back to transactions
        </button>
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-bg" />
        <p className="text-xs text-text-muted">Loading transaction details...</p>
      </div>
    );
  }

  const currentStatus = tx.status;

  // Basic calculations
  const getCommission = (amount) => amount * 0.15;
  const getFee = (amount) => amount * 0.05;
  const getTotalCharged = (amount, tip = 0) => amount + getFee(amount) + tip;

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

  // Timeline checkpoints helper based on Figma PDFs
  const getTimelineSteps = (status) => {
    const requestDate = "June 10, 2026 • 09:45 AM";
    const providerAcceptDate = "June 10, 2026 • 09:45 AM";
    const paymentConfirmDate = "June 10, 2026 • 10:15 AM";

    switch (status) {
      case "Pending Payment":
        return [
          { status: "Service Request Submitted", date: requestDate },
          { status: "Negotiation Started", date: "June 10, 2026 • 09:52 AM" },
          { status: "Custom Offer Sent", date: "June 10, 2026 • 10:08 AM" },
          { status: "Offer Accepted", date: "June 10, 2026 • 10:15 AM" },
          { status: "Awaiting Payment", date: "Pending", isPending: true, note: "The client is reviewing the custom offer. Payment is required to confirm the booking." }
        ];
      case "Completed":
        return [
          { status: "Service Request Submitted", date: requestDate },
          { status: "Negotiation Started", date: "June 10, 2026 • 09:52 AM" },
          { status: "Custom Offer Sent", date: "June 10, 2026 • 10:08 AM" },
          { status: "Offer Accepted", date: "June 10, 2026 • 10:15 AM" },
          { status: "Payment Completed", date: paymentConfirmDate },
          { status: "Booking Confirmed", date: paymentConfirmDate },
          { status: "Service Started", date: paymentConfirmDate },
          { status: "Provider Marked Completed", date: paymentConfirmDate },
          { status: "Client Approved Completion", date: paymentConfirmDate },
          { status: "Provider Paid", date: paymentConfirmDate }
        ];
      case "In Progress":
        return [
          { status: "Service Request Submitted", date: requestDate },
          { status: "Negotiation Started", date: "June 10, 2026 • 09:52 AM" },
          { status: "Custom Offer Sent", date: "June 10, 2026 • 10:08 AM" },
          { status: "Offer Accepted", date: "June 10, 2026 • 10:15 AM" },
          { status: "Payment Completed", date: paymentConfirmDate },
          { status: "Booking Confirmed", date: paymentConfirmDate },
          { status: "Service Started", date: paymentConfirmDate, isProgress: true }
        ];
      case "Confirmed":
        return [
          { status: "Service Request Submitted", date: requestDate },
          { status: "Negotiation Started", date: "June 10, 2026 • 09:52 AM" },
          { status: "Custom Offer Sent", date: "June 10, 2026 • 10:08 AM" },
          { status: "Offer Accepted", date: "June 10, 2026 • 10:15 AM" },
          { status: "Payment Completed", date: paymentConfirmDate },
          { status: "Booking Confirmed", date: paymentConfirmDate },
          { status: "Service yet to start", date: "Awaiting", isPending: true }
        ];
      case "Cancelled Pending Admin Review":
        return [
          { status: "Service Request Submitted", date: requestDate },
          { status: "Negotiation Started", date: "June 10, 2026 • 09:52 AM" },
          { status: "Custom Offer Sent", date: "June 10, 2026 • 10:08 AM" },
          { status: "Offer Accepted", date: "June 10, 2026 • 10:15 AM" },
          { status: "Payment Completed", date: paymentConfirmDate },
          { status: "Booking Confirmed", date: paymentConfirmDate },
          { status: "Booking Cancelled", date: paymentConfirmDate, isDeclined: true },
          { status: "Refund Requested", date: "June 10, 2026 • 11:15 AM", isPending: true }
        ];
      case "Wallet Credited — Client Fault":
      case "Wallet Credited — Provider Fault":
      case "Cancelled – Wallet Credited":
        return [
          { status: "Service Request Submitted", date: requestDate },
          { status: "Negotiation Started", date: "June 10, 2026 • 09:52 AM" },
          { status: "Custom Offer Sent", date: "June 10, 2026 • 10:08 AM" },
          { status: "Offer Accepted", date: "June 10, 2026 • 10:15 AM" },
          { status: "Payment Completed", date: paymentConfirmDate },
          { status: "Booking Confirmed", date: paymentConfirmDate },
          { status: "Booking Cancelled", date: paymentConfirmDate, isDeclined: true },
          { status: "Refund Requested", date: "June 10, 2026 • 11:15 AM" },
          { status: "Wallet Credited", date: "June 10, 2026 • 11:15 AM" }
        ];
      case "Refund Requested":
        return [
          { status: "Service Request Submitted", date: requestDate },
          { status: "Negotiation Started", date: "June 10, 2026 • 09:52 AM" },
          { status: "Custom Offer Sent", date: "June 10, 2026 • 10:08 AM" },
          { status: "Offer Accepted", date: "June 10, 2026 • 10:15 AM" },
          { status: "Payment Completed", date: paymentConfirmDate },
          { status: "Booking Confirmed", date: paymentConfirmDate },
          { status: "Booking Cancelled", date: paymentConfirmDate, isDeclined: true },
          { status: "Refund Requested", date: "June 10, 2026 • 11:15 AM", isPending: true }
        ];
      case "Refunded":
        return [
          { status: "Service Request Submitted", date: requestDate },
          { status: "Negotiation Started", date: "June 10, 2026 • 09:52 AM" },
          { status: "Custom Offer Sent", date: "June 10, 2026 • 10:08 AM" },
          { status: "Offer Accepted", date: "June 10, 2026 • 10:15 AM" },
          { status: "Payment Completed", date: paymentConfirmDate },
          { status: "Booking Confirmed", date: paymentConfirmDate },
          { status: "Booking Cancelled", date: paymentConfirmDate, isDeclined: true },
          { status: "Refund Requested", date: "June 10, 2026 • 11:15 AM" },
          { status: "Refunded", date: "June 10, 2026 • 11:15 AM" }
        ];
      case "Dispute":
        return [
          { status: "Service Request Submitted", date: requestDate },
          { status: "Negotiation Started", date: "June 10, 2026 • 09:52 AM" },
          { status: "Custom Offer Sent", date: "June 10, 2026 • 10:08 AM" },
          { status: "Offer Accepted", date: "June 10, 2026 • 10:15 AM" },
          { status: "Payment Completed", date: paymentConfirmDate },
          { status: "Booking Confirmed", date: paymentConfirmDate },
          { status: "Service Started", date: paymentConfirmDate },
          { status: "Provider Marked Completed", date: paymentConfirmDate },
          { status: "Client Raised Dispute", date: "June 10, 2026 • 10:15 AM", isPending: true }
        ];
      default:
        return [
          { status: "Service Request Submitted", date: requestDate },
          { status: "Booking Confirmed", date: paymentConfirmDate }
        ];
    }
  };

  // Get status banner styles
  const getBannerDetails = (status) => {
    switch (status) {
      case "Pending Payment":
        return {
          container: "border-amber-200 bg-amber-50/50",
          titleColor: "text-amber-800",
          textColor: "text-amber-700",
          title: "Awaiting Client Payment",
          text: "The provider has sent a custom offer. The client has not completed payment yet. This booking will be confirmed automatically once payment is successful."
        };
      case "Completed":
        return {
          container: "border-emerald-200 bg-emerald-50/50",
          titleColor: "text-emerald-800",
          textColor: "text-emerald-700",
          title: "Service Completed Successfully",
          text: "The client approved the completed work. The provider has been paid and this transaction is now closed."
        };
      case "In Progress":
        return {
          container: "border-indigo-200 bg-indigo-50/50",
          titleColor: "text-indigo-800",
          textColor: "text-indigo-700",
          title: "Service In Progress",
          text: "The provider has started the service. Waiting for the provider to mark the job as completed."
        };
      case "Confirmed":
        return {
          container: "border-sky-200 bg-sky-50/50",
          titleColor: "text-sky-800",
          textColor: "text-sky-700",
          title: "Payment received.",
          text: "The client has completed the payment. Waiting for the provider to start the job."
        };
      case "Wallet Credited — Client Fault":
      case "Wallet Credited — Provider Fault":
      case "Cancelled – Wallet Credited":
      case "Cancelled Pending Admin Review":
        return {
          container: "border-border-main bg-page-bg",
          titleColor: "text-text-primary",
          textColor: "text-text-muted",
          title: "Booking Cancelled",
          text: "This booking was cancelled before completion. The refundable amount has been credited to the client's Netly Wallet. The provider did not receive a payout."
        };
      case "Refund Requested":
        return {
          container: "border-amber-200 bg-amber-50/50",
          titleColor: "text-amber-800",
          textColor: "text-amber-700",
          title: "Refund Requested",
          text: "This booking was cancelled before completion. The refund is being requested by the client"
        };
      case "Refunded":
        return {
          container: "border-teal-200 bg-teal-50/50",
          titleColor: "text-teal-800",
          textColor: "text-teal-700",
          title: "Refunded",
          text: "This booking was cancelled before completion. The refundable amount has been credited to the client's account."
        };
      case "Dispute":
        return {
          container: "border-red-200 bg-red-50/50",
          titleColor: "text-red-800",
          textColor: "text-red-700",
          title: "Dispute",
          text: "The service has been completed by the provider. The client has raised a dispute."
        };
      default:
        return {
          container: "border-border-main bg-page-bg",
          titleColor: "text-text-primary",
          textColor: "text-text-muted",
          title: "Transaction Active",
          text: "This transaction is active on the platform."
        };
    }
  };

  // Get status pill classes
  const getStatusPill = (status) => {
    switch (status) {
      case "Pending Payment":
      case "Hour Adjustment Pending":
        return "bg-amber-50 text-amber-600 border border-amber-200";
      case "Completed":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      case "In Progress":
        return "bg-indigo-50 text-indigo-600 border border-indigo-200";
      case "Confirmed":
        return "bg-sky-50 text-sky-600 border border-sky-200";
      case "Wallet Credited — Client Fault":
      case "Wallet Credited — Provider Fault":
      case "Cancelled – Wallet Credited":
        return "bg-secondary-bg text-text-muted border border-border-main";
      case "Refund Requested":
        return "bg-rose-50 text-rose-600 border border-rose-200";
      case "Refunded":
        return "bg-teal-50 text-teal-600 border border-teal-200";
      case "Dispute":
        return "bg-red-50 text-red-600 border border-red-200";
      default:
        return "bg-page-bg text-text-primary border border-border-main";
    }
  };

  const banner = getBannerDetails(currentStatus);
  const showRefundInfo = ["Wallet Credited — Client Fault", "Wallet Credited — Provider Fault", "Cancelled – Wallet Credited", "Refunded", "Refund Requested"].includes(currentStatus);
  const showPhotos = currentStatus === "Completed";

  return (
    <div className="space-y-4 font-onest">


      {/* Breadcrumb header row */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push("/transactions")}
          className="w-8 h-8 rounded-lg bg-white border border-border-main hover:bg-page-bg transition flex items-center justify-center text-text-primary cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="text-xl font-medium text-text-primary">{tx.id}</div>
        <button
          onClick={() => copyToClipboard(tx.id)}
          className="text-text-muted hover:text-text-primary p-1.5 rounded-full hover:bg-white border border-transparent hover:border-border-main transition cursor-pointer"
          title="Copy ID"
        >
          <Copy size={16} />
        </button>
      </div>

      {/* Dynamic Banner Notification */}
      <div className={`p-4 border rounded-2xl flex flex-col gap-1 transition ${banner.container}`}>
        <span className={`text-xs font-bold uppercase tracking-wider ${banner.titleColor}`}>{banner.title}</span>
        <p className={`text-xs leading-relaxed font-light ${banner.textColor}`}>{banner.text}</p>
      </div>

      {/* Grid structure columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Left Column Section */}
        <div className="lg:col-span-1 space-y-4">

          {/* Transaction Information */}
          <div className="bg-white rounded-3xl p-5 border border-border-main space-y-4">
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider block">Transaction Information</span>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-text-muted block font-light mb-0.5">Transaction ID</span>
                <div className="text-text-primary">{tx.id}</div>
              </div>
              <div>
                <span className="text-text-muted block font-light mb-0.5">Status</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusPill(currentStatus)}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {currentStatus}
                </span>
              </div>
              <div>
                {["Completed", "Refunded", "Refund Requested"].includes(currentStatus) ? (
                  <>
                    <span className="text-text-muted block font-light mb-0.5">Completed On</span>
                    <div className="text-text-primary">Jun 24, 2027 • 08:30 AM</div>
                  </>
                ) : (
                  <>
                    <span className="text-text-muted block font-light mb-0.5">Created On</span>
                    <div className="text-text-primary">Jun 24, 2027 • 08:30 AM</div>
                  </>
                )}
              </div>
              {currentStatus === "Completed" && (
                <div>
                  <span className="text-text-muted block font-light mb-0.5">Service Started</span>
                  <div className="text-text-primary">Jun 24, 2027 • 09:05 AM</div>
                </div>
              )}
              {showRefundInfo && (
                <>
                  <div>
                    <span className="text-text-muted block font-light mb-0.5">Cancelled On</span>
                    <div className="text-text-primary">Jun 24, 2027 • 09:45 AM</div>
                  </div>
                  <div>
                    <span className="text-text-muted block font-light mb-0.5">Refund Processed On</span>
                    <div className="text-text-primary">
                      {currentStatus === "Refund Requested" ? "Awaiting" : "Jun 24, 2027 • 11:10 AM"}
                    </div>
                  </div>
                </>
              )}
              {currentStatus === "Dispute" && (
                <div>
                  <span className="text-text-muted block font-light mb-0.5">Dispute opened on</span>
                  <div className="text-text-primary">Jun 24, 2027 • 09:45 AM</div>
                </div>
              )}
            </div>
          </div>

          {/* Service Information */}
          <div className="bg-white rounded-3xl p-5 border border-border-main space-y-4">
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider block">Service Information</span>
            <div className="grid grid-cols-2 gap-4 text-xs border-b border-border-main pb-4">
              <div>
                <span className="text-text-muted block font-light mb-0.5">Service</span>
                <div className="text-text-primary">Office Daily Cleaning</div>
              </div>
              <div>
                <span className="text-text-muted block font-light mb-0.5">Category</span>
                <div className="text-text-primary">Cleaning Services</div>
              </div>
              <div>
                <span className="text-text-muted block font-light mb-0.5">Sub Category</span>
                <div className="text-text-primary">Office Cleaning</div>
              </div>
              <div>
                <span className="text-text-muted block font-light mb-0.5">Pricing Model</span>
                <div className="text-text-primaryd">Hourly</div>
              </div>
              <div>
                <span className="text-text-muted block font-light mb-0.5">Scheduled Date & Time</span>
                <div className="text-text-primary">Jun 24, 2027 • 08:30 AM</div>
              </div>
              <div>
                {currentStatus === "Completed" ? (
                  <>
                    <span className="text-text-muted block font-light mb-0.5">Completed At</span>
                    <div className="text-text-primary">Jun 24, 2027 • 12:35 PM</div>
                  </>
                ) : (
                  <>
                    <span className="text-text-muted block font-light mb-0.5">Estimated Duration</span>
                    <div className="text-text-primary">4 Hours</div>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-3 pt-1 text-xs">
              <div>
                <span className="text-text-muted block font-light mb-1">Booking notes</span>
                <p className="text-text-primary">
                  3-bedroom flat. Kitchen requires priority cleaning.
                </p>
              </div>
              {showRefundInfo && (
                <div>
                  <span className="text-text-muted block font-light mb-1">Cancellation Reason</span>
                  <p className="text-text-primary">
                    Client cancelled before the scheduled service.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Status History */}
          <div className="bg-white rounded-3xl p-5 border border-border-main space-y-4">
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider block">Status history</span>
            <div className="relative pl-8 space-y-5">

              {/* Timeline bar line */}
              <div className="absolute left-2.5 top-2.5 bottom-2.5 w-[1.5px] bg-primary-bg/25" />

              {getTimelineSteps(currentStatus).map((step, idx) => (
                <div key={idx} className="relative flex flex-col space-y-0.5 text-xs">
                  <div className="absolute -left-7.25 top-0.5">
                    {step.isDeclined ? (
                      <XCircle className="fill-red-500 text-white" size={18} />
                    ) : step.isPending ? (
                      <Clock className="fill-amber-400 text-white" size={18} />
                    ) : step.isProgress ? (
                      <div className="w-4.5 h-4.5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">
                        ★
                      </div>
                    ) : (
                      <CheckCircle2 className="fill-emerald-500 text-white" size={18} />
                    )}
                  </div>
                  <span className="text-text-primary">{step.status}</span>
                  <span className="text-[10px] text-text-muted font-light">{step.date}</span>
                  {step.note && (
                    <span className="text-[10px] text-text-muted font-light leading-relaxed mt-0.5">{step.note}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column Section */}
        <div className="space-y-4">

          {/* Admin Actions */}
          <div className="bg-white rounded-3xl p-5 border border-border-main space-y-4">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">Admin Actions</span>
            <div className="flex flex-col gap-2.5">
              {currentStatus === "Pending Payment" && (
                <>
                  <button
                    onClick={() => toast.success("Payment reminder resent to client successfully!")}
                    className="w-full bg-primary-bg hover:opacity-90 text-white font-semibold text-xs py-3 rounded-xl transition cursor-pointer text-center"
                  >
                    Resend Payment Reminder
                  </button>
                  <button
                    onClick={notImplementedRefund}
                    className="w-full bg-white border border-border-main text-text-primary hover:bg-page-bg font-semibold text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Zap size={14} /> Force Manual Transfer
                  </button>
                  <button
                    onClick={() => setDisputeModalOpen(true)}
                    className="w-full bg-white border border-red-200 text-red-500 hover:bg-red-50 font-semibold text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Flag size={14} /> Flag as Dispute
                  </button>
                </>
              )}

              {["Completed", "In Progress", "Confirmed", "Cancelled – Wallet Credited", "Refunded", "Refund Requested"].includes(currentStatus) && (
                <>
                  <button
                    onClick={() => toast.success("Opening booking chat thread...")}
                    className="w-full bg-primary-bg hover:opacity-90 text-white font-semibold text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare size={14} /> View Booking Chat
                  </button>

                  {currentStatus === "Cancelled – Wallet Credited" && (
                    <button
                      onClick={() => toast.info("Redirecting to Wallet Transaction logs...")}
                      className="w-full bg-secondary-bg hover:bg-secondary-bg/80 text-text-primary font-semibold text-xs py-3 rounded-xl transition cursor-pointer text-center"
                    >
                      View Wallet Transaction
                    </button>
                  )}

                  {currentStatus === "Refund Requested" && (
                    <button
                      onClick={notImplementedRefund}
                      className="w-full bg-secondary-bg hover:bg-secondary-bg/80 text-text-primary font-semibold text-xs py-3 rounded-xl transition cursor-pointer text-center"
                    >
                      Process Refund
                    </button>
                  )}

                  {currentStatus === "Refunded" && (
                    <button
                      onClick={() => toast.info("Redirecting to Stripe payment gateway logs...")}
                      className="w-full bg-secondary-bg hover:bg-secondary-bg/80 text-text-primary font-semibold text-xs py-3 rounded-xl transition cursor-pointer text-center"
                    >
                      View Transaction
                    </button>
                  )}

                  <button
                    onClick={() => setDisputeModalOpen(true)}
                    className="w-full bg-white border border-red-200 text-red-500 hover:bg-red-50 font-semibold text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Flag size={14} /> Open Dispute
                  </button>
                </>
              )}

              {currentStatus === "Dispute" && (
                <button
                  onClick={() => router.push("/compliance/disputes")}
                  className="w-full bg-primary-bg hover:opacity-90 text-white font-semibold text-xs py-3 rounded-xl transition cursor-pointer text-center"
                >
                  Go to dispute panel
                </button>
              )}
            </div>
          </div>

          {/* Users */}
          <div className="bg-white rounded-3xl p-5 border border-border-main space-y-4">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">Users</span>

            {/* Client Block */}
            <div className="space-y-2 pb-3.5 border-b border-border-main">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-semibold text-text-muted">Client</span>
                <Link href="/accounts" className="text-[10px] text-primary-bg hover:underline flex items-center gap-0.5 font-light">
                  View account <ArrowUpRight size={10} />
                </Link>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary-bg text-white flex items-center justify-center text-xs font-semibold">
                  FD
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-text-primary">Fatima Diallo</h4>
                  <p className="text-[10px] text-text-muted font-light">fatima.d@corp.com</p>
                </div>
              </div>
            </div>

            {/* Provider Block */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-semibold text-text-muted">Provider</span>
                <Link href="/accounts" className="text-[10px] text-primary-bg hover:underline flex items-center gap-0.5 font-light">
                  View account <ArrowUpRight size={10} />
                </Link>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary-bg text-white flex items-center justify-center text-xs font-semibold">
                  MN
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-text-primary">Meek Nowise</h4>
                  <p className="text-[10px] text-text-muted font-light font-mono">emeka@cleanpro.ng</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white rounded-3xl p-5 border border-border-main space-y-4">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">Financial Summary</span>
            <div className="grid grid-cols-3 gap-3">

              {/* Box 1 */}
              <div className="border border-border-main rounded-2xl p-3 text-xs bg-page-bg/10 flex flex-col justify-between min-h-16">
                <span className="text-[10px] text-text-muted block">Service Price</span>
                <strong className="text-sm text-text-primary font-bold block mt-1">$85.00</strong>
              </div>

              {/* Box 2 */}
              <div className="border border-border-main rounded-2xl p-3 text-xs bg-page-bg/10 flex flex-col justify-between min-h-16">
                <span className="text-[10px] text-text-muted block">Client Platform Fee (5%)</span>
                <strong className="text-sm text-text-primary font-bold block mt-1">$4.25</strong>
              </div>

              {/* Box 3 - Total Amount Due */}
              <div className={`rounded-2xl p-3 text-xs flex flex-col justify-between min-h-16 border ${currentStatus === "Pending Payment" ? "border-amber-300 bg-amber-50/40" : "border-border-main bg-page-bg/10"
                }`}>
                <span className={`text-[10px] block ${currentStatus === "Pending Payment" ? "text-amber-600" : "text-text-muted"}`}>Total Amount Due</span>
                <strong className={`text-sm font-bold block mt-1 ${currentStatus === "Pending Payment" ? "text-amber-700" : "text-text-primary"}`}>$89.25</strong>
              </div>

              {/* Box 4 - Commission or Wallet Credit */}
              {showRefundInfo ? (
                <div className="border border-border-main rounded-2xl p-3 text-xs bg-page-bg/10 flex flex-col justify-between min-h-21.25 col-span-1">
                  <span className="text-[10px] text-text-muted block">Wallet Credit Issued</span>
                  <strong className="text-sm text-text-primary font-bold block mt-0.5">$85.00</strong>
                  <span className="text-[8px] text-text-muted font-light leading-tight mt-0.5">
                    (Service amount credited to the client's Netly Wallet.)
                  </span>
                </div>
              ) : (
                <div className="border border-border-main rounded-2xl p-3 text-xs bg-page-bg/10 flex flex-col justify-between min-h-16">
                  <span className="text-[10px] text-text-muted block">Provider Commission (15%)</span>
                  <strong className="text-sm text-text-primary font-bold block mt-1">$12.75</strong>
                </div>
              )}

              {/* Box 5 - Expected Provider Payout */}
              {showRefundInfo ? (
                <div className="border border-border-main rounded-2xl p-3 text-xs bg-page-bg/10 flex flex-col justify-between min-h-21.25 col-span-1">
                  <span className="text-[10px] text-text-muted block">Provider Payout</span>
                  <strong className="text-sm text-text-primary font-bold block mt-0.5">$0.00</strong>
                  <span className="text-[8px] text-text-muted font-light leading-tight mt-0.5">
                    (No payout released.)
                  </span>
                </div>
              ) : (
                <div className={`rounded-2xl p-3 text-xs bg-page-bg/10 flex flex-col justify-between min-h-21.25 border ${["In Progress", "Confirmed", "Dispute"].includes(currentStatus) ? "border-amber-200" : "border-border-main"
                  }`}>
                  <span className="text-[10px] text-text-muted block">Expected Provider Payout</span>
                  <strong className="text-sm text-text-primary font-bold block mt-0.5">$72.25</strong>
                  {["In Progress", "Confirmed", "Dispute"].includes(currentStatus) && (
                    <span className="text-[8px] text-text-muted font-light leading-tight mt-0.5">
                      Will be released after the client approves completion.
                    </span>
                  )}
                </div>
              )}

              {/* Box 6 - Netly Revenue */}
              {showRefundInfo ? (
                <div className="border border-emerald-300 rounded-2xl p-3 text-xs bg-emerald-50/40 flex flex-col justify-between min-h-21.25 col-span-1">
                  <span className="text-[10px] text-emerald-600 block">Netly Revenue</span>
                  <strong className="text-sm text-emerald-700 font-bold block mt-0.5">$4.25</strong>
                  <span className="text-[8px] text-emerald-500 font-light leading-tight mt-0.5">
                    (Client platform fee retained.)
                  </span>
                </div>
              ) : (
                <div className="border border-emerald-300 rounded-2xl p-3 text-xs bg-emerald-50/40 flex flex-col justify-between min-h-16">
                  <span className="text-[10px] text-emerald-600 block">Netly Revenue</span>
                  <strong className="text-sm text-emerald-700 font-bold block mt-1">$17.00</strong>
                </div>
              )}

            </div>
          </div>

          {/* Completion Photos */}
          {showPhotos && (
            <div className="bg-white rounded-3xl p-5 border border-border-main space-y-4 animate-fade-in">
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">Completion Photos</span>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="relative rounded-2xl overflow-hidden aspect-4/3 border border-border-main">
                  <Image
                    src="/kitchen_completed.png"
                    alt="Kitchen Completed Photos"
                    fill
                    className="object-cover hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="relative rounded-2xl overflow-hidden aspect-4/3 border border-border-main">
                  <Image
                    src="/bathroom_completed.png"
                    alt="Bathroom Completed Photos"
                    fill
                    className="object-cover hover:scale-105 transition duration-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Refund Information */}
          {showRefundInfo && (
            <div className="bg-white rounded-3xl p-5 border border-border-main space-y-4 animate-fade-in">
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">Refund Information</span>
              <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-xs">
                <div>
                  <span className="text-text-muted block font-light mb-0.5">Refund Method</span>
                  <strong className="text-text-primary font-semibold">
                    {["Wallet Credited — Client Fault", "Wallet Credited — Provider Fault", "Cancelled – Wallet Credited"].includes(currentStatus)
                      ? "Netly Wallet Credit"
                      : "Client Bank Account"
                    }
                  </strong>
                </div>
                <div>
                  <span className="text-text-muted block font-light mb-0.5">Refund Status</span>
                  <strong className="text-text-primary font-semibold">
                    {currentStatus === "Refund Requested" ? "Requested" : currentStatus === "Refunded" ? "Refunded" : "Wallet Credited"}
                  </strong>
                </div>
                <div>
                  <span className="text-text-muted block font-light mb-0.5">Processed By</span>
                  <strong className="text-text-primary font-semibold">John Smith (Support Admin)</strong>
                </div>
                <div>
                  <span className="text-text-muted block font-light mb-0.5">
                    {["Wallet Credited — Client Fault", "Wallet Credited — Provider Fault", "Cancelled – Wallet Credited"].includes(currentStatus)
                      ? "Wallet Transaction ID"
                      : "Transaction ID"
                    }
                  </span>
                  <strong className="text-text-primary font-semibold font-mono">
                    {["Wallet Credited — Client Fault", "Wallet Credited — Provider Fault", "Cancelled – Wallet Credited"].includes(currentStatus)
                      ? "WLT-002184"
                      : "TXN-002184"
                    }
                  </strong>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* DISPUTE ACTIONS DIALOG MODAL */}
      {disputeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-onest animate-fade-in">
          <div
            className="absolute inset-0 bg-alt-bg/40 backdrop-blur-xs transition-opacity"
            onClick={() => setDisputeModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl z-10 border border-border-main animate-scale-up mx-4 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border-main">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                Open Dispute
              </h3>
              <button
                onClick={() => setDisputeModalOpen(false)}
                className="w-5 h-5 rounded-full bg-[#0F172A] text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 text-xs">
                <p className="text-red-800 leading-relaxed font-light">
                  Are you sure you want to flag transaction <strong className="font-semibold">{tx.id}</strong> as a dispute? This action will block scheduled payouts and alert the operations compliance team.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-primary block">Justification Reason *</label>
                <textarea
                  placeholder="Provide at least 20 characters explaining the dispute conflict..."
                  rows={4}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full bg-white border border-border-main text-xs rounded-2xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted/60 resize-none font-light"
                  required
                />
                {justification.length < 20 && (
                  <span className="text-[10px] text-amber-600 block font-light">
                    Minimum 20 characters ({20 - justification.length} more)
                  </span>
                )}
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setDisputeModalOpen(false)}
                  className="flex-1 bg-secondary-bg hover:bg-page-bg text-text-primary font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (justification.trim().length < 20) {
                      return;
                    }
                    disputeMutation.mutate({
                      bookingId: tx.id,
                      reason: justification.trim(),
                      raisedBy: "client"
                    });
                  }}
                  disabled={justification.trim().length < 20}
                  className={`flex-1 font-semibold text-xs py-2.5 rounded-xl transition text-center text-white ${justification.trim().length >= 20
                      ? "bg-red-500 hover:bg-red-600 cursor-pointer"
                      : "bg-red-300 cursor-not-allowed"
                    }`}
                >
                  Confirm Dispute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
