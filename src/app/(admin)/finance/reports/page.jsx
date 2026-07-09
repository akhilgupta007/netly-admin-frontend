"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import { exportCSV, exportPDF } from "@/utils/exportHelper";

// Component tab separation
import TransactionVolumeTab from "@/components/finance/TransactionVolumeTab";
import NetRevenueTab from "@/components/finance/NetRevenueTab";
import WalletRefundsTab from "@/components/finance/WalletRefundsTab";
import MonthlyAccountingTab from "@/components/finance/MonthlyAccountingTab";

const mockTransactions = [
  { id: "TXN00192123500007", client: "Logan Walker", provider: "Zoe Robinson", category: "Post-Construction Cleaning", amount: 500.00, fee: 25.00, commission: 30.00, tip: 20.00, status: "Hour Adjustment Pending" },
  { id: "TXN00192123500004", client: "Isabella Thomas", provider: "Lucas Garcia", category: "Window Cleaning", amount: 250.00, fee: 12.50, commission: 15.00, tip: 10.00, status: "Completed" },
  { id: "TXN001921235000011", client: "Chloe Torres", provider: "Daniel Baker", category: "Sanitization Services", amount: 300.00, fee: 15.00, commission: 20.00, tip: 15.00, status: "In Progress" },
  { id: "TXN00192123500009", client: "Avery King", provider: "Jacob Wright", category: "Commercial Cleaning", amount: 700.00, fee: 35.00, commission: 45.00, tip: 30.00, status: "Refund Requested" },
  { id: "TXN00192123500006", client: "Amelia Clark", provider: "Alexander Lewis", category: "Deep Cleaning", amount: 400.00, fee: 20.00, commission: 25.00, tip: 15.00, status: "Dispute" },
  { id: "TXN00192123500003", client: "Ethan Martinez", provider: "Ava Anderson", category: "Pressure Washing", amount: 300.00, fee: 15.00, commission: 20.00, tip: 12.00, status: "Wallet Credited" },
  { id: "TXN00192123500005", client: "Charlotte Lee", provider: "James Harris", category: "Floor Waxing", amount: 300.00, fee: 15.00, commission: 20.00, tip: 11.00, status: "Pending Provider Accept" }
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("Transaction Volume");

  const handleExportCSV = () => {
    const headers = ["Transaction ID", "Client", "Provider", "Category", "Amount ($)", "Fee ($)", "Commission ($)", "Tip ($)", "Status"];
    const rows = mockTransactions.map(item => `"${item.id}","${item.client}","${item.provider}","${item.category}",${item.amount},${item.fee},${item.commission},${item.tip},"${item.status}"`);
    exportCSV(headers, rows, `monthly_accounting_${Date.now()}.csv`);
  };

  const handleExportPDF = () => {
    const headers = ["TXN ID", "Client", "Provider", "Category", "Amount", "Fee", "Commission", "Tip", "Status"];
    const rows = mockTransactions.map(item => [
      item.id,
      item.client,
      item.provider,
      item.category,
      `$${item.amount.toFixed(2)}`,
      `$${item.fee.toFixed(2)}`,
      `$${item.commission.toFixed(2)}`,
      `$${item.tip.toFixed(2)}`,
      item.status
    ]);
    exportPDF("Monthly Accounting Report", headers, rows, `monthly_accounting_${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-4">
      
      {/* Dynamic Tab Navigation headers matching Accounts/Wallets styling */}
      <div className="flex border-b border-secondary-bg text-xs">
        {[
          { id: "Transaction Volume", label: "Transaction Volume" },
          { id: "Net Revenue", label: "Net Revenue" },
          { id: "Wallet Usage vs Refunds", label: "Wallet Usage vs Refunds" },
          { id: "Monthly Accounting", label: "Monthly Accounting" }
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
          <MonthlyAccountingTab onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
        )}
      </div>

    </div>
  );
}
