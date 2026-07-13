"use client";

import React, { useState } from "react";
import { ChevronDown, Download, FileText } from "lucide-react";
import { toast } from "react-toastify";
import { exportCSV, exportPDF } from "@/utils/exportHelper";

export default function TransactionVolumeTab() {
  const [chartType, setChartType] = useState("Bar"); // "Bar" | "Line"
  const [category, setCategory] = useState("All");

  const chartData = [
    { day: "Jun 21", bookings: 38, gmv: 3500 },
    { day: "Jun 22", bookings: 48, gmv: 4200 },
    { day: "Jun 23", bookings: 32, gmv: 2800 },
    { day: "Jun 24", bookings: 55, gmv: 5100 },
    { day: "Jun 25", bookings: 68, gmv: 6200 },
    { day: "Jun 26", bookings: 45, gmv: 3900 },
    { day: "Jun 27", bookings: 35, gmv: 3100 }
  ];

  const handleExportCSV = () => {
    const headers = ["Day", "Bookings", "GMV ($)"];
    const rows = chartData.map(item => `"${item.day}",${item.bookings},${item.gmv}`);
    exportCSV(headers, rows, `transaction_volume_${Date.now()}.csv`);
  };

  const handleExportPDF = () => {
    const headers = ["Day", "Bookings", "GMV ($)"];
    const rows = chartData.map(item => [item.day, item.bookings, `$${item.gmv.toFixed(2)}`]);
    exportPDF("Transaction Volume Report", headers, rows, `transaction_volume_${Date.now()}.pdf`);
  };

  return (
    <div className="animate-scale-up">
      {/* Filters row bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
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

          <div className="border border-border-main rounded-full px-4 py-1.5 text-xs text-text-muted bg-white flex items-center gap-1.5">
            <span>01/07/26 - 08/07/26</span>
          </div>
        </div>

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

      {/* Grid cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-secondary-bg rounded-3xl p-4 hover:shadow-xs transition-shadow">
          <span className="text-xs text-text-primary block">Total bookings</span>
          <strong className="text-2xl text-text-primary font-semibold block mt-3">365</strong>
          <span className="text-[10px] text-text-muted block">Jun 18-24</span>
        </div>

        <div className="bg-white border border-secondary-bg rounded-3xl p-4 hover:shadow-xs transition-shadow">
          <span className="text-xs text-text-primary block">GMV (period)</span>
          <strong className="text-2xl text-text-primary font-semibold block mt-3">$44,900.00</strong>
          <span className="text-[10px] text-text-muted block">Gross merchandise value</span>
        </div>

        <div className="bg-white border border-secondary-bg rounded-3xl p-4 hover:shadow-xs transition-shadow">
          <span className="text-xs text-text-primary block">Average booking value</span>
          <strong className="text-2xl text-text-primary font-semibold block mt-3">$126.12</strong>
          <span className="text-[10px] text-text-muted block">Per transaction</span>
        </div>
      </div>

      {/* Daily Bookings & GMV Chart Section */}
      <div className="bg-white rounded-3xl p-4 hover:shadow-xs transition-shadow space-y-4 mt-4">
        <div className="flex justify-between items-center pb-3 border-b border-page-bg">
          <h3 className="text-xs font-semibold text-text-primary">Daily Bookings & GMV</h3>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-text-muted block">This week · USD</span>
            <div className="flex bg-primary-bg-muted/20 rounded-lg p-0.5 text-[10px]">
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
        <div className="pt-4 px-10">
          <div className="flex items-stretch h-64 relative">
            {/* Left Y Axis column (Bookings) */}
            <div className="w-12 flex flex-col justify-between text-sm text-text-muted pb-1 select-none">
              <span>80</span>
              <span>60</span>
              <span>40</span>
              <span>20</span>
              <span>0</span>
            </div>

            {/* Middle Graph Area */}
            <div className="flex-1 relative h-full mx-2">
              {/* Gridlines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-full border-b border-dashed border-secondary-bg/75" />
                ))}
              </div>

              {/* Chart content */}
              {chartType === "Bar" ? (
                <div className="w-full h-full flex justify-between items-end pb-1 relative z-10" style={{ paddingLeft: "7.1428%", paddingRight: "7.1428%" }}>
                  {chartData.map((d, index) => {
                    const bookingsHeight = `${(d.bookings / 80) * 100}%`;
                    const gmvHeight = `${(d.gmv / 10000) * 100}%`;
                    return (
                      <div key={index} className="w-0 overflow-visible flex justify-center items-end h-full">
                        <div className="flex items-end justify-center gap-1.5 shrink-0 h-full">
                          <div style={{ height: bookingsHeight }} className="w-14 bg-primary-bg rounded-t-md" />
                          <div style={{ height: gmvHeight }} className="w-14 bg-text-primary rounded-t-md" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="w-full h-full relative z-10">
                  <svg className="w-full h-full absolute inset-0 pb-1">
                    {(() => {
                      const bookingsPoints = chartData.map((d, index) => ({
                        x: `${7.1428 + index * 14.2857}%`,
                        y: `${(1 - d.bookings / 80) * 100}%`
                      }));
                      const gmvPoints = chartData.map((d, index) => ({
                        x: `${7.1428 + index * 14.2857}%`,
                        y: `${(1 - d.gmv / 10000) * 100}%`
                      }));
                      return (
                        <g>
                          {/* Bookings line segments */}
                          {bookingsPoints.slice(0, -1).map((p, idx) => (
                            <line
                              key={`b-l-${idx}`}
                              x1={p.x}
                              y1={p.y}
                              x2={bookingsPoints[idx + 1].x}
                              y2={bookingsPoints[idx + 1].y}
                              stroke="#6FB5BD"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          ))}
                          {/* GMV line segments */}
                          {gmvPoints.slice(0, -1).map((p, idx) => (
                            <line
                              key={`g-l-${idx}`}
                              x1={p.x}
                              y1={p.y}
                              x2={gmvPoints[idx + 1].x}
                              y2={gmvPoints[idx + 1].y}
                              stroke="#0F1D36"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          ))}
                          {/* Bookings dots */}
                          {bookingsPoints.map((p, idx) => (
                            <circle key={`b-d-${idx}`} cx={p.x} cy={p.y} r="4.5" fill="#6FB5BD" stroke="white" strokeWidth="1.5" />
                          ))}
                          {/* GMV dots */}
                          {gmvPoints.map((p, idx) => (
                            <circle key={`g-d-${idx}`} cx={p.x} cy={p.y} r="4.5" fill="#0F1D36" stroke="white" strokeWidth="1.5" />
                          ))}
                        </g>
                      );
                    })()}
                  </svg>
                </div>
              )}
            </div>

            {/* Right Y Axis column (GMV) */}
            <div className="w-14 flex flex-col justify-between text-sm text-text-muted text-right pb-1 select-none">
              <span>$10.0k</span>
              <span>$7.5k</span>
              <span>$5.0k</span>
              <span>$2.5k</span>
              <span>$0.0k</span>
            </div>
          </div>

          {/* X Axis days label row aligned exactly under the middle graph area */}
          <div className="flex pl-10 pr-14 mt-2">
            <div className="flex-1 flex justify-between mx-2" style={{ paddingLeft: "7.1428%", paddingRight: "7.1428%" }}>
              {chartData.map((d, index) => (
                <span key={index} className="w-0 overflow-visible text-center whitespace-nowrap flex justify-center text-sm text-text-muted font-light">
                  {d.day}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Legend row */}
        <div className="flex justify-center items-center gap-4 text-xs text-text-primary pt-2">
          <div className="flex items-center text-primary-bg gap-1.5">
            <span className="w-2.5 h-2.5 bg-primary-bg rounded-xs" />
            <span>Bookings</span>
          </div>
          <div className="flex items-center gap-1.5 text-text-primary">
            <span className="w-2.5 h-2.5 bg-text-primary rounded-xs" />
            <span>GMV</span>
          </div>
        </div>

      </div>
    </div>
  );
}
