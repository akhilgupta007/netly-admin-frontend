"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { useTransactions } from "@/hooks/useTransactions";
import { toast } from "react-toastify";
import Pagination from "@/components/ui/Pagination";
import {
  Search,
  ChevronDown,
  Copy
} from "lucide-react";
import { RefreshingBar, TableSkeleton } from "@/components/ui/Skeleton";

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
  const { transactions, isLoading, isFetching, isError, error } = useTransactions();

  // Read filters out of the URL so dashboard cards can deep-link in.
  useEffect(() => {
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
    <div className="bg-white rounded-3xl border border-border-main hover:shadow-xs relative overflow-visible">
      <RefreshingBar active={isFetching && !isLoading} />
      {/* Filter and Search controls bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-4 bg-white rounded-t-3xl">
        {/* Single search bar input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by client/provider's name or email..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="max-w-md w-full border border-border-main md:text-xs text-[10px] rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
          />
        </div>

        {/* Dropdowns filters */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Status filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="border border-border-main md:text-xs text-[10px] rounded-full px-4 py-2.5 focus:outline-none appearance-none text-text-muted cursor-pointer"
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
              className="border border-border-main md:text-xs text-[10px] rounded-full px-4 py-2.5 focus:outline-none appearance-none text-text-muted cursor-pointer"
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
        <table className="min-w-full divide-y divide-secondary-bg md:text-sm text-xs tracking-tight">
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
                    className="hover:bg-secondary-bg/30 transition-colors duration-150 md:text-sm text-xs"
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
                    <td className="px-4 py-3 md:text-xs text-[10px]">
                      <div>{tx.date}</div>
                      <div className="md:text-[10px] text-[7px] text-text-muted">{tx.time}</div>
                    </td>
                    <td className="px-4 py-3">{tx.client.name}</td>
                    <td className="px-4 py-3">{tx.provider.name}</td>
                    <td className="px-4 py-3">{tx.category}</td>
                    <td className="px-4 py-3">${tx.serviceAmount.toFixed(2)}</td>
                    <td className="px-4 py-3">${getFee(tx.serviceAmount).toFixed(2)}</td>
                    <td className="px-4 py-3">${getCommission(tx.serviceAmount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full md:text-xs text-[10px] font-semibold w-fit ${colorBadge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDotColors[tx.status] || "bg-gray-400"}`} />
                          {getStatusLabel(tx.status)}
                        </span>
                        <span className={`md:text-[10px] text-[7px] font-light pl-0.5 ${statusSubtitleColors[tx.status] || "text-text-muted"}`}>
                          {getStatusSubtitle(tx)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/transactions/${tx.id}`); }}
                        className="px-3 py-1 border border-primary-bg hover:bg-page-bg md:text-sm text-xs font-medium rounded-lg transition text-primary-bg cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : isLoading ? (
              <TableSkeleton columns={11} rows={6} />
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
