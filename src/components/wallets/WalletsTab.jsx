"use client";

import React, { useState, useEffect } from "react";
import { Search, MoreVertical, History, Settings2 } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { getInitials } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";

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
  const paginated = wallets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white rounded-3xl border border-secondary-bg hover:shadow-xs relative overflow-hidden">
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
          <thead className="bg-secondary-bg text-text-primary text-left text-sm">
            <tr>
              <th className="px-4 py-3 font-semibold">Client</th>
              <th className="px-4 py-3 font-semibold">Mail Address</th>
              <th className="px-4 py-3 font-semibold">Current Balance</th>
              <th className="px-4 py-3 font-semibold">Last Transaction</th>
              <th className="px-4 py-3 font-semibold w-10"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-bg text-xs text-text-primary">
            {paginated.length > 0 ? (
              paginated.map((item, idx) => (
                <tr key={item.id} className="hover:bg-page-bg/50 transition">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-primary-bg-muted text-white flex items-center justify-center font-light">
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
                  <td className="px-4 py-4" data-dropdown-container>
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
                      className="px-4 text-text-primary hover:text-text-primary rounded transition cursor-pointer"
                    >
                      <MoreVertical size={20} />
                    </button>
                    {openDropdownId === item.id && (
                      <div
                        className="fixed w-36 bg-white border border-secondary-bg rounded-xl shadow-lg z-50 py-1.5 animate-scale-up"
                        style={{ top: dropdownPos.top, left: dropdownPos.left }}
                      >
                        <button
                          onClick={() => {
                            onOpenHistory(item);
                            setOpenDropdownId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-page-bg text-sm text-text-primary font-medium flex items-center gap-2 cursor-pointer"
                        >
                          <History size={16} /> History
                        </button>
                        <button
                          onClick={() => {
                            onOpenAdjust(item);
                            setOpenDropdownId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-page-bg text-sm text-text-primary font-medium flex items-center gap-2 cursor-pointer"
                        >
                          <Settings2 size={16} /> Adjust
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-text-muted font-light">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75" />
                    <span>No clients found matching filter criteria.</span>
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
        totalItems={wallets.length}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
