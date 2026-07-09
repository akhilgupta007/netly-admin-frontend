"use client";

import React, { useState } from "react";
import { ChevronDown, Download, FileText } from "lucide-react";
import { toast } from "react-toastify";
import { exportCSV, exportPDF } from "@/utils/exportHelper";

export default function NetRevenueTab() {
  const [chartType, setChartType] = useState("Line"); // "Bar" | "Line"
  const [category, setCategory] = useState("All");

  const chartData = [
    { day: "Jun 21", fee: 4000, commission: 5000 },
    { day: "Jun 22", fee: 4200, commission: 3800 },
    { day: "Jun 23", fee: 3800, commission: 5500 },
    { day: "Jun 24", fee: 5200, commission: 3200 },
    { day: "Jun 25", fee: 6500, commission: 2500 },
    { day: "Jun 26", fee: 4100, commission: 4300 },
    { day: "Jun 27", fee: 3900, commission: 5100 }
  ];

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

  return (
    <div className="animate-scale-up">
      {/* Filters row bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-2.5">
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
            className="bg-primary-bg hover:opacity-90 text-white font-semibold text-xs py-2 px-4 rounded-full transition cursor-pointer flex items-center gap-1.5"
          >
            <Download size={13} /> Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-white border border-border-main hover:bg-page-bg text-text-primary font-semibold text-xs py-2 px-4 rounded-full transition cursor-pointer flex items-center gap-1.5"
          >
            <FileText size={13} /> Export PDF
          </button>
        </div>
      </div>

      {/* Grid cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-secondary-bg rounded-3xl p-5 shadow-2xs space-y-2">
          <span className="text-[10px] text-text-muted block">Total fees</span>
          <strong className="text-2xl text-text-primary font-bold block">$2,245.00</strong>
          <span className="text-[9px] text-text-muted block">5% fee</span>
        </div>

        <div className="bg-white border border-secondary-bg rounded-3xl p-5 shadow-2xs space-y-2">
          <span className="text-[10px] text-text-muted block">Total commissions</span>
          <strong className="text-2xl text-text-primary font-bold block">$6,735.00</strong>
          <span className="text-[9px] text-text-muted block">15% commission</span>
        </div>

        <div className="bg-white border border-secondary-bg rounded-3xl p-5 shadow-2xs space-y-2">
          <span className="text-[10px] text-text-muted block">Net revenue</span>
          <strong className="text-2xl text-text-primary font-bold block">$8,980.00</strong>
          <span className="text-[9px] text-text-muted block">Combined Value</span>
        </div>

        <div className="bg-white border border-secondary-bg rounded-3xl p-5 shadow-2xs space-y-2">
          <span className="text-[10px] text-text-muted block">Average net revenue</span>
          <strong className="text-2xl text-text-primary font-bold block">$25.22</strong>
          <span className="text-[9px] text-text-muted block">Per Booking</span>
        </div>
      </div>

      {/* 5% Fee vs 15% Commission Daily Chart Section */}
      <div className="bg-white border border-secondary-bg rounded-3xl p-5 shadow-2xs space-y-4 mt-4">
        <div className="flex justify-between items-center pb-3 border-b border-page-bg">
          <div>
            <h3 className="text-xs font-semibold text-text-primary">5% Fee vs 15% Commission – Daily</h3>
            <span className="text-[9px] text-text-muted block">This week · USD</span>
          </div>
          <div className="flex border border-secondary-bg rounded-lg p-0.5 text-[10px] bg-page-bg/50">
            <button
              onClick={() => setChartType("Bar")}
              className={`px-3 py-1 rounded-md font-semibold transition ${chartType === "Bar" ? "bg-white text-text-primary shadow-2xs" : "text-text-muted"}`}
            >
              Bar
            </button>
            <button
              onClick={() => setChartType("Line")}
              className={`px-3 py-1 rounded-md font-semibold transition ${chartType === "Line" ? "bg-white text-text-primary shadow-2xs" : "text-text-muted"}`}
            >
              Line
            </button>
          </div>
        </div>

        {/* HTML/CSS-based Responsive Chart Area */}
        <div className="pt-4">
          <div className="flex items-stretch h-48 relative">
            {/* Left Y Axis column */}
            <div className="w-10 flex flex-col justify-between text-[9px] text-text-muted pb-1 select-none">
              <span>$10.0k</span>
              <span>$7.5k</span>
              <span>$5.0k</span>
              <span>$2.5k</span>
              <span>$0.0k</span>
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
                    const feeHeight = `${(d.fee / 10000) * 100}%`;
                    const commissionHeight = `${(d.commission / 10000) * 100}%`;
                    return (
                      <div key={index} className="w-0 overflow-visible flex justify-center items-end h-full">
                        <div className="flex items-end justify-center gap-1.5 shrink-0 h-full">
                          <div style={{ height: feeHeight }} className="w-7 bg-primary-bg rounded-t-sm" />
                          <div style={{ height: commissionHeight }} className="w-7 bg-text-primary rounded-t-sm" />
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
                        y: `${(1 - d.fee / 10000) * 100}%`
                      }));
                      const commissionPoints = chartData.map((d, index) => ({
                        x: `${7.1428 + index * 14.2857}%`,
                        y: `${(1 - d.commission / 10000) * 100}%`
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
                          {feePoints.map((p, idx) => (
                            <circle key={`f-d-${idx}`} cx={p.x} cy={p.y} r="4.5" fill="#6FB5BD" stroke="white" strokeWidth="1.5" />
                          ))}
                          {/* Commission dots */}
                          {commissionPoints.map((p, idx) => (
                            <circle key={`c-d-${idx}`} cx={p.x} cy={p.y} r="4.5" fill="#0F1D36" stroke="white" strokeWidth="1.5" />
                          ))}
                        </g>
                      );
                    })()}
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* X Axis days label row aligned exactly under the middle graph area */}
          <div className="flex pl-10 pr-2 mt-2">
            <div className="flex-1 flex justify-between mx-2" style={{ paddingLeft: "7.1428%", paddingRight: "7.1428%" }}>
              {chartData.map((d, index) => (
                <span key={index} className="w-0 overflow-visible text-center whitespace-nowrap flex justify-center text-[9px] text-text-muted font-light">
                  {d.day}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Legend row */}
        <div className="flex justify-center items-center gap-4 text-[10px] text-text-primary pt-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-primary-bg rounded-xs" />
            <span>5% fee</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-text-primary rounded-xs" />
            <span>15% commission</span>
          </div>
        </div>

      </div>
    </div>
  );
}
