"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, ChevronDown, MoreHorizontal, Eye, Slash } from "lucide-react";
import { toast } from "react-toastify";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import ProviderDetailModal from "@/components/accounts/ProviderDetailModal";
import SuspendBanModal from "@/components/accounts/SuspendBanModal";
import CardWrapper from "@/components/ui/CardWrapper";

// Import custom Firestore React Query hook
import { useProviders } from "@/hooks/useProviders";
import { toMillis } from "@/services/firestoreReads";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAccountStatus, resetUserPassword } from "@/lib/callables";
import { ListSkeleton, RefreshingBar } from "@/components/ui/Skeleton";

// Initial Mock Partners list matching Screenshot 1 values

export default function FoundingPartnersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // selected entities for modal actions
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [suspendBanOpen, setSuspendBanOpen] = useState(false);

  // Active dropdown row ID
  const [activeMenuRowId, setActiveMenuRowId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  // Firestore React Query hook. isLoading/isFetching come from the query
  // itself — a timer would clear before the data arrived.
  const {
    providers: queryProviders,
    isLoading,
    isFetching,
    isError,
  } = useProviders();
  const queryClient = useQueryClient();

  // Derived, not copied into state. Copying via an effect meant the first paint
  // happened before the query resolved, so stale localStorage/mock rows showed
  // and were then swapped for the real ones.
  //
  // isFoundingPartner is the real flag, written by inviteUser.
  const partners = useMemo(
      () =>
        (queryProviders || [])
            .filter((p) => p.isFoundingPartner)
            .map((p) => ({
              id: p.id,
              uid: p.uid,
              name: p.name,
              email: p.email,
              date: p.joinDate,
              dateTime: p.createdAtRaw ? new Date(toMillis(p.createdAtRaw)) : null,
              status: p.status,
              city: p.city,
              rating: p.rating,
            })),
      [queryProviders],
  );

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest("[data-dropdown-container]")) {
        setActiveMenuRowId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Modal handlers. Founding partners are ordinary provider accounts, so these
  // go through the same callables as the Accounts page.
  const statusMutation = useMutation({
    mutationFn: updateAccountStatus,
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      setSuspendBanOpen(false);
      setSelectedPartner(null);
      const label = { suspend: "suspended", ban: "banned", reactivate: "reactivated" }[
        variables.action
      ];
      toast.success(`Partner account ${label}.`);
    },
    onError: (error) => toast.error(error.message)
  });

  const resetPasswordMutation = useMutation({
    mutationFn: resetUserPassword,
    onSuccess: (result) =>
      toast.success(`Password reset email sent to ${result.email}.`),
    onError: (error) => toast.error(error.message)
  });

  const handleSuspendBanSubmit = (partner, data) => {
    statusMutation.mutate({
      uid: data.uid || partner.uid,
      action: data.actionType === "Suspend (Temporary)" ? "suspend" : "ban",
      durationDays: data.actionType === "Suspend (Temporary)" ? data.duration : undefined,
      reason: data.reason,
      notifyEmail: data.notifyEmail
    });
  };

  const handleReactivatePartner = (partner) => {
    statusMutation.mutate({ uid: partner.uid, action: "reactivate" });
  };

  const handleResetPassword = (partner) => {
    resetPasswordMutation.mutate({ uid: partner.uid });
  };
  // Filtering
  const filteredPartners = partners.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "All" || p.status === filterStatus;

    let matchesDate = true;
    if (startDate && endDate) {
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      const signUpTime = new Date(p.dateTime).getTime();
      matchesDate = signUpTime >= start && signUpTime <= end;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Dynamic calculations for Stats Cards
  const statsTotal = partners.length;
  const statsInvited = partners.filter(p => p.status === "Invited").length;
  const statsActivated = partners.filter(p => p.status === "Active").length;
  const statsDeclined = partners.filter(p => p.status === "Declined").length;

  // Pagination
  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage) || 1;
  const paginatedPartners = filteredPartners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4 font-onest animate-scale-up">

      {/* Summary Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {[
          { title: "Total Sign Ups", count: statsTotal > 0 ? statsTotal : "-" },
          { title: "Invited", count: statsTotal > 0 ? statsInvited : "-" },
          { title: "Activated", count: statsTotal > 0 ? statsActivated : "-" },
          { title: "Declined", count: statsTotal > 0 ? statsDeclined : "-" }
        ].map((card, i) => (
          <CardWrapper
            key={i}
            name={card.title}
            value={card.count}
          />
        ))}
      </div>

      {/* Main Table Container Box */}
      <div className="bg-white rounded-3xl border border-border-main hover:shadow-xs relative overflow-visible">
        <RefreshingBar active={isFetching && !isLoading} />

        {/* Filters control bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white rounded-t-3xl border-b border-border-main">
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
              className="max-w-sm w-full border border-border-main md:text-xs text-[10px] rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
            />
          </div>

          <div className="flex items-center gap-2 justify-center">
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-border-main md:text-xs text-[10px] rounded-full px-3 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
              >
                <option value="All">Status</option>
                <option value="Active">Active</option>
                <option value="Invited">Invited</option>
                <option value="Declined">Declined</option>
                <option value="Suspended">Suspended</option>
                <option value="Banned">Banned</option>
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

        {isLoading ? (
          <ListSkeleton rows={6} columns={5} firstColAvatar />
        ) : filteredPartners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white min-h-80">
            <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">No founding partners signups yet</h3>
              <p className="text-xs text-text-muted font-light">Users data will appear here, once they register themselves as founding provider.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto overflow-y-visible rounded-b-3xl">
              <table className="min-w-full divide-y divide-secondary-bg md:text-sm text-xs tracking-tight">
                <thead className="bg-secondary-bg text-text-primary text-left md:text-sm text-xs font-bold">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email Address</th>
                    <th className="px-4 py-3 font-semibold">Sign Up Date</th>
                    <th className="px-4 py-3 font-semibold">Account status</th>
                    <th className="px-4 py-3 font-semibold w-10">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-bg md:text-sm text-xs text-text-primary">
                  {paginatedPartners.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-page-bg/50 transition">
                      <td className="px-4 py-3">{item.name}</td>
                      <td className="px-4 py-3">{item.email}</td>
                      <td className="px-4 py-3 text-nowrap">{item.date}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${item.status === "Active" ? "text-emerald-500 bg-emerald-50" :
                            item.status === "Invited" ? "text-blue-500 bg-blue-50" :
                              item.status === "Declined" ? "text-text-muted bg-page-bg" :
                                "text-red-500 bg-red-50"
                          }`}>
                          <span className="h-1 w-1 rounded-full bg-current" />
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3" data-dropdown-container>
                        <button
                          onClick={(e) => {
                            if (activeMenuRowId === item.id) {
                              setActiveMenuRowId(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const isLastItem = idx === paginatedPartners.length - 1;
                              const top = isLastItem ? rect.top - 80 : rect.bottom + 4;
                              setDropdownPos({ top, left: rect.left - 120 });
                              setActiveMenuRowId(item.id);
                            }
                          }}
                          className="flex items-center justify-center rounded-full hover:bg-page-bg transition cursor-pointer text-text-primary"
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        {/* Actions context menu overlay */}
                        {activeMenuRowId === item.id && (
                          <div
                            className="fixed w-40 bg-white border border-border-main rounded-xl shadow-lg p-1.5 space-y-0.5 text-left text-xs animate-scale-up text-text-primary z-50"
                            style={{ top: dropdownPos.top, left: dropdownPos.left }}
                          >
                            <button
                              onClick={() => {
                                setSelectedPartner(item);
                                setDetailOpen(true);
                                setActiveMenuRowId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.75 rounded-lg hover:bg-page-bg transition cursor-pointer font-medium"
                            >
                              <Eye size={13} className="text-text-muted" /> View
                            </button>
                            <button
                              disabled={item.status === "Banned" || item.status === "Declined"}
                              onClick={() => {
                                setSelectedPartner(item);
                                setSuspendBanOpen(true);
                                setActiveMenuRowId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.75 rounded-lg hover:bg-page-bg transition cursor-pointer font-medium disabled:opacity-45 disabled:cursor-not-allowed"
                            >
                              <Slash size={13} className="text-text-muted" /> Suspend/Ban
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <Pagination
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredPartners.length}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Action Modals */}
      {selectedPartner && (
        <>
          <ProviderDetailModal
            isOpen={detailOpen}
            provider={selectedPartner}
            onClose={() => {
              setDetailOpen(false);
              setSelectedPartner(null);
            }}
            onSuspendBanTrigger={(partner) => {
              setDetailOpen(false);
              setSelectedPartner(partner);
              setSuspendBanOpen(true);
            }}
            onReactivateTrigger={(partner) => {
              handleReactivatePartner(partner);
              // Reflect it on the open card immediately; the query refetch
              // behind the modal is what makes it stick.
              setSelectedPartner(prev => prev ? { ...prev, status: "Active" } : null);
            }}
            onResetPassword={handleResetPassword}
            isResettingPassword={resetPasswordMutation.isPending}
          />

          <SuspendBanModal
            isOpen={suspendBanOpen}
            account={selectedPartner}
            activeTab="Providers"
            onClose={() => {
              setSuspendBanOpen(false);
              setSelectedPartner(null);
            }}
            onSubmit={(data) => handleSuspendBanSubmit(selectedPartner, data)}
            isPending={statusMutation.isPending}
          />
        </>
      )}

    </div>
  );
}
