"use client";

import React, { useState } from "react";

// Component tab separation
import CommissionSettingsTab from "@/components/finance/CommissionSettingsTab";
import PayoutQueueTab from "@/components/finance/PayoutQueueTab";
import T4ATaxTab from "@/components/finance/T4ATaxTab";

export default function CommissionsPage() {
  const [activeTab, setActiveTab] = useState("Commission Settings"); // 'Commission Settings' | 'Payout Queue' | 'T4A / Tax.'

  return (
    <div className="space-y-4 font-onest">
      
      {/* Dynamic Tab Navigation headers matching Accounts/Wallets styling */}
      <div className="flex border-b border-secondary-bg text-xs">
        {[
          { id: "Commission Settings", label: "Commission Settings" },
          { id: "Payout Queue", label: "Payout Queue" },
          { id: "T4A / Tax.", label: "T4A / Tax." }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 -mb-px font-semibold transition hover:text-primary-bg cursor-pointer ${
              activeTab === tab.id
                ? "border-b-2 border-text-primary text-text-primary font-bold"
                : "text-text-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* RENDER CURRENT ACTIVE TAB CONTENT */}
      <div>
        {activeTab === "Commission Settings" && (
          <CommissionSettingsTab />
        )}

        {activeTab === "Payout Queue" && (
          <PayoutQueueTab />
        )}

        {activeTab === "T4A / Tax." && (
          <T4ATaxTab />
        )}
      </div>

    </div>
  );
}
