"use client";

import React, { useState } from "react";
import FlaggedContentTab from "@/components/platform/FlaggedContentTab";
import ServiceListingsTab from "@/components/platform/ServiceListingsTab";
import ReviewsTab from "@/components/platform/ReviewsTab";

export default function ContentModerationPage() {
  const [activeTab, setActiveTab] = useState("Flagged Content");

  const tabs = ["Flagged Content", "Service Listings", "Reviews"];

  return (
    <div className="space-y-4 font-onest">
      {/* Dynamic Tab Navigation headers matching Accounts/Wallets/Compliance styling */}
      <div className="flex border-b border-secondary-bg text-xs">
        {tabs.map((tab) => (
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
      <div>
        {activeTab === "Flagged Content" && <FlaggedContentTab />}
        {activeTab === "Service Listings" && <ServiceListingsTab />}
        {activeTab === "Reviews" && <ReviewsTab />}
      </div>
    </div>
  );
}
