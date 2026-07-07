"use client";

import React, { useState } from "react";
import { Search, ChevronDown, MoreVertical, Eye, Ban } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { getInitials } from "@/lib/utils";

export default function ClientsTab({
  clients,
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterOTP,
  onOTPChange,
  startDate,
  endDate,
  onDateChange,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  getStatusClass,
  getOtpClass,
  onViewClient,
  onSuspendBan
}) {
  const [openMenuId, setOpenMenuId] = useState(null);

  // Sliced page clients list
  const paginated = clients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

          {/* OTP Dropdown */}
          <div className="relative">
            <select
              value={filterOTP}
              onChange={(e) => {
                onOTPChange(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-border-main text-xs rounded-full px-3 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
            >
              <option value="All">OTP</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
              <option value="Unverified">Unverified</option>
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

        </div>
      </div>

      {/* Table Content Section */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-secondary-bg text-sm tracking-tight">
          <thead className="bg-secondary-bg text-text-primary text-left text-sm">
            <tr>
              <th className="px-4 py-2 font-semibold">Name</th>
              <th className="px-4 py-2 font-semibold">Email Address</th>
              <th className="px-4 py-2 font-semibold">Join Date</th>
              <th className="px-4 py-2 text-center font-semibold">OTP</th>
              <th className="px-4 py-2 text-center font-semibold">Bookings</th>
              <th className="px-4 py-2 text-left font-semibold">Wallet</th>
              <th className="px-4 py-2 text-left font-semibold">Status</th>
              <th className="px-4 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-bg text-sm text-text-primary">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-text-muted font-light">
                  <div className="flex flex-col items-center justify-center space-y-3">
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
                  <td className="px-4 py-3 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-primary-bg-muted text-white flex items-center justify-center text-[10px] font-light">
                      {getInitials(client.name)}
                    </div>
                    <span className="text-text-primary">{client.name}</span>
                  </td>
                  <td className="px-4 py-4">{client.email}</td>
                  <td className="px-4 py-4">{client.joinDate}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getOtpClass(client.otp)}`}>
                      <span className="h-1 w-1 rounded-full bg-current" />
                      {client.otp}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-text-primary">{client.bookings}</td>
                  <td className="px-4 py-4 text-text-primary">${client.wallet.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs ${getStatusClass(client.status)}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === client.id ? null : client.id)}
                      className="px-4 text-text-primary hover:text-text-primary rounded transition cursor-pointer"
                    >
                      <MoreVertical size={20} />
                    </button>
                    
                    {openMenuId === client.id && (
                      <div className={`absolute right-6 w-32 bg-white border border-secondary-bg rounded-xl shadow-lg z-10 py-1.5 animate-scale-up ${
                        idx >= paginated.length - 3 ? "bottom-11 origin-bottom" : "top-10 origin-top"
                      }`}>
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
      <div className="flex items-center justify-between border-t border-secondary-bg px-4 py-3.5 bg-white rounded-b-3xl">
        <span className="text-[10px] text-text-muted font-medium">
          Showing {(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, clients.length)} of {clients.length}
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
            disabled={currentPage * itemsPerPage >= clients.length}
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
