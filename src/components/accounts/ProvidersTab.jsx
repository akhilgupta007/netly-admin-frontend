"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronDown, MoreVertical, Eye, FileText, CreditCard, Ban, Plus } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { getInitials } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";

export default function ProvidersTab({
  providers,
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterKYC,
  onKYCChange,
  startDate,
  endDate,
  onDateChange,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  getStatusClass,
  onViewProvider,
  onKYCDocuments,
  onPayouts,
  onSuspendBan,
  onInviteClick,
  totalItems
}) {
  const getKycClass = (kyc) => {
    switch (kyc) {
      case "Verified":
        return "text-emerald-500 bg-emerald-50";
      case "Pending":
        return "text-amber-500 bg-amber-50";
      default:
        return "text-red-500 bg-red-50";
    }
  };
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

  // Backend paginated providers list (or fallback sliced list)
  const paginated = totalItems !== undefined ? providers : providers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white rounded-3xl border border-secondary-bg hover:shadow-xs relative overflow-visible">
      {/* Filters controls bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white rounded-t-3xl border-b border-secondary-bg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search provider by name, email or city..."
            value={searchTerm}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-md w-full border border-border-main text-xs rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          
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

          {/* KYC Dropdown */}
          <div className="relative">
            <select
              value={filterKYC}
              onChange={(e) => {
                onKYCChange(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-border-main text-xs rounded-full px-3 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
            >
              <option value="All">KYC</option>
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
              <th className="px-4 py-3 font-semibold">City</th>
              <th className="px-4 py-3 text-center font-semibold">Rating</th>
              <th className="px-4 py-3 font-semibold">Join Date</th>
              <th className="px-4 py-3 font-semibold">KYC</th>
              <th className="px-4 py-3 font-semibold">Badges</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-bg text-sm text-text-primary">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-text-muted font-light">
                  <div className="flex flex-col items-center justify-center space-y-3 min-h-80">
                    <span className="text-xs text-text-muted animate-pulse font-light">Loading Providers Data...</span>
                  </div>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-text-muted font-light">
                  <div className="flex flex-col items-center justify-center space-y-3 min-h-80">
                    <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75" />
                    <span>No providers found matching filter criteria.</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((provider, idx) => (
                <tr 
                  key={provider.id}
                  className="hover:bg-page-bg/50 transition"
                >
                  <td className="px-4 py-3 flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-md bg-primary-bg-muted text-white flex items-center justify-center text-[10px] font-light">
                      {getInitials(provider.name)}
                    </div>
                    <span className="text-text-primary">{provider.name}</span>
                  </td>
                  <td className="px-4 py-3">{provider.email}</td>
                  <td className="px-4 py-3">{provider.city}</td>
                  <td className="px-4 py-3 text-center flex items-center gap-1 text-text-primary">
                    <span className="text-amber-500 text-xl">★</span> 
                    {provider.rating}
                  </td>
                  <td className="px-4 py-3">{provider.joinDate}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getKycClass(provider.kyc)}`}>
                      <span className="h-1 w-1 rounded-full bg-current" />
                      {provider.kyc}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {provider.badges.map((b, idx) => (
                        <span key={idx} className="bg-primary-bg-muted/10 text-primary-bg text-xs font-medium px-2 py-0.5 rounded-md">
                          {b}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs ${getStatusClass(provider.status)}`}>
                      {provider.status}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()} data-dropdown-container>
                    <button
                      onClick={(e) => {
                        if (openMenuId === provider.id) {
                          setOpenMenuId(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const isLastItem = idx === paginated.length - 1;
                          const top = isLastItem ? rect.top - 150 : rect.bottom + 4;
                          setDropdownPos({ top, left: rect.left - 100 });
                          setOpenMenuId(provider.id);
                        }
                      }}
                      className="pr-4 text-text-primary hover:text-text-primary rounded transition cursor-pointer"
                    >
                      <MoreVertical size={20} />
                    </button>
                    
                    {openMenuId === provider.id && (
                      <div
                        className="fixed w-36 bg-white border border-secondary-bg rounded-xl shadow-lg z-50 py-1.5 animate-scale-up"
                        style={{ top: dropdownPos.top, left: dropdownPos.left }}
                      >
                        <button
                          onClick={() => {
                            onViewProvider(provider);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-page-bg text-xs text-text-primary font-medium flex items-center gap-2 cursor-pointer"
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          onClick={() => {
                            onKYCDocuments(provider);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-page-bg text-xs text-text-primary font-medium flex items-center gap-2 cursor-pointer"
                        >
                          <FileText size={13} /> KYC
                        </button>
                        <button
                          onClick={() => {
                            onPayouts(provider);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-page-bg text-xs text-text-primary font-medium flex items-center gap-2 cursor-pointer"
                        >
                          <CreditCard size={13} /> Payouts
                        </button>
                        <button
                          onClick={() => {
                            onSuspendBan(provider);
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
        totalItems={totalItems !== undefined ? totalItems : providers.length}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
