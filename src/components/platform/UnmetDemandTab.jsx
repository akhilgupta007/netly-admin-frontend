"use client";

import React, { useState } from "react";
import { Search, MapPin, Download, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import { exportCSV } from "@/utils/exportHelper";

// Mock demand data matching Screenshot 2
const mockDemand = [
  { id: "DEM-001", city: "Lagos", category: "Window Cleaning", count: 45, date: "Jun 24, 2027", dateTime: new Date(2027, 5, 24) },
  { id: "DEM-002", city: "Nairobi", category: "General Cleaning", count: 30, date: "Jul 15, 2027", dateTime: new Date(2027, 6, 15) },
  { id: "DEM-003", city: "Johannesburg", category: "Office Cleaning", count: 50, date: "Aug 01, 2027", dateTime: new Date(2027, 7, 1) },
  { id: "DEM-004", city: "Accra", category: "Carpet Cleaning", count: 25, date: "Sep 10, 2027", dateTime: new Date(2027, 8, 10) },
  { id: "DEM-005", city: "Kampala", category: "Post-Construction Cleaning", count: 60, date: "Oct 05, 2027", dateTime: new Date(2027, 9, 5) },
  { id: "DEM-006", city: "Dar es Salaam", category: "Deep Cleaning", count: 40, date: "Nov 11, 2027", dateTime: new Date(2027, 10, 11) },
  { id: "DEM-007", city: "Abuja", category: "Pressure Washing", count: 55, date: "Dec 20, 2027", dateTime: new Date(2027, 11, 20) },
  { id: "DEM-008", city: "Cairo", category: "Window Cleaning", count: 70, date: "Jan 15, 2028", dateTime: new Date(2028, 0, 15) },
  { id: "DEM-009", city: "Nairobi", category: "Residential Cleaning", count: 35, date: "Feb 28, 2028", dateTime: new Date(2028, 1, 28) }
];

export default function UnmetDemandTab() {
  const [data, setData] = useState(mockDemand);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 10;

  // Filter
  const filtered = data.filter((item) => {
    const matchesSearch =
      item.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (startDate && endDate) {
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      const val = new Date(item.dateTime).getTime();
      matchesDate = val >= start && val <= end;
    }

    return matchesSearch && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // CSV Exporter
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error("No data available to export.");
      return;
    }
    const headers = ["City", "Category", "No Result Searches", "Last Search"];
    const rows = filtered.map(item => `"${item.city}","${item.category}",${item.count},"${item.date}"`);
    exportCSV(headers, rows, `unmet_demand_${Date.now()}.csv`);
  };

  return (
    <div className="space-y-4 animate-scale-up font-onest text-xs text-text-primary">
      
      {/* Search and Filters Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-secondary-bg rounded-3xl shadow-2xs">
        
        <div className="flex flex-1 max-w-md relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by city or category..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full border border-border-main text-xs rounded-full pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted/60"
          />
        </div>

        <div className="flex items-center gap-2">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
              setCurrentPage(1);
            }}
          />

          <button
            onClick={handleExportCSV}
            className="bg-[#6FB5BD] hover:bg-[#5da0a8] text-white font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer select-none flex items-center gap-1.5 shadow-2xs h-9.5 shrink-0"
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Grid Content wrapper */}
      <div className="bg-white border border-secondary-bg rounded-3xl overflow-hidden shadow-2xs">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center space-y-4 select-none bg-white">
            <img src="/empty.png" alt="No unmet demand" className="w-16 h-16 object-contain opacity-75 animate-pulse" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">No search data available yet</h3>
              <p className="text-xs text-text-muted font-light">Data populates once the app is live</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-bg text-xs text-text-primary text-left">
                <thead className="bg-secondary-bg text-text-primary font-semibold">
                  <tr>
                    <th className="px-5 py-3 font-semibold w-1/4">City</th>
                    <th className="px-5 py-3 font-semibold w-1/3">Category</th>
                    <th className="px-5 py-3 font-semibold text-center w-32">No Result Searches</th>
                    <th className="px-5 py-3 font-semibold text-center w-32">Last Search</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-bg">
                  {paginated.map((item) => (
                    <tr key={item.id} className="hover:bg-page-bg/50 transition">
                      <td className="px-5 py-3.5 flex items-center gap-2">
                        <MapPin size={13} className="text-text-muted shrink-0" />
                        <span className="font-semibold text-text-primary">{item.city}</span>
                      </td>
                      <td className="px-5 py-3.5 font-light text-text-muted">{item.category}</td>
                      <td className="px-5 py-3.5 text-center font-semibold text-text-primary">{item.count}</td>
                      <td className="px-5 py-3.5 text-center text-text-muted font-light">{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <Pagination
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filtered.length}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

    </div>
  );
}
