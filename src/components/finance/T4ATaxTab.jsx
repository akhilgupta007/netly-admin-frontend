"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";
import DateRangePicker from "@/components/ui/DateRangePicker";
import T4APreviewModal from "./T4APreviewModal";

const initialSlips = [
  { id: "1", provider: "Ava Taylor", taxYear: 2024, generatedDate: "Jul 25, 2025", generatedBy: "admin@netly.io" },
  { id: "2", provider: "Ethan Lee", taxYear: 2026, generatedDate: "Oct 18, 2027", generatedBy: "admin@netly.io" },
  { id: "3", provider: "Jackson Davis", taxYear: 2023, generatedDate: "May 6, 2024", generatedBy: "admin@netly.io" },
  { id: "4", provider: "Sophia Martinez", taxYear: 2025, generatedDate: "Mar 22, 2026", generatedBy: "finance@netly.io" },
  { id: "5", provider: "Isabella Martinez", taxYear: 2022, generatedDate: "Dec 5, 2023", generatedBy: "admin@netly.io" }
];

export default function T4ATaxTab() {
  const [slips, setSlips] = useState(initialSlips);
  const [taxYearInput, setTaxYearInput] = useState("2026");
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

  const handleGenerateT4A = (e) => {
    e.preventDefault();
    
    // Simulate generation logs
    const newSlips = [];
    const generatedDateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    
    if (providerInput.trim()) {
      newSlips.push({
        id: String(slips.length + 1),
        provider: providerInput.trim(),
        taxYear: parseInt(taxYearInput),
        generatedDate: generatedDateStr,
        generatedBy: "admin@netly.io"
      });
    } else {
      // Generate for typical default mock names
      const sampleNames = ["Marcus Vance", "Clarissa Harlowe", "Donald Trump"];
      sampleNames.forEach((name, idx) => {
        newSlips.push({
          id: String(slips.length + idx + 1),
          provider: name,
          taxYear: parseInt(taxYearInput),
          generatedDate: generatedDateStr,
          generatedBy: "admin@netly.io"
        });
      });
    }

    setSlips([...newSlips, ...slips]);
    toast.success(`Successfully generated T4A tax slips for tax year ${taxYearInput}!`);
    setProviderInput("");
  };

  const filteredSlips = useMemo(() => {
    return slips.filter((s) => {
      const matchSearch = s.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.generatedBy.toLowerCase().includes(searchTerm.toLowerCase());
      const matchYear = filterYear === "All" || String(s.taxYear) === filterYear;

      return matchSearch && matchYear;
    });
  }, [slips, searchTerm, filterYear, startDate, endDate]);

  const paginated = useMemo(() => {
    return filteredSlips.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredSlips, currentPage]);

  return (
    <div className="space-y-6 animate-scale-up">
      
      {/* Generate T4A Slips Form Panel (Slide 2) */}
      <form onSubmit={handleGenerateT4A} className="bg-white border border-secondary-bg rounded-3xl p-5 space-y-4 shadow-2xs">
        <div className="flex justify-between items-center pb-2 border-b border-secondary-bg">
          <span className="text-xs font-semibold text-text-primary">Generate T4A Slips</span>
          <button
            type="submit"
            className="bg-primary-bg hover:opacity-90 text-white font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
          >
            Generate T4A
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          <div className="space-y-1">
            <label className="text-xs text-text-primary block">Tax year <span className="text-red-500">*</span></label>
            <div className="relative">
              <select
                value={taxYearInput}
                onChange={(e) => setTaxYearInput(e.target.value)}
                className="appearance-none bg-white border border-secondary-bg text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary w-full cursor-pointer"
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

          <div className="space-y-1">
            <label className="text-xs text-text-primary block">Provider (optional)</label>
            <input
              type="text"
              value={providerInput}
              onChange={(e) => setProviderInput(e.target.value)}
              placeholder="Provider Name"
              className="w-full bg-white border border-secondary-bg text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
            />
            <span className="text-[10px] text-text-muted block mt-0.5">Leave blank to generate for all providers</span>
          </div>

        </div>
      </form>

      {/* Slips table listing container box */}
      <div className="border border-secondary-bg rounded-3xl overflow-hidden bg-white shadow-2xs">
        
        {/* Filters control row */}
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
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-border-main text-xs rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
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

        {/* Slips table data listing */}
        {filteredSlips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white rounded-b-3xl">
            <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">No Slips Found</h3>
              <p className="text-xs text-text-muted font-light">No tax slips match search filters.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-bg text-xs text-text-primary">
              <thead className="bg-secondary-bg text-text-primary text-left text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3 font-semibold">Provider</th>
                  <th className="px-4 py-3 font-semibold">Tax Year</th>
                  <th className="px-4 py-3 font-semibold">Generated Date</th>
                  <th className="px-4 py-3 font-semibold">Generated By</th>
                  <th className="px-4 py-3 text-right pr-6 font-semibold w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-bg">
                {paginated.map((row) => (
                  <tr key={row.id} className="hover:bg-page-bg/50 transition">
                    <td className="px-4 py-3.5 font-medium">{row.provider}</td>
                    <td className="px-4 py-3.5 text-text-muted">{row.taxYear}</td>
                    <td className="px-4 py-3.5 text-text-muted">{row.generatedDate}</td>
                    <td className="px-4 py-3.5">{row.generatedBy}</td>
                    <td className="px-4 py-2 text-right pr-6">
                      <button
                        onClick={() => setSelectedSlip(row)}
                        className="border border-primary-bg-muted hover:border-primary-bg text-primary-bg font-semibold text-[10px] px-3.5 py-1 rounded-full transition cursor-pointer text-center whitespace-nowrap"
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
          <div className="flex items-center justify-between border-t border-secondary-bg px-4 py-3.5 bg-white rounded-b-3xl">
            <span className="text-[10px] text-text-muted font-medium">
              Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredSlips.length)} of {filteredSlips.length}
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
                disabled={currentPage * itemsPerPage >= filteredSlips.length}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="w-7 h-7 flex items-center justify-center border border-secondary-bg rounded-lg hover:bg-page-bg transition disabled:opacity-50 text-[10px] font-bold"
              >
                &rarr;
              </button>
            </div>
          </div>
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
