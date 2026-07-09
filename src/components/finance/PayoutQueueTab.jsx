"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronDown, Check, RotateCcw } from "lucide-react";
import { toast } from "react-toastify";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";

const initialPayouts = [
  { id: "1", provider: "Riya Gupta", bookingId: "TXN00192123456800", gross: 180.00, commission: 15.00, tip: 5.50, status: "Pending" },
  { id: "2", provider: "Chloe Davis", bookingId: "TXN00192123456799", gross: 80.00, commission: 8.50, tip: 4.50, status: "Completed" },
  { id: "3", provider: "Noah Brown", bookingId: "TXN00192123456798", gross: 150.00, commission: 15.50, tip: 7.00, status: "Processing" },
  { id: "4", provider: "Ravi Singh", bookingId: "TXN00192123456794", gross: 400.00, commission: 35.00, tip: 15.00, status: "Failed" },
  { id: "5", provider: "Zara Khan", bookingId: "TXN00192123456793", gross: 50.00, commission: 5.50, tip: 2.00, status: "Completed" },
  { id: "6", provider: "Nia Patel", bookingId: "TXN00192123456791", gross: 75.00, commission: 8.00, tip: 3.00, status: "Failed" },
  { id: "7", provider: "Sophie Wang", bookingId: "TXN00192123456795", gross: 120.00, commission: 13.00, tip: 6.00, status: "Completed" },
  { id: "8", provider: "Amara Osei", bookingId: "TXN00192123456789", gross: 125.00, commission: 14.25, tip: 10.00, status: "Pending" },
  { id: "9", provider: "Ethan Smith", bookingId: "TXN00192123456792", gross: 300.00, commission: 25.00, tip: 12.00, status: "Processing" },
  { id: "10", provider: "Leila Martinez", bookingId: "TXN00192123456797", gross: 90.00, commission: 9.50, tip: 4.00, status: "Failed" }
];

export default function PayoutQueueTab() {
  const [payouts, setPayouts] = useState(initialPayouts);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleProcessPayout = (id) => {
    toast.info("Initializing Stripe Connect payout transfer...");
    setTimeout(() => {
      const updated = payouts.map(p => {
        if (p.id === id) {
          return { ...p, status: "Completed" };
        }
        return p;
      });
      setPayouts(updated);
      toast.success("Payout processed and sent to provider account via Stripe Connect!");
    }, 800);
  };

  const handleRetryPayout = (id) => {
    toast.info("Retrying failed payout transfer...");
    setTimeout(() => {
      const updated = payouts.map(p => {
        if (p.id === id) {
          return { ...p, status: "Completed" };
        }
        return p;
      });
      setPayouts(updated);
      toast.success("Payout successfully re-sent and completed!");
    }, 800);
  };

  const filteredPayouts = useMemo(() => {
    return payouts.filter((item) => {
      const matchSearch = item.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.bookingId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === "All" || item.status === filterStatus;

      // Mock date range check (we can simulate date checking or pass true)
      return matchSearch && matchStatus;
    });
  }, [payouts, searchTerm, filterStatus, startDate, endDate]);

  const paginated = useMemo(() => {
    return filteredPayouts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredPayouts, currentPage]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return "text-emerald-500 bg-emerald-50";
      case "Pending":
        return "text-amber-500 bg-amber-50";
      case "Processing":
        return "text-blue-500 bg-blue-50";
      case "Failed":
        return "text-red-500 bg-red-50";
      default:
        return "text-text-muted bg-page-bg";
    }
  };

  return (
    <div className="animate-scale-up border border-secondary-bg rounded-3xl overflow-hidden bg-white shadow-2xs">
      {/* Filters row bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white border-b border-secondary-bg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-md w-full border border-border-main text-xs rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-border-main text-xs rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
            >
              <option value="All">Status</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Processing">Processing</option>
              <option value="Failed">Failed</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
          </div>

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

      {/* Payouts table */}
      {filteredPayouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white rounded-b-3xl">
          <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-text-primary">No Payout Records</h3>
            <p className="text-xs text-text-muted font-light">No provider payouts found matching criteria.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-bg text-xs text-text-primary">
            <thead className="bg-secondary-bg text-text-primary text-left text-xs font-semibold">
              <tr>
                <th className="px-4 py-3 font-semibold">Provider</th>
                <th className="px-4 py-3 font-semibold">Booking ID</th>
                <th className="px-4 py-3 font-semibold">Gross Payout</th>
                <th className="px-4 py-3 font-semibold">Commission</th>
                <th className="px-4 py-3 font-semibold">Tip</th>
                <th className="px-4 py-3 font-semibold">Net Payout</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right pr-6 font-semibold w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-bg text-xs">
              {paginated.map((item) => {
                // Compute net payout: if completed, display Gross - Commission + Tip, else show $0.00 as per figma
                const netValue = item.status === "Completed" ? (item.gross - item.commission + item.tip) : 0.00;
                return (
                  <tr key={item.id} className="hover:bg-page-bg/50 transition">
                    <td className="px-4 py-3.5 font-medium">{item.provider}</td>
                    <td className="px-4 py-3.5 text-text-muted">{item.bookingId}</td>
                    <td className="px-4 py-3.5">${item.gross.toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-red-500 font-medium">${item.commission.toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-amber-500 font-medium">${item.tip.toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-emerald-500 font-medium">${netValue.toFixed(2)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadge(item.status)}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right pr-6">
                      {item.status === "Pending" && (
                        <button
                          onClick={() => handleProcessPayout(item.id)}
                          className="border border-primary-bg-muted hover:border-primary-bg text-primary-bg font-semibold text-[10px] px-3.5 py-1 rounded-full transition cursor-pointer text-center"
                        >
                          Process
                        </button>
                      )}
                      {item.status === "Failed" && (
                        <button
                          onClick={() => handleRetryPayout(item.id)}
                          className="border border-red-200 text-red-500 hover:bg-red-50 font-semibold text-[10px] px-3.5 py-1 rounded-full transition cursor-pointer text-center"
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {filteredPayouts.length > 0 && (
        <Pagination
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={filteredPayouts.length}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
