"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Copy, MoreVertical, ShieldCheck, X } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";

export default function WalletCreditQueueTab({
  creditQueue,
  isLoading,
  isError,
  error,
  startDate,
  endDate,
  searchTerm,
  filterStatus,
  onSearchChange,
  onStatusChange,
  onDateChange,
  onAuthorize,
  onReject,
  copyToClipboard,
  currentPage,
  setCurrentPage,
  itemsPerPage
}) {
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest("[data-dropdown-container]")) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Pagination config
  const paginated = creditQueue.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white rounded-3xl border border-border-main hover:shadow-xs relative overflow-visible">
      {/* Filters controls bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white rounded-t-3xl border-b border-border-main">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name, email or Request ID..."
            value={searchTerm}
            onChange={(e) => { onSearchChange(e.target.value); setCurrentPage(1); }}
            className="max-w-md w-full border border-border-main md:text-xs text-[10px] rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Status filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => { onStatusChange(e.target.value); setCurrentPage(1); }}
              className="border border-border-main md:text-xs text-[10px] rounded-full px-4 py-2.5 focus:outline-none appearance-none text-text-muted cursor-pointer"
            >
              <option value="All">Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-5 w-5 text-text-muted pointer-events-none" />
          </div>

          {/* Date Range calendar picker */}
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              onDateChange(start, end);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Table contents */}
      <div className="overflow-x-auto rounded-b-3xl">
        <table className="min-w-full divide-y divide-secondary-bg md:text-sm text-xs tracking-tight">
          <thead className="bg-secondary-bg text-text-primary text-left md:text-sm text-xs">
            <tr>
              <th className="px-4 py-3 font-semibold">Request ID</th>
              <th className="px-4 py-3 font-semibold">Client</th>
              <th className="px-4 py-3 font-semibold">Credit Amount</th>
              <th className="px-4 py-3 font-semibold">Linked Transaction</th>
              <th className="px-4 py-3 font-semibold">Date Requested</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold w-10"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-bg md:text-sm text-xs">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-text-muted font-light">
                  <div className="flex flex-col items-center justify-center space-y-3 min-h-80">
                    <span className="text-xs text-text-muted animate-pulse font-light">Loading Credit Queue Data...</span>
                  </div>
                </td>
              </tr>
            ) : paginated.length > 0 ? (
              paginated.map((item, idx) => {
                const statusColors = {
                  Requested: "bg-blue-50 text-blue-600",
                  Processing: "bg-orange-50 text-orange-600",
                  Transferred: "bg-emerald-50 text-emerald-600",
                  Error: "bg-red-50 text-red-600",
                  Rejected: "bg-neutral-50 text-neutral-600"
                };
                const statusClass = statusColors[item.status] || "bg-secondary-bg text-text-muted border-border-main";

                return (
                  <tr key={item.id} className="hover:bg-page-bg/50 transition">
                    <td className="px-4 py-3 text-text-primary flex items-center gap-3">
                      {item.id}
                      <button onClick={() => copyToClipboard(item.id)} className="text-text-muted hover:text-text-primary transition cursor-pointer">
                        <Copy size={14} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-text-primary">{item.client.name}</td>
                    <td className="px-4 py-3 text-text-primary">${item.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">{item.txn}</td>
                    <td className="px-4 py-3">{item.date}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full md:text-xs text-[10px] ${statusClass}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" data-dropdown-container>
                      {["Requested", "Error"].includes(item.status) && (
                        <>
                          <button
                            onClick={(e) => {
                              if (openDropdownId === item.id) {
                                setOpenDropdownId(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const isLastItem = idx === paginated.length - 1;
                                const top = isLastItem ? rect.top - 80 : rect.bottom + 4;
                                setDropdownPos({ top, left: rect.left - 100 });
                                setOpenDropdownId(item.id);
                              }
                            }}
                            className="p-1 text-text-primary rounded transition cursor-pointer"
                          >
                            <MoreVertical size={18} />
                          </button>
                          {openDropdownId === item.id && (
                            <div
                              className="fixed w-36 bg-white border border-border-main rounded-xl shadow-lg z-50 py-1 animate-scale-up"
                              style={{ top: dropdownPos.top, left: dropdownPos.left }}
                            >
                              {/* Only pending requests can be decided — the
                                  callable rejects anything already resolved. */}
                              {item.status === "Pending" ? (
                                <>
                                  <button
                                    onClick={() => {
                                      onAuthorize(item);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-page-bg text-xs text-text-primary font-medium flex items-center gap-2 cursor-pointer"
                                  >
                                    <ShieldCheck size={16} /> Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      onReject(item);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-page-bg text-xs text-red-500 font-medium flex items-center gap-2 cursor-pointer"
                                  >
                                    <X size={16} /> Reject
                                  </button>
                                </>
                              ) : (
                                <div className="px-4 py-2 text-[10px] text-text-muted font-light">
                                  Already {item.status.toLowerCase()}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-text-muted font-light">
                  <div className="flex flex-col items-center justify-center space-y-3 min-h-80">
                    <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75" />
                    <span>No requests found matching filter criteria.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Navigation Footer */}
      <Pagination
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalItems={creditQueue.length}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
