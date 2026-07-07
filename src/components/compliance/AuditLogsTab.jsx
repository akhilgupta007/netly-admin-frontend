"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronDown, Download } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";

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

export default function AuditLogsTab({ onExport }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAdmin, setFilterAdmin] = useState("All");
  const [filterAction, setFilterAction] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const filteredLogs = useMemo(() => {
    return mockAuditLogs.filter((log) => {
      const matchSearch = log.justification.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.targetId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchAdmin = filterAdmin === "All" || log.admin === filterAdmin;
      const matchAction = filterAction === "All" || log.action === filterAction;

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

      return matchSearch && matchAdmin && matchAction && matchDate;
    });
  }, [searchTerm, filterAdmin, filterAction, startDate, endDate]);

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
          
          <div className="relative">
            <select
              value={filterAdmin}
              onChange={(e) => {
                setFilterAdmin(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-border-main text-xs rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
            >
              <option value="All">Admin User</option>
              <option value="contact@netly.io">contact@netly.io</option>
              <option value="finance@netly.io">finance@netly.io</option>
              <option value="support@netly.io">support@netly.io</option>
              <option value="info@netly.io">info@netly.io</option>
              <option value="admin@netly.io">admin@netly.io</option>
              <option value="hr@netly.io">hr@netly.io</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-border-main text-xs rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
            >
              <option value="All">Action Type</option>
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
            <h3 className="text-sm font-semibold text-text-primary">No Audit Logs</h3>
            <p className="text-xs text-text-muted font-light">No platform actions match filter criteria.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-bg text-xs text-text-primary">
            <thead className="bg-secondary-bg text-text-primary text-left text-xs font-semibold">
              <tr>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Admin</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Target Entity</th>
                <th className="px-4 py-3 font-semibold">Target ID</th>
                <th className="px-4 py-3 font-semibold">Justification</th>
                <th className="px-4 py-3 font-semibold">IP Address</th>
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
