"use client";

import React, { useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "react-toastify";

export default function WalletRefundsTab() {
  const [chartType, setChartType] = useState("Bar"); // "Bar" | "Line"

  const handleExportCSV = () => {
    toast.success("Wallet & Refund reports exported to CSV successfully!");
  };

  const handleExportPDF = () => {
    toast.success("Wallet & Refund reports exported to PDF successfully!");
  };

  const chartData = [
    { day: "Jun 21", wallet: 4800, card: 3000 },
    { day: "Jun 22", wallet: 5800, card: 3800 },
    { day: "Jun 23", wallet: 4400, card: 2500 },
    { day: "Jun 24", wallet: 7100, card: 5200 },
    { day: "Jun 25", wallet: 8500, card: 6800 },
    { day: "Jun 26", wallet: 5100, card: 3900 },
    { day: "Jun 27", wallet: 4200, card: 2800 }
  ];

  return (
    <div className="animate-scale-up">
      {/* Filters row bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-2.5">
        <div className="border border-border-main rounded-full px-4 py-1.5 text-xs text-text-muted bg-white flex items-center gap-1.5 h-8.5">
          <span>01/07/26 - 08/07/26</span>
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
          <span className="text-[10px] text-text-muted block">Total wallet credits</span>
          <strong className="text-2xl text-text-primary font-bold block">$9,800.00</strong>
          <span className="text-[9px] text-text-muted block">Jun 18-24</span>
        </div>

        <div className="bg-white border border-secondary-bg rounded-3xl p-5 shadow-2xs space-y-2">
          <span className="text-[10px] text-text-muted block">Total card refunds</span>
          <strong className="text-2xl text-text-primary font-bold block">$7,120.00</strong>
          <span className="text-[9px] text-text-muted block">Jun 18-24</span>
        </div>

        <div className="bg-white border border-secondary-bg rounded-3xl p-5 shadow-2xs space-y-2">
          <span className="text-[10px] text-text-muted block">Refund rate</span>
          <strong className="text-2xl text-text-primary font-bold block">42.1%</strong>
          <span className="text-[9px] text-text-muted block">Jun 18-24</span>
        </div>

        <div className="bg-white border border-secondary-bg rounded-3xl p-5 shadow-2xs space-y-2">
          <span className="text-[10px] text-text-muted block">Retention rate</span>
          <strong className="text-2xl text-text-primary font-bold block">57.9%</strong>
          <span className="text-[9px] text-text-muted block">Jun 18-24</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white border border-secondary-bg rounded-3xl p-5 shadow-2xs space-y-4 mt-4">
        <div className="flex justify-between items-center pb-3 border-b border-page-bg">
          <div>
            <h3 className="text-xs font-semibold text-text-primary">Wallet Credits Retained vs Refunded to Card</h3>
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
                    const walletHeight = `${(d.wallet / 10000) * 100}%`;
                    const cardHeight = `${(d.card / 10000) * 100}%`;
                    return (
                      <div key={index} className="w-0 overflow-visible flex justify-center items-end h-full">
                        <div className="flex items-end justify-center gap-1.5 shrink-0 h-full">
                          <div style={{ height: walletHeight }} className="w-7 bg-[#6FB5BD] rounded-t-sm" />
                          <div style={{ height: cardHeight }} className="w-7 bg-[#0F1D36] rounded-t-sm" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="w-full h-full relative z-10">
                  <svg className="w-full h-full absolute inset-0 pb-1">
                    {(() => {
                      const walletPoints = chartData.map((d, index) => ({
                        x: `${7.1428 + index * 14.2857}%`,
                        y: `${(1 - d.wallet / 10000) * 100}%`
                      }));
                      const cardPoints = chartData.map((d, index) => ({
                        x: `${7.1428 + index * 14.2857}%`,
                        y: `${(1 - d.card / 10000) * 100}%`
                      }));
                      return (
                        <g>
                          {/* Wallet line segments */}
                          {walletPoints.slice(0, -1).map((p, idx) => (
                            <line
                              key={`w-l-${idx}`}
                              x1={p.x}
                              y1={p.y}
                              x2={walletPoints[idx + 1].x}
                              y2={walletPoints[idx + 1].y}
                              stroke="#6FB5BD"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          ))}
                          {/* Card line segments */}
                          {cardPoints.slice(0, -1).map((p, idx) => (
                            <line
                              key={`c-l-${idx}`}
                              x1={p.x}
                              y1={p.y}
                              x2={cardPoints[idx + 1].x}
                              y2={cardPoints[idx + 1].y}
                              stroke="#0F1D36"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          ))}
                          {/* Wallet dots */}
                          {walletPoints.map((p, idx) => (
                            <circle key={`w-d-${idx}`} cx={p.x} cy={p.y} r="4.5" fill="#6FB5BD" stroke="white" strokeWidth="1.5" />
                          ))}
                          {/* Card dots */}
                          {cardPoints.map((p, idx) => (
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
            <span className="w-2.5 h-2.5 bg-[#6FB5BD] rounded-xs" />
            <span>Kept as wallet credit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#0F1D36] rounded-xs" />
            <span>Refunded to card</span>
          </div>
        </div>

      </div>
    </div>
  );
}
