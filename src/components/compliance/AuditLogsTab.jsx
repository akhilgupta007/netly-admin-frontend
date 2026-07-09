"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronDown, Download } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import { exportCSV } from "@/utils/exportHelper";

const mockAuditLogs = [
  { timestamp: "June 2, 2027\n12:45 PM", admin: "contact@netly.io", action: "Rejected", targetEntity: "Provider", targetId: "pr12", justification: "Incomplete documentation submitted.", ipAddress: "192.168.1.21" },
  { timestamp: "May 31, 2027\n09:00 AM", admin: "finance@netly.io", action: "Pending Approval", targetEntity: "Provider", targetId: "pr10", justification: "Additional verification required.", ipAddress: "192.168.1.19" },
  { timestamp: "May 29, 2027\n01:25 PM", admin: "support@netly.io", action: "Rejected", targetEntity: "User", targetId: "pr8", justification: "Documents did not match provided information.", ipAddress: "192.168.1.17" },
  { timestamp: "May 26, 2027\n11:00 AM", admin: "info@netly.io", action: "KYC Approved", targetEntity: "Admin", targetId: "pr5", justification: "Documents verified against utility bill.", ipAddress: "192.168.1.14" },
  { timestamp: "May 27, 2027\n04:50 PM", admin: "contact@netly.io", action: "Pending Approval", targetEntity: "User", targetId: "pr6", justification: "Awaiting additional documents.", ipAddress: "192.168.1.15" },
  { timestamp: "June 1, 2027\n05:15 PM", admin: "info@netly.io", action: "KYC Approved", targetEntity: "User", targetId: "pr11", justification: "Documents verified against employment records.", ipAddress: "192.168.1.20" },
  { timestamp: "May 25, 2027\n02:45 PM", admin: "finance@netly.io", action: "Rejected", targetEntity: "Provider", targetId: "pr4", justification: "Insufficient documentation submitted.", ipAddress: "192.168.1.13" },
  { timestamp: "May 28, 2027\n10:10 AM", admin: "admin@netly.io", action: "KYC Approved", targetEntity: "Provider", targetId: "pr7", justification: "Documents verified against driver's license.", ipAddress: "192.168.1.16" },
  { timestamp: "May 24, 2027\n12:30 PM", admin: "hr@netly.io", action: "KYC Approved", targetEntity: "Provider", targetId: "pr3", justification: "Documents verified against passport database.", ipAddress: "192.168.1.12" }
];

export default function AuditLogsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const filteredLogs = useMemo(() => {
    return mockAuditLogs.filter((log) => {
      const matchSearch =
        log.admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.targetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.justification.toLowerCase().includes(searchTerm.toLowerCase());

      const matchAction = filterAction === "All" || log.action === filterAction;

      return matchSearch && matchAction;
    });
  }, [searchTerm, filterAction, startDate, endDate]);

  const paginated = useMemo(() => {
    return filteredLogs.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredLogs, currentPage]);

  const handleExportCSV = () => {
    const headers = ["Timestamp", "Admin", "Action", "Target Entity", "Target ID", "Justification", "IP Address"];
    const rows = filteredLogs.map(log => `"${log.timestamp.replace(/\n/g, " ")}","${log.admin}","${log.action}","${log.targetEntity}","${log.targetId}","${log.justification}","${log.ipAddress}"`);
    exportCSV(headers, rows, `audit_logs_${Date.now()}.csv`);
  };

  return (
    <div className="space-y-4 p-5 animate-scale-up text-xs text-text-primary">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2 max-w-md flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search logs by admin, ID or reason..."
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
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-border-main text-xs rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-28"
            >
              <option value="All">All Actions</option>
              <option value="Rejected">Rejected</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="KYC Approved">KYC Approved</option>
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
            <h3 className="text-sm font-semibold text-text-primary">No logs found</h3>
            <p className="text-xs text-text-muted font-light">Refine your filters to see entries</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-bg text-left">
            <thead className="bg-secondary-bg font-semibold text-text-primary">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target Entity</th>
                <th className="px-4 py-3">Target ID</th>
                <th className="px-4 py-3">Justification</th>
                <th className="px-4 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-bg">
              {paginated.map((log, idx) => (
                <tr key={idx} className="hover:bg-page-bg/50 transition">
                  <td className="px-4 py-3 whitespace-pre-line text-text-muted leading-relaxed">{log.timestamp}</td>
                  <td className="px-4 py-3 font-medium">{log.admin}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      log.action === "KYC Approved" ? "bg-emerald-50 text-emerald-600" :
                      log.action === "Rejected" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">{log.targetEntity}</td>
                  <td className="px-4 py-3">{log.targetId}</td>
                  <td className="px-4 py-3 font-light text-text-muted">{log.justification}</td>
                  <td className="px-4 py-3 text-text-muted">{log.ipAddress}</td>
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
