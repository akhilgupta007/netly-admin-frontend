"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import CardWrapper from "@/components/ui/CardWrapper";
import { useDisputes } from "@/hooks/useDisputes";

export default function DisputesPage() {
  const router = useRouter();
  const { disputes, isLoading, isError, error } = useDisputes();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Open");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Sync state with localStorage
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

  // Filter disputes by active tab + search + date
  const filteredDisputes = useMemo(() => {
    return disputes.filter((d) => {
      const matchSearch =
        d.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchTab = d.status === activeTab;

      let matchDate = true;
      if (startDate && endDate) {
        const itemDate = new Date(d.dateOpened);
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        matchDate = itemDate >= start && itemDate <= end;
      }

      return matchSearch && matchTab && matchDate;
    });
  }, [disputes, searchTerm, activeTab, startDate, endDate]);

  // Sliced page data
  const paginated = useMemo(() => {
    return filteredDisputes.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
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

  // Tab definitions
  const tabs = [
    { id: "Open", label: "Open" },
    { id: "Under Review", label: "Under Review" },
    { id: "Resolved", label: "Resolved" },
  ];

  // Dashboard list layout (default state)
  return (
    <div className="space-y-4 font-onest">
      {/* Summary Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
        {[
          { label: "Open", count: counts.Open },
          { label: "Under Review", count: counts.UnderReview },
          { label: "Resolved", count: counts.Resolved },
        ].map((card, idx) => (
          <CardWrapper key={idx} name={card.label} value={card.count} />
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border-main text-xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 -mb-px font-semibold transition hover:text-primary-bg cursor-pointer ${
              activeTab === tab.id
                ? "border-b-2 border-text-primary text-text-primary font-bold"
                : "text-text-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Table Container Box */}
      <div className="bg-white rounded-3xl border border-border-main hover:shadow-xs relative overflow-visible">
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
              className="max-w-md w-full border border-border-main md:text-xs text-[10px] rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
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
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white rounded-b-3xl min-h-80">
            <span className="text-xs text-text-muted animate-pulse font-light">
              Loading Disputes Data...
            </span>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white rounded-b-3xl min-h-80">
            <img
              src="/empty.png"
              alt="No data"
              className="w-24 h-24 object-contain opacity-80"
            />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">
                No Open Disputes
              </h3>
              <p className="text-xs text-text-muted font-light">
                Disputes raised by client/provider will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-b-3xl">
            <table className="min-w-full divide-y divide-secondary-bg md:text-sm text-xs tracking-tight">
              <thead className="bg-secondary-bg text-text-primary text-left md:text-sm text-xs font-bold">
                <tr>
                  <th className="px-4 py-2 font-semibold">Dispute ID</th>
                  <th className="px-4 py-2 font-semibold">Transaction ID</th>
                  <th className="px-4 py-2 font-semibold">Booking ID</th>
                  <th className="px-4 py-2 font-semibold">Client</th>
                  <th className="px-4 py-2 font-semibold">Provider</th>
                  <th className="px-4 py-2 font-semibold">Category</th>
                  <th className="px-4 py-2 font-semibold">Date Opened</th>
                  <th className="px-4 py-2 w-20 text-right pr-6 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-bg md:text-sm text-xs text-text-primary">
                {paginated.map((row) => (
                  <tr key={row.id} className="hover:bg-page-bg/50 transition">
                    <td className="px-4 py-3">{row.id}</td>
                    <td className="px-4 py-3 font-mono">{row.txnId}</td>
                    <td className="px-4 py-3 font-mono">{row.bookingId}</td>
                    <td className="px-4 py-3">{row.client}</td>
                    <td className="px-4 py-3">{row.provider}</td>
                    <td className="px-4 py-3">{row.category}</td>
                    <td className="px-4 py-3">{row.dateOpened}</td>
                    <td className="px-4 py-3 text-right pr-6">
                      <button
                        onClick={() => {
                          router.push(`/compliance/disputes/${row.id}`);
                        }}
                        className="inline-block border border-primary-bg-muted hover:border-primary-bg text-primary-bg font-medium px-3.5 py-1 rounded-lg transition cursor-pointer text-center"
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
