"use client";

import React, { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { generateT4AReport } from "@/lib/callables";
import { Search, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import T4APreviewModal from "./T4APreviewModal";

export default function T4ATaxTab() {
  const [slips, setSlips] = useState([]);
  const [report, setReport] = useState(null);
  const [taxYearInput, setTaxYearInput] = useState(
    String(new Date().getFullYear() - 1),
  );
  const [providerInput, setProviderInput] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Preview Modal target state
  const [selectedSlip, setSelectedSlip] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const generate = useMutation({
    mutationFn: generateT4AReport,
    onSuccess: (result) => {
      setReport(result);
      // One row per provider who cleared the reporting threshold.
      setSlips(
        (result.providers || []).map((p) => ({
          id: p.uid,
          provider: p.legalName || p.email || p.uid,
          taxYear: result.year,
          generatedDate: new Date(result.generatedAt).toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
              year: "numeric",
            },
          ),
          generatedBy: p.province || "—",
          amount: p.box048FeesForServices,
          jobs: p.jobs,
          hasSin: p.hasSin,
          warnings: p.warnings || [],
        })),
      );
      setCurrentPage(1);

      const t = result.totals;
      if (t.providers === 0) {
        toast.info(
          `No provider earned above the reporting threshold in ${result.year}.`,
        );
      } else if (t.blocked > 0) {
        // Filing without a SIN is impossible, so this is surfaced rather than
        // buried in a per-row warning.
        toast.warn(
          `${t.providers} provider(s) found — ${t.blocked} cannot be filed yet ` +
            "(missing SIN or legal name).",
        );
      } else {
        toast.success(`${t.filable} slip(s) ready for ${result.year}.`);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const handleGenerateT4A = (e) => {
    e.preventDefault();
    const year = parseInt(taxYearInput, 10);
    if (!Number.isInteger(year)) {
      toast.error("Pick a tax year.");
      return;
    }
    generate.mutate({ year });
  };

  const filteredSlips = useMemo(() => {
    return slips.filter((s) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        s.provider.toLowerCase().includes(term) ||
        String(s.generatedBy).toLowerCase().includes(term);
      const matchYear =
        filterYear === "All" || String(s.taxYear) === filterYear;

      return matchSearch && matchYear;
    });
  }, [slips, searchTerm, filterYear, startDate, endDate]);

  const paginated = useMemo(() => {
    return filteredSlips.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  }, [filteredSlips, currentPage]);

  // Nothing loads until a year is generated, so the table starts empty.
  const isLoading = generate.isPending;

  return (
    <div className="space-y-4 animate-scale-up">
      {/* Generate T4A Slips Form Panel (Slide 2) */}
      <form
        onSubmit={handleGenerateT4A}
        className="bg-white border border-border-main rounded-3xl p-5 space-y-4 hover:shadow-xs"
      >
        <div className="flex justify-between items-center pb-2 gap-4">
          <span className="text-sm font-semibold text-text-primary">
            Generate T4A Slips
          </span>
          <button
            type="submit"
            className="bg-primary-bg hover:opacity-90 text-white font-medium text-sm py-2.5 md:px-10 px-6 rounded-lg transition cursor-pointer"
          >
            Generate T4A
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <label className="text-xs text-text-primary block">
              Tax year <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={taxYearInput}
                onChange={(e) => setTaxYearInput(e.target.value)}
                className="appearance-none bg-white border border-border-main text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary w-full cursor-pointer"
              >
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
              <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-text-muted pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-text-primary block">
              Provider (optional)
            </label>
            <input
              type="text"
              value={providerInput}
              onChange={(e) => setProviderInput(e.target.value)}
              placeholder="Provider Name"
              className="w-full bg-white border border-border-main text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
            />
            <span className="text-[10px] text-text-muted block mt-0.5">
              Leave blank to generate for all providers
            </span>
          </div>
        </div>
      </form>

      {/* Slips table listing container box */}
      <div className="border border-border-main rounded-3xl overflow-visible bg-white hover:shadow-xs relative z-20">
        {/* Filters control row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white rounded-t-3xl border-b border-border-main">
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
              className="max-w-md w-full border border-border-main md:text-xs text-[10px] rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
            />
          </div>

          <div className="flex items-center gap-2 justify-center">
            <div className="relative">
              <select
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-border-main md:text-xs text-[10px] rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
              >
                <option value="All">Tax Year</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
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
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white rounded-b-3xl min-h-80">
            <span className="text-xs text-text-muted animate-pulse font-light">
              Loading T4A Slips Data...
            </span>
          </div>
        ) : filteredSlips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white rounded-b-3xl min-h-80">
            <img
              src="/empty.png"
              alt="No data"
              className="w-16 h-16 object-contain opacity-75"
            />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">
                No Slips Found
              </h3>
              <p className="text-xs text-text-muted font-light">
                No tax slips match search filters.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-b-3xl">
            <table className="min-w-full divide-y divide-secondary-bg md:text-sm text-xs tracking-tight">
              <thead className="bg-secondary-bg text-text-primary text-left md:text-sm text-xs">
                <tr>
                  <th className="px-4 py-3 font-semibold">Provider</th>
                  <th className="px-4 py-3 font-semibold">Tax Year</th>
                  <th className="px-4 py-3 font-semibold">Generated Date</th>
                  <th className="px-4 py-3 font-semibold">Box 048 (Fees)</th>
                  <th className="px-4 py-3 font-semibold">Jobs</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right pr-6 font-semibold w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-bg md:text-sm text-xs text-text-primary">
                {paginated.map((row) => (
                  <tr key={row.id} className="hover:bg-page-bg/50 transition">
                    <td className="px-4 py-3">{row.provider}</td>
                    <td className="px-4 py-3">{row.taxYear}</td>
                    <td className="px-4 py-3">{row.generatedDate}</td>
                    <td className="px-4 py-3 font-semibold">
                      $
                      {row.amount?.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3">{row.jobs}</td>
                    <td className="px-4 py-3">
                      {row.warnings.length === 0 ? (
                        <span className="text-emerald-600 font-medium">
                          Ready
                        </span>
                      ) : (
                        <span
                          className="text-amber-600 font-medium"
                          title={row.warnings.join(" ")}
                        >
                          Blocked
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right pr-6">
                      <button
                        onClick={() => setSelectedSlip(row)}
                        className="border border-primary-bg-muted hover:border-primary-bg text-primary-bg font-semibold md:text-xs text-[10px] px-3.5 py-1 rounded-lg transition cursor-pointer text-center whitespace-nowrap"
                      >
                        Preview & Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredSlips.length > 0 && (
          <Pagination
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredSlips.length}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Slip Preview Modal */}
      {selectedSlip && (
        <T4APreviewModal
          slip={selectedSlip}
          onClose={() => setSelectedSlip(null)}
        />
      )}
    </div>
  );
}
