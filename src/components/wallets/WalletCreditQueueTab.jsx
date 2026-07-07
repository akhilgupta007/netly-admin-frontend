"use client";

import React, { useState } from "react";
import { Search, ChevronDown, Copy, MoreVertical, Zap, X } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";

export default function WalletCreditQueueTab({
  creditQueue,
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

  // Pagination config
  const paginated = creditQueue.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white rounded-3xl border border-secondary-bg hover:shadow-xs relative">
      {/* Filters controls bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white rounded-t-3xl border-b border-secondary-bg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name, email or Request ID..."
            value={searchTerm}
            onChange={(e) => { onSearchChange(e.target.value); setCurrentPage(1); }}
            className="max-w-md w-full border border-border-main text-xs rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => { onStatusChange(e.target.value); setCurrentPage(1); }}
              className="border border-border-main text-xs rounded-full px-4 py-2.5 focus:outline-none appearance-none text-text-primary cursor-pointer"
            >
              <option value="All">Status</option>
              <option value="Requested">Requested</option>
              <option value="Processing">Processing</option>
              <option value="Transferred">Transferred</option>
              <option value="Error">Error</option>
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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-secondary-bg text-sm tracking-tight">
          <thead className="bg-page-bg text-text-muted uppercase text-left text-[10px] font-bold">
            <tr>
              <th className="px-6 py-4">Request ID</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Credit Amount</th>
              <th className="px-6 py-4">Linked Transaction</th>
              <th className="px-6 py-4">Date Requested</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-bg text-xs">
            {paginated.length > 0 ? (
              paginated.map((item) => {
                const statusColors = {
                  Requested: "bg-blue-50 text-blue-600 border-blue-200",
                  Processing: "bg-orange-50 text-orange-600 border-orange-200",
                  Transferred: "bg-emerald-50 text-emerald-600 border-emerald-200",
                  Error: "bg-red-50 text-red-600 border-red-200",
                  Rejected: "bg-neutral-50 text-neutral-600 border-neutral-200"
                };
                const statusClass = statusColors[item.status] || "bg-secondary-bg text-text-muted border-secondary-bg";

                return (
                  <tr key={item.id} className="hover:bg-page-bg/50 transition">
                    <td className="px-6 py-4 font-bold text-text-primary flex items-center gap-1.5">
                      {item.id}
                      <button onClick={() => copyToClipboard(item.id)} className="text-text-muted hover:text-text-primary transition cursor-pointer">
                        <Copy size={12} />
                      </button>
                    </td>
                    <td className="px-6 py-4 font-bold text-text-primary">{item.client.name}</td>
                    <td className="px-6 py-4 font-bold text-text-primary">${item.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-text-muted font-light">{item.txn}</td>
                    <td className="px-6 py-4 text-text-muted font-light">{item.date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${statusClass}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 relative">
                      {["Requested", "Error"].includes(item.status) && (
                        <>
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                            className="p-1 text-text-muted hover:text-text-primary rounded transition cursor-pointer"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openDropdownId === item.id && (
                            <div className="absolute right-6 top-10 w-32 bg-white border border-secondary-bg rounded-xl shadow-lg z-10 py-1.5 animate-scale-up">
                              <button
                                onClick={() => {
                                  onAuthorize(item);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-page-bg text-xs text-text-primary font-medium flex items-center gap-2 cursor-pointer"
                              >
                                <Zap size={13} /> Authorize
                              </button>
                              <button
                                onClick={() => {
                                  onReject(item);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-page-bg text-xs text-red-500 font-medium flex items-center gap-2 cursor-pointer"
                              >
                                <X size={13} /> Reject
                              </button>
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
                  <div className="flex flex-col items-center justify-center space-y-3">
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
      <div className="flex items-center justify-between border-t border-secondary-bg px-4 py-3.5 bg-white rounded-b-3xl">
        <span className="text-[10px] text-text-muted font-medium">
          Showing {currentPage * itemsPerPage - itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, creditQueue.length)} of {creditQueue.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            className="w-7 h-7 flex items-center justify-center border border-secondary-bg rounded-lg hover:bg-page-bg transition disabled:opacity-50 text-[10px] font-bold"
          >
            &larr;
          </button>
          <button
            disabled={currentPage * itemsPerPage >= creditQueue.length}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="w-7 h-7 flex items-center justify-center border border-secondary-bg rounded-lg hover:bg-page-bg transition disabled:opacity-50 text-[10px] font-bold"
          >
            &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
