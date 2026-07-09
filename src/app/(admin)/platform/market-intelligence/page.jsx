"use client";

import React, { useState } from "react";
import UnmetDemandTab from "@/components/platform/UnmetDemandTab";
import SearchTermTrendsTab from "@/components/platform/SearchTermTrendsTab";
import UserStatsTab from "@/components/platform/UserStatsTab";

export default function MarketIntelligencePage() {
  const [activeTab, setActiveTab] = useState("Unmet Demand");
  const tabs = ["Unmet Demand", "Search Term Trends", "User Stats"];

  return (
    <div className="space-y-4 font-onest">
      
      {/* Dynamic Tab Navigation headers matching layout standards */}
      <div className="flex border-b border-secondary-bg text-xs select-none">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 -mb-px font-semibold transition hover:text-primary-bg cursor-pointer ${
              activeTab === tab
                ? "border-b-2 border-text-primary text-text-primary font-bold"
                : "text-text-muted font-normal"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Render sub-tab content */}
      <div>
        {activeTab === "Unmet Demand" && <UnmetDemandTab />}
        {activeTab === "Search Term Trends" && <SearchTermTrendsTab />}
        {activeTab === "User Stats" && <UserStatsTab />}
      </div>

    </div>
  );
}
