"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { ArrowLeft, ArrowUpRight, Check, Send, Paperclip, AlertTriangle } from "lucide-react";
import { getInitials } from "@/lib/utils";

const defaultDisputesBackup = [
  {
    id: "D-0019",
    txnId: "TXN-00188",
    bookingId: "BK234RFDW235E",
    client: "Kofi Mensah",
    provider: "Yetunde Balogun",
    category: "Post-Construction",
    dateOpened: "Jun 22, 2027",
    status: "Under Review",
    serviceAmount: 350.00,
    clientFee: 17.50,
    commission: 52.50,
    totalCharged: 367.50,
    description: "Full post-construction deep clean of a 4-bedroom detached house. Includes removal of dust, debris, paint splatters, and sanitisation of all surfaces.",
    clientStatement: "The provider left after 3 hours without completing the bathrooms or the kitchen. There is still paint on the tiles and the floors were not mopped properly. I paid for a full clean and did not receive it.",
    providerStatement: "I completed all tasks listed in the booking. The client added new rooms verbally that were not included in the original scope. I worked 5 hours and completed what was agreed at booking.",
    chat: [
      { sender: "Kofi Mensah", role: "client", text: "I am very unhappy. The kitchen was left dirty and the main bathroom has not been cleaned at all.", time: "Jun 22, 2027 18:05" },
      { sender: "Yetunde Balogun", role: "provider", text: "The scope at booking was 3 rooms. You asked me to do extra rooms on the day which was not agreed.", time: "Jun 22, 2027 18:05" },
      { sender: "Kofi Mensah", role: "client", text: "The booking clearly says full house. I have screenshots of the listing description.", time: "Jun 22, 2027 18:05" },
      { sender: "System", role: "system", text: "Dispute opened. Case assigned to review queue.", time: "Jun 22, 2027 18:05" },
      { sender: "Yetunde Balogun", role: "provider", text: "I am happy to discuss but I fulfilled my side of the agreement as booked.", time: "Jun 22, 2027 18:05" }
    ],
    timeline: [
      { event: "Booking marked Completed", time: "June 10, 2026 - 09:45 AM" },
      { event: "Dispute opened by client", time: "June 10, 2026 - 09:45 AM" },
      { event: "Status set to Open - in queue", time: "June 10, 2026 - 09:45 AM" },
      { event: "Status -> Under Review", time: "June 10, 2026 - 09:45 AM" }
    ]
  }
];

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [disputes, setDisputes] = useState([]);
  const [dispute, setDispute] = useState(null);

  // Details chat input message
  const [chatMessage, setChatMessage] = useState("");
  const chatContainerRef = useRef(null);

  // Resolution form states
  const [decision, setDecision] = useState("Favor Client");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [refundOriginalCard, setRefundOriginalCard] = useState(true);
  const [suspendAccount, setSuspendAccount] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Sync state with localStorage
  useEffect(() => {
    let list = [];
    const saved = localStorage.getItem("netly_disputes");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hasIssues = parsed.some(d => !d.provider || d.client === d.provider);
        if (hasIssues) {
          localStorage.removeItem("netly_disputes");
          list = defaultDisputesBackup;
          localStorage.setItem("netly_disputes", JSON.stringify(defaultDisputesBackup));
        } else {
          list = parsed;
        }
      } catch (err) {
        localStorage.removeItem("netly_disputes");
        list = defaultDisputesBackup;
        localStorage.setItem("netly_disputes", JSON.stringify(defaultDisputesBackup));
      }
    } else {
      list = defaultDisputesBackup;
      localStorage.setItem("netly_disputes", JSON.stringify(defaultDisputesBackup));
    }
    
    setDisputes(list);
    const found = list.find((d) => d.id === id);
    if (found) {
      setDispute(found);
      setDecision(found.decision || "Favor Client");
      setResolutionNotes(found.notes || "");
    }
  }, [id]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [dispute?.chat]);

  const saveDisputes = (updated) => {
    setDisputes(updated);
    localStorage.setItem("netly_disputes", JSON.stringify(updated));
    const found = updated.find((d) => d.id === id);
    if (found) {
      setDispute(found);
    }
  };

  // Render pill color status utilities
  const getStatusClass = (status) => {
    switch (status) {
      case "Resolved":
        return "text-emerald-500 bg-emerald-50";
      case "Under Review":
        return "text-amber-500 bg-amber-50";
      case "Open":
        return "text-red-500 bg-red-50";
      default:
        return "text-text-muted bg-page-bg";
    }
  };

  // Append sent messages callback
  const handleSendChatSubmit = (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !dispute) return;

    const newMsg = {
      sender: "System User",
      role: "system",
      text: chatMessage.trim(),
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    };

    const updated = disputes.map((d) => {
      if (d.id === dispute.id) {
        return {
          ...d,
          chat: [...(d.chat || []), newMsg]
        };
      }
      return d;
    });

    saveDisputes(updated);
    setChatMessage("");
  };

  // Submit resolution handler
  const handleResolveSubmit = (e) => {
    e.preventDefault();
    if (!dispute) return;
    if (resolutionNotes.trim().length < 30) {
      toast.error("Resolution notes must contain at least 30 characters.");
      return;
    }

    const resolvedTimelineItem = {
      event: `Resolved - ${decision === "Split" ? "Split decision" : decision === "Favor Client" ? "Favored Client" : "Favored Provider"}`,
      time: "Just Now"
    };

    const updated = disputes.map((d) => {
      if (d.id === dispute.id) {
        return {
          ...d,
          status: "Resolved",
          decision: decision,
          resolvedDate: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          resolvedBy: "admin@netly.io",
          notes: resolutionNotes.trim(),
          timeline: [...(d.timeline || []), resolvedTimelineItem]
        };
      }
      return d;
    });

    saveDisputes(updated);
    toast.success(`Dispute ${dispute.id} resolved successfully!`);
  };

  if (!dispute) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-3 font-onest">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-bg" />
        <p className="text-xs text-text-muted">Loading dispute details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-onest">
      
      {/* Detail View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border-main pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/compliance/disputes")}
            className="w-8 h-8 rounded-full bg-white border border-secondary-bg hover:bg-page-bg transition flex items-center justify-center text-text-primary cursor-pointer font-bold"
          >
            <ArrowLeft size={16} />
          </button>
          <h3 className="text-lg font-semibold text-text-primary">{dispute.id}</h3>
          <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold ${getStatusClass(dispute.status)}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            {dispute.status}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <span>👤 Assigned: <strong>admin@netly.io</strong></span>
        </div>
      </div>

      {/* 2-Column layout grids */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        
        {/* LEFT 3/5 COLUMN */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Transaction Summary Grid */}
          <div className="bg-white rounded-3xl border border-secondary-bg p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-secondary-bg shrink-0">
              <span className="text-xs font-semibold text-text-primary flex items-center gap-1">
                📄 Transaction Summary
              </span>
              <span className="text-[10px] text-text-muted font-mono">{dispute.txnId}</span>
            </div>
            <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 text-xs border-b border-secondary-bg pb-3">
              <div className="flex justify-between">
                <span className="text-text-muted font-light">Service</span>
                <strong className="text-text-primary font-normal">{dispute.category}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted font-light">Service amount</span>
                <strong className="text-text-primary font-semibold">${dispute.serviceAmount?.toFixed(2) || "350.00"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted font-light">Date</span>
                <strong className="text-text-primary font-normal">{dispute.dateOpened}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted font-light">Client fee (5%)</span>
                <strong className="text-text-primary font-normal">${dispute.clientFee?.toFixed(2) || "17.50"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted font-light">Client</span>
                <strong className="text-text-primary font-normal">{dispute.client}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted font-light">Commission (15%)</span>
                <strong className="text-text-primary font-normal">${dispute.commission?.toFixed(2) || "52.50"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted font-light">Provider</span>
                <strong className="text-text-primary font-normal">{dispute.provider}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted font-light">Total charged</span>
                <strong className="text-text-primary font-semibold">${dispute.totalCharged?.toFixed(2) || "367.50"}</strong>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-text-muted block">Service description</span>
              <p className="text-xs text-text-primary font-light leading-relaxed bg-page-bg/40 rounded-xl p-3 border border-secondary-bg/30">
                {dispute.description || "No description provided."}
              </p>
            </div>
          </div>

          {/* Statements grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
            <div className="bg-white rounded-3xl border border-secondary-bg p-4 space-y-2">
              <span className="text-[10px] text-text-muted block font-semibold">Client statement</span>
              <h4 className="text-xs font-semibold text-text-primary">{dispute.client}</h4>
              <p className="text-xs text-text-muted font-light leading-relaxed">
                "{dispute.clientStatement || "No statement filed."}"
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-secondary-bg p-4 space-y-2">
              <span className="text-[10px] text-text-muted block font-semibold">Provider statement</span>
              <h4 className="text-xs font-semibold text-text-primary">{dispute.provider}</h4>
              <p className="text-xs text-text-muted font-light leading-relaxed">
                "{dispute.providerStatement || "No statement filed."}"
              </p>
            </div>
          </div>

          {/* Booking chat / message history logs */}
          <div className="bg-white rounded-3xl border border-secondary-bg p-4 space-y-3">
            <span className="text-[10px] text-text-muted block font-semibold">Booking chat / message history</span>
            
            <div ref={chatContainerRef} className="space-y-3.5 max-h-75 overflow-y-auto pr-1">
              {(dispute.chat || []).map((msg, idx) => (
                <div key={idx} className="text-xs space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-primary-bg-muted/15 text-primary-bg flex items-center justify-center font-bold text-[9px]">
                        {getInitials(msg.sender)}
                      </div>
                      <strong className="text-text-primary font-semibold">{msg.sender}</strong>
                    </div>
                    <span className="text-text-muted font-light">{msg.time}</span>
                  </div>
                  <div className={`p-3 rounded-2xl leading-relaxed text-xs max-w-lg ${
                    msg.role === "system" 
                      ? "bg-amber-50 text-amber-700 border border-amber-100 italic" 
                      : "bg-page-bg text-text-primary"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Send Input Box */}
            {dispute.status !== "Resolved" && (
              <form onSubmit={handleSendChatSubmit} className="flex items-center gap-2 border border-secondary-bg rounded-full p-1 bg-white">
                <button type="button" className="p-2 text-text-muted hover:text-text-primary transition cursor-pointer">
                  <Paperclip size={14} />
                </button>
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent text-xs p-2 focus:outline-none text-text-primary placeholder:text-text-muted"
                />
                <button
                  type="submit"
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-primary-bg text-white hover:opacity-90 transition cursor-pointer"
                >
                  <Send size={12} />
                </button>
              </form>
            )}
          </div>

        </div>

        {/* RIGHT 2/5 COLUMN */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Status timeline checkboxes */}
          <div className="bg-white rounded-3xl border border-secondary-bg p-4 space-y-3.5">
            <span className="text-[10px] text-text-muted block font-semibold">🕒 Status timeline</span>
            <div className="space-y-4 relative pl-3.5 before:absolute before:left-1 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-secondary-bg">
              {(dispute.timeline || []).map((t, idx) => (
                <div key={idx} className="relative text-xs space-y-0.5">
                  <span className="absolute -left-5 top-1 h-3 w-3 rounded-full bg-emerald-500 border border-white flex items-center justify-center text-[7px] text-white">
                    ✓
                  </span>
                  <strong className="text-text-primary font-semibold block leading-tight">{t.event}</strong>
                  <span className="text-[10px] text-text-muted font-light block">{t.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Decision resolution section panel layout */}
          {dispute.status !== "Resolved" ? (
            /* RESOLUTION PANEL FORM */
            <form onSubmit={handleResolveSubmit} className="bg-white rounded-3xl border border-secondary-bg shadow-2xs overflow-hidden flex flex-col">
              <div className="bg-amber-50/70 border-b border-amber-100 p-3.5 text-xs text-amber-800 font-semibold flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-600" />
                <span>Resolution panel</span>
              </div>

              <div className="p-4 space-y-4">
                {/* Decision selection radios */}
                <div className="space-y-2">
                  <label className="text-xs text-text-primary block">Decision <span className="text-red-500">*</span></label>
                  <div className="space-y-2">
                    {[
                      { id: "Favor Client", label: "Favor Client" },
                      { id: "Favor Provider", label: "Favor Provider" },
                      { id: "Split", label: "Split" }
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-3 border p-3 rounded-xl cursor-pointer select-none transition ${
                          decision === opt.id 
                            ? "bg-blue-50/40 border-primary-bg-muted/70" 
                            : "bg-white border-secondary-bg hover:bg-page-bg/30"
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
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                          decision === opt.id ? "border-primary-bg" : "border-text-muted/30"
                        }`}>
                          {decision === opt.id && (
                            <div className="w-2.5 h-2.5 rounded-full bg-primary-bg" />
                          )}
                        </div>
                        <span className="text-xs text-text-primary font-medium">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Wallet adjustment amount input (Favor Client & Split) */}
                {["Favor Client", "Split"].includes(decision) && (
                  <div className="space-y-1">
                    <label className="text-xs text-text-primary block">Wallet adjustment amount <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      value={adjustmentAmount}
                      placeholder="0.00"
                      onChange={(e) => setAdjustmentAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-white border border-secondary-bg text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary font-mono"
                    />
                    <span className="text-[9px] text-text-muted block mt-0.5">Credit issued to client wallet</span>
                  </div>
                )}

                {/* Checkbox option - Refund to card (Favor Client only) */}
                {decision === "Favor Client" && (
                  <div>
                    <label className="flex items-center gap-2.5 text-xs text-text-muted cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={refundOriginalCard}
                        onChange={(e) => setRefundOriginalCard(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                        refundOriginalCard ? "border-primary-bg bg-primary-bg text-white animate-scale-up" : "border-text-muted/30 bg-white"
                      }`}>
                        {refundOriginalCard && <span className="text-[10px] font-bold">✓</span>}
                      </div>
                      <div>
                        <strong className="block text-text-primary text-[11px] leading-tight font-medium">Refund to original card</strong>
                        <span className="block text-[9px] text-text-muted">Triggers Stripe refund flow via Cloud Function</span>
                      </div>
                    </label>
                  </div>
                )}

                {/* Checkbox option - Suspend account at fault (Favor Client & Favor Provider) */}
                {["Favor Client", "Favor Provider"].includes(decision) && (
                  <div>
                    <label className="flex items-center gap-2.5 text-xs text-text-muted cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={suspendAccount}
                        onChange={(e) => setSuspendAccount(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                        suspendAccount ? "border-primary-bg bg-primary-bg text-white animate-scale-up" : "border-text-muted/30 bg-white"
                      }`}>
                        {suspendAccount && <span className="text-[10px] font-bold">✓</span>}
                      </div>
                      <div>
                        <strong className="block text-text-primary text-[11px] leading-tight font-medium">Suspend account at fault</strong>
                        <span className="block text-[9px] text-text-muted">Opens A04-ACT pre-filled with this case context</span>
                      </div>
                    </label>
                  </div>
                )}

                {/* Resolution notes */}
                <div className="space-y-1">
                  <label className="text-xs text-text-primary block">Resolution notes <span className="text-red-500">*</span></label>
                  <textarea
                    placeholder="Document the full resolution rationale including evidence reviewed, decision basis, and any follow-up actions..."
                    rows={4}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="w-full bg-white border border-secondary-bg text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted resize-none"
                    required
                  />
                  <span className="text-[10px] text-text-muted block">Minimum 30 characters.</span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary-bg hover:opacity-90 text-white font-medium text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                >
                  <Check size={13} /> Resolve Dispute
                </button>
              </div>
            </form>
          ) : (
            /* RESOLUTION DETAILS SUMMARY (Image 3) */
            <div className="bg-white rounded-3xl border border-secondary-bg p-4 space-y-3.5 shadow-2xs">
              <span className="text-[10px] text-text-muted block font-semibold uppercase tracking-wider">⚖️ Resolution</span>
              
              <div className="space-y-3 text-xs">
                <div className="flex justify-between pb-1.5 border-b border-page-bg">
                  <span className="text-text-muted font-light">Decision</span>
                  <strong className="text-text-primary font-semibold">{dispute.decision}</strong>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-page-bg">
                  <span className="text-text-muted font-light">Resolved</span>
                  <strong className="text-text-primary font-normal">{dispute.resolvedDate}</strong>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-page-bg">
                  <span className="text-text-muted font-light">By</span>
                  <strong className="text-text-primary font-normal">{dispute.resolvedBy}</strong>
                </div>
                
                <div className="space-y-1 pt-1.5">
                  <span className="text-[10px] text-text-muted block font-semibold uppercase">Notes</span>
                  <p className="p-3 bg-emerald-50/20 text-emerald-800 border border-emerald-100 rounded-xl leading-relaxed">
                    {dispute.notes}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
