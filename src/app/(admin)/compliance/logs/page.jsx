"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";

// Component Separation
import AuditLogsTab from "@/components/compliance/AuditLogsTab";
import DataAccessLogsTab from "@/components/compliance/DataAccessLogsTab";
import ConsentManagementTab from "@/components/compliance/ConsentManagementTab";

export default function ComplianceLogsPage() {
  const [activeTab, setActiveTab] = useState("Audit Logs");

  const handleExportCSV = () => {
    toast.success("CSV log export initialized successfully!");
  };

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
      <div className="bg-white rounded-3xl border border-secondary-bg hover:shadow-xs relative">
        {activeTab === "Audit Logs" && (
          <AuditLogsTab onExport={handleExportCSV} />
        )}

        {activeTab === "Data Access Logs" && (
          <DataAccessLogsTab onExport={handleExportCSV} />
        )}

        {activeTab === "Consent Management" && (
          <ConsentManagementTab onExport={handleExportCSV} />
        )}
      </div>

    </div>
  );
}
