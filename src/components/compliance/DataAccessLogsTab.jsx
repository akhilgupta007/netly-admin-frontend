"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronDown, Download } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import { exportCSV } from "@/utils/exportHelper";
import { useDataAccessLogs } from "@/hooks/useCompliance";
import { toMillis } from "@/services/firestoreReads";
import { ListSkeleton } from "@/components/ui/Skeleton";

export default function DataAccessLogsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDataType, setFilterDataType] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { logs, isLoading, isError, error } = useDataAccessLogs();

  // Filter options come from the data, so they always match what the backend
  // actually writes.
  const dataTypeOptions = useMemo(
    () => [...new Set(logs.map((l) => l.dataType).filter(Boolean))].sort(),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        log.admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.dataType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.reason.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDataType = filterDataType === "All" || log.dataType === filterDataType;

      let matchDate = true;
      if (startDate || endDate) {
        // Compare the stored Timestamp, not a re-parsed display string.
        const at = toMillis(log.createdAtRaw);
        if (at !== null) {
          if (startDate && at < new Date(startDate).setHours(0, 0, 0, 0)) matchDate = false;
          if (endDate && at > new Date(endDate).setHours(23, 59, 59, 999)) matchDate = false;
        }
      }

      return matchSearch && matchDataType && matchDate;
    });
  }, [logs, searchTerm, filterDataType, startDate, endDate]);

  const paginated = useMemo(() => {
    return filteredLogs.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredLogs, currentPage]);

  const handleExportCSV = () => {
    const headers = ["Timestamp", "Admin", "Data Type", "Record ID", "Reason", "IP Address"];
    const escape = (v) => `"${String(v ?? "").replace(/"/g, '""').replace(/\n/g, " ")}"`;
    const rows = filteredLogs.map((log) =>
      [log.timestamp, log.admin, log.dataType, log.recordId, log.reason, log.ipAddress]
        .map(escape).join(",")
    );
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
            className="w-full border border-border-main md:text-xs text-[10px] rounded-full pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted/60"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          <div className="relative">
            <select
              value={filterDataType}
              onChange={(e) => {
                setFilterDataType(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-border-main md:text-xs text-[10px] rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-28"
            >
              <option value="All">All Data Types</option>
              {dataTypeOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
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
          <ListSkeleton rows={6} columns={5} firstColAvatar />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-2 select-none bg-white min-h-80">
          <h3 className="text-sm font-semibold text-red-600">Could not load data access logs</h3>
          <p className="text-xs text-text-muted font-light max-w-sm">
            {error?.message || "The data_access_logs collection may not be readable yet."}
          </p>
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
          <table className="min-w-full divide-y divide-secondary-bg text-left md:text-sm text-xs">
            <thead className="bg-secondary-bg text-text-primary md:text-sm text-xs">
              <tr>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Admin</th>
                <th className="px-4 py-3 font-semibold">Data Type</th>
                <th className="px-4 py-3 font-semibold">Record ID</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-bg md:text-sm text-xs">
              {paginated.map((log, idx) => (
                <tr key={idx} className="hover:bg-page-bg/50 transition text-text-primary md:text-xs text-[10px]">
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
