"use client";

import React, { useState } from "react";
import { Edit3 } from "lucide-react";
import EditRatesModal from "./EditRatesModal";

export default function CommissionSettingsTab() {
  const [clientFee, setClientFee] = useState(5);
  const [providerCommission, setProviderCommission] = useState(15);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [historyLogs, setHistoryLogs] = useState([
    { date: "Jun 1, 2027 09:00", details: "5% client 15% commission by admin@netly.io", reason: "Q2 review — rates remain unchanged pending competitor analysis." },
    { date: "Jun 1, 2027 09:00", details: "5% client 15% commission by admin@netly.io", reason: "Q2 review — rates remain unchanged pending competitor analysis." }
  ]);

  const handleSaveRates = (data) => {
    setClientFee(data.clientFee);
    setProviderCommission(data.providerCommission);

    const newLog = {
      date: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).replace(",", ""),
      details: `${data.clientFee}% client ${data.providerCommission}% commission by admin@netly.io`,
      reason: data.reason
    };

    setHistoryLogs([newLog, ...historyLogs]);
    setIsEditModalOpen(false);
  };

  return (
    <div className="p-5 space-y-5 animate-scale-up">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        
        {/* LEFT COLUMN: CURRENT RATES CARD */}
        <div className="lg:col-span-3 border border-secondary-bg rounded-3xl p-5 space-y-4 shadow-2xs h-min">
          <div className="flex justify-between items-center pb-2 border-b border-secondary-bg shrink-0">
            <span className="text-xs font-semibold text-text-primary">Current Rates</span>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="border border-primary-bg-muted hover:border-primary-bg text-primary-bg font-semibold text-xs px-3.5 py-1.5 rounded-full transition cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 size={12} /> Edit Rates
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Client platform fee */}
            <div className="bg-page-bg/30 border border-secondary-bg rounded-2xl p-4 flex flex-col justify-between min-h-22.5">
              <div>
                <span className="text-[10px] text-text-primary font-medium block">Client platform fee</span>
                <strong className="text-2xl text-emerald-500 font-bold block pt-1.5">{clientFee}%</strong>
              </div>
              <span className="text-[9px] text-text-muted font-light pt-2">Added to service price at checkout</span>
            </div>

            {/* Provider commission */}
            <div className="bg-page-bg/30 border border-secondary-bg rounded-2xl p-4 flex flex-col justify-between min-h-22.5">
              <div>
                <span className="text-[10px] text-text-primary font-medium block">Provider commission</span>
                <strong className="text-2xl text-red-500 font-bold block pt-1.5">{providerCommission}%</strong>
              </div>
              <span className="text-[9px] text-text-muted font-light pt-2">Deducted from provider gross payout</span>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: RATE CHANGE HISTORY TIMELINE */}
        <div className="lg:col-span-2 border border-secondary-bg rounded-3xl p-5 space-y-4 shadow-2xs">
          <span className="text-xs font-semibold text-text-primary block pb-2 border-b border-secondary-bg">Rate Change History</span>
          
          <div className="space-y-4 relative pl-3.5 before:absolute before:left-1 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-secondary-bg">
            {historyLogs.map((log, idx) => (
              <div key={idx} className="relative text-xs space-y-1">
                <span className="absolute -left-5 top-1.25 h-2 w-2 rounded-full bg-primary-bg" />
                <span className="text-[10px] text-text-muted font-light block">{log.date}</span>
                <strong className="text-text-primary font-semibold block leading-tight">{log.details}</strong>
                <p className="text-[10px] text-text-muted italic leading-normal font-light">"{log.reason}"</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Edit Rates Modal overlay */}
      {isEditModalOpen && (
        <EditRatesModal
          currentClientFee={clientFee}
          currentProviderCommission={providerCommission}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveRates}
        />
      )}
    </div>
  );
}
