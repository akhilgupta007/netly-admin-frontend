"use client";

import React, { useState } from "react";

// Component tab separation
import CommissionSettingsTab from "@/components/finance/CommissionSettingsTab";
import PayoutQueueTab from "@/components/finance/PayoutQueueTab";
import T4ATaxTab from "@/components/finance/T4ATaxTab";

const TABS = ["Commission Settings", "Payout Queue", "T4A / Tax."];

export default function CommissionsPage() {
  // A deep link from a provider's action menu on Accounts arrives as
  // ?tab=Payout Queue&uid=... — read from the URL directly rather than through
  // useSearchParams, which would force this page behind a Suspense boundary.
  const [initial] = useState(() => {
    if (typeof window === "undefined") return { tab: null, uid: null };
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    return {
      tab: TABS.includes(tab) ? tab : null,
      uid: params.get("uid"),
      q: params.get("q") || "",
    };
  });

  const [activeTab, setActiveTab] = useState(
      initial.tab || "Commission Settings",
  );

  // Consumed once: switching tabs by hand must not reopen the modal.
  const [focusUid, setFocusUid] = useState(initial.uid);

  return (
    <div className="space-y-4 font-onest">

      {/* Dynamic Tab Navigation headers matching Accounts/Wallets styling */}
      <div className="flex border-b border-border-main text-xs">
        {TABS.map((tab) => (
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

      {/* RENDER CURRENT ACTIVE TAB CONTENT */}
      <div>
        {activeTab === "Commission Settings" && (
          <CommissionSettingsTab />
        )}

        {activeTab === "Payout Queue" && (
          <PayoutQueueTab
            focusUid={focusUid}
            focusQuery={initial.q}
            onFocusHandled={() => setFocusUid(null)}
          />
        )}

        {activeTab === "T4A / Tax." && (
          <T4ATaxTab />
        )}
      </div>

    </div>
  );
}
