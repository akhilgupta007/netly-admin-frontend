"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { ArrowLeft, ArrowUpRight, Check, Send, Paperclip, AlertTriangle, X, Eye, Download, User, FileText, ShieldAlert, Clock, ArrowLeftRight } from "lucide-react";
import { getInitials } from "@/lib/utils";

const defaultDisputesBackup = [
  {
    id: "D-0019",
    txnId: "TXN-00188",
    bookingId: "BK234RFDW235E",
    client: "Amara Osei",
    clientEmail: "amara.osei@gmail.com",
    provider: "Blessing Okeke",
    providerEmail: "b.okeke@clearly.ca",
    category: "Window Cleaning",
    dateOpened: "Jul 5, 2027",
    status: "Under Review",
    serviceAmount: 126.00,
    clientFee: 6.30,
    commission: 18.90,
    totalCharged: 132.30,
    description: "Provider left after 45 minutes claiming the job was done. Client states that 3 of 8 windows were not cleaned and the sills were not wiped as per the listing description.",
    reason: "Service not completed",
    clientStatement: "Hi, I'm really unhappy with the service today. The provider left after less than an hour and 3 of my windows are still dirty. The sills weren't even touched.",
    providerStatement: "I completed all tasks listed in the booking. The client added new rooms verbally that were not included in the original scope. I worked 5 hours and completed what was agreed at booking.",
    chat: [
      { sender: "Amara Osei", role: "client", text: "Hi, I'm really unhappy with the service today. The provider left after less than an hour and 3 of my windows are still dirty. The sills weren't even touched.", time: "Jul 5, 2027 9:14 AM" },
      { sender: "Amara Osei", role: "client", text: "I've uploaded photos showing the state of the windows both before and after. You can clearly see the difference – windows 4, 6 and 7 are unchanged.", time: "Jul 5, 2027 9:22 AM", file: "window_photos_comparison.jpg" },
      { sender: "Blessing Okeke", role: "provider", text: "I completed all windows that were accessible. Windows 6 and 7 were blocked by furniture the client had not moved as required in the booking notes. I cannot be held responsible for client-side access issues.", time: "Jul 5, 2027 11:45 AM" },
      { sender: "Blessing Okeke", role: "provider", text: "I also have a completion photo showing my work on the windows I was given access to. This is standard practice – any inaccessible areas are noted at the time of service.", time: "Jul 5, 2027 11:48 AM", file: "provider_completion_photo.jpg" },
      { sender: "Amara Osei", role: "client", text: "The furniture was NOT blocking windows 4 and 7. The sofa is on the opposite wall. I have floor plan photos if needed. Window 6 I can accept but 4 and 7 were absolutely accessible.", time: "Jul 5, 2027 3:10 PM" },
      { sender: "System", role: "system", text: "Admin Priya Nair has joined this conversation. All messages are now being monitored by the Netly dispute team.", time: "Jul 6, 2027 10:30 AM" },
      { sender: "Admin - Priya Nair", role: "admin", text: "Hello Amara and Blessing. I'm Priya from the Netly disputes team. I've reviewed the evidence submitted by both parties. I have a few clarifying questions before we proceed.\n\nBlessing – can you confirm the exact time you arrived and departed? The booking was for 2 hours and our records show a 52-minute duration.", time: "Jul 6, 2027 10:31 AM" },
      { sender: "Blessing Okeke", role: "provider", text: "I arrived at 10:05 AM and departed at 10:58 AM. The booking was originally for 2 hours but I finished in under 1 hour because access was limited. I did not charge for the full 2 hours – my time log shows 52 minutes billed.", time: "Jul 6, 2027 11:02 AM" },
      { sender: "Amara Osei", role: "client", text: "Priya, thank you for getting involved. I just want a fair resolution. I'm happy with a partial refund for the windows that weren't done – I don't want to penalize the provider for the whole booking, just the incomplete part.", time: "Jul 6, 2027 11:20 AM" },
      { sender: "Admin - Priya Nair", role: "admin", text: "Thank you both for clarifying. Amara, that's a reasonable position. Blessing, given that 2 of 8 windows were unambiguously accessible (based on your own photos, which show the room layout), would you be open to a 25% partial refund? That would be $31.50 returned to Amara's wallet.", time: "Jul 6, 2027 2:45 PM" }
    ],
    timeline: [
      { event: "Service Request Submitted", time: "June 10, 2026 • 09:45 AM" },
      { event: "Negotiation Started", time: "June 10, 2026 • 09:52 AM" },
      { event: "Custom Offer Sent", time: "June 10, 2026 • 10:08 AM" },
      { event: "Offer Accepted", time: "June 10, 2026 • 10:15 AM" },
      { event: "Payment Completed", time: "June 10, 2026 • 10:15 AM" },
      { event: "Booking Confirmed", time: "June 10, 2026 • 10:15 AM" },
      { event: "Service Started", time: "June 10, 2026 • 10:15 AM" },
      { event: "Provider Marked Completed", time: "June 10, 2026 • 10:15 AM" },
      { event: "Dispute opened by client", time: "June 10, 2026 • 09:45 AM" },
      { event: "Status set to Open — in queue", time: "June 10, 2026 • 09:45 AM" },
      { event: "Status → Under Review", time: "June 10, 2026 • 09:45 AM" }
    ]
  }
];

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [disputes, setDisputes] = useState([]);
  const [dispute, setDispute] = useState(null);

  // Redesign tabs and modal states
  const [activeTab, setActiveTab] = useState("Evidence");
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  // Details chat input message
  const [chatMessage, setChatMessage] = useState("");
  const chatContainerRef = useRef(null);

  // Resolution form states
  const [decision, setDecision] = useState("Favor Client");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [refundOriginalCard, setRefundOriginalCard] = useState(true);
  const [suspendAccount, setSuspendAccount] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const handleClaimDispute = () => {
    if (!dispute) return;
    const updated = disputes.map((d) => {
      if (d.id === dispute.id) {
        return {
          ...d,
          status: "Under Review",
          timeline: [
            ...(d.timeline || []),
            { event: "Assigned case to review queue", time: "Just Now" },
            { event: "Dispute claimed by admin@netly.io", time: "Just Now" }
          ]
        };
      }
      return d;
    });
    saveDisputes(updated);
    toast.success("Dispute claimed! Status changed to Under Review.");
  };

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
          const updatedParsed = parsed.map(d => {
            if (d.id === "D-0019" && (!d.reason || d.timeline?.length < 5)) {
              return {
                ...d,
                ...defaultDisputesBackup[0]
              };
            }
            return d;
          });
          list = updatedParsed;
          localStorage.setItem("netly_disputes", JSON.stringify(updatedParsed));
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
      sender: "Admin - Priya Nair",
      role: "admin",
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
    setIsResolveModalOpen(false);
    toast.success(`Dispute ${dispute.id} resolved successfully!`);
  };

  if (!dispute) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-3 font-onest">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-bg" />
        <p className="text-xs text-text-muted font-light">Loading dispute details...</p>
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
            className="w-8 h-8 rounded-lg bg-white border border-secondary-bg hover:bg-page-bg transition flex items-center justify-center text-text-primary cursor-pointer font-bold shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold tracking-tight text-text-primary">{dispute.id}</h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${getStatusClass(dispute.status)}`}>
                <span className="h-1 w-1 rounded-full bg-current" />
                {dispute.status}
              </span>
            </div>
            <span className="text-[10px] text-text-muted mt-1 block">
              Opened by Client - {dispute.dateOpened} - 9:14 AM - {dispute.category}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-primary bg-page-bg px-3 py-1.5 rounded-xl border border-secondary-bg/30 select-none">
          <User size={16} className="text-text-muted" />
          <span>Assigned: <span>admin@netly.io</span></span>
        </div>
      </div>

      {/* Main Layout: Left Column (Parties + Tabs) & Right Column (Live Conversation) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* LEFT COLUMN: Parties and Info Tabs */}
        <div className="lg:col-span-1 space-y-4">
          {/* Parties Card */}
          <div className="bg-white rounded-3xl border border-secondary-bg p-4 space-y-4 shadow-2xs">
            <span className="text-[10px] text-text-muted block">Parties</span>
            
            {/* Client */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#E5F5F7] text-[#0ea5e9] flex items-center justify-center font-bold text-xs shrink-0 select-none">
                AO
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-medium text-text-primary truncate">{dispute.client}</h4>
                <span className="text-[9px] text-text-muted block truncate">{dispute.clientEmail || "amara.osei@gmail.com"}</span>
                <span className="inline-block bg-primary-bg-muted/20 text-text-primary text-[8px] font-medium px-1.5 py-1 rounded-xl mt-1">CLIENT</span>
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
                <h4 className="text-xs font-medium text-text-primary truncate">{dispute.provider}</h4>
                <span className="text-[9px] text-text-muted block truncate">{dispute.providerEmail || "b.okeke@clearly.ca"}</span>
                <span className="inline-block bg-text-primary text-white text-[8px] font-medium px-1.5 py-1 rounded-xl mt-1">PROVIDER</span>
              </div>
            </div>
          </div>

          {/* Details / Evidence / Timeline Tab Selection */}
          <div className="bg-white rounded-3xl border border-secondary-bg p-4 space-y-4 shadow-2xs">
            <div className="flex border-b border-secondary-bg text-xs">
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
                <div className="bg-[#FAFBFD] rounded-2xl border border-secondary-bg p-4 space-y-1">
                  <span className="text-[10px] text-text-muted block">Dispute Reason</span>
                  <p className="text-xs font-medium text-text-primary">{dispute.reason || "Service not completed"}</p>
                </div>

                {/* Description (by client) */}
                <div className="bg-[#FAFBFD] rounded-2xl border border-secondary-bg p-4 space-y-1">
                  <span className="text-[10px] text-text-muted block">Description (by client)</span>
                  <p className="text-xs text-text-primary leading-relaxed font-light">
                    {dispute.description || "No client description provided."}
                  </p>
                </div>

                {/* Transaction Summary Card */}
                <div className="bg-white rounded-2xl border border-secondary-bg overflow-hidden shadow-3xs">
                  <div className="flex items-center justify-between p-4 border-b border-secondary-bg/60">
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight size={14} className="text-text-muted transform scale-x-[-1]" />
                      <span className="text-xs font-semibold text-text-primary">Transaction Summary</span>
                    </div>
                    <span className="text-xs text-[#0ea5e9] font-medium">{dispute.txnId || "TXN-00188"}</span>
                  </div>
                  
                  <div className="p-4 space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-text-muted font-light">Service</span>
                      <span className="text-text-primary font-medium">{dispute.category}</span>
                    </div>
                    <div className="flex justify-between pb-1.5">
                      <span className="text-text-muted font-light">Date</span>
                      <span className="text-text-primary font-medium">{dispute.dateOpened}</span>
                    </div>
                    
                    <div className="border-t border-secondary-bg/50 pt-2 flex justify-between">
                      <span className="text-text-muted font-light">Service amount</span>
                      <span className="text-text-primary font-medium">${dispute.serviceAmount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted font-light">Client fee (5%)</span>
                      <span className="text-text-primary font-medium">${dispute.clientFee?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted font-light">Commission (15%)</span>
                      <span className="text-text-primary font-medium">${dispute.commission?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-secondary-bg/30 text-text-primary">
                      <span>Total charged</span>
                      <span>${dispute.totalCharged?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Provider Statement */}
                <div className="bg-[#FAFBFD] rounded-2xl border border-secondary-bg p-4 space-y-2">
                  <span className="text-[10px] text-text-muted block">Provider statement</span>
                  <div className="flex items-center gap-1.5 text-xs text-text-primary font-medium">
                    <User size={13} className="text-text-muted" />
                    <span>{dispute.provider}</span>
                  </div>
                  <p className="text-xs text-text-primary leading-relaxed font-light">
                    {dispute.providerStatement || "No provider statement filed."}
                  </p>
                </div>

                {dispute.status === "Resolved" && (
                  <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-4 space-y-2 text-xs">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">⚖️ Resolution Decision</span>
                    <div className="flex justify-between py-1 border-b border-emerald-100/50">
                      <span className="text-emerald-700 font-light">Decision</span>
                      <strong className="text-emerald-900 font-bold">{dispute.decision}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-emerald-100/50">
                      <span className="text-emerald-700 font-light">Resolved Date</span>
                      <strong className="text-emerald-900 font-normal">{dispute.resolvedDate}</strong>
                    </div>
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Notes</span>
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
                {[
                  { name: "window_photos_before.jpg", uploader: `${dispute.client} - Jul 5`, isImg: true },
                  { name: "window_photos_after.jpg", uploader: `${dispute.client} - Jul 5`, isImg: true },
                  { name: "listing_description.pdf", uploader: "System - Jul 5", isImg: false },
                  { name: "provider_completion_photo.jpg", uploader: `${dispute.provider} - Jul 5`, isImg: true }
                ].map((file, idx) => (
                  <div key={idx} className="bg-page-bg/60 rounded-xl p-3 flex items-center justify-between text-xs hover:bg-page-bg transition border border-secondary-bg/30">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-white border border-secondary-bg flex items-center justify-center shrink-0">
                        <FileText size={14} className={file.isImg ? "text-blue-500" : "text-amber-500"} />
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-text-primary block truncate text-[11px]">{file.name}</span>
                        <span className="text-[9px] text-text-muted block mt-0.5">{file.uploader}</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => toast.info(`Viewing file ${file.name}...`)}
                      className="text-text-muted hover:text-text-primary p-1 shrink-0 cursor-pointer"
                    >
                      <Eye size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Timeline Tab Panel */}
            {activeTab === "Timeline" && (
              <div className="relative pl-6 space-y-6 py-2 before:absolute before:left-2.75 before:top-4 before:bottom-4 before:w-0.5 before:bg-[#10b981]">
                {(dispute.timeline || []).map((t, idx) => {
                  const isLatest = idx === (dispute.timeline || []).length - 1;
                  return (
                    <div key={idx} className="relative flex flex-col gap-0.5 min-h-11 pl-1">
                      {isLatest ? (
                        <div className="absolute -left-5.75 top-0 h-5.5 w-5.5 rounded-full bg-[#f59e0b] border-2 border-white flex items-center justify-center text-white shrink-0 select-none shadow-xs">
                          <Clock size={11} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="absolute -left-5.75 top-0 h-5.5 w-5.5 rounded-full bg-[#10b981] border-2 border-white flex items-center justify-center text-white shrink-0 select-none shadow-xs">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                      <strong className="text-xs font-semibold text-text-primary block leading-tight">{t.event}</strong>
                      <span className="text-[10px] text-text-muted font-light block">{t.time}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT/MAIN COLUMN: Conversation Area */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-secondary-bg shadow-2xs flex flex-col h-[78vh] overflow-hidden">
          
          {/* Conversation Header */}
          <div className="px-5 py-3.5 border-b border-secondary-bg flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-text-primary">Live Conversation</span>
              
              {/* Member Avatars */}
              <div className="flex items-center gap-2 pl-2 border-l border-secondary-bg text-[10px]">
                <div className="flex -space-x-1.5 shrink-0 select-none">
                  <div className="w-5 h-5 rounded-full bg-[#E5F5F7] text-[#0ea5e9] border border-white flex items-center justify-center font-bold text-[8px]">AO</div>
                  <div className="w-5 h-5 rounded-full bg-[#0F172A] text-white border border-white flex items-center justify-center font-bold text-[8px]">BO</div>
                  <div className="w-5 h-5 rounded-full bg-[#93D6DB] text-text-primary border border-white flex items-center justify-center font-bold text-[8px]">PN</div>
                </div>
                <div className="flex items-center gap-1 text-text-muted truncate max-w-64">
                  <span className="font-semibold text-text-primary">AO</span> Amara
                  <span className="mx-0.5 font-light text-text-muted/65">•</span>
                  <span className="font-semibold text-text-primary">BO</span> Blessing
                  <span className="mx-0.5 font-light text-text-muted/65">•</span>
                  <span className="font-semibold text-text-primary">PN</span> You
                </div>
              </div>
            </div>

            {/* Claim / Resolve buttons */}
            {dispute.status !== "Resolved" && (
              dispute.status === "Open" ? (
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
              )
            )}
          </div>

          {/* Conversation Chat Thread */}
          <div 
            ref={chatContainerRef} 
            className="flex-1 overflow-y-auto p-5 bg-[#FAFBFD] space-y-4 scrollbar-thin"
          >
            {(() => {
              let lastDate = "";
              return (dispute.chat || []).map((msg, idx) => {
                const isSystem = (msg.role === "system" || msg.sender === "System") && msg.sender !== "System User";
                const isProvider = msg.role === "provider";
                const isAdmin = msg.role === "admin" || msg.sender.startsWith("Admin") || msg.sender === "System User";
                
                // Parse date header
                let dateHeader = null;
                const match = msg.time.match(/^[A-Za-z]{3} \d{1,2}, \d{4}/);
                if (match) {
                  const msgDate = match[0];
                  if (msgDate !== lastDate) {
                    lastDate = msgDate;
                    dateHeader = (
                      <div key={`date-${idx}`} className="flex justify-center my-4 animate-fade-in select-none">
                        <span className="text-[10px] text-text-muted font-medium bg-secondary-bg/30 px-3.5 py-1 rounded-full">
                          {msgDate}
                        </span>
                      </div>
                    );
                  }
                }
                const displayTime = msg.time.replace(/^[A-Za-z]{3} \d{1,2}, \d{4}\s*/, "");

                if (isSystem) {
                  return (
                    <React.Fragment key={idx}>
                      {dateHeader}
                      <div className="flex justify-center my-4 animate-fade-in select-none">
                        <div className="bg-white border border-secondary-bg rounded-full text-center py-1.5 px-5 text-text-muted italic text-[10px] max-w-lg shadow-2xs">
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
                            {msg.sender} <span className="font-light opacity-80">(You)</span>
                          </span>
                          
                          <div className="p-3 rounded-2xl rounded-tr-none leading-relaxed text-xs shadow-3xs bg-primary-bg-muted text-text-primary border border-secondary-bg/20 text-left">
                            <p className="whitespace-pre-line">{msg.text}</p>
                            
                            {/* Attached mock file preview box */}
                            {msg.file && (
                              <div className="mt-2.5 p-2.5 rounded-xl flex items-center justify-between text-[10px] bg-page-bg text-text-primary border border-secondary-bg/50">
                                <div className="flex items-center gap-2 truncate">
                                  <FileText size={13} className="text-blue-500" />
                                  <span className="font-medium truncate">{msg.file}</span>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => toast.info(`Downloading file ${msg.file}...`)}
                                  className="p-1 hover:opacity-80 transition cursor-pointer text-text-primary"
                                >
                                  <Download size={11} />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <span className="text-[8px] text-text-muted block mt-0.5 font-light">{displayTime}</span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                }

                // Client or Provider bubble
                let avatarText = isProvider ? "BO" : "AO";
                let avatarBgClass = isProvider ? "bg-[#0F172A] text-white" : "bg-[#E5F5F7] text-[#0ea5e9]";
                let bubbleClass = isProvider ? "bg-[#0F172A] text-white" : "bg-white text-text-primary border border-secondary-bg/30";
                let labelSuffix = isProvider ? "(Provider)" : "(Client)";

                return (
                  <React.Fragment key={idx}>
                    {dateHeader}
                    <div className="flex items-start gap-2.5 max-w-3xl mr-auto justify-start animate-fade-in">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 select-none ${avatarBgClass}`}>
                        {avatarText}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-text-muted font-medium">
                          {msg.sender} <span className="font-light opacity-80">{labelSuffix}</span>
                        </span>
                        
                        <div className={`p-3 rounded-2xl rounded-tl-none leading-relaxed text-xs shadow-3xs ${bubbleClass}`}>
                          <p className="whitespace-pre-line">{msg.text}</p>
                          
                          {/* Attached mock file preview box */}
                          {msg.file && (
                            <div className={`mt-2.5 p-2.5 rounded-xl flex items-center justify-between text-[10px] ${
                              isProvider ? "bg-white/10 text-white" : "bg-page-bg text-text-primary border border-secondary-bg/50"
                            }`}>
                              <div className="flex items-center gap-2 truncate">
                                <FileText size={13} className={isProvider ? "text-blue-300" : "text-blue-500"} />
                                <span className="font-medium truncate">{msg.file}</span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => toast.info(`Downloading file ${msg.file}...`)}
                                className="p-1 hover:opacity-80 transition cursor-pointer text-text-primary"
                              >
                                <Download size={11} />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <span className="text-[8px] text-text-muted block mt-0.5 font-light">{displayTime}</span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              });
            })()}
          </div>

          {/* Conversation Input area */}
          <div className="p-4 border-t border-secondary-bg bg-white shrink-0">
            <div className="flex items-center justify-between text-[10px] text-text-muted pb-2 select-none">
              <span className="font-medium">Sending as <span className="text-text-primary font-semibold">Priya Nair</span> · Admin</span>
              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            
            {dispute.status !== "Resolved" ? (
              <form onSubmit={handleSendChatSubmit} className="flex items-center gap-2 border border-secondary-bg rounded-2xl p-1 bg-white focus-within:ring-1 focus-within:ring-primary-bg/20 transition">
                <button 
                  type="button" 
                  onClick={() => toast.info("Opening file upload attachment manager...")}
                  className="p-2 text-text-muted hover:text-text-primary transition cursor-pointer"
                >
                  <Paperclip size={15} />
                </button>
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                  className="flex-1 bg-transparent text-xs p-2 focus:outline-none text-text-primary placeholder:text-text-muted"
                />
                <button
                  type="submit"
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-primary-bg text-white hover:opacity-90 transition cursor-pointer shrink-0 shadow-2xs"
                >
                  <Send size={13} />
                </button>
              </form>
            ) : (
              <div className="bg-page-bg/50 border border-secondary-bg/30 text-center text-text-muted font-light py-2 text-xs rounded-xl italic select-none">
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
          <div className="absolute inset-0 bg-alt-bg/40 backdrop-blur-xs animate-fade-in" onClick={() => setIsResolveModalOpen(false)} />
          
          {/* Modal Container */}
          <form onSubmit={handleResolveSubmit} className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl z-10 border border-secondary-bg animate-scale-up mx-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-2 mb-4 border-b border-border-main shrink-0">
              <h3 className="text-lg font-bold text-text-primary tracking-tight">Resolve Dispute</h3>
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
                <label className="text-xs text-text-primary block font-medium">Decision <span className="text-red-500">*</span></label>
                <div className="space-y-2">
                  {[
                    { id: "Favor Client", label: "Favor Client" },
                    { id: "Favor Provider", label: "Favor Provider" },
                    { id: "Split", label: "Split Decision" }
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
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition shrink-0 ${
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

              {/* Wallet Adjustment */}
              {["Favor Client", "Split"].includes(decision) && (
                <div className="space-y-1">
                  <label className="text-xs text-text-primary block font-medium">Wallet Adjustment Amount ($) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white border border-secondary-bg text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary font-mono"
                    required
                  />
                  <span className="text-[10px] text-text-muted block mt-0.5">Credit issued back to client's wallet.</span>
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
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${
                    refundOriginalCard ? "border-primary-bg bg-primary-bg text-white" : "border-text-muted/30 bg-white"
                  }`}>
                    {refundOriginalCard && <span className="text-[10px] font-bold">✓</span>}
                  </div>
                  <div>
                    <strong className="block text-text-primary text-[11px] leading-tight font-medium">Refund to original card</strong>
                    <span className="block text-[9px] text-text-muted">Triggers Stripe refund flow via Cloud Function</span>
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
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${
                    suspendAccount ? "border-primary-bg bg-primary-bg text-white" : "border-text-muted/30 bg-white"
                  }`}>
                    {suspendAccount && <span className="text-[10px] font-bold">✓</span>}
                  </div>
                  <div>
                    <strong className="block text-text-primary text-[11px] leading-tight font-medium">Suspend account at fault</strong>
                    <span className="block text-[9px] text-text-muted">Opens pre-filled suspension page context</span>
                  </div>
                </label>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs text-text-primary block font-medium">Resolution Notes <span className="text-red-500">*</span></label>
                <textarea
                  placeholder="Document resolution rationale, evidence reviewed..."
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full bg-white border border-secondary-bg text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted resize-none"
                  required
                />
                <span className="text-[10px] text-text-muted block">Minimum 30 characters.</span>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-secondary-bg mt-4 shrink-0">
              <button
                type="button"
                onClick={() => setIsResolveModalOpen(false)}
                className="flex-1 bg-white border border-border-main text-text-primary hover:bg-page-bg font-semibold text-xs py-2.5 rounded-lg transition cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#93D6DB] text-text-primary hover:bg-[#82c5cb] font-bold text-xs py-2.5 rounded-lg transition cursor-pointer text-center"
              >
                Confirm Resolution
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
