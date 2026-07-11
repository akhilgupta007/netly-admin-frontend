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
    <div className="space-y-5 animate-scale-up">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* LEFT COLUMN: CURRENT RATES CARD */}
        <div className="bg-white rounded-3xl p-4 space-y-4 hover:shadow-xs h-min">
          <div className="flex justify-between items-center pb-2 shrink-0">
            <span className="text-sm font-semibold text-text-primary">Current Rates</span>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="border border-primary-bg-muted hover:border-primary-bg text-primary-bg font-semibold text-sm px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 size={16} /> Edit Rates
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Client platform fee */}
            <div className="bg-page-bg rounded-2xl p-4 flex flex-col justify-between">
              <div className="text-xs text-text-primary font-medium block">Client platform fee</div>
              <div>
                <strong className="text-2xl text-emerald-500 font-semibold block pt-3">{clientFee}%</strong>
                <div className="text-[9px] text-text-muted font-light">Added to service price at checkout</div>
              </div>
            </div>

            {/* Provider commission */}
            <div className="bg-page-bg rounded-2xl p-4 flex flex-col justify-between">
              <div className="text-xs text-text-primary font-medium block">Provider commission</div>
              <div>
                <strong className="text-2xl text-red-500 font-semibold block pt-3">{providerCommission}%</strong>
                <div className="text-[9px] text-text-muted font-light">Deducted from provider gross payout</div>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: RATE CHANGE HISTORY TIMELINE */}
        <div className="bg-white rounded-3xl p-4 space-y-4 hover:shadow-xs">
          <span className="text-sm font-semibold text-text-primary block pb-2">Rate Change History</span>
          
          <div className="space-y-4 relative pl-3.5 before:absolute before:left-1.25 before:top-1.5 before:bottom-1.5 before:w-[1.5px] before:bg-primary-bg-muted divide-y divide-border-main">
            {historyLogs.map((log, idx) => (
              <div key={idx} className="relative text-xs space-y-1 pl-2 flex gap-5">
                <span className="absolute -left-3.5 top-0.5 h-2.5 w-2.5 rounded-full bg-primary-bg" />
                <span className="text-text-primary block">{log.date}</span>
                <div>
                  <span className="text-text-primary block">{log.details}</span>
                  <p className="text-text-primary block pb-2">"{log.reason}"</p>
                </div>
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
