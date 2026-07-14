"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronDown, MoreVertical, Eye, Ban, Plus } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { getInitials } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";

export default function ClientsTab({
  clients,
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusChange,
  startDate,
  endDate,
  onDateChange,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  getStatusClass,
  onViewClient,
  onSuspendBan,
  onInviteClick
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest("[data-dropdown-container]")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Sliced page clients list
  const paginated = clients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white rounded-3xl border border-secondary-bg hover:shadow-xs relative overflow-visible">
      {/* Filters controls bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white rounded-t-3xl border-b border-secondary-bg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search client by name or email..."
            value={searchTerm}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-md w-full border border-border-main text-xs rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          
          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => {
                onStatusChange(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-border-main text-xs rounded-full px-3 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
            >
              <option value="All">Status</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Banned">Banned</option>
              <option value="Pending Verification">Pending Verification</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
          </div>


          {/* Date Range Picker */}
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              onDateChange(start, end);
              setCurrentPage(1);
            }}
          />

          {/* Invite User Button */}
          <button
            onClick={onInviteClick}
            className="h-10 px-4 py-2 bg-primary-bg-muted hover:bg-primary-bg text-text-primary font-semibold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus size={16} /> Invite User
          </button>

        </div>
      </div>

      {/* Table Content Section */}
      <div className="overflow-x-auto rounded-b-3xl">
        <table className="min-w-full divide-y divide-secondary-bg text-sm tracking-tight">
          <thead className="bg-secondary-bg text-text-primary text-left text-sm">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email Address</th>
              <th className="px-4 py-3 font-semibold">Join Date</th>
              <th className="px-4 py-3 font-semibold">Bookings</th>
              <th className="px-4 py-3 font-semibold">Wallet</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-bg text-sm text-text-primary">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-text-muted font-light">
                  <div className="flex flex-col items-center justify-center space-y-3 min-h-80">
                    <span className="text-xs text-text-muted animate-pulse font-light">Loading Clients Data...</span>
                  </div>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-text-muted font-light">
                  <div className="flex flex-col items-center justify-center space-y-3 min-h-80">
                    <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75" />
                    <span>No clients found matching filter criteria.</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((client, idx) => (
                <tr 
                  key={client.id}
                  className="hover:bg-page-bg/50 transition"
                >
                  <td className="px-4 py-3 flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-md bg-primary-bg-muted text-white flex items-center justify-center text-[10px] font-light pt-0.5">
                      {getInitials(client.name)}
                    </div>
                    <span className="text-text-primary">{client.name}</span>
                  </td>
                  <td className="px-4 py-3">{client.email}</td>
                  <td className="px-4 py-3">{client.joinDate}</td>
                  <td className="px-4 py-3 text-text-primary">{client.bookings}</td>
                  <td className="px-4 py-3 text-text-primary">${client.wallet.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs ${getStatusClass(client.status)}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()} data-dropdown-container>
                    <button
                      onClick={(e) => {
                        if (openMenuId === client.id) {
                          setOpenMenuId(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const isLastItem = idx === paginated.length - 1;
                          const top = isLastItem ? rect.top - 80 : rect.bottom + 4;
                          setDropdownPos({ top, left: rect.left - 100 });
                          setOpenMenuId(client.id);
                        }
                      }}
                      className="pr-4 text-text-primary hover:text-text-primary rounded transition cursor-pointer"
                    >
                      <MoreVertical size={20} />
                    </button>
                    
                    {openMenuId === client.id && (
                      <div
                        className="fixed w-36 bg-white border border-secondary-bg rounded-xl shadow-lg z-50 py-1.5 animate-scale-up"
                        style={{ top: dropdownPos.top, left: dropdownPos.left }}
                      >
                        <button
                          onClick={() => {
                            onViewClient(client);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-page-bg text-xs text-text-primary font-medium flex items-center gap-2 cursor-pointer"
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          onClick={() => {
                            onSuspendBan(client);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-red-50 text-xs text-red-500 font-medium flex items-center gap-2 cursor-pointer"
                        >
                          <Ban size={13} /> Suspend/Ban
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Navigation Footer */}
      <Pagination
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalItems={clients.length}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
