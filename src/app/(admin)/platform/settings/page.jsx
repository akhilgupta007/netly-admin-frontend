"use client";

import React, { useState } from "react";
import AdminUsersTab from "@/components/platform/AdminUsersTab";
import ProfileSettingsTab from "@/components/platform/ProfileSettingsTab";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("Admin Users");

  const tabs = ["Admin Users", "Settings"];

  return (
    <div className="space-y-4 font-onest">

      {/* Dynamic Tab Navigation headers matching Accounts/Wallets/Compliance styling */}
      <div className="flex border-b border-border-main text-xs">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 -mb-px font-semibold transition hover:text-primary-bg cursor-pointer ${activeTab === tab
                ? "border-b-2 border-text-primary text-text-primary font-bold"
                : "text-text-muted"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* RENDER CURRENT ACTIVE TAB COMPONENT */}
      <div>
        {activeTab === "Admin Users" && <AdminUsersTab />}
        {activeTab === "Settings" && <ProfileSettingsTab />}
      </div>
    </div>
  );
}
