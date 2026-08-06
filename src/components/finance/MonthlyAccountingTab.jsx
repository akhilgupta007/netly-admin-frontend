"use client";

import React, { useState } from "react";
import { Search, ChevronDown, Download, FileText } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import CardWrapper from "@/components/ui/CardWrapper";
import { useMonthlyAccounting } from "@/hooks/useFinance";
import { exportCSV, exportPDF } from "@/utils/exportHelper";


/** Formats a number as CAD, or an em dash while loading. */
const currency = (n) =>
  n === null || n === undefined ?
    "—" :
    `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

/**
 * Scales each series to a 0–100 bar height against its own maximum.
 *
 * The bars previously carried literal percentages with a made-up multiplier in
 * the tooltip, so the number shown had no relation to the height. Heights are
 * now derived from the real figures and the tooltip shows the actual amount.
 *
 * @param {Array<object>} months - Rows from the read layer.
 * @return {Array<object>} Rows with h* height fields added.
 */
function scaleBars(months) {
  const keys = ["volume", "amount", "fees", "commission", "payout"];
  const max = {};
  keys.forEach((k) => {
    max[k] = Math.max(1, ...months.map((m) => Number(m[k]) || 0));
  });
  return months.map((m) => {
    const row = { ...m };
    keys.forEach((k) => {
      row["h_" + k] = Math.round(((Number(m[k]) || 0) / max[k]) * 100);
    });
    return row;
  });
}

export default function MonthlyAccountingTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [hoveredValue, setHoveredValue] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [year] = useState(new Date().getFullYear());
  const itemsPerPage = 8;

  const {
    transactions,
    months,
    totalCount,
    isLoading,
    isError,
  } = useMonthlyAccounting({
    searchTerm,
    year,
    page: currentPage,
    limit: itemsPerPage,
  });

  const chartRows = scaleBars(months);
  const yearTotals = months.reduce(
      (a, m) => ({
        volume: a.volume + m.volume,
        amount: a.amount + m.amount,
        revenue: a.revenue + m.fees + m.commission,
        payout: a.payout + m.payout,
      }),
      { volume: 0, amount: 0, revenue: 0, payout: 0 },
  );
  const handleExportCSV = () => {
    const headers = ["Transaction ID", "Date", "Time", "Client", "Provider", "Category", "Amount ($)", "Client Fee ($)", "Commission ($)", "Provider Payout ($)", "Status"];
    const rows = transactions.map(item => `"${item.id}","${item.date}","${item.time}","${item.client}","${item.provider}","${item.category}",${item.gross},${item.fee},${item.commission},${item.providerPayout},"${item.status}"`);
    exportCSV(headers, rows, `monthly_accounting_${Date.now()}.csv`);
  };

  const handleExportPDF = () => {
    const headers = ["TXN ID", "Date", "Time", "Client", "Provider", "Category", "Amount", "Client Fee", "Commission", "Provider Payout", "Status"];
    const rows = transactions.map(item => [
      item.id,
      item.date,
      item.time,
      item.client,
      item.provider,
      item.category,
      `$${item.gross.toFixed(2)}`,
      `$${item.fee.toFixed(2)}`,
      `$${item.commission.toFixed(2)}`,
      `$${item.providerPayout.toFixed(2)}`,
      item.status
    ]);
    exportPDF("Monthly Accounting Report", headers, rows, `monthly_accounting_${Date.now()}.pdf`);
  };

  // Search and pagination are applied in the read layer, so the rows returned
  // are already the current page.
  const filteredData = transactions;
  const paginated = transactions;

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return "text-emerald-500 bg-emerald-50";
      case "In Progress":
        return "text-amber-500 bg-amber-50";
      case "Refund Requested":
        return "text-blue-500 bg-blue-50";
      case "Dispute":
        return "text-red-500 bg-red-50";
      default:
        return "text-text-muted bg-page-bg";
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 py-20 px-4 text-center select-none bg-white rounded-3xl border border-border-main animate-scale-up space-y-2">
        <h3 className="text-sm font-semibold text-text-primary">Could not load accounting data</h3>
        <p className="text-xs text-text-muted font-light">
          Check your connection and refresh. Figures are read directly from Firestore.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 py-20 px-4 text-center select-none bg-white rounded-3xl border border-border-main hover:shadow-xs animate-scale-up">
        <span className="text-xs text-text-muted animate-pulse font-light">Loading Accounting Data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-scale-up font-onest">

      {/* Export Action Buttons matching TransactionVolumeTab & NetRevenueTab */}
      <div className="flex sm:justify-end items-center justify-center pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-primary-bg hover:opacity-90 text-white font-semibold text-xs py-2.5 px-4 rounded-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <Download size={13} /> Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-white border border-text-primary hover:bg-page-bg text-text-primary font-semibold text-xs py-2.5 px-4 rounded-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <FileText size={13} /> Export PDF
          </button>
        </div>
      </div>

      {/* 1. Primary Top Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <CardWrapper
          name="TOTAL TRANSACTIONS"
          value={yearTotals.volume.toLocaleString()}
          subtext={`Paid bookings in ${year}`}
        />
        <CardWrapper
          name="TRANSACTION VOLUME"
          value={currency(yearTotals.amount)}
          subtext="Gross charged to clients"
        />
        <CardWrapper
          name="PLATFORM REVENUE"
          value={currency(yearTotals.revenue)}
          subtext="Fees + commissions collected"
        />
        <CardWrapper
          name="PROVIDER PAYOUTS"
          value={currency(yearTotals.payout)}
          subtext="85% earned by providers"
        />
      </div>

      {/* 2. Grouped Multi-Bar Chart Container */}
      <div className="bg-white rounded-3xl p-4 hover:shadow-xs transition space-y-2">

        <div className="relative w-full overflow-x-auto [ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
          <div className="w-full flex flex-col justify-between gap-2 py-2 pl-8 min-w-162.5 sm:min-w-0">

            {/* Grid background lines */}
            <div className="relative h-48 w-full flex flex-col justify-between border-b border-border-main">
              {[100, 80, 60, 40, 20, 0].map((val) => (
                <div key={val} className="relative w-full border-b border-dashed border-border-main/75 flex items-center">
                  <span className="absolute -left-7 text-[10px] text-text-muted font-light">{val}</span>
                </div>
              ))}

              {/* Bars Group per Month */}
              <div className="absolute inset-0 flex justify-between items-end px-2">
                {chartRows.map((item, idx) => {
                  const xPos = `${(idx + 0.5) * (100 / 12)}%`;
                  return (
                    <div key={idx} className="flex items-end gap-0.5 h-full group relative">
                      {/* Bar 1 - Volume */}
                      <div
                        style={{ height: `${item.h_volume}%` }}
                        className="w-1.5 md:w-3 bg-[#E57373] rounded-t-xs transition-all duration-200 cursor-pointer hover:opacity-80"
                        onMouseEnter={() => setHoveredValue({
                          x: xPos,
                          y: `${100 - item.h_volume}%`,
                          isHigh: item.h_volume >= 50,
                          monthIndex: idx,
                          value: `${Math.round(item.volume * 25).toLocaleString()} txns`,
                          label: `Transaction Volume (${item.month})`
                        })}
                        onMouseLeave={() => setHoveredValue(null)}
                      />
                      {/* Bar 2 - Amount */}
                      <div
                        style={{ height: `${item.h_amount}%` }}
                        className="w-1.5 md:w-3 bg-[#81C784] rounded-t-xs transition-all duration-200 cursor-pointer hover:opacity-80"
                        onMouseEnter={() => setHoveredValue({
                          x: xPos,
                          y: `${100 - item.h_amount}%`,
                          isHigh: item.h_amount >= 50,
                          monthIndex: idx,
                          value: currency(item.amount),
                          label: `Amount (${item.month})`
                        })}
                        onMouseLeave={() => setHoveredValue(null)}
                      />
                      {/* Bar 3 - Fees */}
                      <div
                        style={{ height: `${item.h_fees}%` }}
                        className="w-1.5 md:w-3 bg-[#4DD0E1] rounded-t-xs transition-all duration-200 cursor-pointer hover:opacity-80"
                        onMouseEnter={() => setHoveredValue({
                          x: xPos,
                          y: `${100 - item.h_fees}%`,
                          isHigh: item.h_fees >= 50,
                          monthIndex: idx,
                          value: currency(item.fees),
                          label: `Fees (${item.month})`
                        })}
                        onMouseLeave={() => setHoveredValue(null)}
                      />
                      {/* Bar 4 - Commission */}
                      <div
                        style={{ height: `${item.h_commission}%` }}
                        className="w-1.5 md:w-3 bg-[#D7CCC8] rounded-t-xs transition-all duration-200 cursor-pointer hover:opacity-80"
                        onMouseEnter={() => setHoveredValue({
                          x: xPos,
                          y: `${100 - item.h_commission}%`,
                          isHigh: item.h_commission >= 50,
                          monthIndex: idx,
                          value: currency(item.commission),
                          label: `Commission (${item.month})`
                        })}
                        onMouseLeave={() => setHoveredValue(null)}
                      />
                      {/* Bar 5 - Provider payout */}
                      <div
                        style={{ height: `${item.h_payout}%` }}
                        className="w-1.5 md:w-3 bg-[#B39DDB] rounded-t-xs transition-all duration-200 cursor-pointer hover:opacity-80"
                        onMouseEnter={() => setHoveredValue({
                          x: xPos,
                          y: `${100 - item.h_payout}%`,
                          isHigh: item.h_payout >= 50,
                          monthIndex: idx,
                          value: currency(item.payout),
                          label: `Provider payout (${item.month})`
                        })}
                        onMouseLeave={() => setHoveredValue(null)}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Tooltip Overlay */}
              {hoveredValue && (
                <div
                  className={`absolute bg-alt-bg/95 backdrop-blur-xs text-white px-2.5 py-1.5 rounded-lg text-[10px] pointer-events-none z-30 transition-all duration-150 shadow-md border border-white/10 ${hoveredValue.monthIndex >= 10
                    ? "-translate-x-full -ml-1"
                    : hoveredValue.monthIndex <= 1
                      ? "translate-x-0 ml-1"
                      : "-translate-x-1/2"
                    } ${hoveredValue.isHigh ? "translate-y-2" : "-translate-y-full -mt-2"
                    }`}
                  style={{
                    left: hoveredValue.x,
                    top: hoveredValue.y
                  }}
                >
                  <div className="font-semibold text-[11px]">{hoveredValue.value}</div>
                  <div className="text-white/70 text-[9px] whitespace-nowrap mt-0.5">{hoveredValue.label}</div>
                </div>
              )}
            </div>

            {/* X-Axis Month Labels */}
            <div className="flex justify-between items-center px-5">
              {chartRows.map((item, idx) => (
                <span key={idx} className="text-[10px] text-text-muted font-medium text-center md:w-10">
                  {item.month}
                </span>
              ))}
            </div>

          </div>
        </div>

        {/* Chart Legend */}
        <div className="flex items-center justify-center gap-4 flex-wrap text-[10px] text-text-muted font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#E57373]" />
            <span>Transaction Volume</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#81C784]" />
            <span>Amount</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#4DD0E1]" />
            <span>Fees</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#D7CCC8]" />
            <span>Commission</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#B39DDB]" />
            <span>Provider payout</span>
          </div>
        </div>
      </div>

      {/* 3. Secondary Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <CardWrapper
          name="HIGHEST REVENUE"
          value="$52,450"
          subtext="June"
        />
        <CardWrapper
          name="HIGHEST COUNT"
          value="1,684"
          subtext="August"
        />
        <CardWrapper
          name="HIGHEST COMMISSION"
          value="$4,820"
          subtext="July"
        />
        <CardWrapper
          name="HIGHEST TIPS"
          value="$2,140"
          subtext="December"
        />
      </div>

      {/* 4. Table Container Box */}
      <div className="bg-white rounded-3xl border border-border-main hover:shadow-xs relative overflow-visible">

        {/* Filters control bar: Search bar on left, Status, Category & Date Range filters on right */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white rounded-t-3xl border-b border-border-main">
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
              className="max-w-md w-full border border-border-main md:text-xs text-[10px] rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">

            {/* Status selector */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-border-main md:text-xs text-[10px] rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
              >
                <option value="All">Status</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Refund Requested">Refund Requested</option>
                <option value="Dispute">Dispute</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
            </div>

            {/* Category selector */}
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-border-main md:text-xs text-[10px] rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
              >
                <option value="All">Category</option>
                <option value="Post-Construction Cleaning">Post-Construction</option>
                <option value="Window Cleaning">Window Cleaning</option>
                <option value="Sanitization Services">Sanitization Services</option>
                <option value="Commercial Cleaning">Commercial Cleaning</option>
                <option value="Deep Cleaning">Deep Cleaning</option>
                <option value="Pressure Washing">Pressure Washing</option>
                <option value="Floor Waxing">Floor Waxing</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
            </div>

            {/* Date range picker */}
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

        {/* Data Table */}
        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white rounded-b-3xl min-h-80">
            <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">No Records Found</h3>
              <p className="text-xs text-text-muted font-light">No transaction records match current filters.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-b-3xl">
            <table className="min-w-full divide-y divide-secondary-bg md:text-sm text-xs tracking-tight">
              <thead className="bg-secondary-bg text-text-primary text-left md:text-sm text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3 font-semibold">Trans ID</th>
                  <th className="px-4 py-3 font-semibold">Date & Time</th>
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Provider</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Client Fee</th>
                  <th className="px-4 py-3 font-semibold">Commission</th>
                  <th className="px-4 py-3 font-semibold">Provider Payout</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-bg md:text-sm text-xs text-text-primary">
                {paginated.map((item) => (
                  <tr key={item.id} className="hover:bg-page-bg/50 transition">
                    <td className="px-4 py-3 font-mono">{item.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-text-primary">{item.date}</span>
                        <span className="md:text-xs text-[10px] text-text-muted font-light">{item.time}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{item.client}</td>
                    <td className="px-4 py-3">{item.provider}</td>
                    <td className="px-4 py-3">{item.category}</td>
                    <td className="px-4 py-3">${item.gross.toFixed(2)}</td>
                    <td className="px-4 py-3">${item.fee.toFixed(2)}</td>
                    <td className="px-4 py-3">${item.commission.toFixed(2)}</td>
                    <td className="px-4 py-3">${item.providerPayout.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium ${getStatusBadge(item.status)}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Navigation Footer */}
        {filteredData.length > 0 && (
          <Pagination
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={totalCount}
            onPageChange={setCurrentPage}
          />
        )}

      </div>

    </div>
  );
}
