"use client";

import React, { useState } from "react";
import { Search, MoreVertical, History, Settings } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { getInitials } from "@/lib/utils";

export default function WalletsTab({
  wallets,
  startDate,
  endDate,
  searchTerm,
  onSearchChange,
  onDateChange,
  onOpenHistory,
  onOpenAdjust,
  currentPage,
  setCurrentPage,
  itemsPerPage
}) {
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Pagination config
  const paginated = wallets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white rounded-3xl border border-secondary-bg hover:shadow-xs relative">
      {/* Filters controls bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white rounded-t-3xl border-b border-secondary-bg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search client by name or email..."
            value={searchTerm}
            onChange={(e) => { onSearchChange(e.target.value); setCurrentPage(1); }}
            className="max-w-md w-full border border-border-main text-xs rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
          />
        </div>

        <div className="flex items-center gap-2">
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
          <thead className="bg-page-bg text-text-primary text-left text-sm font-bold">
            <tr>
              <th className="px-4 py-2">Client</th>
              <th className="px-4 py-2">Mail Address</th>
              <th className="px-4 py-2">Current Balance</th>
              <th className="px-4 py-2">Last Transaction</th>
              <th className="px-4 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-bg text-xs text-text-primary">
            {paginated.length > 0 ? (
              paginated.map((item, idx) => (
                <tr key={item.id} className="hover:bg-page-bg/50 transition">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-primary-bg text-white flex items-center justify-center font-light">
                      {getInitials(item.client.name)}
                    </div>
                    <span>{item.client.name}</span>
                  </td>
                  <td className="px-4 py-4">{item.client.email}</td>
                  <td className="px-4 py-4">${item.balance.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className="block text-text-primary">{item.lastTxDate}</span>
                    <span className="block text-[10px] text-text-muted pt-1">{item.lastTxTime}</span>
                  </td>
                  <td className="px-4 py-4 relative">
                    <button
                      onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                      className="px-4 text-text-primary hover:text-text-primary rounded transition cursor-pointer"
                    >
                      <MoreVertical size={20} />
                    </button>
                    {openDropdownId === item.id && (
                      <div className={`absolute right-6 w-32 bg-white border border-secondary-bg rounded-xl shadow-lg z-10 py-1.5 animate-scale-up ${
                        idx >= paginated.length - 2 ? "bottom-10 origin-bottom" : "top-10 origin-top"
                      }`}>
                        <button
                          onClick={() => {
                            onOpenHistory(item);
                            setOpenDropdownId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-page-bg text-xs text-text-primary font-medium flex items-center gap-2 cursor-pointer"
                        >
                          <History size={13} /> History
                        </button>
                        <button
                          onClick={() => {
                            onOpenAdjust(item);
                            setOpenDropdownId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-page-bg text-xs text-text-primary font-medium flex items-center gap-2 cursor-pointer"
                        >
                          <Settings size={13} /> Adjust
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-text-muted">
                  No clients found matching filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Navigation Footer */}
      <div className="flex items-center justify-between border-t border-secondary-bg px-4 py-3.5 bg-white rounded-b-3xl">
        <span className="text-[10px] text-text-muted font-medium">
          Showing {currentPage * itemsPerPage - itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, wallets.length)} of {wallets.length}
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
            disabled={currentPage * itemsPerPage >= wallets.length}
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
