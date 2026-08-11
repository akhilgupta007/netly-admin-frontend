"use client";

import React, { useState } from "react";
import { ChevronDown, Download, FileText } from "lucide-react";
import { toast } from "react-toastify";
import { exportCSV, exportPDF } from "@/utils/exportHelper";
import DateRangePicker, {
  getMondayAndSunday,
} from "@/components/ui/DateRangePicker";
import CardWrapper from "@/components/ui/CardWrapper";
import { useFinanceReports } from "@/hooks/useFinance";

/** Formats a number as currency, or an em dash while loading. */
const currency = (n) =>
  n === null || n === undefined ?
    "—" :
    `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function NetRevenueTab() {
  const [chartType, setChartType] = useState("Line"); // "Bar" | "Line"
  const [category, setCategory] = useState("All");
  // The current week, not a fixed date. These were pinned to 1–7 July 2026,
  // so the page opened on a window with no bookings in it and every chart
  // looked broken.
  const [startDate, setStartDate] = useState(
    () => getMondayAndSunday(new Date()).monday,
  );
  const [endDate, setEndDate] = useState(
    () => getMondayAndSunday(new Date()).sunday,
  );
  const [hoveredValue, setHoveredValue] = useState(null);

  const { revenue, totals, isLoading, isError } = useFinanceReports({ startDate, endDate });

  const chartData = revenue.map((r) => ({
    ...r,
    dayName: r.day,
    fullDate: new Date(`${r.date}T00:00:00`).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    }),
  }));

  /**
   * Rounds a maximum up to a readable axis top (480 → 500, 3200 → 5000).
   *
   * Both series were divided by a hardcoded 10000, so anything under a few
   * thousand dollars drew as a sliver at the baseline and the chart looked
   * empty regardless of the data.
   *
   * @param {number} value - Largest value across the series.
   * @return {number} Axis maximum, never zero.
   */
  const axisMax = (value) => {
    if (!value || value <= 0) return 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    const normalised = value / magnitude;
    const step =
      normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;
    return step * magnitude;
  };

  // Both series are money on the same scale, so they share one maximum —
  // otherwise the two are not visually comparable.
  const valueMax = axisMax(
    Math.max(0, ...chartData.flatMap((d) => [d.fee, d.commission])),
  );

  const axisTicks = [1, 0.75, 0.5, 0.25, 0];

  /**
   * Formats a currency axis tick, using thousands only when it helps.
   *
   * @param {number} value - Dollar amount.
   * @return {string} e.g. "$500" or "$2.5k".
   */
  const moneyTick = (value) =>
    valueMax >= 1000
      ? `$${(value / 1000).toFixed(1)}k`
      : `$${Math.round(value)}`;

  const handleExportCSV = () => {
    const headers = ["Day", "Platform Fees ($)", "Commissions ($)"];
    const rows = chartData.map(item => `"${item.day}",${item.fee},${item.commission}`);
    exportCSV(headers, rows, `net_revenue_${Date.now()}.csv`);
  };

  const handleExportPDF = () => {
    const headers = ["Day", "Platform Fees ($)", "Commissions ($)"];
    const rows = chartData.map(item => [item.day, `$${item.fee.toFixed(2)}`, `$${item.commission.toFixed(2)}`]);
    exportPDF("Net Revenue Report", headers, rows, `net_revenue_${Date.now()}.pdf`);
  };


  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 py-20 px-4 text-center select-none bg-white rounded-3xl border border-border-main animate-scale-up space-y-2">
        <h3 className="text-sm font-semibold text-text-primary">Could not load report data</h3>
        <p className="text-xs text-text-muted font-light">
          Check your connection and refresh. Figures are read directly from Firestore.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 py-20 px-4 text-center select-none bg-white rounded-3xl border border-border-main hover:shadow-xs animate-scale-up">
        <span className="text-xs text-text-muted animate-pulse font-light">Loading Reports Data...</span>
      </div>
    );
  }

  return (
    <div className="animate-scale-up font-onest">
      {/* Filters row bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2.5">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="appearance-none bg-white border border-border-main text-xs rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-28"
            >
              <option value="All">Category</option>
              <option value="Post-Construction Cleaning">Post-Construction</option>
              <option value="Window Cleaning">Window Cleaning</option>
              <option value="Sanitization Services">Sanitization</option>
              <option value="Commercial Cleaning">Commercial</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
          </div>

          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
            isWeekView={true}
          />
        </div>

        <div className="flex items-center gap-2 justify-center">
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

      {/* Grid cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardWrapper
          name="Total fees"
          value={currency(totals?.fees)}
          subtext="5% fee"
        />
        <CardWrapper
          name="Total commissions"
          value={currency(totals?.commission)}
          subtext="15% commission"
        />
        <CardWrapper
          name="Net revenue"
          value={currency(totals?.netRevenue)}
          subtext="Combined Value"
        />
        <CardWrapper
          name="Average net revenue"
          // Was a hardcoded "$25.22", which never moved whatever the range.
          value={currency(
            totals && totals.bookings ? totals.netRevenue / totals.bookings : 0,
          )}
          subtext="Per Booking"
        />
      </div>

      {/* 5% Fee vs 15% Commission Daily Chart Section */}
      <div className="bg-white rounded-3xl p-4 hover:shadow-xs transition-shadow space-y-4 mt-4">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-sm font-semibold text-text-primary">5% Fee vs 15% Commission – Daily</h3>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-text-muted block">This week · USD</span>
            <div className="flex md:flex-row flex-col bg-primary-bg-muted/20 rounded-lg p-0.5 text-[10px]">
              <button
                onClick={() => setChartType("Bar")}
                className={`px-2 py-1 rounded-md font-medium transition ${chartType === "Bar" ? "bg-white text-text-primary shadow-2xs" : "text-text-muted"}`}
              >
                Bar
              </button>
              <button
                onClick={() => setChartType("Line")}
                className={`px-3 py-1 rounded-md font-medium transition ${chartType === "Line" ? "bg-white text-text-primary shadow-2xs" : "text-text-muted"}`}
              >
                Line
              </button>
            </div>
          </div>
        </div>

        {/* HTML/CSS-based Responsive Chart Area */}
        <div className="pt-4 px-2 sm:px-10 overflow-x-auto [ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
          <div className="min-w-162.5 sm:min-w-0">
            <div className="flex items-stretch h-64 relative">
              {/* Left Y Axis column */}
              <div className="w-12 flex flex-col justify-between md:text-sm text-xs text-text-muted pb-1 select-none">
                {axisTicks.map((t) => (
                  <span key={t}>{moneyTick(valueMax * t)}</span>
                ))}
              </div>

              {/* Middle Graph Area */}
              <div className="flex-1 relative h-full mx-2">
                {/* Gridlines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-full border-b border-dashed border-border-main/75" />
                  ))}
                </div>

                {/* Chart content */}
                {chartType === "Bar" ? (
                  <div className="w-full h-full flex justify-between items-end pb-1 relative z-10" style={{ paddingLeft: "7.1428%", paddingRight: "7.1428%" }}>
                    {chartData.map((d, index) => {
                      const feeHeight = `${(d.fee / valueMax) * 100}%`;
                      const commissionHeight = `${(d.commission / valueMax) * 100}%`;
                      return (
                        <div key={index} className="w-0 overflow-visible flex justify-center items-end h-full">
                          <div className="flex items-end justify-center gap-1 sm:gap-1.5 shrink-0 h-full">
                            <div
                              style={{ height: feeHeight }}
                              className="sm:w-12 w-6 bg-primary-bg rounded-t-md cursor-pointer transition-all duration-200 hover:opacity-90"
                              onMouseEnter={() => setHoveredValue({
                                x: `${7.1428 + index * 14.2857}%`,
                                y: `${100 - (d.fee / valueMax) * 100}%`,
                                value: `$${d.fee.toLocaleString()}`,
                                label: `5% Fee (${d.dayName}, ${d.fullDate})`
                              })}
                              onMouseLeave={() => setHoveredValue(null)}
                            />
                            <div
                              style={{ height: commissionHeight }}
                              className="sm:w-12 w-6 bg-text-primary rounded-t-md cursor-pointer transition-all duration-200 hover:opacity-90"
                              onMouseEnter={() => setHoveredValue({
                                x: `${7.1428 + index * 14.2857}%`,
                                y: `${100 - (d.commission / valueMax) * 100}%`,
                                value: `$${d.commission.toLocaleString()}`,
                                label: `15% Commission (${d.dayName}, ${d.fullDate})`
                              })}
                              onMouseLeave={() => setHoveredValue(null)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="w-full h-full relative z-10">
                    <svg className="w-full h-full absolute inset-0 pb-1">
                      {(() => {
                        const feePoints = chartData.map((d, index) => ({
                          x: `${7.1428 + index * 14.2857}%`,
                          y: `${(1 - d.fee / valueMax) * 100}%`
                        }));
                        const commissionPoints = chartData.map((d, index) => ({
                          x: `${7.1428 + index * 14.2857}%`,
                          y: `${(1 - d.commission / valueMax) * 100}%`
                        }));
                        return (
                          <g>
                            {/* Fee line segments */}
                            {feePoints.slice(0, -1).map((p, idx) => (
                              <line
                                key={`f-l-${idx}`}
                                x1={p.x}
                                y1={p.y}
                                x2={feePoints[idx + 1].x}
                                y2={feePoints[idx + 1].y}
                                stroke="#6FB5BD"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                            ))}
                            {/* Commission line segments */}
                            {commissionPoints.slice(0, -1).map((p, idx) => (
                              <line
                                key={`c-l-${idx}`}
                                x1={p.x}
                                y1={p.y}
                                x2={commissionPoints[idx + 1].x}
                                y2={commissionPoints[idx + 1].y}
                                stroke="#0F1D36"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                            ))}
                            {/* Fee dots */}
                            {feePoints.map((p, idx) => {
                              const d = chartData[idx];
                              return (
                                <circle
                                  key={`f-d-${idx}`}
                                  cx={p.x}
                                  cy={p.y}
                                  r="4.5"
                                  fill="#6FB5BD"
                                  stroke="white"
                                  strokeWidth="1.5"
                                  className="cursor-pointer"
                                  onMouseEnter={() => setHoveredValue({
                                    x: p.x,
                                    y: p.y,
                                    value: `$${d.fee.toLocaleString()}`,
                                    label: `5% Fee (${d.dayName}, ${d.fullDate})`
                                  })}
                                  onMouseLeave={() => setHoveredValue(null)}
                                />
                              );
                            })}
                            {/* Commission dots */}
                            {commissionPoints.map((p, idx) => {
                              const d = chartData[idx];
                              return (
                                <circle
                                  key={`c-d-${idx}`}
                                  cx={p.x}
                                  cy={p.y}
                                  r="4.5"
                                  fill="#0F1D36"
                                  stroke="white"
                                  strokeWidth="1.5"
                                  className="cursor-pointer"
                                  onMouseEnter={() => setHoveredValue({
                                    x: p.x,
                                    y: p.y,
                                    value: `$${d.commission.toLocaleString()}`,
                                    label: `15% Commission (${d.dayName}, ${d.fullDate})`
                                  })}
                                  onMouseLeave={() => setHoveredValue(null)}
                                />
                              );
                            })}
                          </g>
                        );
                      })()}
                    </svg>
                  </div>
                )}

                {hoveredValue && (
                  <div
                    className="absolute bg-alt-bg/95 backdrop-blur-xs text-white p-2 rounded-lg text-[10px] pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 z-30 transition-all duration-150 shadow-md border border-white/10"
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

              {/* Right Y Axis column */}
              <div className="w-14 flex flex-col justify-between md:text-sm text-xs text-text-muted text-right pb-1 select-none">
                {axisTicks.map((t) => (
                  <span key={t}>{moneyTick(valueMax * t)}</span>
                ))}
              </div>
            </div>

            {/* X Axis days label row aligned exactly under the middle graph area */}
            <div className="flex pl-10 pr-14 mt-2">
              <div className="flex-1 flex justify-between ml-4 mr-2" style={{ paddingLeft: "7.1428%", paddingRight: "7.1428%" }}>
                {chartData.map((d, index) => (
                  <div key={index} className="w-0 overflow-visible text-center flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs text-text-primary">{d.dayName}</span>
                    <span className="text-[10px] text-text-muted whitespace-nowrap leading-none mt-0.5">{d.fullDate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend row */}
        <div className="flex justify-center items-center gap-4 text-xs text-text-primary pt-2">
          <div className="flex items-center text-primary-bg gap-1.5">
            <span className="w-2.5 h-2.5 bg-primary-bg rounded-xs" />
            <span>5% fee</span>
          </div>
          <div className="flex items-center gap-1.5 text-text-primary">
            <span className="w-2.5 h-2.5 bg-text-primary rounded-xs" />
            <span>15% commission</span>
          </div>
        </div>

      </div>
    </div>
  );
}
