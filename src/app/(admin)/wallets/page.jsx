"use client";

import React, { useState, useMemo, useEffect } from "react";
import { toast } from "react-toastify";

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

  // Mock Database - Wallets List
  const [wallets, setWallets] = useState([
    { id: "W-1001", client: { name: "Amara Osei", email: "amara@gmail.com" }, balance: 247.50, lastTxDate: "May 22, 2027", lastTxTime: "03:20 PM" },
    { id: "W-1002", client: { name: "Brandon Kim", email: "brandon.kim@example.com" }, balance: 300.00, lastTxDate: "May 23, 2027", lastTxTime: "01:45 PM" },
    { id: "W-1003", client: { name: "Chloe Lee", email: "chloe.lee@example.com" }, balance: 150.75, lastTxDate: "May 24, 2027", lastTxTime: "11:00 AM" },
    { id: "W-1004", client: { name: "Daniel Park", email: "daniel.park@example.com" }, balance: 400.20, lastTxDate: "May 25, 2027", lastTxTime: "09:30 AM" },
    { id: "W-1005", client: { name: "Ella Martinez", email: "ella.martinez@example.com" }, balance: 275.80, lastTxDate: "May 26, 2027", lastTxTime: "10:15 AM" },
    { id: "W-1006", client: { name: "Felix Garcia", email: "felix.garcia@example.com" }, balance: 130.00, lastTxDate: "May 27, 2027", lastTxTime: "02:00 PM" },
    { id: "W-1007", client: { name: "Hannah Kim", email: "hannah.kim@example.com" }, balance: 400.00, lastTxDate: "May 28, 2027", lastTxTime: "12:00 PM" },
    { id: "W-1008", client: { name: "Isaac Lee", email: "isaac.lee@example.com" }, balance: 50.25, lastTxDate: "May 29, 2027", lastTxTime: "03:15 PM" },
    { id: "W-1009", client: { name: "Jasmine Miller", email: "jasmine.miller@example.com" }, balance: 220.00, lastTxDate: "May 30, 2027", lastTxTime: "09:00 AM" }
  ]);

  // Mock Database - Wallet Credit Queue
  const [creditQueue, setCreditQueue] = useState([
    { id: "TRF-0051", client: { name: "Oliver Lee", email: "oliver@example.com" }, amount: 130.00, txn: "-", date: "June 1, 2027", status: "Processing" },
    { id: "TRF-0050", client: { name: "Charlotte Martin", email: "charlotte@example.com" }, amount: 88.60, txn: "-", date: "May 31, 2027", status: "Requested" },
    { id: "TRF-0053", client: { name: "James Harris", email: "james@example.com" }, amount: 210.90, txn: "-", date: "June 3, 2027", status: "Requested" },
    { id: "TRF-0052", client: { name: "Amelia Young", email: "amelia@example.com" }, amount: 160.70, txn: "TXN-0018945687476", date: "June 2, 2027", status: "Transferred" },
    { id: "TRF-0047", client: { name: "Ava Johnson", email: "ava@example.com" }, amount: 95.00, txn: "-", date: "May 28, 2027", status: "Requested" },
    { id: "TRF-0054", client: { name: "Mia Wilson", email: "mia@example.com" }, amount: 125.45, txn: "TXN-0018945687478", date: "June 4, 2027", status: "Error" },
    { id: "TRF-0049", client: { name: "Mason Wong", email: "mason@example.com" }, amount: 175.40, txn: "-", date: "May 30, 2027", status: "Requested" },
    { id: "TRF-0048", client: { name: "Isabella Brown", email: "isabella@example.com" }, amount: 120.85, txn: "-", date: "May 29, 2027", status: "Rejected" },
    { id: "TRF-0046", client: { name: "Noah Smith", email: "noah@example.com" }, amount: 180.50, txn: "TXN-0018945687470", date: "May 27, 2027", status: "Transferred" },
    { id: "TRF-0045", client: { name: "Elena Garcia", email: "elena@example.com" }, amount: 300.75, txn: "-", date: "May 26, 2027", status: "Requested" }
  ]);

  // Mock Database - Transfer Queue
  const [transferQueue, setTransferQueue] = useState([
    { id: "TRF-0051", provider: { name: "Oliver Lee", email: "oliver@example.com" }, amount: 130.00, txn: "-", date: "June 1, 2027", status: "Processing" },
    { id: "TRF-0050", provider: { name: "Charlotte Martin", email: "charlotte@example.com" }, amount: 88.60, txn: "-", date: "May 31, 2027", status: "Requested" },
    { id: "TRF-0053", provider: { name: "James Harris", email: "james@example.com" }, amount: 210.90, txn: "-", date: "June 3, 2027", status: "Requested" },
    { id: "TRF-0052", provider: { name: "Amelia Young", email: "amelia@example.com" }, amount: 160.70, txn: "TXN-0018945687476", date: "June 2, 2027", status: "Transferred" },
    { id: "TRF-0047", provider: { name: "Ava Johnson", email: "ava@example.com" }, amount: 95.00, txn: "-", date: "May 28, 2027", status: "Requested" },
    { id: "TRF-0054", provider: { name: "Mia Wilson", email: "mia@example.com" }, amount: 125.45, txn: "TXN-0018945687478", date: "June 4, 2027", status: "Error" },
    { id: "TRF-0049", provider: { name: "Mason Wong", email: "mason@example.com" }, amount: 175.40, txn: "-", date: "May 30, 2027", status: "Requested" },
    { id: "TRF-0048", provider: { name: "Isabella Brown", email: "isabella@example.com" }, amount: 120.85, txn: "-", date: "May 29, 2027", status: "Rejected" },
    { id: "TRF-0046", provider: { name: "Noah Smith", email: "noah@example.com" }, amount: 180.50, txn: "TXN-0018945687470", date: "May 27, 2027", status: "Transferred" },
    { id: "TRF-0045", provider: { name: "Elena Garcia", email: "elena@example.com" }, amount: 300.75, txn: "-", date: "May 26, 2027", status: "Requested" }
  ]);

  // Mock Wallet History details (Slide 8)
  const walletHistory = [
    { date: "Jun 24, 2027, 09:00", description: "Provider cancellation refund", type: "Credit", amount: 90.25, txn: "TXN-0018945687", running: 247.50 },
    { date: "Jul 12, 2027, 14:30", description: "Booking payment", type: "Debit", amount: 50.00, txn: "TXN-0018945687", running: 197.50 },
    { date: "Aug 05, 2027, 11:15", description: "Admin wallet credit", type: "Credit", amount: 75.00, txn: "TXN-0018945687", running: 122.50 },
    { date: "Sep 09, 2027, 15:45", description: "Booking payment", type: "Debit", amount: 40.00, txn: "TXN-0018945687", running: 82.50 },
    { date: "Oct 20, 2027, 08:00", description: "Tip returned", type: "Credit", amount: 20.50, txn: "TXN-0018945687", running: 62.00 }
  ];

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

  // Trigger balance adjustment confirmation
  const handleAdjustSubmit = ({ walletId, amount, type, reason }) => {
    // Update wallet
    const updated = wallets.map(w => {
      if (w.id === walletId) {
        const nextBalance = type === "Add Credit" ? w.balance + amount : w.balance - amount;
        return {
          ...w,
          balance: nextBalance,
          lastTxDate: "June 24, 2027",
          lastTxTime: "12:00 PM"
        };
      }
      return w;
    });
    setWallets(updated);
    toast.success("Wallet balance adjusted successfully!");
    setActiveModal(null);
  };

  // Trigger transfer authorization
  const handleAuthorizeSubmit = ({ itemId, amount, reason }) => {
    // Set Queue status
    if (activeTab === "credit") {
      setCreditQueue(creditQueue.map(item => item.id === itemId ? { ...item, status: "Transferred" } : item));
    } else {
      setTransferQueue(transferQueue.map(item => item.id === itemId ? { ...item, status: "Transferred" } : item));
    }
    toast.success("Transfer authorized successfully!");
    setActiveModal(null);
  };

  // Trigger transfer rejection
  const handleRejectSubmit = ({ itemId, reason }) => {
    if (activeTab === "credit") {
      setCreditQueue(creditQueue.map(item => item.id === itemId ? { ...item, status: "Rejected" } : item));
    } else {
      setTransferQueue(transferQueue.map(item => item.id === itemId ? { ...item, status: "Rejected" } : item));
    }
    toast.success("Transfer request rejected.");
    setActiveModal(null);
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
