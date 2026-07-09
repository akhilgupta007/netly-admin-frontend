"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronDown, Download, FileText } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";

const mockTransactions = [
  { id: "TXN00192123500007", dateTime: "June 9, 2027\n1:15 PM", client: "Logan Walker", provider: "Zoe Robinson", category: "Post-Construction Cleaning", amount: 500.00, fee: 25.00, commission: 30.00, tip: 20.00, status: "Hour Adjustment Pending" },
  { id: "TXN00192123500004", dateTime: "June 6, 2027\n3:10 PM", client: "Isabella Thomas", provider: "Lucas Garcia", category: "Window Cleaning", amount: 250.00, fee: 12.50, commission: 15.00, tip: 10.00, status: "Completed" },
  { id: "TXN001921235000011", dateTime: "June 13, 2027\n10:30 AM", client: "Chloe Torres", provider: "Daniel Baker", category: "Sanitization Services", amount: 300.00, fee: 15.00, commission: 20.00, tip: 15.00, status: "In Progress" },
  { id: "TXN00192123500009", dateTime: "June 11, 2027\n5:30 PM", client: "Avery King", provider: "Jacob Wright", category: "Commercial Cleaning", amount: 700.00, fee: 35.00, commission: 45.00, tip: 30.00, status: "Refund Requested" },
  { id: "TXN00192123500006", dateTime: "June 8, 2027\n4:00 PM", client: "Amelia Clark", provider: "Alexander Lewis", category: "Deep Cleaning", amount: 400.00, fee: 20.00, commission: 25.00, tip: 15.00, status: "Dispute" },
  { id: "TXN00192123500003", dateTime: "June 5, 2027\n10:00 AM", client: "Ethan Martinez", provider: "Ava Anderson", category: "Pressure Washing", amount: 300.00, fee: 15.00, commission: 20.00, tip: 12.00, status: "Wallet Credited" },
  { id: "TXN00192123500005", dateTime: "June 7, 2027\n9:30 AM", client: "Charlotte Lee", provider: "James Harris", category: "Floor Waxing", amount: 300.00, fee: 15.00, commission: 20.00, tip: 11.00, status: "Pending Provider Accept" }
];

export default function MonthlyAccountingTab({ onExportCSV, onExportPDF }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filteredData = useMemo(() => {
    return mockMockData(mockTransactions).filter((t) => {
      const matchSearch = t.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === "All" || t.status === filterStatus;
      const matchCategory = filterCategory === "All" || t.category === filterCategory;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [searchTerm, filterStatus, filterCategory, startDate, endDate]);

  const paginated = useMemo(() => {
    return filteredData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredData, currentPage]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
      case "Wallet Credited":
        return "text-emerald-500 bg-emerald-50";
      case "In Progress":
      case "Hour Adjustment Pending":
      case "Pending Provider Accept":
        return "text-amber-500 bg-amber-50";
      case "Refund Requested":
        return "text-blue-500 bg-blue-50";
      case "Dispute":
        return "text-red-500 bg-red-50";
      default:
        return "text-text-muted bg-page-bg";
    }
  };

  return (
    <div className="animate-scale-up">
      {/* Top Filter block (Slide 2 top filter bar) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-2.5">
        <div className="flex items-center gap-2 flex-wrap">
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
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Refund Requested">Refund Requested</option>
              <option value="Dispute">Dispute</option>
              <option value="Wallet Credited">Wallet Credited</option>
              <option value="Hour Adjustment Pending">Adjustment Pending</option>
              <option value="Pending Provider Accept">Pending Provider</option>
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

        <div className="flex items-center gap-2">
          <button
            onClick={onExportCSV}
            className="bg-primary-bg hover:opacity-90 text-white font-semibold text-xs py-2 px-4 rounded-full transition cursor-pointer flex items-center gap-1.5"
          >
            <Download size={13} /> Export CSV
          </button>
          <button
            onClick={onExportPDF}
            className="bg-white border border-border-main hover:bg-page-bg text-text-primary font-semibold text-xs py-2 px-4 rounded-full transition cursor-pointer flex items-center gap-1.5"
          >
            <FileText size={13} /> Export PDF
          </button>
        </div>
      </div>

      {/* Primary table area card (Slide 2 card container) */}
      <div className="bg-white border border-secondary-bg rounded-3xl overflow-hidden shadow-2xs">
        
        {/* Table inline header (Search & Category filters) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-secondary-bg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by client/provider's name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-border-main text-xs rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-border-main text-xs rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
              >
                <option value="All">Category</option>
                <option value="Post-Construction Cleaning">Post-Construction</option>
                <option value="Window Cleaning">Window Cleaning</option>
                <option value="Sanitization Services">Sanitization</option>
                <option value="Commercial Cleaning">Commercial</option>
                <option value="Deep Cleaning">Deep Cleaning</option>
                <option value="Pressure Washing">Pressure Washing</option>
                <option value="Floor Waxing">Floor Waxing</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table Content list */}
        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white">
            <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">No Records Found</h3>
              <p className="text-xs text-text-muted font-light">No ledger entries match current criteria.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-bg text-xs text-text-primary">
                <thead className="bg-secondary-bg text-text-primary text-left text-xs font-semibold">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Trans ID</th>
                    <th className="px-4 py-3 font-semibold">Date & Time</th>
                    <th className="px-4 py-3 font-semibold">Client</th>
                    <th className="px-4 py-3 font-semibold">Provider</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Client Fee</th>
                    <th className="px-4 py-3 font-semibold">Commission</th>
                    <th className="px-4 py-3 font-semibold">Tip</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-bg">
                  {paginated.map((item) => (
                    <tr key={item.id} className="hover:bg-page-bg/50 transition">
                      <td className="px-4 py-3.5 text-text-primary font-medium">{item.id}</td>
                      <td className="px-4 py-3.5 whitespace-pre-line text-text-muted leading-relaxed">{item.dateTime}</td>
                      <td className="px-4 py-3.5 font-medium">{item.client}</td>
                      <td className="px-4 py-3.5 font-medium">{item.provider}</td>
                      <td className="px-4 py-3.5 text-text-muted">{item.category}</td>
                      <td className="px-4 py-3.5 font-medium">${item.amount.toFixed(2)}</td>
                      <td className="px-4 py-3.5 text-text-muted">${item.fee.toFixed(2)}</td>
                      <td className="px-4 py-3.5 text-red-500 font-medium">${item.commission.toFixed(2)}</td>
                      <td className="px-4 py-3.5 text-amber-500 font-medium">${item.tip.toFixed(2)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadge(item.status)}`}>
                          <span className="h-1.25 w-1.25 rounded-full bg-current" />
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredData.length}
              onPageChange={setCurrentPage}
            />
          </>
        )}

      </div>
    </div>
  );
}

// Quick helper to prevent reference mutations
function mockMockData(arr) {
  return [...arr];
}
