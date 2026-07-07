"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronDown, Download } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";

const mockDataAccessLogs = [
  { timestamp: "May 22, 2027\n03:20 PM", admin: "admin@netly.io", dataType: "KYC Document", recordId: "kyc-01", reason: "Document review for KYC approval workflow" },
  { timestamp: "May 23, 2027\n10:15 AM", admin: "support@netly.io", dataType: "Tax Return", recordId: "tax-01", reason: "Annual tax documentation submission" },
  { timestamp: "May 24, 2027\n01:45 PM", admin: "hr@netly.io", dataType: "Employment Verification", recordId: "emp-01", reason: "Verification of employment status for onboarding" },
  { timestamp: "May 25, 2027\n09:30 AM", admin: "legal@netly.io", dataType: "Contract Agreement", recordId: "contract-01", reason: "Review of the new partnership contract" },
  { timestamp: "May 26, 2027\n02:00 PM", admin: "finance@netly.io", dataType: "Invoice", recordId: "inv-01", reason: "Invoice submission for services rendered" },
  { timestamp: "May 27, 2027\n11:00 AM", admin: "marketing@netly.io", dataType: "Ad Campaign Proposal", recordId: "ad-01", reason: "Proposal for the upcoming ad campaign review" },
  { timestamp: "May 28, 2027\n03:55 PM", admin: "dev@netly.io", dataType: "Software Update", recordId: "update-01", reason: "Documentation for the latest software update" },
  { timestamp: "May 29, 2027\n04:30 PM", admin: "quality@netly.io", dataType: "Quality Assurance Report", recordId: "qa-01", reason: "Report on quality checks and testing outcomes" },
  { timestamp: "June 15, 2027\n10:00 AM", admin: "dev@netly.io", dataType: "Development Update", recordId: "dev-02", reason: "Overview of recent feature developments and bug fixes" }
];

export default function DataAccessLogsTab({ onExport }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDataType, setFilterDataType] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const filteredLogs = useMemo(() => {
    return mockDataAccessLogs.filter((log) => {
      const matchSearch = log.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.recordId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDataType = filterDataType === "All" || log.dataType === filterDataType;

      let matchDate = true;
      if (startDate && endDate) {
        const cleanDateStr = log.timestamp.split("\n")[0];
        const logTime = new Date(cleanDateStr);
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        matchDate = logTime >= start && logTime <= end;
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

  return (
    <div className="animate-scale-up">
      {/* Filters row bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white rounded-t-3xl border-b border-secondary-bg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by email..."
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
              value={filterDataType}
              onChange={(e) => {
                setFilterDataType(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-border-main text-xs rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
            >
              <option value="All">Data Type</option>
              <option value="KYC Document">KYC Document</option>
              <option value="Tax Return">Tax Return</option>
              <option value="Employment Verification">Employment Verification</option>
              <option value="Contract Agreement">Contract Agreement</option>
              <option value="Invoice">Invoice</option>
              <option value="Ad Campaign Proposal">Ad Proposal</option>
              <option value="Software Update">Software Update</option>
              <option value="Quality Assurance Report">QA Report</option>
              <option value="Development Update">Dev Update</option>
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
            onClick={onExport}
            className="bg-primary-bg hover:opacity-90 text-white font-semibold text-xs py-2 px-4 rounded-full transition cursor-pointer flex items-center gap-1.5"
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Logs Table grid */}
      {filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white rounded-b-3xl">
          <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-text-primary">No Data Access Logs</h3>
            <p className="text-xs text-text-muted font-light">No platform accesses match filter criteria.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-bg text-xs text-text-primary">
            <thead className="bg-secondary-bg text-text-primary text-left text-xs font-semibold">
              <tr>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Admin</th>
                <th className="px-4 py-3 font-semibold">Data Type</th>
                <th className="px-4 py-3 font-semibold">Record ID</th>
                <th className="px-4 py-3 font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-bg">
              {paginated.map((log, idx) => (
                <tr key={idx} className="hover:bg-page-bg/50 transition">
                  <td className="px-4 py-3 whitespace-pre-line text-text-muted leading-relaxed">{log.timestamp}</td>
                  <td className="px-4 py-3 font-medium">{log.admin}</td>
                  <td className="px-4 py-3 font-semibold text-text-primary">{log.dataType}</td>
                  <td className="px-4 py-3">{log.recordId}</td>
                  <td className="px-4 py-3 font-light text-text-muted">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Table Pagination Footer */}
      {filteredLogs.length > 0 && (
        <div className="flex items-center justify-between border-t border-secondary-bg px-4 py-3.5 bg-white rounded-b-3xl">
          <span className="text-[10px] text-text-muted font-medium">
            Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="w-7 h-7 flex items-center justify-center border border-secondary-bg rounded-lg hover:bg-page-bg transition disabled:opacity-50 text-[10px] font-bold"
            >
              &larr;
            </button>
            <button
              disabled={currentPage * itemsPerPage >= filteredLogs.length}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="w-7 h-7 flex items-center justify-center border border-secondary-bg rounded-lg hover:bg-page-bg transition disabled:opacity-50 text-[10px] font-bold"
            >
              &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
