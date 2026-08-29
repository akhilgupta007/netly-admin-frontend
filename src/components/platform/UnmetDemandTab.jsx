"use client";

import React, { useState } from "react";
import { Search, MapPin, Download, Bell, Loader2, X } from "lucide-react";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import { exportCSV } from "@/utils/exportHelper";
import { useUnmetDemand } from "@/hooks/useDashboard";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { notifyUnmetDemand, defaultDemandCopy } from "@/lib/callables";

/**
 * One labelled box in the message form, with a live character count.
 *
 * The count is shown rather than just enforced because the backend rejects an
 * over-long field outright — finding that out after pressing Send, on an
 * action that reaches real clients, is a worse experience than seeing the
 * limit while typing.
 *
 * @param {object} props - Options.
 * @param {string} props.label - Field label.
 * @param {string} props.value - Current text.
 * @param {number} props.maxLength - Character ceiling, matching the callable.
 * @param {number} [props.rows] - Renders a textarea when set.
 * @param {Function} props.onChange - Receives the new text.
 * @return {JSX.Element} The field.
 */
function Field({ label, value, maxLength, rows, onChange }) {
  const shared =
    "w-full border border-border-main rounded-lg px-2.5 py-2 text-xs " +
    "text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-bg " +
    "placeholder:text-text-muted/60";
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-[10px] text-text-muted font-light">
          {label}
        </label>
        <span
          className={`text-[10px] font-light ${
            value.length > maxLength ? "text-red-500" : "text-text-muted/70"
          }`}
        >
          {value.length}/{maxLength}
        </span>
      </div>
      {rows ? (
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${shared} resize-none leading-relaxed`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={shared}
        />
      )}
    </div>
  );
}

export default function UnmetDemandTab() {
  // availability_alerts records a search where no provider covered the area,
  // grouped here by city and category.
  const { rows: data, isLoading, isError } = useUnmetDemand();
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  // The row awaiting confirmation. Notifying pushes to real clients and cannot
  // be taken back, so it never fires straight off the button.
  const [confirming, setConfirming] = useState(null);
  const [copy, setCopy] = useState(null);

  // Re-seed the form when a different row is opened, during render rather than
  // in an effect so the previous row's wording is never on screen for a frame
  // — the text is about to be sent to real people, and a stale city name in
  // the box for even one frame is the kind of thing that gets approved.
  const [copyKey, setCopyKey] = useState(null);
  if (confirming && confirming.id !== copyKey) {
    setCopyKey(confirming.id);
    setCopy(defaultDemandCopy(confirming));
  }

  // Mirrors the callable's own checks so Send is unavailable rather than
  // failing server-side. The backend still enforces them — this is the
  // courtesy, not the boundary.
  const isCopyValid =
    Boolean(copy) &&
    [
      [copy?.title, 100],
      [copy?.frenchTitle, 100],
      [copy?.body, 500],
      [copy?.frenchBody, 500],
    ].every(([v, max]) => (v || "").trim().length > 0 && v.length <= max);

  const queryClient = useQueryClient();

  const notifyMutation = useMutation({
    mutationFn: notifyUnmetDemand,
    onSuccess: (result) => {
      const n = result?.notified ?? 0;
      toast.success(
        n === 1 ? "1 client notified." : `${n} clients notified.`,
      );
      setConfirming(null);
      // The rows carry pending counts and alert ids, both of which the send
      // just changed.
      queryClient.invalidateQueries({ queryKey: ["unmetDemand"] });
    },
    onError: (err) => toast.error(err.message),
  });

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
    <div className="animate-scale-up font-onest text-xs text-text-primary">
      
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none p-4">
        
        <div className="flex items-center gap-2 max-w-md flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by city or category..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full border border-border-main md:text-xs text-[10px] rounded-full pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted/60"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
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

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white rounded-b-3xl">
          <img src="/empty.png" alt="No unmet demand" className="w-16 h-16 object-contain opacity-75" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-text-primary">No search data available yet</h3>
            <p className="text-xs text-text-muted font-light">Data populates once the app is live</p>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-bg text-left md:text-sm text-xs">
              <thead className="bg-secondary-bg text-text-primary md:text-sm text-xs font-bold">
                <tr>
                  <th className="px-4 py-3 font-semibold w-1/4">City</th>
                  <th className="px-4 py-3 font-semibold w-1/3">Category</th>
                  <th className="px-4 py-3 font-semibold text-center w-32">No Result Searches</th>
                  <th className="px-4 py-3 font-semibold text-center w-32">Last Search</th>
                  <th className="px-4 py-3 font-semibold text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-bg md:text-sm text-xs text-text-primary">
                {isLoading ? (
                  <TableSkeleton columns={5} rows={5} />
                ) : isError ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-text-muted font-light">
                      Could not load demand data.
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-text-muted font-light">
                      No unmet demand recorded yet. Rows appear when a client
                      searches somewhere no provider covers.
                    </td>
                  </tr>
                ) : paginated.map((item) => (
                  <tr key={item.id} className="hover:bg-page-bg/50 transition">
                    <td className="px-4 py-3 flex items-center gap-2">
                      <MapPin size={13} className="text-text-muted shrink-0" />
                      <span>{item.city}</span>
                    </td>
                    <td className="px-4 py-3">{item.category}</td>
                    <td className="px-4 py-3 text-center">{item.count}</td>
                    <td className="px-4 py-3 text-center">{item.date}</td>
                    <td className="px-4 py-3 text-center">
                      {item.pending > 0 ? (
                        <button
                          onClick={() => setConfirming(item)}
                          className="bg-white border border-border-main hover:border-primary-bg hover:text-primary-bg text-text-primary font-medium text-[11px] py-1.5 px-3 rounded-lg transition cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Bell size={12} />
                          Notify Users
                        </button>
                      ) : (
                        // Every search here has already been answered. The row
                        // stays visible because the demand it records is still
                        // worth seeing when planning recruitment.
                        <span className="text-[11px] text-text-muted font-light">
                          Notified
                        </span>
                      )}
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
            totalItems={filtered.length}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {confirming && copy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-onest p-4">
          <div
            className="absolute inset-0 bg-alt-bg/40 backdrop-blur-xs"
            onClick={() => !notifyMutation.isPending && setConfirming(null)}
          />

          <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl z-10 border border-border-main animate-scale-up">
            <div className="flex items-start justify-between p-4 border-b border-border-main gap-4">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-text-primary">
                  Notify{" "}
                  {confirming.recipients === 1 ?
                    "1 client" :
                    `${confirming.recipients} clients`}
                </h3>
                <p className="text-[10px] text-text-muted font-light truncate">
                  {confirming.city} · {confirming.category}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirming(null)}
                disabled={notifyMutation.isPending}
                className="w-6 h-6 rounded-full bg-text-primary text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer shrink-0 disabled:opacity-50"
                aria-label="Close"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              <p className="text-[11px] text-text-muted font-light">
                Edit what they will receive:
              </p>

              <Field
                label="Title"
                value={copy.title}
                maxLength={100}
                onChange={(v) => setCopy((c) => ({ ...c, title: v }))}
              />
              <Field
                label="Message"
                value={copy.body}
                maxLength={500}
                rows={3}
                onChange={(v) => setCopy((c) => ({ ...c, body: v }))}
              />

              {/*
                French is edited here rather than generated, because the apps
                are bilingual: an admin who rewrites only the English would
                otherwise send francophone clients the untouched template, and
                two different messages would go out under one approval.
              */}
              <div className="pt-1 border-t border-border-main/60 space-y-3">
                <p className="text-[10px] text-text-muted font-light uppercase tracking-wider">
                  French version
                </p>
                <Field
                  label="Titre"
                  value={copy.frenchTitle}
                  maxLength={100}
                  onChange={(v) => setCopy((c) => ({ ...c, frenchTitle: v }))}
                />
                <Field
                  label="Message"
                  value={copy.frenchBody}
                  maxLength={500}
                  rows={3}
                  onChange={(v) => setCopy((c) => ({ ...c, frenchBody: v }))}
                />
              </div>

              {/*
                The count is people, not searches — the two differ whenever
                somebody searched more than once, and promising the larger
                number would be a lie about how many were reached.
              */}
              <p className="text-[10px] text-text-muted font-light">
                Sent once per person, covering {confirming.pending}{" "}
                {confirming.pending === 1 ? "search" : "searches"}. This cannot
                be undone.
              </p>
            </div>

            <div className="flex gap-2 p-4 border-t border-border-main">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                disabled={notifyMutation.isPending}
                className="flex-1 bg-white border border-border-main text-text-primary hover:bg-page-bg font-semibold text-xs py-2.5 rounded-lg transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  notifyMutation.mutate({
                    alertIds: confirming.alertIds,
                    ...copy,
                  })
                }
                disabled={notifyMutation.isPending || !isCopyValid}
                className="flex-1 bg-primary-bg hover:bg-primary-bg-muted text-white font-semibold text-xs py-2.5 rounded-lg transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {notifyMutation.isPending && (
                  <Loader2 size={13} className="animate-spin" />
                )}
                {notifyMutation.isPending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
