"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Send,
  Paperclip,
  AlertTriangle,
  X,
  Eye,
  User,
  FileText,
  ShieldAlert,
  Clock,
  ArrowLeftRight,
  Loader2,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import { readImageForUpload } from "@/lib/imageFile";
import ImagePreviewModal from "@/components/platform/ImagePreviewModal";

/**
 * Badge colours for a dispute status.
 *
 * Mirrors the list page so the same dispute is not one colour in the queue and
 * another on its detail screen.
 *
 * @param {string} status - Display status.
 * @return {string} Tailwind classes.
 */
/**
 * Human-readable file size.
 * @param {number} bytes - Size in bytes.
 * @return {string} e.g. "2.1 MB", or "" when unknown.
 */
function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${Math.round((n / 1024 / 1024) * 10) / 10} MB`;
}

/**
 * The photo attached to a chat message.
 *
 * Disputes are argued with photographs — the damaged chair, the unfinished
 * job — so these are evidence, not decoration, and they are shown inline
 * rather than as a filename an admin has to click to believe. Clicking opens
 * the same preview dialog the Evidence tab uses.
 *
 * Rendered with a plain <img>: these are Firebase Storage URLs whose token
 * lives in the query string, which next/image would need every bucket host
 * whitelisted for and could not usefully cache anyway.
 *
 * @param {object} props - Options.
 * @param {string} props.src - Storage URL of the image.
 * @param {Function} props.onOpen - Opens the full-size preview.
 * @param {boolean} props.onDark - True inside the provider's dark bubble.
 * @return {JSX.Element|null} The thumbnail, or nothing when there is no image.
 */
function MessageImage({ src, onOpen, onDark }) {
  if (!src) return null;
  return (
    <button
      type="button"
      onClick={onOpen}
      title="View full size"
      className={`block overflow-hidden rounded-xl border transition hover:opacity-90 cursor-pointer ${
        onDark ? "border-white/20" : "border-border-main/50"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Attachment sent in this conversation"
        className="max-h-56 w-auto max-w-full object-cover"
      />
    </button>
  );
}

function getStatusClass(status) {
  switch (status) {
    case "Resolved":
      return "text-emerald-500 bg-emerald-50";
    case "Under Review":
      return "text-amber-500 bg-amber-50";
    case "Open":
      return "text-red-500 bg-red-50";
    case "Rejected":
    case "Withdrawn":
      return "text-neutral-500 bg-neutral-50";
    default:
      return "text-text-muted bg-page-bg";
  }
}
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useDispute,
  useDisputeChat,
  useDisputeThread,
} from "@/hooks/useDisputes";
import { resolveDispute, postDisputeMessage, claimDispute } from "@/lib/callables";

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const { dispute, isLoading, isError, error, notFound } = useDispute(id);
  const [evidence, setEvidence] = useState(null);
  // Two separate conversations. The dispute thread is the one an admin acts
  // on — client, provider and support together — and is the default. The
  // booking thread is the pair's ordinary chat, shown read-only for context;
  // it may span several bookings and predates the dispute.
  const [chatView, setChatView] = useState("dispute");
  const disputeThread = useDisputeThread(dispute);
  const bookingThread = useDisputeChat(dispute);

  const isBookingView = chatView === "booking";
  const messages = isBookingView ?
    bookingThread.messages :
    disputeThread.messages;
  const chatId = isBookingView ? bookingThread.chatId : disputeThread.chatId;
  const queryClient = useQueryClient();

  // Redesign tabs and modal states
  const [activeTab, setActiveTab] = useState("Evidence");
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  // Details chat input message
  const [chatMessage, setChatMessage] = useState("");
  const chatContainerRef = useRef(null);

  // A photo staged for the next send. Held until the message goes out so the
  // admin can add a caption to it, and so picking the wrong file is
  // recoverable without sending it.
  const [pendingImage, setPendingImage] = useState(null);
  const [isReadingImage, setIsReadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const handlePickImage = async (e) => {
    const file = e.target.files?.[0];
    // Clear immediately, or picking the same file twice fires no change event.
    e.target.value = "";
    if (!file) return;

    setIsReadingImage(true);
    try {
      setPendingImage(await readImageForUpload(file));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsReadingImage(false);
    }
  };

  // Resolution form states
  const [decision, setDecision] = useState("Favor Client");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [refundOriginalCard, setRefundOriginalCard] = useState(true);
  const [suspendAccount, setSuspendAccount] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["dispute", id] });
    queryClient.invalidateQueries({ queryKey: ["disputes"] });
  };

  const messageMutation = useMutation({
    mutationFn: postDisputeMessage,
    onSuccess: () => {
      setChatMessage("");
      setPendingImage(null);
      queryClient.invalidateQueries({
        queryKey: ["disputeThread", dispute?.id],
      });
    },
    onError: (err) => toast.error(err.message),
  });

  const resolveMutation = useMutation({
    mutationFn: resolveDispute,
    onSuccess: (_result, variables) => {
      invalidate();
      setIsResolveModalOpen(false);
      toast.success("Dispute resolved.");

      // The checkbox promises to open the suspension page for the party at
      // fault. Suspension lives on Accounts, where updateAccountStatus carries
      // its own audit trail — duplicating it here would give two code paths
      // for the same action.
      if (suspendAccount) {
        const atFault =
          variables.resolution === "client_favour" ?
            { uid: dispute.providerId, tab: "Providers" } :
            { uid: dispute.clientId, tab: "Clients" };
        if (atFault.uid) {
          router.push(`/accounts?tab=${atFault.tab}&uid=${atFault.uid}`);
        }
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const claimMutation = useMutation({
    mutationFn: claimDispute,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["dispute", id] });
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      toast.success(
          result.claimedBy ?
            "Dispute claimed — it is now under your review." :
            "Claim released back to the queue.",
      );
    },
    onError: (err) => toast.error(err.message),
  });

  const handleClaimDispute = () => {
    // Claiming stops two admins working the same dispute; resolveDispute is
    // the separate, terminal step that moves money.
    claimMutation.mutate({
      disputeId: id,
      action: dispute?.claimedBy ? "release" : "claim",
    });
  };

  const handleSendChatSubmit = (e) => {
    e.preventDefault();
    const text = chatMessage.trim();
    // Only the dispute thread is writable; the booking chat is a record of a
    // conversation between two other people.
    if (!dispute?.id || isBookingView) return;
    // A photo on its own is a complete message, so either half will do.
    if (!text && !pendingImage) return;
    messageMutation.mutate({
      disputeId: dispute.id,
      message: text,
      bookingId: dispute.bookingId,
      imageBase64: pendingImage?.dataUrl,
      imageContentType: pendingImage?.contentType,
    });
  };

  // Keep the thread scrolled to the newest message as it arrives.
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, chatView]);

  // Submit resolution handler
  const handleResolveSubmit = (e) => {
    e.preventDefault();
    if (!dispute) return;
    if (resolutionNotes.trim().length < 30) {
      toast.error("Resolution notes must contain at least 30 characters.");
      return;
    }

    // UI wording → the resolution slugs resolveDispute accepts.
    const resolution =
      decision === "Split"
        ? "split"
        : decision === "Reject"
          ? "rejected"
          : decision === "Favor Client"
            ? "client_favour"
            : "provider_favour";

    const amount = Number(adjustmentAmount) || 0;
    const serviceAmount = Number(dispute.serviceAmount) || 0;

    // A split has to give both sides something. Sending 0 to the provider made
    // it behave identically to Favor Client. The entered amount is the client's
    // refund; the provider keeps the remainder of the disputed value.
    let clientRefundAmount = 0;
    let providerCreditAmount = 0;

    if (resolution === "rejected") {
      // A rejection changes nothing about the booking, so neither side is
      // credited. Without this it fell into the client-favour branch below and
      // sent a full refund amount the backend then ignored.
    } else if (resolution === "provider_favour") {
      providerCreditAmount = amount;
    } else if (resolution === "split") {
      clientRefundAmount = amount;
      providerCreditAmount = Math.max(
          0,
          Math.round((serviceAmount - amount) * 100) / 100,
      );
    } else {
      // Favour client: a blank amount refunds the full service value.
      clientRefundAmount = amount || serviceAmount;
    }

    if (resolution === "split" && amount >= serviceAmount) {
      toast.error(
          `A split must leave something for the provider — enter less than $${serviceAmount.toFixed(2)}.`,
      );
      return;
    }

    resolveMutation.mutate({
      disputeId: dispute.id,
      resolution,
      clientRefundAmount,
      providerCreditAmount,
      // Only meaningful when money goes back to the client.
      refundToCard: resolution === "provider_favour" ? false : refundOriginalCard,
      adminNotes: resolutionNotes.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-3 font-onest">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-bg" />
        <p className="text-xs text-text-muted font-light">
          Loading dispute details...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-2 text-center px-4 font-onest">
        <h3 className="text-sm font-semibold text-red-600">
          Could not load this dispute
        </h3>
        <p className="text-xs text-text-muted font-light max-w-sm">
          {error?.message || "Check your connection and try again."}
        </p>
      </div>
    );
  }

  if (notFound || !dispute) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-3 text-center px-4 font-onest">
        <h3 className="text-sm font-semibold text-text-primary">
          Dispute not found
        </h3>
        <p className="text-xs text-text-muted font-light">
          No dispute exists with id <span className="font-mono">{id}</span>.
        </p>
        <button
          onClick={() => router.push("/compliance/disputes")}
          className="text-xs text-primary-bg hover:underline cursor-pointer"
        >
          Back to disputes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-onest text-text-primary p-1">
      {/* Dispute Header Box */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/compliance/disputes")}
            className="w-8 h-8 rounded-lg bg-white border border-border-main hover:bg-page-bg transition flex items-center justify-center text-text-primary cursor-pointer font-bold shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold tracking-tight text-text-primary">
                {dispute.id}
              </h3>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${getStatusClass(dispute.status)}`}
              >
                <span className="h-1 w-1 rounded-full bg-current" />
                {dispute.status}
              </span>
            </div>
            <span className="text-[10px] text-text-muted mt-1 block">
              Opened by Client - {dispute.dateOpened} - 9:14 AM -{" "}
              {dispute.category}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-primary bg-page-bg px-3 py-1.5 rounded-xl border border-border-main/30 select-none">
          <User size={16} className="text-text-muted" />
          <span>
            Assigned: <span>admin@netly.io</span>
          </span>
        </div>
      </div>

      {/* Main Layout: Left Column (Parties + Tabs) & Right Column (Live Conversation) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* LEFT COLUMN: Parties and Info Tabs */}
        <div className="lg:col-span-1 space-y-4">
          {/* Parties Card */}
          <div className="bg-white rounded-3xl border border-border-main p-4 space-y-4 shadow-2xs">
            <span className="text-[10px] text-text-muted block">Parties</span>

            {/* Client */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#E5F5F7] text-[#0ea5e9] flex items-center justify-center font-bold text-xs shrink-0 select-none">
                AO
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-medium text-text-primary truncate">
                  {dispute.client}
                </h4>
                <span className="text-[9px] text-text-muted block truncate">
                  {dispute.clientEmail || "amara.osei@gmail.com"}
                </span>
                <span className="inline-block bg-primary-bg-muted/20 text-text-primary text-[8px] font-medium px-1.5 py-1 rounded-xl mt-1">
                  CLIENT
                </span>
              </div>
            </div>

            {/* Divider with shield warning */}
            <div className="relative flex items-center justify-center py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dashed border-red-200"></div>
              </div>
              <div className="relative z-10 bg-white px-2">
                <ShieldAlert size={14} className="text-red-500" />
              </div>
            </div>

            {/* Provider */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs shrink-0 select-none">
                BO
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-medium text-text-primary truncate">
                  {dispute.provider}
                </h4>
                <span className="text-[9px] text-text-muted block truncate">
                  {dispute.providerEmail || "b.okeke@clearly.ca"}
                </span>
                <span className="inline-block bg-text-primary text-white text-[8px] font-medium px-1.5 py-1 rounded-xl mt-1">
                  PROVIDER
                </span>
              </div>
            </div>
          </div>

          {/* Details / Evidence / Timeline Tab Selection */}
          <div className="bg-white rounded-3xl border border-border-main p-4 space-y-4 shadow-2xs">
            <div className="flex border-b border-border-main text-xs">
              {["Details", "Evidence", "Timeline"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 pb-2 font-semibold border-b-2 text-center transition cursor-pointer ${
                    activeTab === tab
                      ? "border-[#93D6DB] text-text-primary font-bold"
                      : "border-transparent text-text-muted hover:text-text-primary"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Details Tab Panel */}
            {activeTab === "Details" && (
              <div className="space-y-3.5">
                {/* Dispute Reason */}
                <div className="bg-[#FAFBFD] rounded-2xl border border-border-main p-4 space-y-1">
                  <span className="text-[10px] text-text-muted block">
                    Dispute Reason
                  </span>
                  <p className="text-xs font-medium text-text-primary">
                    {dispute.reason || "Service not completed"}
                  </p>
                </div>

                {/* Description (by client) */}
                <div className="bg-[#FAFBFD] rounded-2xl border border-border-main p-4 space-y-1">
                  <span className="text-[10px] text-text-muted block">
                    Description (by client)
                  </span>
                  <p className="text-xs text-text-primary leading-relaxed font-light">
                    {dispute.description || "No client description provided."}
                  </p>
                </div>

                {/* Transaction Summary Card */}
                <div className="bg-white rounded-2xl border border-border-main overflow-hidden shadow-3xs">
                  <div className="flex items-center justify-between p-4 border-b border-border-main/60">
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight
                        size={14}
                        className="text-text-muted transform scale-x-[-1]"
                      />
                      <span className="text-xs font-semibold text-text-primary">
                        Transaction Summary
                      </span>
                    </div>
                    <span className="text-xs text-[#0ea5e9] font-medium">
                      {dispute.txnId || "TXN-00188"}
                    </span>
                  </div>

                  <div className="p-4 space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-text-muted font-light">
                        Service
                      </span>
                      <span className="text-text-primary font-medium">
                        {dispute.category}
                      </span>
                    </div>
                    <div className="flex justify-between pb-1.5">
                      <span className="text-text-muted font-light">Date</span>
                      <span className="text-text-primary font-medium">
                        {dispute.dateOpened}
                      </span>
                    </div>

                    <div className="border-t border-border-main/50 pt-2 flex justify-between">
                      <span className="text-text-muted font-light">
                        Service amount
                      </span>
                      <span className="text-text-primary font-medium">
                        ${dispute.serviceAmount?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted font-light">
                        Client fee (5%)
                      </span>
                      <span className="text-text-primary font-medium">
                        ${dispute.clientFee?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted font-light">
                        Commission (15%)
                      </span>
                      <span className="text-text-primary font-medium">
                        ${dispute.commission?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-border-main/30 text-text-primary">
                      <span>Total charged</span>
                      <span>${dispute.totalCharged?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Provider Statement */}
                <div className="bg-[#FAFBFD] rounded-2xl border border-border-main p-4 space-y-2">
                  <span className="text-[10px] text-text-muted block">
                    Provider statement
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-text-primary font-medium">
                    <User size={13} className="text-text-muted" />
                    <span>{dispute.provider}</span>
                  </div>
                  <p className="text-xs text-text-primary leading-relaxed font-light">
                    {dispute.providerStatement ||
                      "No provider statement filed."}
                  </p>
                </div>

                {dispute.isClosed && (
                  <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-4 space-y-2 text-xs">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                      ⚖️ Resolution Decision
                    </span>
                    <div className="flex justify-between py-1 border-b border-emerald-100/50">
                      <span className="text-emerald-700 font-light">
                        Decision
                      </span>
                      <strong className="text-emerald-900 font-bold">
                        {dispute.decision}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-emerald-100/50">
                      <span className="text-emerald-700 font-light">
                        Resolved Date
                      </span>
                      <strong className="text-emerald-900 font-normal">
                        {dispute.resolvedDate}
                      </strong>
                    </div>
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                        Notes
                      </span>
                      <p className="text-emerald-950 font-light leading-relaxed">
                        {dispute.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Evidence Tab Panel */}
            {activeTab === "Evidence" && (
              <div className="space-y-2">
                {(dispute.attachments || []).length === 0 ? (
                  <p className="text-[11px] text-text-muted font-light py-4 text-center">
                    No evidence was attached to this dispute.
                  </p>
                ) : (dispute.attachments || []).map((file, idx) => {
                  const isImg = String(file.contentType || "").startsWith("image/");
                  return (
                    <div
                      key={file.storagePath || idx}
                      className="bg-page-bg/60 rounded-xl p-3 flex items-center justify-between text-xs hover:bg-page-bg transition border border-border-main/30"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-white border border-border-main flex items-center justify-center shrink-0 overflow-hidden">
                          {isImg && file.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText
                              size={14}
                              className={isImg ? "text-blue-500" : "text-amber-500"}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-text-primary block truncate text-[11px]">
                            {file.name || "Attachment"}
                          </span>
                          <span className="text-[9px] text-text-muted block mt-0.5">
                            {[
                              dispute.raisedBy === "provider" ?
                                dispute.provider :
                                dispute.client,
                              formatBytes(file.size),
                            ]
                                .filter(Boolean)
                                .join(" · ")}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEvidence(file)}
                        disabled={!file.url}
                        title={file.url ? "View attachment" : "No file URL stored"}
                        className="text-text-muted hover:text-text-primary p-1 shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Eye size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Timeline Tab Panel */}
            {activeTab === "Timeline" && (
              <div className="relative pl-6 space-y-4 py-2 before:absolute before:left-2.75 before:top-4 before:bottom-4 before:w-0.5 before:bg-[#10b981]">
                {(dispute.timeline || []).map((t, idx) => {
                  const isLatest = idx === (dispute.timeline || []).length - 1;
                  return (
                    <div
                      key={idx}
                      className="relative flex flex-col gap-0.5 min-h-11 pl-1"
                    >
                      {isLatest ? (
                        <div className="absolute -left-5.75 top-0 h-5.5 w-5.5 rounded-full bg-[#f59e0b] border-2 border-white flex items-center justify-center text-white shrink-0 select-none shadow-xs">
                          <Clock size={11} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="absolute -left-5.75 top-0 h-5.5 w-5.5 rounded-full bg-[#10b981] border-2 border-white flex items-center justify-center text-white shrink-0 select-none shadow-xs">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                      <strong className="text-xs font-semibold text-text-primary block leading-tight">
                        {t.event}
                      </strong>
                      <span className="text-[10px] text-text-muted font-light block">
                        {t.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT/MAIN COLUMN: Conversation Area */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-border-main shadow-2xs flex flex-col h-[78vh] overflow-hidden">
          {/* Conversation Header */}
          <div className="px-5 py-3.5 border-b border-border-main flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-text-primary">
                Live Conversation
              </span>

              {/* Member Avatars */}
              <div className="flex items-center gap-2 pl-2 border-l border-border-main text-[10px]">
                <div className="flex -space-x-1.5 shrink-0 select-none">
                  <div className="w-5 h-5 rounded-full bg-[#E5F5F7] text-[#0ea5e9] border border-white flex items-center justify-center font-bold text-[8px]">
                    AO
                  </div>
                  <div className="w-5 h-5 rounded-full bg-[#0F172A] text-white border border-white flex items-center justify-center font-bold text-[8px]">
                    BO
                  </div>
                  <div className="w-5 h-5 rounded-full bg-[#93D6DB] text-text-primary border border-white flex items-center justify-center font-bold text-[8px]">
                    PN
                  </div>
                </div>
                <div className="flex items-center gap-1 text-text-muted truncate max-w-64">
                  <span className="font-semibold text-text-primary">AO</span>{" "}
                  Amara
                  <span className="mx-0.5 font-light text-text-muted/65">
                    •
                  </span>
                  <span className="font-semibold text-text-primary">BO</span>{" "}
                  Blessing
                  <span className="mx-0.5 font-light text-text-muted/65">
                    •
                  </span>
                  <span className="font-semibold text-text-primary">PN</span>{" "}
                  You
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Which conversation is on screen */}
              <div className="flex items-center rounded-xl border border-border-main bg-white p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setChatView("dispute")}
                  className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer font-semibold ${
                    !isBookingView ?
                      "bg-primary-bg/10 text-primary-bg" :
                      "text-text-muted hover:text-text-primary"
                  }`}
                >
                  Dispute chat
                </button>
                <button
                  type="button"
                  onClick={() => setChatView("booking")}
                  className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer font-semibold ${
                    isBookingView ?
                      "bg-primary-bg/10 text-primary-bg" :
                      "text-text-muted hover:text-text-primary"
                  }`}
                >
                  Booking chat
                </button>
              </div>

            {/* Claim / Resolve buttons */}
            {!dispute.isClosed &&
              (dispute.status === "Open" ? (
                <button
                  type="button"
                  onClick={handleClaimDispute}
                  className="bg-[#93D6DB] hover:bg-[#82c5cb] text-text-primary font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-3xs"
                >
                  Claim Dispute
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(true)}
                  className="bg-[#93D6DB] hover:bg-[#82c5cb] text-text-primary font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-3xs"
                >
                  Resolve Dispute
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Chat Thread */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-5 bg-[#FAFBFD] space-y-4 scrollbar-thin"
          >
            {(() => {
              let lastDate = "";
              return messages.map((msg, idx) => {
                const isSystem =
                  (msg.role === "system" || msg.sender === "System") &&
                  msg.sender !== "System User";
                const isProvider = msg.role === "provider";
                const isAdmin =
                  msg.role === "admin" ||
                  msg.sender.startsWith("Admin") ||
                  msg.sender === "System User";

                // Parse date header
                let dateHeader = null;
                const match = msg.time.match(/^[A-Za-z]{3} \d{1,2}, \d{4}/);
                if (match) {
                  const msgDate = match[0];
                  if (msgDate !== lastDate) {
                    lastDate = msgDate;
                    dateHeader = (
                      <div
                        key={`date-${idx}`}
                        className="flex justify-center my-4 animate-fade-in select-none"
                      >
                        <span className="text-[10px] text-text-muted font-medium bg-secondary-bg/30 px-3.5 py-1 rounded-full">
                          {msgDate}
                        </span>
                      </div>
                    );
                  }
                }
                const displayTime = msg.time.replace(
                  /^[A-Za-z]{3} \d{1,2}, \d{4}\s*/,
                  "",
                );

                if (isSystem) {
                  return (
                    <React.Fragment key={idx}>
                      {dateHeader}
                      <div className="flex justify-center my-4 animate-fade-in select-none">
                        <div className="bg-white border border-border-main rounded-full text-center py-1.5 px-5 text-text-muted italic text-[10px] max-w-lg shadow-2xs">
                          {msg.text}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                }

                // Set matching styles based on sender role
                if (isAdmin) {
                  return (
                    <React.Fragment key={idx}>
                      {dateHeader}
                      <div className="flex items-start gap-2.5 max-w-3xl ml-auto justify-end animate-fade-in">
                        <div className="space-y-1 text-right flex flex-col items-end">
                          <span className="text-[10px] text-text-muted font-medium">
                            {msg.sender}{" "}
                            <span className="font-light opacity-80">(You)</span>
                          </span>

                          <div className="p-3 space-y-2 rounded-2xl rounded-tr-none leading-relaxed text-xs shadow-3xs bg-primary-bg-muted text-text-primary border border-border-main/20 text-left">
                            {/* An image-only message carries no text, and an
                                empty <p> would leave a blank padded bubble. */}
                            {msg.text && (
                              <p className="whitespace-pre-line">{msg.text}</p>
                            )}

                            <MessageImage
                              src={msg.image}
                              onOpen={() =>
                                setEvidence({
                                  url: msg.image,
                                  name: `Photo from ${msg.sender}`,
                                  subtitle: msg.time,
                                  contentType: "image/*",
                                })
                              }
                            />
                          </div>

                          <span className="text-[8px] text-text-muted block mt-0.5 font-light">
                            {displayTime}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                }

                // Client or Provider bubble
                let avatarText = isProvider ? "BO" : "AO";
                let avatarBgClass = isProvider
                  ? "bg-[#0F172A] text-white"
                  : "bg-[#E5F5F7] text-[#0ea5e9]";
                let bubbleClass = isProvider
                  ? "bg-[#0F172A] text-white"
                  : "bg-white text-text-primary border border-border-main/30";
                let labelSuffix = isProvider ? "(Provider)" : "(Client)";

                return (
                  <React.Fragment key={idx}>
                    {dateHeader}
                    <div className="flex items-start gap-2.5 max-w-3xl mr-auto justify-start animate-fade-in">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 select-none ${avatarBgClass}`}
                      >
                        {avatarText}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-text-muted font-medium">
                          {msg.sender}{" "}
                          <span className="font-light opacity-80">
                            {labelSuffix}
                          </span>
                        </span>

                        <div
                          className={`p-3 space-y-2 rounded-2xl rounded-tl-none leading-relaxed text-xs shadow-3xs ${bubbleClass}`}
                        >
                          {msg.text && (
                            <p className="whitespace-pre-line">{msg.text}</p>
                          )}

                          <MessageImage
                            src={msg.image}
                            onDark={isProvider}
                            onOpen={() =>
                              setEvidence({
                                url: msg.image,
                                name: `Photo from ${msg.sender}`,
                                subtitle: msg.time,
                                contentType: "image/*",
                              })
                            }
                          />
                        </div>

                        <span className="text-[8px] text-text-muted block mt-0.5 font-light">
                          {displayTime}
                        </span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              });
            })()}
          </div>

          {/* Conversation Input area */}
          <div className="p-4 border-t border-border-main bg-white shrink-0">
            <div className="flex items-center justify-between text-[10px] text-text-muted pb-2 select-none">
              <span className="font-medium">
                Sending as{" "}
                <span className="text-text-primary font-semibold">
                  Priya Nair
                </span>{" "}
                · Admin
              </span>
              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>

            {isBookingView ? (
              <div className="bg-page-bg/50 border border-border-main/30 text-center text-text-muted font-light py-2 text-xs rounded-xl select-none">
                Read-only — this is the client and provider&apos;s own booking
                conversation. Switch to{" "}
                <button
                  type="button"
                  onClick={() => setChatView("dispute")}
                  className="text-primary-bg hover:underline cursor-pointer font-medium"
                >
                  Dispute chat
                </button>{" "}
                to reply.
              </div>
            ) : !dispute.isClosed ? (
              <form onSubmit={handleSendChatSubmit} className="space-y-2">
                {/* Staged photo. Shown before sending so the admin can see
                    what they picked and back out of the wrong file. */}
                {pendingImage && (
                  <div className="flex items-center gap-2.5 p-2 rounded-xl border border-border-main bg-page-bg/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pendingImage.dataUrl}
                      alt=""
                      className="w-11 h-11 rounded-lg object-cover border border-border-main shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block text-[11px] font-medium text-text-primary truncate">
                        {pendingImage.name}
                      </span>
                      <span className="block text-[9px] text-text-muted font-light">
                        Sends with your next message
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingImage(null)}
                      title="Remove attachment"
                      className="p-1 text-text-muted hover:text-red-500 transition cursor-pointer shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 border border-border-main rounded-2xl p-1 bg-white focus-within:ring-1 focus-within:ring-primary-bg/20 transition">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handlePickImage}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isReadingImage || messageMutation.isPending}
                    title="Attach an image"
                    className={`p-2 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                      pendingImage ?
                        "text-primary-bg" :
                        "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {isReadingImage ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Paperclip size={15} />
                    )}
                  </button>
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder={
                      pendingImage ?
                        "Add a caption (optional)…" :
                        "Type a message… (Enter to send)"
                    }
                    className="flex-1 bg-transparent text-xs p-2 focus:outline-none text-text-primary placeholder:text-text-muted"
                  />
                  <button
                    type="submit"
                    disabled={
                      messageMutation.isPending ||
                      isReadingImage ||
                      (!chatMessage.trim() && !pendingImage)
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-primary-bg text-white hover:opacity-90 transition cursor-pointer shrink-0 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {messageMutation.isPending ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Send size={13} />
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-page-bg/50 border border-border-main/30 text-center text-text-muted font-light py-2 text-xs rounded-xl italic select-none">
                This dispute conversation has been resolved and closed.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RESOLUTION MODAL OVERLAY */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-onest">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-alt-bg/40 backdrop-blur-xs animate-fade-in"
            onClick={() => setIsResolveModalOpen(false)}
          />

          {/* Modal Container */}
          <form
            onSubmit={handleResolveSubmit}
            className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl z-10 border border-border-main animate-scale-up mx-4 max-h-[90vh] flex flex-col"
          >
            <div className="flex justify-between items-center pb-2 mb-4 border-b border-border-main shrink-0">
              <h3 className="text-lg font-bold text-text-primary tracking-tight">
                Resolve Dispute
              </h3>
              <button
                type="button"
                onClick={() => setIsResolveModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#0F172A] text-white flex items-center justify-center hover:opacity-90 cursor-pointer text-xs"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1 scrollbar-thin">
              {/* Decision */}
              <div className="space-y-2">
                <label className="text-xs text-text-primary block font-medium">
                  Decision <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    { id: "Favor Client", label: "Favor Client" },
                    { id: "Favor Provider", label: "Favor Provider" },
                    { id: "Split", label: "Split Decision" },
                    { id: "Reject", label: "Reject" },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 border p-3 rounded-xl cursor-pointer select-none transition ${
                        decision === opt.id
                          ? "bg-blue-50/40 border-primary-bg-muted/70"
                          : "bg-white border-border-main hover:bg-page-bg/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="decision"
                        value={opt.id}
                        checked={decision === opt.id}
                        onChange={() => setDecision(opt.id)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition shrink-0 ${
                          decision === opt.id
                            ? "border-primary-bg"
                            : "border-text-muted/30"
                        }`}
                      >
                        {decision === opt.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary-bg" />
                        )}
                      </div>
                      <span className="text-xs text-text-primary font-medium">
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Wallet Adjustment */}
              {["Favor Client", "Split"].includes(decision) && (
                <div className="space-y-1">
                  <label className="text-xs text-text-primary block font-medium">
                    Wallet Adjustment Amount ($){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white border border-border-main text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary font-mono"
                    required
                  />
                  <span className="text-[10px] text-text-muted block mt-0.5">
                    Credit issued back to the client&apos;s wallet.
                  </span>
                </div>
              )}

              {/* Checkbox Card */}
              {decision === "Favor Client" && (
                <label className="flex items-center gap-2.5 text-xs text-text-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={refundOriginalCard}
                    onChange={(e) => setRefundOriginalCard(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${
                      refundOriginalCard
                        ? "border-primary-bg bg-primary-bg text-white"
                        : "border-text-muted/30 bg-white"
                    }`}
                  >
                    {refundOriginalCard && (
                      <span className="text-[10px] font-bold">✓</span>
                    )}
                  </div>
                  <div>
                    <strong className="block text-text-primary text-[11px] leading-tight font-medium">
                      Refund to original card
                    </strong>
                    <span className="block text-[9px] text-text-muted">
                      Triggers Stripe refund flow via Cloud Function
                    </span>
                  </div>
                </label>
              )}

              {/* Checkbox Suspend */}
              {["Favor Client", "Favor Provider"].includes(decision) && (
                <label className="flex items-center gap-2.5 text-xs text-text-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={suspendAccount}
                    onChange={(e) => setSuspendAccount(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${
                      suspendAccount
                        ? "border-primary-bg bg-primary-bg text-white"
                        : "border-text-muted/30 bg-white"
                    }`}
                  >
                    {suspendAccount && (
                      <span className="text-[10px] font-bold">✓</span>
                    )}
                  </div>
                  <div>
                    <strong className="block text-text-primary text-[11px] leading-tight font-medium">
                      Suspend account at fault
                    </strong>
                    <span className="block text-[9px] text-text-muted">
                      Opens pre-filled suspension page context
                    </span>
                  </div>
                </label>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs text-text-primary block font-medium">
                  Resolution Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Document resolution rationale, evidence reviewed..."
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full bg-white border border-border-main text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted resize-none"
                  required
                />
                <span className="text-[10px] text-text-muted block">
                  Minimum 30 characters.
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-border-main mt-4 shrink-0">
              <button
                type="button"
                onClick={() => setIsResolveModalOpen(false)}
                disabled={resolveMutation.isPending}
                className="flex-1 bg-white border border-border-main text-text-primary hover:bg-page-bg font-semibold text-xs py-2.5 rounded-lg transition cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              {/* Resolving moves money — a Stripe refund, a wallet credit and
                  a payout clawback — so it is slow enough that an un-disabled
                  button invites a second click and a second resolution. */}
              <button
                type="submit"
                disabled={resolveMutation.isPending}
                className="flex-1 bg-[#93D6DB] text-text-primary hover:bg-[#82c5cb] font-bold text-xs py-2.5 rounded-lg transition cursor-pointer text-center disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {resolveMutation.isPending ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Resolving…
                  </>
                ) : (
                  "Confirm Resolution"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <ImagePreviewModal
        isOpen={Boolean(evidence)}
        onClose={() => setEvidence(null)}
        src={evidence?.url}
        title={evidence?.name}
        // Evidence-tab files have no better second line than their MIME type;
        // a chat photo has when it was sent, which is what an admin is
        // actually placing it against.
        subtitle={evidence?.subtitle || evidence?.contentType}
        contentType={evidence?.contentType}
      />
    </div>
  );
}
