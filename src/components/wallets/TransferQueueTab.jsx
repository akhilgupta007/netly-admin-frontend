"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronDown, Copy, MoreVertical, Zap, X } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import { RefreshingBar, TableSkeleton } from "@/components/ui/Skeleton";

export default function TransferQueueTab({
  transferQueue,
  isLoading,
  isFetching,
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
  itemsPerPage,
  totalCount
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
  // Already the current page — the read layer paginates. Slicing again would
  // empty every page after the first.
  const paginated = transferQueue;

  return (
    <div className="bg-white rounded-3xl border border-border-main hover:shadow-xs relative overflow-visible">
      <RefreshingBar active={isFetching && !isLoading} />
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
              <option value="Transferred">Transferred</option>
              <option value="Rejected">Rejected</option>
              <option value="Error">Error</option>
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
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Linked Transaction</th>
              <th className="px-4 py-3 font-semibold">Date Requested</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold w-10"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-bg md:text-sm text-xs">
            {isLoading ? (
              <TableSkeleton columns={8} rows={6} firstColAvatar />
            ) : paginated.length > 0 ? (
              paginated.map((item, idx) => {
                const statusColors = {
                  Pending: "bg-amber-50 text-amber-600",
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
                    <td className="px-4 py-3 text-text-primary">
                      <span className="block">{item.client?.name || item.name}</span>
                      <span className="block md:text-[10px] text-[8px] text-text-muted font-light">
                        {item.client?.email || item.email}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-primary">${item.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-text-primary">{item.txn}</td>
                    <td className="px-4 py-3 text-text-primary">{item.requestedDate || item.date}</td>
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
                              {/* Pending requests are the only rows that need a
                                  decision. The funds are already held, so
                                  approving settles the hold and rejecting
                                  returns it to the client's wallet. */}
                              {item.isPending ? (
                                <>
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
                                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-xs text-red-500 font-medium flex items-center gap-2 cursor-pointer"
                                  >
                                    <Zap size={13} /> Reject
                                  </button>
                                </>
                              ) : (
                                <div className="px-4 py-2 text-[10px] text-text-muted font-light leading-relaxed">
                                  {item.status === "Error" ?
                                    item.errorMessage || "Transfer failed." :
                                    item.status === "Rejected" ?
                                      item.rejectionReason || "Rejected." :
                                      `Settled${item.resolvedByEmail ? ` by ${item.resolvedByEmail}` : ""}.`}
                                </div>
                              )}
                              {item.txn && item.txn !== "-" && (
                                <button
                                  onClick={() => {
                                    copyToClipboard(item.txn);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-page-bg text-xs text-text-primary font-medium flex items-center gap-2 cursor-pointer"
                                >
                                  <Zap size={13} /> Copy transfer ID
                                </button>
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
        totalItems={totalCount ?? transferQueue.length}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
