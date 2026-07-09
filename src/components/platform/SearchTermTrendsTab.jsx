"use client";

import React, { useState } from "react";
import { ArrowUpRight, ArrowDownRight, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
import Pagination from "@/components/ui/Pagination";

// Mock trend terms matching Screenshot 3
const mockTrends = [
  { id: "TRD-001", term: "Event planning services", count: 150, change: 72, isPositive: true, matched: false },
  { id: "TRD-002", term: "Tutoring services", count: 95, change: 70, isPositive: true, matched: true },
  { id: "TRD-003", term: "Elderly care assistance", count: 200, change: 85, isPositive: true, matched: false },
  { id: "TRD-004", term: "Landscaping and gardening", count: 130, change: 55, isPositive: true, matched: true },
  { id: "TRD-005", term: "Food meal prep service", count: 170, change: 5, isPositive: false, matched: false },
  { id: "TRD-006", term: "Window cleaning service", count: 75, change: 40, isPositive: true, matched: true },
  { id: "TRD-007", term: "Personal training sessions", count: 88, change: 50, isPositive: true, matched: true },
  { id: "TRD-008", term: "Home cleaning service", count: 210, change: 80, isPositive: true, matched: false },
  { id: "TRD-009", term: "Car wash and detailing", count: 98, change: 5, isPositive: false, matched: true },
  { id: "TRD-010", term: "Pet grooming service", count: 122, change: 65, isPositive: true, matched: true },
  { id: "TRD-011", term: "Grocery delivery service", count: 240, change: 75, isPositive: true, matched: false }
];

export default function SearchTermTrendsTab() {
  const [data, setData] = useState(mockTrends);
  const [onlyUnmatched, setOnlyUnmatched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sorting state: "" (unsorted default), "desc", "asc"
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("desc");

  const handleSort = (field) => {
    if (sortField === field) {
      if (sortDirection === "desc") {
        setSortDirection("asc");
      } else {
        // After asc, clear sorting completely and return to default data order
        setSortField("");
      }
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="text-text-muted/60 shrink-0" />;
    }
    return sortDirection === "asc"
      ? <ArrowUp size={12} className="text-text-primary shrink-0" />
      : <ArrowDown size={12} className="text-text-primary shrink-0" />;
  };

  // Filter
  const filtered = data.filter((item) => {
    if (onlyUnmatched) {
      return !item.matched;
    }
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === "change") {
      // weigh positive vs negative changes
      aVal = a.isPositive ? a.change : -a.change;
      bVal = b.isPositive ? b.change : -b.change;
    }

    if (typeof aVal === "string") {
      return sortDirection === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    } else {
      return sortDirection === "asc"
        ? aVal - bVal
        : bVal - aVal;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginated = sorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="animate-scale-up font-onest text-xs text-text-primary">
      
      {/* Toggle switch filtering header */}
      <div className="flex justify-end bg-white p-4 border border-secondary-bg rounded-t-3xl shadow-2xs">
        <div className="flex items-center gap-2.5 select-none">
          <span className="text-[10px] text-text-muted font-light">Terms with no Matching Category</span>
          <button
            type="button"
            onClick={() => {
              setOnlyUnmatched(!onlyUnmatched);
              setCurrentPage(1);
            }}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              onlyUnmatched ? "bg-[#6FB5BD]" : "bg-secondary-bg"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                onlyUnmatched ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Grid Content wrapper */}
      <div className="bg-white border border-secondary-bg rounded-b-3xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-bg text-xs text-text-primary text-left">
            <thead className="bg-secondary-bg text-text-primary font-semibold">
              <tr>
                <th
                  onClick={() => handleSort("term")}
                  className="px-5 py-3 font-semibold w-1/3 cursor-pointer hover:bg-page-bg/60 select-none"
                >
                  <div className="flex items-center gap-1">
                    Search Term
                    {renderSortIcon("term")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("count")}
                  className="px-5 py-3 font-semibold w-28 cursor-pointer hover:bg-page-bg/60 select-none"
                >
                  <div className="flex items-center gap-1">
                    Count
                    {renderSortIcon("count")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("change")}
                  className="px-5 py-3 font-semibold w-40 cursor-pointer hover:bg-page-bg/60 select-none"
                >
                  <div className="flex items-center gap-1">
                    Week-Week Change
                    {renderSortIcon("change")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("matched")}
                  className="px-5 py-3 font-semibold w-44 cursor-pointer hover:bg-page-bg/60 select-none"
                >
                  <div className="flex items-center gap-1">
                    Has Matching Category
                    {renderSortIcon("matched")}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-bg">
              {paginated.map((item) => (
                <tr key={item.id} className="hover:bg-page-bg/50 transition">
                  <td className="px-5 py-3.5 font-medium text-text-primary">{item.term}</td>
                  <td className="px-5 py-3.5 text-text-primary font-medium">{item.count}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 font-semibold ${
                      item.isPositive ? "text-emerald-500" : "text-rose-500"
                    }`}>
                      {item.isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                      {item.change} %
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`font-semibold ${
                      item.matched ? "text-emerald-500" : "text-rose-500"
                    }`}>
                      {item.matched ? "Yes" : "No"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <Pagination
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={sorted.length}
          onPageChange={setCurrentPage}
        />
      </div>

    </div>
  );
}
