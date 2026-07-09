"use client";

import React, { useState } from "react";

// Component Separation
import AuditLogsTab from "@/components/compliance/AuditLogsTab";
import DataAccessLogsTab from "@/components/compliance/DataAccessLogsTab";
import ConsentManagementTab from "@/components/compliance/ConsentManagementTab";

export default function ComplianceLogsPage() {
  const [activeTab, setActiveTab] = useState("Audit Logs");

  return (
    <div className="space-y-4 font-onest">
      
      {/* Dynamic Tab Navigation headers matching Accounts/Wallets styling */}
      <div className="flex border-b border-secondary-bg text-xs">
        {["Audit Logs", "Data Access Logs", "Consent Management"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 -mb-px font-semibold transition hover:text-primary-bg cursor-pointer ${
              activeTab === tab
                ? "border-b-2 border-text-primary text-text-primary font-bold"
                : "text-text-muted"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* RENDER CURRENT ACTIVE TAB COMPONENT */}
      <div className="bg-white rounded-3xl border border-secondary-bg hover:shadow-xs relative overflow-hidden">
        {activeTab === "Audit Logs" && (
          <AuditLogsTab />
        )}

        {activeTab === "Data Access Logs" && (
          <DataAccessLogsTab />
        )}

        {activeTab === "Consent Management" && (
          <ConsentManagementTab />
        )}
      </div>

    </div>
  );
}
