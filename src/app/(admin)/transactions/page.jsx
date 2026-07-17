"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { toast } from "react-toastify";
import Pagination from "@/components/ui/Pagination";
import {
  Search,
  ChevronDown,
  Copy
} from "lucide-react";

// Helper to copy text to clipboard
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  toast.success(`Copied Transaction ID to clipboard!`, {
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

export default function TransactionsPage() {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Filters & Page state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const router = useRouter();

  // Categories list
  const categories = [
    "All",
    "Deep Cleaning",
    "Window Washing",
    "Organizing",
    "Car Detailing",
    "Lawn Care",
    "Pressure Washing",
    "Window Installation",
    "Fence Installation",
    "Pest Control",
    "Gutter Cleaning"
  ];

  // Status options array
  const statusOptions = [
    { value: "All", label: "Status" },
    { value: "Finalised", label: "Finalised" },
    { value: "Completed", label: "Completed" },
    { value: "In Progress", label: "In Progress" },
    { value: "Refund Requested", label: "Refund Requested" },
    { value: "Dispute", label: "Dispute" },
    { value: "Wallet Credited — Client Fault", label: "Wallet Credited" },
    { value: "Pending Provider Acceptance", label: "Pending Provider Accept" },
    { value: "Quote Pending", label: "Quote Pending" },
    { value: "Confirmed", label: "Confirmed" },
    { value: "Cancelled Pending Admin Review", label: "Cancelled Pending" },
    { value: "Pending Payment", label: "Pending Payment" }
  ];

  // 16 Mock Transactions matching exact layout from mockup (Screenshot 4)
  const defaultTransactions = [
    {
      id: "TXN0019142136974",
      status: "Finalised",
      client: { name: "Amara Osei", email: "amara@example.com" },
      provider: { name: "Fatima Diallo", email: "fatima.d@corp.com" },
      category: "Deep Cleaning",
      date: "May 22, 2027",
      time: "03:20 PM",
      serviceAmount: 125.00,
      pricingType: "Hourly",
      tip: 10.00,
      description: "3-bedroom flat, kitchen priority.",
      originalHours: "4 hours",
      requestedHours: "6 hours",
      originalAmount: 125.00,
      revisedAmount: 187.50,
      adjustmentNumber: "1 of 2",
      adjustmentSubmittedAt: "May 22, 2027 02:00 PM",
      history: [
        { status: "Request Submitted", date: "June 10, 2026 • 09:45 AM" },
        { status: "Provider Accepted", date: "June 10, 2026 • 09:45 AM", note: "Provider confirmed availability and accepted at listed rate." }
      ]
    },
    {
      id: "TXN0019142136975",
      status: "Completed",
      client: { name: "Liam Chen", email: "liam@example.com" },
      provider: { name: "Aisha Patel", email: "aisha@example.com" },
      category: "Window Washing",
      date: "May 22, 2027",
      time: "04:00 PM",
      serviceAmount: 80.00,
      pricingType: "Hourly",
      tip: 0,
      description: "Deep exterior window frames cleanup.",
      completedAt: "May 22, 2027 05:30 PM",
      payoutStatus: "Paid",
      history: [
        { status: "Request Submitted", date: "June 10, 2026 • 09:45 AM" },
        { status: "Service Completed", date: "June 10, 2026 • 09:45 AM" }
      ]
    },
    {
      id: "TXN0019142136976",
      status: "In Progress",
      client: { name: "Sofia Reyes", email: "sofia@example.com" },
      provider: { name: "Mark Thompson", email: "mark@example.com" },
      category: "Organizing",
      date: "May 23, 2027",
      time: "09:30 AM",
      serviceAmount: 200.00,
      pricingType: "Hourly",
      tip: 0,
      description: "Basement cleanup and box classifications.",
      serviceStartedAt: "May 23, 2027 09:45 AM",
      history: [
        { status: "Request Submitted", date: "June 10, 2026 • 09:45 AM" },
        { status: "Service Started", date: "June 10, 2026 • 09:45 AM" }
      ]
    },
    {
      id: "TXN0019142136977",
      status: "Refund Requested",
      client: { name: "Oliver Smith", email: "oliver@example.com" },
      provider: { name: "Ella Johnson", email: "ella@example.com" },
      category: "Car Detailing",
      date: "May 23, 2027",
      time: "11:15 AM",
      serviceAmount: 150.00,
      pricingType: "Hourly",
      tip: 8.00,
      description: "Full interior detail client requested refund.",
      refundRequestedAt: "May 23, 2027 02:00 PM",
      walletBalanceAtRequest: 165.50,
      amountRequested: 165.50,
      cancelledBy: "Provider",
      history: [
        { status: "Request Submitted", date: "June 10, 2026 • 09:45 AM" },
        { status: "Refund Requested by Client", date: "June 10, 2026 • 09:45 AM" }
      ]
    },
    {
      id: "TXN0019142136978",
      status: "Dispute",
      client: { name: "Mia Wong", email: "mia@example.com" },
      provider: { name: "James Carter", email: "james@example.com" },
      category: "Lawn Care",
      date: "May 24, 2027",
      time: "01:00 PM",
      serviceAmount: 90.00,
      pricingType: "Hourly",
      tip: 3.00,
      description: "Grass trim dispute raised.",
      disputeId: "DISP-8802",
      disputeOpenedAt: "May 24, 2027 02:30 PM",
      disputeStatus: "Open",
      disputeRaisedBy: "Client",
      history: [
        { status: "Request Submitted", date: "June 10, 2026 • 09:45 AM" },
        { status: "Dispute Opened by Client", date: "June 10, 2026 • 09:45 AM" }
      ]
    },
    {
      id: "TXN0019142136979",
      status: "Wallet Credited — Client Fault",
      client: { name: "Noah Brown", email: "noah@example.com" },
      provider: { name: "Isabella Davis", email: "isabella@example.com" },
      category: "Pressure Washing",
      date: "May 24, 2027",
      time: "02:45 PM",
      serviceAmount: 110.00,
      pricingType: "Hourly",
      tip: 0,
      description: "Driveway clean up. Client cancelled layout.",
      cancelledBy: "Client",
      retainedFee: 5.50,
      creditedAmount: 104.50,
      walletCreditedAt: "May 24, 2027 03:00 PM",
      approvedBy: "Sophia (Admin)",
      refundRequestedByClient: true,
      history: [
        { status: "Request Submitted", date: "June 10, 2026 • 09:45 AM" },
        { status: "Wallet Credit Approved", date: "June 10, 2026 • 09:45 AM" }
      ]
    },
    {
      id: "TXN0019142136980",
      status: "Pending Provider Acceptance",
      client: { name: "James Smith", email: "james@example.com" },
      provider: { name: "Emily Clark", email: "emily@example.com" },
      category: "Window Installation",
      date: "June 1, 2027",
      time: "3:30 PM",
      serviceAmount: 500.00,
      pricingType: "Hourly",
      tip: 0,
      description: "Window glass fitting.",
      requestedDate: "June 2, 2027",
      expiresAt: "Expires in 23h 10m",
      history: [
        { status: "Request Submitted", date: "June 10, 2026 • 09:45 AM" }
      ]
    },
    {
      id: "TXN0019142136981",
      status: "Quote Pending",
      client: { name: "Sophia Turner", email: "sophia@example.com" },
      provider: { name: "Michael Brown", email: "michael@example.com" },
      category: "Fence Installation",
      date: "June 5, 2027",
      time: "10:15 AM",
      serviceAmount: 800.00,
      pricingType: "Quote",
      tip: 0,
      description: "Open-plan office, 200 sqm, 5 days/week.",
      quotedPrice: 340.00,
      quotedDuration: "4 hours/visit",
      quoteSubmittedAt: "Jun 24, 2027 09:00 AM",
      quoteExpiresAt: "Jun 26, 2027 09:00 AM",
      history: [
        { status: "Request Submitted", date: "June 10, 2026 • 09:45 AM" },
        { status: "Quote Submitted by Provider", date: "June 10, 2026 • 09:45 AM" }
      ]
    },
    {
      id: "TXN0019142136982",
      status: "Confirmed",
      client: { name: "Ava Miller", email: "ava@example.com" },
      provider: { name: "Lucas Wilson", email: "lucas@example.com" },
      category: "Pest Control",
      date: "May 25, 2027",
      time: "08:00 AM",
      serviceAmount: 130.00,
      pricingType: "Hourly",
      tip: 9.00,
      description: "Garden pest inspection.",
      paymentCapturedAt: "May 25, 2027 08:30 AM",
      history: [
        { status: "Request Submitted", date: "June 10, 2026 • 09:45 AM" },
        { status: "Payment Confirmed", date: "June 10, 2026 • 09:45 AM" }
      ]
    },
    {
      id: "TXN0019142136983",
      status: "Cancelled Pending Admin Review",
      client: { name: "Ethan Martinez", email: "ethan@example.com" },
      provider: { name: "Chloe Lopez", email: "chloe@example.com" },
      category: "Gutter Cleaning",
      date: "May 25, 2027",
      time: "10:30 AM",
      serviceAmount: 75.00,
      pricingType: "Hourly",
      tip: 4.00,
      description: "Roof gutter leaves clean. Provider cancelled.",
      cancelledBy: "Provider",
      cancelledAt: "May 25, 2027 10:00 AM",
      cancellationReason: "Heavy rain storm forecasts.",
      creditAmount: 78.75, // service amount + fee credit
      history: [
        { status: "Request Submitted", date: "June 10, 2026 • 09:45 AM" },
        { status: "Cancelled by Provider", date: "June 10, 2026 • 09:45 AM" }
      ]
    },
    {
      id: "TXN0019142136984",
      status: "Quote Declined",
      client: { name: "Fatima Diallo", email: "fatima.d@corp.com" },
      provider: { name: "Meek Nowise", email: "emeka@cleanpro.ng" },
      category: "Office Daily",
      date: "Jun 24, 2027",
      time: "08:30 AM",
      serviceAmount: 340.00,
      pricingType: "Quote",
      tip: 0,
      description: "Open-plan office space daily cleanup.",
      quotedPrice: 340.00,
      quotedDuration: "4 hours/visit",
      rejectionReason: "price too high.",
      history: [
        { status: "Request Submitted", date: "June 10, 2026 • 09:45 AM" },
        { status: "Quote Submitted by Provider", date: "June 10, 2026 • 09:45 AM" },
        { status: "Quote Declined by Client", date: "June 11, 2026 • 09:45 AM" }
      ]
    },
    {
      id: "TXN0019142136985",
      status: "Pending Payment",
      client: { name: "Fatima Diallo", email: "fatima.d@corp.com" },
      provider: { name: "Meek Nowise", email: "emeka@cleanpro.ng" },
      category: "Office Daily",
      date: "Jun 24, 2027",
      time: "08:30 AM",
      serviceAmount: 85.00,
      pricingType: "Hourly",
      tip: 0,
      description: "3-bedroom flat, kitchen priority.",
      providerAcceptedAt: "Jun 10, 2026 • 09:45 AM",
      paymentExpiry: "Expires in 23h 30m",
      history: [
        { status: "Request Submitted", date: "June 10, 2026 • 09:45 AM" },
        { status: "Provider Accepted", date: "June 10, 2026 • 09:45 AM", note: "Provider confirmed availability and accepted at listed rate." }
      ]
    }
  ];

  const [transactions, setTransactions] = useState([]);

  // Initialize and synchronize transactions with localStorage
  useEffect(() => {
    const stored = localStorage.getItem("netly_transactions");
    if (stored) {
      try {
        setTransactions(JSON.parse(stored));
      } catch (err) {
        console.error(err);
        setTransactions(defaultTransactions);
      }
    } else {
      setTransactions(defaultTransactions);
      localStorage.setItem("netly_transactions", JSON.stringify(defaultTransactions));
    }

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const statusParam = params.get("status");
      const startParam = params.get("startDate");
      const endParam = params.get("endDate");
      
      if (statusParam) {
        const matchedOpt = statusOptions.find(opt => opt.value.toLowerCase() === statusParam.toLowerCase());
        if (matchedOpt) {
          setFilterStatus(matchedOpt.value);
        } else {
          setFilterStatus(statusParam);
        }
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

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      localStorage.setItem("netly_transactions", JSON.stringify(transactions));
    }
  }, [transactions]);

  // Status-to-class color styling lookup mapping
  const statusColors = {
    "Pending Payment": "text-amber-600 bg-amber-50",
    "Hour Adjustment Pending": "text-amber-600 bg-amber-50",
    "Confirmed": "text-blue-600 bg-blue-50",
    "In Progress": "text-blue-600 bg-blue-50",
    "Completed": "text-emerald-600 bg-emerald-50",
    "Finalised": "text-emerald-600 bg-emerald-50",
    "Cancelled Pending Admin Review": "text-gray-500 bg-gray-100",
    "Wallet Credited — Client Fault": "text-gray-500 bg-gray-100",
    "Wallet Credited — Provider Fault": "text-gray-500 bg-gray-100",
    "Dispute": "text-rose-600 bg-rose-50",
    "Refund Requested": "text-emerald-600 bg-emerald-50",
    "Pending Provider Acceptance": "text-amber-600 bg-amber-50",
    "Quote Pending": "text-amber-600 bg-amber-50",
    "Quote Declined": "text-gray-500 bg-gray-100",
    "Rejected / Expired": "text-gray-500 bg-gray-100"
  };

  // Status dot color lookup
  const statusDotColors = {
    "Pending Payment": "bg-amber-500",
    "Hour Adjustment Pending": "bg-amber-500",
    "Confirmed": "bg-blue-500",
    "In Progress": "bg-blue-500",
    "Completed": "bg-emerald-500",
    "Finalised": "bg-emerald-500",
    "Cancelled Pending Admin Review": "bg-gray-400",
    "Wallet Credited — Client Fault": "bg-gray-400",
    "Wallet Credited — Provider Fault": "bg-gray-400",
    "Dispute": "bg-rose-500",
    "Refund Requested": "bg-emerald-500",
    "Pending Provider Acceptance": "bg-amber-500",
    "Quote Pending": "bg-amber-500",
    "Quote Declined": "bg-gray-400",
    "Rejected / Expired": "bg-gray-400"
  };

  // Status subtitle text color lookup
  const statusSubtitleColors = {
    "Pending Payment": "text-amber-500",
    "Hour Adjustment Pending": "text-amber-500",
    "Confirmed": "text-blue-500",
    "In Progress": "text-blue-500",
    "Completed": "text-emerald-500",
    "Finalised": "text-emerald-500",
    "Cancelled Pending Admin Review": "text-gray-400",
    "Wallet Credited — Client Fault": "text-gray-400",
    "Wallet Credited — Provider Fault": "text-gray-400",
    "Dispute": "text-rose-500",
    "Refund Requested": "text-emerald-500",
    "Pending Provider Acceptance": "text-amber-500",
    "Quote Pending": "text-amber-500",
    "Quote Declined": "text-gray-400",
    "Rejected / Expired": "text-gray-400"
  };

  // Helper to get status subtitle description
  const getStatusSubtitle = (tx) => {
    switch (tx.status) {
      case "Pending Payment": return "Payment Pending";
      case "Confirmed": return "Payment Received";
      case "In Progress": return "Started by Provider";
      case "Completed": return "Waiting for Client Approval";
      case "Finalised": return "Booking Closed";
      case "Cancelled Pending Admin Review":
        return tx.cancelledBy === "Client" ? "Cancelled by Client" : "Cancelled by Provider";
      case "Wallet Credited — Client Fault": return "Cancelled by Client";
      case "Wallet Credited — Provider Fault": return "Cancelled by Provider";
      case "Dispute":
        return tx.disputeRaisedBy === "Provider" ? "Raised by Provider" : "Raised by Client";
      case "Refund Requested": return "Refund Completed";
      case "Pending Provider Acceptance": return "Awaiting Provider";
      case "Quote Pending": return "Quote Awaited";
      case "Quote Declined": return "Declined by Client";
      case "Hour Adjustment Pending": return "Adjustment Pending";
      case "Rejected / Expired": return "Expired";
      default: return "";
    }
  };

  // Display label for status badge
  const getStatusLabel = (status) => {
    switch (status) {
      case "Wallet Credited — Client Fault": return "Cancelled";
      case "Wallet Credited — Provider Fault": return "Cancelled";
      case "Pending Provider Acceptance": return "Pending";
      case "Cancelled Pending Admin Review": return "Cancelled";
      case "Pending Payment": return "Pending";
      case "Refund Requested": return "Refunded";
      default: return status;
    }
  };

  // Static pricing multipliers
  const getFee = (amount) => amount * 0.05;
  const getCommission = (amount) => amount * 0.15;
  const getTotalCharged = (amount, tip = 0) => amount + getFee(amount) + tip;

  // Search filter
  const filteredTxs = useMemo(() => {
    return transactions.filter((tx) => {
      const searchStr = searchTerm.toLowerCase();
      const matchSearch = 
        tx.client.name.toLowerCase().includes(searchStr) ||
        tx.client.email.toLowerCase().includes(searchStr) ||
        tx.provider.name.toLowerCase().includes(searchStr) ||
        tx.provider.email.toLowerCase().includes(searchStr) ||
        tx.id.toLowerCase().includes(searchStr);

      let matchStatus = false;
      if (filterStatus === "All") {
        matchStatus = true;
      } else if (filterStatus.includes(",")) {
        const allowed = filterStatus.split(",").map(s => s.trim().toLowerCase());
        const txStatusClean = tx.status.toLowerCase();
        matchStatus = allowed.includes(txStatusClean) || 
                      (allowed.includes("finalised") && (txStatusClean === "completed" || txStatusClean.startsWith("wallet credited"))) ||
                      (allowed.includes("cancelled") && txStatusClean.includes("cancel"));
      } else {
        const txStatusClean = tx.status.toLowerCase();
        const filterStatusClean = filterStatus.toLowerCase();
        matchStatus = txStatusClean === filterStatusClean || 
                      (filterStatusClean === "finalised" && (txStatusClean === "completed" || txStatusClean.startsWith("wallet credited"))) ||
                      (filterStatusClean === "cancelled" && txStatusClean.includes("cancel"));
      }
      const matchCategory = filterCategory === "All" || tx.category === filterCategory;

      let matchDate = true;
      if (startDate || endDate) {
        const txDate = parseTxDate(tx.date);
        if (startDate && txDate < startDate) {
          matchDate = false;
        }
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (txDate > endOfDay) {
            matchDate = false;
          }
        }
      }

      return matchSearch && matchStatus && matchCategory && matchDate;
    });
  }, [transactions, searchTerm, filterStatus, filterCategory, startDate, endDate]);

  // Pagination config
  const itemsPerPage = 9;
  const totalPages = Math.ceil(filteredTxs.length / itemsPerPage);
  const paginatedTxs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTxs.slice(start, start + itemsPerPage);
  }, [filteredTxs, currentPage]);



  return (
      // Main Transactions List Table Card
      <div className="bg-white rounded-3xl border border-secondary-bg hover:shadow-xs relative overflow-visible">
        {/* Filter and Search controls bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white rounded-t-3xl">
          {/* Single search bar input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by client/provider's name or email..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="max-w-md w-full border border-border-main text-xs rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
            />
          </div>

          {/* Dropdowns filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="border border-border-main text-xs rounded-full px-4 py-2.5 focus:outline-none appearance-none text-text-muted cursor-pointer"
              >
                {filterStatus.includes(",") && (
                  <option value={filterStatus}>
                    {filterStatus.split(",").map(s => s.trim().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")).join(" + ")}
                  </option>
                )}
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-5 w-5 text-text-muted pointer-events-none" />
            </div>

            {/* Category filter */}
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                className="border border-border-main text-xs rounded-full px-4 py-2.5 focus:outline-none appearance-none text-text-muted cursor-pointer"
              >
                <option value="All">Category</option>
                {categories.slice(1).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-5 w-5 text-text-muted pointer-events-none" />
            </div>

            {/* Date range picker selector with Custom DateRangePicker Component */}
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-b-3xl">
          <table className="min-w-full divide-y divide-secondary-bg text-sm tracking-tight">
            <thead className="bg-secondary-bg text-text-primary text-left">
              <tr>
                <th className="p-4 font-semibold">Transaction ID</th>
                <th className="p-4 font-semibold">Booking Date</th>
                <th className="p-4 font-semibold">Client</th>
                <th className="p-4 font-semibold">Provider</th>
                <th className="p-4 font-semibold">Service</th>
                <th className="p-4 font-semibold">Total Paid</th>
                <th className="p-4 font-semibold">Provider Payout</th>
                <th className="p-4 font-semibold">Netly Commission</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-bg bg-white text-text-primary">
              {paginatedTxs.length > 0 ? (
                paginatedTxs.map((tx) => {
                  const colorBadge = statusColors[tx.status] || "bg-secondary-bg text-text-muted";

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-secondary-bg/30 transition-colors duration-150 text-sm"
                    >
                      <td className="px-4 py-3 text-text-primary">
                        <div className="flex items-center gap-1 font-medium">
                          <span>{tx.id.slice(0, 10)}...</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(tx.id); }}
                            className="p-0.5 text-text-muted hover:text-text-primary rounded"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div>{tx.date}</div>
                        <div className="text-[10px] text-text-muted">{tx.time}</div>
                      </td>
                      <td className="px-4 py-3">{tx.client.name}</td>
                      <td className="px-4 py-3">{tx.provider.name}</td>
                      <td className="px-4 py-3">{tx.category}</td>
                      <td className="px-4 py-3">${tx.serviceAmount.toFixed(2)}</td>
                      <td className="px-4 py-3">${getFee(tx.serviceAmount).toFixed(2)}</td>
                      <td className="px-4 py-3">${getCommission(tx.serviceAmount).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit ${colorBadge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusDotColors[tx.status] || "bg-gray-400"}`} />
                            {getStatusLabel(tx.status)}
                          </span>
                          <span className={`text-[10px] font-light pl-0.5 ${statusSubtitleColors[tx.status] || "text-text-muted"}`}>
                            {getStatusSubtitle(tx)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/transactions/${tx.id}`); }}
                          className="px-3 py-1 border border-primary-bg hover:bg-page-bg text-sm font-medium rounded-lg transition text-primary-bg cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : isLoading ? (
                <tr>
                  <td colSpan="11" className="px-4 py-12 text-center text-text-muted font-light">
                    <div className="flex flex-col items-center justify-center space-y-3 min-h-80">
                      <span className="text-xs text-text-muted animate-pulse">Loading Transactions Data...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan="11" className="px-4 py-12 text-center text-text-muted font-light">
                    <div className="flex flex-col items-center justify-center space-y-3 min-h-80">
                      <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75" />
                      <span>No transactions found matching search filter criteria.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer pagination navigation row matching design layout */}
        {totalPages > 0 && (
          <Pagination
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredTxs.length}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
  );
}
