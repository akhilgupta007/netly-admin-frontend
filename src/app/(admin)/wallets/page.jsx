"use client";

import React, { useState, useMemo, useEffect } from "react";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useWallets,
  useWalletCreditRequests,
  usePayoutLogs
} from "@/hooks/useWallets";
import { adjustWalletBalance, approveWalletCreditRequest } from "@/lib/callables";

import WalletHistoryModal from "@/components/wallets/WalletHistoryModal";
import AdjustBalanceModal from "@/components/wallets/AdjustBalanceModal";
import AuthorizeTransferModal from "@/components/wallets/AuthorizeTransferModal";
import RejectTransferModal from "@/components/wallets/RejectTransferModal";

import WalletsTab from "@/components/wallets/WalletsTab";
import WalletCreditQueueTab from "@/components/wallets/WalletCreditQueueTab";
import TransferQueueTab from "@/components/wallets/TransferQueueTab";
import FeeReportTab from "@/components/wallets/FeeReportTab";

// Helper to copy text to clipboard
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  toast.success(`Copied to clipboard: ${text}`, {
    position: "top-right",
    autoClose: 2000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: false,
  });
};

// Helper to parse localized transaction date string
const parseTxDate = (dateStr) => {
  let cleanStr = dateStr;
  if (dateStr.startsWith("Jun ")) {
    cleanStr = dateStr.replace("Jun ", "June ");
  }
  return new Date(cleanStr);
};


export default function WalletsRefundsPage() {
  // Tabs State
  const [activeTab, setActiveTab] = useState("wallets"); // 'wallets' | 'credit' | 'transfer' | 'fee'

  // Global filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals & Drawers States
  const [selectedWallet, setSelectedWallet] = useState(null); // Used for history and adjust
  const [selectedQueueItem, setSelectedQueueItem] = useState(null); // Used for authorize / reject
  const [activeModal, setActiveModal] = useState(null); // 'adjust' | 'authorize' | 'reject'
  const [drawerOpen, setDrawerOpen] = useState(false); // History drawer

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      const startParam = params.get("startDate");
      const endParam = params.get("endDate");

      if (tabParam) {
        setActiveTab(tabParam);
      }
      if (startParam) {
        const [y, m, d] = startParam.split("-").map(Number);
        setStartDate(new Date(y, m - 1, d));
      }
      if (endParam) {
        const [y, m, d] = endParam.split("-").map(Number);
        setEndDate(new Date(y, m - 1, d));
      }
    }
  }, []);

  const queryClient = useQueryClient();

  // Live data. Each tab only queries while it is the active one.
  const { wallets, isLoading: walletsLoading, isError: walletsError } = useWallets(
    {},
    { enabled: activeTab === "wallets" }
  );
  const {
    requests: creditQueue,
    isLoading: creditLoading,
    isError: creditError
  } = useWalletCreditRequests({}, { enabled: activeTab === "credit" });
  const {
    payouts: transferQueue,
    isLoading: transferLoading,
    isError: transferError
  } = usePayoutLogs({}, { enabled: activeTab === "transfer" });

  // Calendar toggle helper
  const toggleCalendar = () => {
    if (!calendarOpen) {
      setTempStartDate(startDate);
      setTempEndDate(endDate);
      setShowMonthYearSelector(false);
    }
    setCalendarOpen(!calendarOpen);
  };

  // Filtering Wallets List
  const filteredWallets = useMemo(() => {
    return wallets.filter(w => {
      const search = searchTerm.toLowerCase();
      const matchSearch = w.client.name.toLowerCase().includes(search) || w.client.email.toLowerCase().includes(search);

      let matchDate = true;
      if (startDate || endDate) {
        // Strip out and parse the first portion of the string
        const cleanTxDate = parseTxDate(w.lastTxDate);
        if (startDate && cleanTxDate < startDate) matchDate = false;
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (cleanTxDate > endOfDay) matchDate = false;
        }
      }
      return matchSearch && matchDate;
    });
  }, [wallets, searchTerm, startDate, endDate]);

  // Filtering Wallet Credit Queue
  const filteredCreditQueue = useMemo(() => {
    return creditQueue.filter(q => {
      const search = searchTerm.toLowerCase();
      const matchSearch = q.client.name.toLowerCase().includes(search) || q.client.email.toLowerCase().includes(search) || q.id.toLowerCase().includes(search);
      const matchStatus = filterStatus === "All" || q.status === filterStatus;

      let matchDate = true;
      if (startDate || endDate) {
        const cleanTxDate = parseTxDate(q.date);
        if (startDate && cleanTxDate < startDate) matchDate = false;
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (cleanTxDate > endOfDay) matchDate = false;
        }
      }
      return matchSearch && matchStatus && matchDate;
    });
  }, [creditQueue, searchTerm, filterStatus, startDate, endDate]);

  // Filtering Transfer Queue
  const filteredTransferQueue = useMemo(() => {
    return transferQueue.filter(q => {
      const search = searchTerm.toLowerCase();
      const matchSearch = q.provider.name.toLowerCase().includes(search) || q.provider.email.toLowerCase().includes(search) || q.id.toLowerCase().includes(search);
      const matchStatus = filterStatus === "All" || q.status === filterStatus;

      let matchDate = true;
      if (startDate || endDate) {
        const cleanTxDate = parseTxDate(q.date);
        if (startDate && cleanTxDate < startDate) matchDate = false;
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (cleanTxDate > endOfDay) matchDate = false;
        }
      }
      return matchSearch && matchStatus && matchDate;
    });
  }, [transferQueue, searchTerm, filterStatus, startDate, endDate]);

  const adjustMutation = useMutation({
    mutationFn: adjustWalletBalance,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      toast.success(
        `Balance adjusted. New balance $${Number(result.balanceAfter).toFixed(2)}.`
      );
      setActiveModal(null);
    },
    onError: (error) => toast.error(error.message)
  });

  const creditDecisionMutation = useMutation({
    mutationFn: approveWalletCreditRequest,
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["walletCreditRequests"] });
      // An approval moves money, so the balances list is stale too.
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      toast.success(
        variables.action === "approve"
          ? "Refund approved and credited."
          : "Refund request rejected."
      );
      setActiveModal(null);
    },
    onError: (error) => toast.error(error.message)
  });

  const handleAdjustSubmit = ({ walletId, uid, amount, type, reason }) => {
    adjustMutation.mutate({
      uid: uid || walletId,
      amount,
      type: type === "Add Credit" ? "credit" : "debit",
      reason
    });
  };

  // Only the credit queue has an approval workflow. Payout transfers are made
  // automatically by processFridayPayouts and are not authorised here.
  const handleAuthorizeSubmit = ({ itemId }) => {
    if (activeTab !== "credit") {
      toast.info("Provider payouts run automatically every Friday.");
      return;
    }
    creditDecisionMutation.mutate({ requestId: itemId, action: "approve" });
  };

  const handleRejectSubmit = ({ itemId, reason }) => {
    if (activeTab !== "credit") {
      toast.info("Provider payouts run automatically every Friday.");
      return;
    }
    creditDecisionMutation.mutate({
      requestId: itemId,
      action: "reject",
      reason
    });
  };

  return (
    <div className="space-y-4">

      {/* Dynamic Header - Title and subtitle dynamically managed by layouts.jsx */}

      {/* 4 Navigation Tabs */}
      <div className="flex border-b border-border-main text-xs">
        {[
          { id: "wallets", label: "Wallets" },
          { id: "credit", label: "Wallet Credit Queue" },
          { id: "transfer", label: "Transfer Queue" },
          { id: "fee", label: "5% Fee Report" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setCurrentPage(1);
              setSearchTerm("");
              setFilterStatus("All");
              setStartDate(null);
              setEndDate(null);
            }}
            className={`px-4 py-2 -mb-px font-semibold transition hover:text-primary-bg ${activeTab === tab.id
                ? "border-b-2 border-text-primary text-text-primary font-bold"
                : "text-text-muted"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conditionally Render Active Tab Component */}
      {activeTab === "wallets" && (
        <WalletsTab
          isLoading={walletsLoading}
          isError={walletsError}
          wallets={filteredWallets}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onOpenHistory={(item) => {
            setSelectedWallet(item);
            setDrawerOpen(true);
          }}
          onOpenAdjust={(item) => {
            setSelectedWallet(item);
            setActiveModal("adjust");
          }}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
        />
      )}

      {activeTab === "credit" && (
        <WalletCreditQueueTab
          isLoading={creditLoading}
          isError={creditError}
          creditQueue={filteredCreditQueue}
          startDate={startDate}
          endDate={endDate}
          searchTerm={searchTerm}
          filterStatus={filterStatus}
          onSearchChange={setSearchTerm}
          onStatusChange={setFilterStatus}
          onDateChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
          onAuthorize={(item) => {
            setSelectedQueueItem(item);
            setActiveModal("authorize");
          }}
          onReject={(item) => {
            setSelectedQueueItem(item);
            setActiveModal("reject");
          }}
          copyToClipboard={copyToClipboard}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
        />
      )}

      {activeTab === "transfer" && (
        <TransferQueueTab
          isLoading={transferLoading}
          isError={transferError}
          transferQueue={filteredTransferQueue}
          startDate={startDate}
          endDate={endDate}
          searchTerm={searchTerm}
          filterStatus={filterStatus}
          onSearchChange={setSearchTerm}
          onStatusChange={setFilterStatus}
          onDateChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
          onAuthorize={(item) => {
            setSelectedQueueItem(item);
            setActiveModal("authorize");
          }}
          onReject={(item) => {
            setSelectedQueueItem(item);
            setActiveModal("reject");
          }}
          copyToClipboard={copyToClipboard}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
        />
      )}

      {activeTab === "fee" && (
        <FeeReportTab
          startDate={startDate}
          endDate={endDate}
          onDateChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
        />
      )}

      {/* ADJUST BALANCE MODAL (Slide 1) */}
      <AdjustBalanceModal
        wallet={selectedWallet}
        isOpen={activeModal === "adjust"}
        onClose={() => setActiveModal(null)}
        onSubmit={handleAdjustSubmit}
      />

      {/* AUTHORIZE TRANSFER MODAL (Slide 2) */}
      <AuthorizeTransferModal
        queueItem={selectedQueueItem}
        activeTab={activeTab}
        isOpen={activeModal === "authorize"}
        onClose={() => setActiveModal(null)}
        onSubmit={handleAuthorizeSubmit}
      />

      {/* REJECT TRANSFER MODAL (Slide 3) */}
      <RejectTransferModal
        queueItem={selectedQueueItem}
        activeTab={activeTab}
        isOpen={activeModal === "reject"}
        onClose={() => setActiveModal(null)}
        onSubmit={handleRejectSubmit}
      />

      {/* WALLET HISTORY MODAL (Slide 8) */}
      <WalletHistoryModal
        wallet={selectedWallet}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
