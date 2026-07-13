"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronDown, Calendar, Users, AlertCircle, Clock } from "lucide-react";
import { toast } from "react-toastify";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import HoldPayoutModal from "./HoldPayoutModal";
import ViewPayoutDetailsModal from "./ViewPayoutDetailsModal";

const initialPayouts = [
  { id: "1", provider: "Oliver Jones", email: "oliver.jones@email.com", initials: "LT", walletBalance: 500.50, walletStatus: "Ready for payout", completedBookings: 22, lastPayoutDate: "Jul 13, 2027", status: "Pending", statusDesc: "Waiting for Friday payout", transferredAmount: null },
  { id: "2", provider: "Benjamin White", email: "benjamin.white@email.com", initials: "LT", walletBalance: 375.40, walletStatus: "Ready for payout", completedBookings: 14, lastPayoutDate: "Jul 11, 2027", status: "Processing", statusDesc: "Transfer in progress", transferredAmount: null },
  { id: "3", provider: "James Wilson", email: "james.wilson@email.com", initials: "LT", walletBalance: 450.00, walletStatus: "Ready for payout", completedBookings: 20, lastPayoutDate: "Jul 9, 2027", status: "Completed", statusDesc: "Paid successfully", transferredAmount: 205.05 },
  { id: "4", provider: "Anna Kim", email: "anna.kim@email.com", initials: "LT", walletBalance: 300.25, walletStatus: "Ready for payout", completedBookings: 12, lastPayoutDate: "Jul 10, 2027", status: "Pending", statusDesc: "Waiting for Friday payout", transferredAmount: null },
  { id: "5", provider: "Jessica Taylor", email: "jessica.taylor@email.com", initials: "LT", walletBalance: 310.00, walletStatus: "Ready for payout", completedBookings: 10, lastPayoutDate: "Jul 8, 2027", status: "Failed", statusDesc: "Bank account requires verification.", transferredAmount: null },
  { id: "6", provider: "Sarah Johnson", email: "sarah.johnson@email.com", initials: "MT", walletBalance: 300.00, walletStatus: "Pending verification", completedBookings: 15, lastPayoutDate: "Jul 10, 2027", status: "Completed", statusDesc: "Paid successfully", transferredAmount: 150.00 },
  { id: "7", provider: "Michael Brown", email: "michael.brown@email.com", initials: "NT", walletBalance: 600.00, walletStatus: "Ready for payout", completedBookings: 25, lastPayoutDate: "Jul 11, 2027", status: "Completed", statusDesc: "Paid successfully", transferredAmount: 250.00 },
  { id: "8", provider: "Oliver Jones", email: "oliver.jones@email.com", initials: "LT", walletBalance: 500.50, walletStatus: "Ready for payout", completedBookings: 22, lastPayoutDate: "Jul 13, 2027", status: "Pending", statusDesc: "Waiting for Friday payout", transferredAmount: null },
  { id: "9", provider: "Jessica Taylor", email: "jessica.taylor@email.com", initials: "LT", walletBalance: 310.00, walletStatus: "Ready for payout", completedBookings: 10, lastPayoutDate: "Jul 8, 2027", status: "Failed", statusDesc: "Bank account requires verification.", transferredAmount: null },
  { id: "10", provider: "Sarah Johnson", email: "sarah.johnson@email.com", initials: "MT", walletBalance: 300.00, walletStatus: "Pending verification", completedBookings: 15, lastPayoutDate: "Jul 10, 2027", status: "Completed", statusDesc: "Paid successfully", transferredAmount: 150.00 },
  { id: "11", provider: "James Wilson", email: "james.wilson@email.com", initials: "LT", walletBalance: 450.00, walletStatus: "Ready for payout", completedBookings: 20, lastPayoutDate: "Jul 9, 2027", status: "Completed", statusDesc: "Paid successfully", transferredAmount: 205.05 },
  { id: "12", provider: "Benjamin White", email: "benjamin.white@email.com", initials: "LT", walletBalance: 375.40, walletStatus: "Ready for payout", completedBookings: 14, lastPayoutDate: "Jul 11, 2027", status: "Processing", statusDesc: "Transfer in progress", transferredAmount: null },
  { id: "13", provider: "Anna Kim", email: "anna.kim@email.com", initials: "LT", walletBalance: 300.25, walletStatus: "Ready for payout", completedBookings: 12, lastPayoutDate: "Jul 10, 2027", status: "Pending", statusDesc: "Waiting for Friday payout", transferredAmount: null },
  { id: "14", provider: "Michael Brown", email: "michael.brown@email.com", initials: "NT", walletBalance: 600.00, walletStatus: "Ready for payout", completedBookings: 25, lastPayoutDate: "Jul 11, 2027", status: "Completed", statusDesc: "Paid successfully", transferredAmount: 250.00 }
];

export default function PayoutQueueTab() {
  const [payouts, setPayouts] = useState(initialPayouts);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Modal states
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [holdReason, setHoldReason] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleActionClick = (item) => {
    setSelectedPayout(item);
    if (item.status === "Pending") {
      setHoldReason("");
      setIsHoldModalOpen(true);
    } else if (item.status === "Failed") {
      toast.info("Retrying failed payout transfer...");
      setTimeout(() => {
        const updated = payouts.map(p => {
          if (p.id === item.id) {
            return {
              ...p,
              status: "Completed",
              statusDesc: "Paid successfully",
              transferredAmount: p.walletBalance
            };
          }
          return p;
        });
        setPayouts(updated);
        toast.success(`Payout successfully completed for ${item.provider}!`);
      }, 800);
    } else {
      setIsViewModalOpen(true);
    }
  };

  const handleConfirmHold = () => {
    if (holdReason.length < 10) return;
    toast.success(`Payout held for ${selectedPayout.provider}.`);
    const updated = payouts.map(p => {
      if (p.id === selectedPayout.id) {
        return {
          ...p,
          statusDesc: "Waiting for Friday payout (On Hold)"
        };
      }
      return p;
    });
    setPayouts(updated);
    setIsHoldModalOpen(false);
    setSelectedPayout(null);
  };

  const filteredPayouts = useMemo(() => {
    return payouts.filter((item) => {
      const matchSearch = item.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === "All" || item.status === filterStatus;

      if (startDate && endDate) {
        const itemDate = new Date(item.lastPayoutDate);
        if (!isNaN(itemDate.getTime())) {
          const s = new Date(startDate);
          const e = new Date(endDate);
          s.setHours(0, 0, 0, 0);
          e.setHours(23, 59, 59, 999);
          return matchSearch && matchStatus && itemDate >= s && itemDate <= e;
        }
      }

      return matchSearch && matchStatus;
    });
  }, [payouts, searchTerm, filterStatus, startDate, endDate]);

  const paginated = useMemo(() => {
    return filteredPayouts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredPayouts, currentPage]);



  return (
    <div className="space-y-4 animate-scale-up">
      {/* Top teal banner and KPI cards */}
      <div className="bg-[#E6F4F6] p-4 rounded-3xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-white rounded-2xl p-4 flex flex-col justify-between hover:shadow-xs transition h-32">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#EAF6F7] text-primary-bg rounded-full shrink-0 flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <span className="text-sm text-text-primary">Expected Friday Payout</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-semibold text-text-primary">$18,540.25</span>
            <span className="text-[10px] text-text-muted block mt-1">Based on current provider wallet balances.</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 flex flex-col justify-between hover:shadow-xs transition h-32">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#EAF6F7] text-primary-bg rounded-full shrink-0 flex items-center justify-center">
              <Users size={18} />
            </div>
            <span className="text-sm text-text-primary">Providers Ready</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-semibold text-text-primary">128</span>
            <span className="text-[10px] text-text-muted block mt-1">Providers with earnings available for payout.</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 flex flex-col justify-between hover:shadow-xs transition h-32">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#EAF6F7] text-primary-bg rounded-full shrink-0 flex items-center justify-center">
              <AlertCircle size={18} />
            </div>
            <span className="text-sm text-text-primary">Failed Last Run</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-semibold text-text-primary">3</span>
            <span className="text-[10px] text-text-muted block mt-1">Awaiting manual review.</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 flex flex-col justify-between hover:shadow-xs transition h-32">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#EAF6F7] text-primary-bg rounded-full shrink-0 flex items-center justify-center">
              <Clock size={18} />
            </div>
            <span className="text-sm text-text-primary">Next Payout</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-semibold text-text-primary">Friday, Jul 11, 2027</span>
            <span className="text-[10px] text-text-muted block mt-1">Weekly payout schedule.</span>
          </div>
        </div>
      </div>

      <div className="border border-secondary-bg rounded-3xl overflow-hidden bg-white shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border-b border-secondary-bg">
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
              className="max-w-md w-full border border-border-main text-xs rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-border-main text-xs rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
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

        {filteredPayouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white rounded-b-3xl">
            <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">No Payout Records</h3>
              <p className="text-xs text-text-muted font-light">No provider payouts found matching criteria.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-bg text-sm tracking-tight text-left">
              <thead className="bg-secondary-bg text-text-primary text-sm">
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
              <tbody className="bg-white divide-y divide-secondary-bg text-sm text-text-primary">
                {paginated.map((item) => (
                  <tr key={item.id} className="hover:bg-page-bg/50 transition">
                    <td className="px-4 py-3 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-primary-bg-muted text-white flex items-center justify-center font-light text-[10px] select-none uppercase shrink-0">
                        {item.initials}
                      </div>
                      <div>
                        <span className="text-text-primary block leading-none">{item.provider}</span>
                        <span className="text-[10px] text-text-muted font-light mt-0.5 block">{item.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-primary-bg block">${item.walletBalance.toFixed(2)}</span>
                      <span className="text-[10px] text-text-muted font-light mt-0.5 block">{item.walletStatus}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span>{item.completedBookings} Bookings</span>
                    </td>
                    <td className="px-4 py-3">
                      <span>{item.lastPayoutDate}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className={`font-semibold text-xs leading-none ${
                          item.status === "Pending" ? "text-amber-500" :
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
                        className="border border-primary-bg-muted hover:border-primary-bg text-primary-bg bg-white hover:bg-page-bg/30 px-3 py-1.5 rounded-lg transition cursor-pointer select-none font-semibold text-xs whitespace-nowrap text-center"
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

        {filteredPayouts.length > 0 && (
          <Pagination
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredPayouts.length}
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
