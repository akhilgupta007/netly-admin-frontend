"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { getInitials } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";

const defaultDisputes = [
  {
    id: "D-0019",
    txnId: "TXN-00188",
    bookingId: "BK234RFDW235E",
    client: "Kofi Mensah",
    provider: "Yetunde Balogun",
    category: "Post-Construction",
    dateOpened: "Jun 22, 2027",
    status: "Under Review",
    serviceAmount: 350.00,
    clientFee: 17.50,
    commission: 52.50,
    totalCharged: 367.50,
    description: "Full post-construction deep clean of a 4-bedroom detached house. Includes removal of dust, debris, paint splatters, and sanitisation of all surfaces.",
    clientStatement: "The provider left after 3 hours without completing the bathrooms or the kitchen. There is still paint on the tiles and the floors were not mopped properly. I paid for a full clean and did not receive it.",
    providerStatement: "I completed all tasks listed in the booking. The client added new rooms verbally that were not included in the original scope. I worked 5 hours and completed what was agreed at booking.",
    chat: [
      { sender: "Kofi Mensah", role: "client", text: "I am very unhappy. The kitchen was left dirty and the main bathroom has not been cleaned at all.", time: "Jun 22, 2027 18:05" },
      { sender: "Yetunde Balogun", role: "provider", text: "The scope at booking was 3 rooms. You asked me to do extra rooms on the day which was not agreed.", time: "Jun 22, 2027 18:05" },
      { sender: "Kofi Mensah", role: "client", text: "The booking clearly says full house. I have screenshots of the listing description.", time: "Jun 22, 2027 18:05" },
      { sender: "System", role: "system", text: "Dispute opened. Case assigned to review queue.", time: "Jun 22, 2027 18:05" },
      { sender: "Yetunde Balogun", role: "provider", text: "I am happy to discuss but I fulfilled my side of the agreement as booked.", time: "Jun 22, 2027 18:05" }
    ],
    timeline: [
      { event: "Booking marked Completed", time: "June 10, 2026 - 09:45 AM" },
      { event: "Dispute opened by client", time: "June 10, 2026 - 09:45 AM" },
      { event: "Status set to Open - in queue", time: "June 10, 2026 - 09:45 AM" },
      { event: "Status -> Under Review", time: "June 10, 2026 - 09:45 AM" }
    ]
  },
  { id: "D-01270", txnId: "TXN00192123456809", bookingId: "BK234RFDW235L", client: "Patricia Thomas", provider: "Meek Nowise", category: "Carpet Shampooing", dateOpened: "Nov 20, 2028", status: "Under Review" },
  { id: "D-01268", txnId: "TXN00192123456807", bookingId: "BK234RFDW235J", client: "Linda Taylor", provider: "David Tennant", category: "Floor Polishing", dateOpened: "Oct 10, 2028", status: "Resolved", decision: "Split", resolvedDate: "Jun 25, 2027, 09:30", resolvedBy: "admin@netly.io", notes: "Both parties partially at fault. Provider lateness confirmed. Partial credit issued to client wallet. Provider commission reduced by 30%." },
  { id: "D-01263", txnId: "TXN00192123456802", bookingId: "BK234RFDW235E", client: "James Smith", provider: "Clara Barton", category: "Window Washing", dateOpened: "Jun 01, 2028", status: "Open" },
  { id: "D-01266", txnId: "TXN00192123456805", bookingId: "BK234RFDW235H", client: "Emily Davis", provider: "Gregory House", category: "Floor Polishing", dateOpened: "Aug 05, 2028", status: "Resolved", decision: "Favor Client", resolvedDate: "Aug 06, 2028, 14:00", resolvedBy: "admin@netly.io", notes: "Full refund issued to client." },
  { id: "D-01272", txnId: "TXN00192123456811", bookingId: "BK234RFDW235N", client: "Jessica Robinson", provider: "Arthur Pendelton", category: "Deep Cleaning", dateOpened: "Dec 15, 2028", status: "Open" },
  { id: "D-01265", txnId: "TXN00192123456804", bookingId: "BK234RFDW235G", client: "David Brown", provider: "Mia Wong", category: "Deep Cleaning", dateOpened: "Jul 10, 2028", status: "Under Review" },
  { id: "D-01267", txnId: "TXN00192123456806", bookingId: "BK234RFDW235I", client: "Michael Wilson", provider: "Isabella Ross", category: "Deep Cleaning", dateOpened: "Sep 15, 2028", status: "Open" },
  { id: "D-01262", txnId: "TXN00192123456801", bookingId: "BK234RFDW235D", client: "Mia Chen", provider: "Ezekiel Vance", category: "Window Washing", dateOpened: "May 15, 2028", status: "Resolved", decision: "Favor Provider", resolvedDate: "May 16, 2028, 16:30", resolvedBy: "admin@netly.io", notes: "No fault found on provider side. Funds released." },
  { id: "D-01271", txnId: "TXN00192123456810", bookingId: "BK234RFDW235M", client: "Daniel Martinez", provider: "Sofia Martinez", category: "Deep Cleaning", dateOpened: "Dec 01, 2028", status: "Open" }
];

export default function DisputesPage() {
  const router = useRouter();
  const [disputes, setDisputes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sync state with localStorage
  useEffect(() => {
    const saved = localStorage.getItem("netly_disputes");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hasIssues = parsed.some(d => !d.provider || d.client === d.provider);
        if (hasIssues) {
          localStorage.removeItem("netly_disputes");
          setDisputes(defaultDisputes);
          localStorage.setItem("netly_disputes", JSON.stringify(defaultDisputes));
        } else {
          setDisputes(parsed);
        }
      } catch (err) {
        localStorage.removeItem("netly_disputes");
        setDisputes(defaultDisputes);
        localStorage.setItem("netly_disputes", JSON.stringify(defaultDisputes));
      }
    } else {
      setDisputes(defaultDisputes);
      localStorage.setItem("netly_disputes", JSON.stringify(defaultDisputes));
    }
  }, []);

  // Statistics counters cards
  const counts = useMemo(() => {
    const res = { Open: 0, UnderReview: 0, Resolved: 0 };
    disputes.forEach((d) => {
      if (d.status === "Open") res.Open++;
      else if (d.status === "Under Review") res.UnderReview++;
      else if (d.status === "Resolved") res.Resolved++;
    });
    return res;
  }, [disputes]);

  // Filter disputes
  const filteredDisputes = useMemo(() => {
    return disputes.filter((d) => {
      const matchSearch = 
        d.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = 
        filterStatus === "All" || 
        d.status === filterStatus;

      let matchDate = true;
      if (startDate && endDate) {
        const itemDate = new Date(d.dateOpened);
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        matchDate = itemDate >= start && itemDate <= end;
      }

      return matchSearch && matchStatus && matchDate;
    });
  }, [disputes, searchTerm, filterStatus, startDate, endDate]);

  // Sliced page data
  const paginated = useMemo(() => {
    return filteredDisputes.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredDisputes, currentPage]);

  // Render pill color status utilities
  const getStatusClass = (status) => {
    switch (status) {
      case "Resolved":
        return "text-emerald-500 bg-emerald-50";
      case "Under Review":
        return "text-amber-500 bg-amber-50";
      case "Open":
        return "text-red-500 bg-red-50";
      default:
        return "text-text-muted bg-page-bg";
    }
  };

  // Dashboard list layout (default state)
  return (
    <div className="space-y-4 font-onest">
      
      {/* Summary Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
        {[
          { label: "Open", count: counts.Open },
          { label: "Under Review", count: counts.UnderReview },
          { label: "Resolved", count: counts.Resolved }
        ].map((card, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-secondary-bg p-4 flex flex-col justify-between min-h-22.5 shadow-2xs hover:shadow-xs transition">
            <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">{card.label}</span>
            <strong className="text-2xl text-text-primary font-semibold block pt-2">{card.count}</strong>
          </div>
        ))}
      </div>

      {/* Main Table Container Box */}
      <div className="bg-white rounded-3xl border border-secondary-bg hover:shadow-xs relative overflow-hidden">
        
        {/* Filters control bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white rounded-t-3xl border-b border-secondary-bg">
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
              className="max-w-md w-full border border-border-main text-xs rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            
            {/* Status selector */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-border-main text-xs rounded-full px-3 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
              >
                <option value="All">Status</option>
                <option value="Open">Open</option>
                <option value="Under Review">Under Review</option>
                <option value="Resolved">Resolved</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
            </div>

            {/* Date range picker */}
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

        {/* Disputes Grid Table (or leak empty container if counts empty) */}
        {filteredDisputes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white rounded-b-3xl">
            <img src="/empty.png" alt="No data" className="w-24 h-24 object-contain opacity-80" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">No Open Disputes</h3>
              <p className="text-xs text-text-muted font-light">Disputes raised by client/provider will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-bg text-sm tracking-tight">
              <thead className="bg-secondary-bg text-text-primary text-left text-sm font-bold">
                <tr>
                  <th className="px-4 py-2 font-semibold">Dispute ID</th>
                  <th className="px-4 py-2 font-semibold">Transaction ID</th>
                  <th className="px-4 py-2 font-semibold">Booking ID</th>
                  <th className="px-4 py-2 font-semibold">Client</th>
                  <th className="px-4 py-2 font-semibold">Provider</th>
                  <th className="px-4 py-2 font-semibold">Category</th>
                  <th className="px-4 py-2 font-semibold">Date Opened</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 w-20 text-right pr-6 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-bg text-xs text-text-primary">
                {paginated.map((row) => (
                  <tr key={row.id} className="hover:bg-page-bg/50 transition">
                    <td className="px-4 py-4 font-semibold text-text-primary">{row.id}</td>
                    <td className="px-4 py-4 text-text-muted font-mono">{row.txnId}</td>
                    <td className="px-4 py-4 text-text-muted font-mono">{row.bookingId}</td>
                    <td className="px-4 py-4">{row.client}</td>
                    <td className="px-4 py-4">{row.provider}</td>
                    <td className="px-4 py-4">{row.category}</td>
                    <td className="px-4 py-4 text-text-muted">{row.dateOpened}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusClass(row.status)}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right pr-6">
                      <button
                        onClick={() => {
                          router.push(`/compliance/disputes/${row.id}`);
                        }}
                        className="inline-block border border-primary-bg-muted hover:border-primary-bg text-primary-bg font-semibold text-[10px] px-3.5 py-1 rounded-full transition cursor-pointer text-center"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Navigation Footer */}
        {filteredDisputes.length > 0 && (
          <Pagination
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredDisputes.length}
            onPageChange={setCurrentPage}
          />
        )}

      </div>

    </div>
  );
}
