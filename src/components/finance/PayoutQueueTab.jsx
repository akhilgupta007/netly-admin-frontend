"use client";

import React, { useState } from "react";
import { usePayoutQueue } from "@/hooks/useFinance";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { holdProviderPayout } from "@/lib/callables";
import { Search, ChevronDown, Calendar, Users, AlertCircle, Clock } from "lucide-react";
import { toast } from "react-toastify";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import HoldPayoutModal from "./HoldPayoutModal";
import ViewPayoutDetailsModal from "./ViewPayoutDetailsModal";
import CardWrapper from "@/components/ui/CardWrapper";
import { ListSkeleton, RefreshingBar } from "@/components/ui/Skeleton";


/** Formats a number as CAD, or an em dash while the figure is still loading. */
const currency = (n) =>
  n === null || n === undefined ?
    "—" :
    `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** The date of the coming Friday payout run. */
function nextFriday() {
  const d = new Date();
  // 5 = Friday. Today counts if the 09:00 run has not happened yet.
  const delta = (5 - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + delta);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function PayoutQueueTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Modal states
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  const itemsPerPage = 8;

  const {
    payouts,
    totalCount,
    totals,
    isLoading,
    isFetching,
    isError,
  } = usePayoutQueue({
    searchTerm,
    status: filterStatus,
    page: currentPage,
    limit: itemsPerPage,
  });

  const holdMutation = useMutation({
    mutationFn: holdProviderPayout,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["payoutQueue"] });
      setIsHoldModalOpen(false);
      setSelectedPayout(null);
      toast.success(
          result.payoutHold ?
            "Payout held — the balance stays in ACTIVE and rolls to next Friday." :
            "Hold released — this provider is back in the Friday run.",
      );
    },
    onError: (err) => toast.error(err.message),
  });

  const handleActionClick = (item) => {
    setSelectedPayout(item);
    if (item.status === "Failed") {
      // Retrying is automatic: the balance never left ACTIVE, so the next
      // Friday run picks it up without intervention.
      toast.info(
          "The balance stays in ACTIVE and the next Friday run will attempt it " +
        "again automatically.",
      );
      return;
    }
    if (item.payoutHold) {
      holdMutation.mutate({ providerId: item.uid, action: "release" });
      return;
    }
    setIsViewModalOpen(true);
  };

  const handleConfirmHold = (reason) => {
    holdMutation.mutate({
      providerId: selectedPayout?.uid,
      action: "hold",
      reason,
    });
  };

  // The date filter applied to lastPayoutDate, which is not what this view is
  // about — the queue answers "who is owed money now". Filtering is done in the
  // read layer over provider/wallet state instead.
  const filteredPayouts = payouts;
  const paginated = payouts;




  return (
    <div className="space-y-4 animate-scale-up">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <CardWrapper
          name="Payable This Friday"
          value={currency(totals?.payableFriday)}
          subtext="ACTIVE balances — last completed Mon–Sun week."
          icon={Calendar}
          className="h-32"
        />
        <CardWrapper
          name="Reserved (This Week)"
          value={currency(totals?.reserved)}
          subtext="Locked until the Sunday close. Not payable Friday."
          icon={Clock}
          className="h-32"
        />
        <CardWrapper
          name="Blocked"
          value={totals ? String(totals.blocked) : "—"}
          subtext="No Stripe Connect account or payouts disabled."
          icon={AlertCircle}
          className="h-32"
        />
        <CardWrapper
          name="Next Payout Run"
          value={nextFriday()}
          subtext="processFridayPayouts · Fridays 09:00 Toronto."
          icon={Users}
          className="h-32"
        />
      </div>

      <div className="border border-border-main rounded-3xl overflow-visible bg-white shadow-2xs relative z-20">
        <RefreshingBar active={isFetching && !isLoading} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border-b border-border-main">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by provider name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-md w-full border border-border-main md:text-xs text-[10px] rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
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
                className="appearance-none bg-white border border-border-main md:text-xs text-[10px] rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
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

        {isLoading ? (
          <ListSkeleton rows={6} columns={6} firstColAvatar />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-2 select-none bg-white rounded-b-3xl min-h-80">
            <h3 className="text-sm font-semibold text-text-primary">Could not load the payout queue</h3>
            <p className="text-xs text-text-muted font-light">
              Check your connection and refresh. Provider wallet data is read directly from Firestore.
            </p>
          </div>
        ) : filteredPayouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white rounded-b-3xl min-h-80">
            <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">No Payout Records</h3>
              <p className="text-xs text-text-muted font-light">No provider payouts found matching criteria.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-b-3xl">
            <table className="min-w-full divide-y divide-secondary-bg md:text-sm text-xs tracking-tight text-left">
              <thead className="bg-secondary-bg text-text-primary md:text-sm text-xs">
                <tr>
                  <th className="px-4 py-3 font-semibold">Provider</th>
                  <th className="px-4 py-3 font-semibold">Wallet Balance</th>
                  <th className="px-4 py-3 font-semibold">Completed Bookings</th>
                  <th className="px-4 py-3 font-semibold">Last Payout</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Transferred Amount</th>
                  <th className="px-4 py-3 text-right pr-6 font-semibold w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-bg md:text-sm text-xs text-text-primary">
                {paginated.map((item) => (
                  <tr key={item.id} className="hover:bg-page-bg/50 transition">
                    <td className="px-4 py-3 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-primary-bg-muted text-white flex items-center justify-center font-light md:text-[10px] text-[7px] select-none uppercase shrink-0">
                        {item.initials}
                      </div>
                      <div>
                        <span className="text-text-primary block leading-none">{item.provider}</span>
                        <span className="md:text-[10px] text-[7px] text-text-muted font-light mt-0.5 block">{item.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-primary-bg block">${item.walletBalance.toFixed(2)}</span>
                      <span className="md:text-[10px] text-[7px] text-text-muted font-light mt-0.5 block">{item.walletStatus}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span>{item.completedBookings} Bookings</span>
                    </td>
                    <td className="px-4 py-3">
                      <span>{item.lastPayoutDate}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className={`font-semibold md:text-xs text-[10px] leading-none ${item.status === "Pending" ? "text-amber-500" :
                            item.status === "Processing" ? "text-blue-500" :
                              item.status === "Completed" ? "text-[#10B981]" :
                                "text-red-500"
                          }`}>
                          • {item.status}
                        </span>
                        <span className="text-[9px] text-text-muted font-light mt-1 block leading-tight">{item.statusDesc}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span>{item.transferredAmount ? `$${item.transferredAmount.toFixed(2)}` : "-"}</span>
                    </td>
                    <td className="px-4 py-3 text-right pr-6">
                      <button
                        onClick={() => handleActionClick(item)}
                        className="border border-primary-bg-muted hover:border-primary-bg text-primary-bg bg-white hover:bg-page-bg/30 px-3 py-1.5 rounded-lg transition cursor-pointer select-none font-semibold md:text-xs text-[10px] whitespace-nowrap text-center"
                      >
                        {item.status === "Pending" ? "Hold" : item.status === "Failed" ? "Retry" : "View"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalCount > 0 && (
          <Pagination
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={totalCount}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      <HoldPayoutModal
        isOpen={isHoldModalOpen}
        onClose={() => {
          setIsHoldModalOpen(false);
          setSelectedPayout(null);
        }}
        payout={selectedPayout}
        onConfirm={handleConfirmHold}
      />

      <ViewPayoutDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedPayout(null);
        }}
        payout={selectedPayout}
      />
    </div>
  );
}
