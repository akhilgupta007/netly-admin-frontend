"use client";

import React, { useState } from "react";
import TransactionVolumeTab from "@/components/finance/TransactionVolumeTab";
import NetRevenueTab from "@/components/finance/NetRevenueTab";
import WalletRefundsTab from "@/components/finance/WalletRefundsTab";
import MonthlyAccountingTab from "@/components/finance/MonthlyAccountingTab";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("Transaction Volume");

  return (
    <div className="space-y-4 font-onest">
      
      {/* Standard Tab Navigation headers matching Accounts/Wallets */}
      <div className="flex border-b border-secondary-bg text-xs overflow-x-auto [ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
        {[
          { id: "Transaction Volume", label: "Transaction Volume" },
          { id: "Net Revenue", label: "Net Revenue" },
          { id: "Wallet Usage vs Refunds", label: "Wallet Usage vs Refunds" },
          { id: "Monthly Accounting", label: "Monthly Accounting" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 -mb-px font-semibold transition hover:text-primary-bg cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? "border-b-2 border-text-primary text-text-primary font-bold"
                : "text-text-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* RENDER CURRENT ACTIVE TAB VIEW */}
      <div>
        {activeTab === "Transaction Volume" && (
          <TransactionVolumeTab />
        )}

        {activeTab === "Net Revenue" && (
          <NetRevenueTab />
        )}

        {activeTab === "Wallet Usage vs Refunds" && (
          <WalletRefundsTab />
        )}

        {activeTab === "Monthly Accounting" && (
          <MonthlyAccountingTab />
        )}
      </div>

    </div>
  );
}
