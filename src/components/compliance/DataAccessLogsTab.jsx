"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronDown, Download } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import { exportCSV } from "@/utils/exportHelper";

const mockDataAccessLogs = [
  { timestamp: "May 22, 2026\n03:20 PM", admin: "admin@netly.io", dataType: "KYC Document", recordId: "kyc-01", reason: "Document review for KYC approval workflow" },
  { timestamp: "May 23, 2026\n10:15 AM", admin: "support@netly.io", dataType: "Tax Return", recordId: "tax-01", reason: "Annual tax documentation submission" },
  { timestamp: "May 24, 2026\n01:45 PM", admin: "hr@netly.io", dataType: "Employment Verification", recordId: "emp-01", reason: "Verification of employment status for onboarding" },
  { timestamp: "May 25, 2026\n09:30 AM", admin: "legal@netly.io", dataType: "Contract Agreement", recordId: "contract-01", reason: "Review of the new partnership contract" },
  { timestamp: "May 26, 2026\n02:00 PM", admin: "finance@netly.io", dataType: "Invoice", recordId: "inv-01", reason: "Invoice submission for services rendered" },
  { timestamp: "May 27, 2026\n11:00 AM", admin: "marketing@netly.io", dataType: "Ad Campaign Proposal", recordId: "ad-01", reason: "Proposal for the upcoming ad campaign review" },
  { timestamp: "May 28, 2026\n03:55 PM", admin: "dev@netly.io", dataType: "Software Update", recordId: "update-01", reason: "Documentation for the latest software update" },
  { timestamp: "May 29, 2026\n04:30 PM", admin: "quality@netly.io", dataType: "Quality Assurance Report", recordId: "qa-01", reason: "Report on quality checks and testing outcomes" },
  { timestamp: "June 15, 2026\n10:00 AM", admin: "dev@netly.io", dataType: "Development Update", recordId: "dev-02", reason: "Overview of recent feature developments and bug fixes" }
];

export default function DataAccessLogsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDataType, setFilterDataType] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);
  const itemsPerPage = 7;

  const filteredLogs = useMemo(() => {
    return mockDataAccessLogs.filter((log) => {
      const matchSearch =
        log.admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.dataType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.reason.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDataType = filterDataType === "All" || log.dataType === filterDataType;

      let matchDate = true;
      if (startDate || endDate) {
        const logDate = new Date(log.timestamp.split("\n")[0]);
        const compareDate = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
        
        if (startDate) {
          const startCompare = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          if (compareDate < startCompare) matchDate = false;
        }
        if (endDate) {
          const endCompare = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          if (compareDate > endCompare) matchDate = false;
        }
      }

      return matchSearch && matchDataType && matchDate;
    });
  }, [searchTerm, filterDataType, startDate, endDate]);

  const paginated = useMemo(() => {
    return filteredLogs.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredLogs, currentPage]);

  const handleExportCSV = () => {
    const headers = ["Timestamp", "Admin", "Data Type", "Record ID"];
    const rows = filteredLogs.map(log => `"${log.timestamp.replace(/\n/g, " ")}","${log.admin}","${log.dataType}","${log.recordId}"`);
    exportCSV(headers, rows, `data_access_logs_${Date.now()}.csv`);
  };

  return (
    <div className="animate-scale-up text-xs text-text-primary">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none p-4">
        <div className="flex items-center gap-2 max-w-md flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search logs by admin, type or reason..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full border border-border-main text-xs rounded-full pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted/60"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <select
              value={filterDataType}
              onChange={(e) => {
                setFilterDataType(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-border-main text-xs rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-28"
            >
              <option value="All">All Data Types</option>
              <option value="KYC Document">KYC Document</option>
              <option value="Tax Return">Tax Return</option>
              <option value="Employment Verification">Employment Verification</option>
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

          <button
            onClick={handleExportCSV}
            className="bg-primary-bg hover:opacity-90 text-white font-medium text-xs py-3 px-4 rounded-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Logs Table grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white rounded-b-3xl min-h-80">
          <span className="text-xs text-text-muted animate-pulse font-light">Loading Data Access Logs Data...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white rounded-b-3xl min-h-80">
          <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-text-primary">No logs found</h3>
            <p className="text-xs text-text-muted font-light">Refine your filters to see entries</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-bg text-left">
            <thead className="bg-secondary-bg text-text-primary text-sm">
              <tr>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Admin</th>
                <th className="px-4 py-3 font-semibold">Data Type</th>
                <th className="px-4 py-3 font-semibold">Record ID</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-bg">
              {paginated.map((log, idx) => (
                <tr key={idx} className="hover:bg-page-bg/50 transition text-text-primary text-xs">
                  <td className="px-4 py-3 whitespace-pre-line leading-relaxed">{log.timestamp}</td>
                  <td className="px-4 py-3">{log.admin}</td>
                  <td className="px-4 py-3">{log.dataType}</td>
                  <td className="px-4 py-3">{log.recordId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Table Pagination Footer */}
      {filteredLogs.length > 0 && (
        <Pagination
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={filteredLogs.length}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
