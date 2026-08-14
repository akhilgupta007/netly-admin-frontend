"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronDown, Download } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import { exportCSV } from "@/utils/exportHelper";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { auditActionLabel, auditActionClass } from "@/lib/auditActions";
import { toMillis } from "@/services/firestoreReads";
import { roleLabel } from "@/lib/adminRoles";
import { ListSkeleton } from "@/components/ui/Skeleton";

export default function AuditLogsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { logs, isLoading, isError, error } = useAuditLogs();

  // Action options come from the data itself, so the filter can never drift
  // out of sync with the action slugs the backend actually writes.
  const actionOptions = useMemo(() => {
    return [...new Set(logs.map((l) => l.action).filter(Boolean))].sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return logs.filter((log) => {
      const matchSearch =
        !term ||
        // Searchable by who was affected, not only by their uid — an auditor
        // looking for what was done to an account has their email, not an id.
        [
          log.actorEmail,
          log.targetId,
          log.targetName,
          log.targetEmail,
          log.reason,
          log.targetType,
        ].some((field) =>
          String(field || "").toLowerCase().includes(term)
        );

      const matchAction = filterAction === "All" || log.action === filterAction;

      let matchDate = true;
      if (startDate || endDate) {
        // Compare against the stored Timestamp, not a re-parsed display string.
        const at = toMillis(log.createdAtRaw);
        if (at !== null) {
          if (startDate && at < new Date(startDate).setHours(0, 0, 0, 0)) matchDate = false;
          if (endDate && at > new Date(endDate).setHours(23, 59, 59, 999)) matchDate = false;
        }
      }

      return matchSearch && matchAction && matchDate;
    });
  }, [logs, searchTerm, filterAction, startDate, endDate]);

  const paginated = useMemo(() => {
    return filteredLogs.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredLogs, currentPage]);

  const handleExportCSV = () => {
    const headers = ["Timestamp", "Admin", "Role", "Action", "Target Entity", "Affected Account", "Affected Email", "Target ID", "Justification", "IP Address"];
    const escape = (v) => `"${String(v ?? "").replace(/"/g, '""').replace(/\n/g, " ")}"`;
    const rows = filteredLogs.map((log) =>
      [
        log.timestamp,
        log.actorEmail,
        log.actorRole || "",
        auditActionLabel(log.action),
        log.targetType,
        log.targetName,
        log.targetEmail,
        log.targetId,
        log.reason,
        log.ipAddress,
      ].map(escape).join(",")
    );
    exportCSV(headers, rows, `audit_logs_${Date.now()}.csv`);
  };

  return (
    <div className="animate-scale-up text-xs text-text-primary">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none p-4">
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
            className="w-full border border-border-main md:text-xs text-[10px] rounded-full pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted/60"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          <div className="relative">
            <select
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-border-main md:text-xs text-[10px] rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-28"
            >
              <option value="All">All Actions</option>
              {actionOptions.map((action) => (
                <option key={action} value={action}>
                  {auditActionLabel(action)}
                </option>
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
          <h3 className="text-sm font-semibold text-red-600">Could not load audit logs</h3>
          <p className="text-xs text-text-muted font-light max-w-sm">
            {error?.message ||
              "The audit_logs collection may not be readable by admins yet."}
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
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Target Entity</th>
                <th className="px-4 py-3 font-semibold">Affected Account</th>
                <th className="px-4 py-3 font-semibold">Justification</th>
                <th className="px-4 py-3 font-semibold">IP Address</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-bg md:text-sm text-xs">
              {paginated.map((log, idx) => (
                <tr key={idx} className="hover:bg-page-bg/50 transition text-text-primary md:text-xs text-[10px]">
                  <td className="px-4 py-3 whitespace-pre-line leading-relaxed">{log.timestamp}</td>
                  <td className="px-4 py-3">{log.actorEmail}</td>
                  <td className="px-4 py-3 text-text-muted">{log.actorRole ? roleLabel(log.actorRole) : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full md:text-xs text-[10px] whitespace-nowrap ${auditActionClass(log.action)}`}>
                      {auditActionLabel(log.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize">{log.targetType}</td>
                  {/* Who the action was taken against. The uid alone named
                      nobody, so identifying an affected account meant looking
                      it up by hand; it stays underneath, since it is the only
                      thing that survives the account being deleted. */}
                  <td className="px-4 py-3">
                    {log.targetName || log.targetEmail ? (
                      <>
                        {log.targetName && (
                          <span className="block font-medium text-text-primary">
                            {log.targetName}
                          </span>
                        )}
                        {log.targetEmail && (
                          <span className="block text-text-muted break-all">
                            {log.targetEmail}
                          </span>
                        )}
                        <span className="block font-mono text-[9px] text-text-muted/70 break-all">
                          {log.targetId}
                        </span>
                      </>
                    ) : (
                      <span className="font-mono text-[10px] break-all">
                        {log.targetId}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-xs">{log.reason || "—"}</td>
                  <td className="px-4 py-3">{log.ipAddress}</td>
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
