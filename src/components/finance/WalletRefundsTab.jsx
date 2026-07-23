"use client";

import React, { useState } from "react";
import { Download, FileText } from "lucide-react";
import { exportCSV, exportPDF } from "@/utils/exportHelper";
import DateRangePicker from "@/components/ui/DateRangePicker";
import CardWrapper from "@/components/ui/CardWrapper";

export default function WalletRefundsTab() {
  const [chartType, setChartType] = useState("Bar"); // "Bar" | "Line"
  const [startDate, setStartDate] = useState(new Date(2026, 6, 1));
  const [endDate, setEndDate] = useState(new Date(2026, 6, 7));
  const [hoveredValue, setHoveredValue] = useState(null);

  const getChartData = () => {
    const data = [];
    const mockWallet = [4800, 5800, 4400, 7100, 8500, 5100, 4200];
    const mockCard = [3000, 3800, 2500, 5200, 6800, 3900, 2800];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const fullDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      data.push({
        dayName,
        fullDate,
        wallet: mockWallet[i],
        card: mockCard[i]
      });
    }
    return data;
  };
  const chartData = getChartData();

  const handleExportCSV = () => {
    const headers = ["Day", "Wallet Funding ($)", "Card Payments ($)"];
    const rows = chartData.map(item => `"${item.day}",${item.wallet},${item.card}`);
    exportCSV(headers, rows, `wallet_refunds_${Date.now()}.csv`);
  };

  const handleExportPDF = () => {
    const headers = ["Day", "Wallet Funding ($)", "Card Payments ($)"];
    const rows = chartData.map(item => [item.day, `$${item.wallet.toFixed(2)}`, `$${item.card.toFixed(2)}`]);
    exportPDF("Wallet & Refunds Report", headers, rows, `wallet_refunds_${Date.now()}.pdf`);
  };

  const [isLoading, setIsLoading] = useState(true);
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

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
        <div className="flex justify-center">
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
          name="Total wallet credits"
          value="$9,800.00"
          subtext="Jun 18-24"
        />
        <CardWrapper
          name="Total card refunds"
          value="$7,120.00"
          subtext="Jun 18-24"
        />
        <CardWrapper
          name="Refund rate"
          value="42.1%"
          subtext="Jun 18-24"
        />
        <CardWrapper
          name="Retention rate"
          value="57.9%"
          subtext="Jun 18-24"
        />
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-3xl p-4 hover:shadow-xs transition-shadow space-y-4 mt-4">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-xs font-semibold text-text-primary">Wallet Credits Retained vs Refunded to Card</h3>
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
                    <div key={i} className="w-full border-b border-dashed border-border-main/75" />
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
                          <div className="flex items-end justify-center gap-1 sm:gap-1.5 shrink-0 h-full">
                            <div
                              style={{ height: walletHeight }}
                              className="sm:w-12 w-6 bg-primary-bg rounded-t-md cursor-pointer transition-all duration-200 hover:opacity-90"
                              onMouseEnter={() => setHoveredValue({
                                x: `${7.1428 + index * 14.2857}%`,
                                y: `${100 - (d.wallet / 10000) * 100}%`,
                                value: `$${d.wallet.toLocaleString()}`,
                                label: `Wallet (${d.dayName}, ${d.fullDate})`
                              })}
                              onMouseLeave={() => setHoveredValue(null)}
                            />
                            <div
                              style={{ height: cardHeight }}
                              className="sm:w-12 w-6 bg-text-primary rounded-t-md cursor-pointer transition-all duration-200 hover:opacity-90"
                              onMouseEnter={() => setHoveredValue({
                                x: `${7.1428 + index * 14.2857}%`,
                                y: `${100 - (d.card / 10000) * 100}%`,
                                value: `$${d.card.toLocaleString()}`,
                                label: `Card (${d.dayName}, ${d.fullDate})`
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
                            {walletPoints.map((p, idx) => {
                              const d = chartData[idx];
                              return (
                                <circle
                                  key={`w-d-${idx}`}
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
                                    value: `$${d.wallet.toLocaleString()}`,
                                    label: `Wallet (${d.dayName}, ${d.fullDate})`
                                  })}
                                  onMouseLeave={() => setHoveredValue(null)}
                                />
                              );
                            })}
                            {/* Card dots */}
                            {cardPoints.map((p, idx) => {
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
                                    value: `$${d.card.toLocaleString()}`,
                                    label: `Card (${d.dayName}, ${d.fullDate})`
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
            </div>

            {/* X Axis days label row aligned exactly under the middle graph area */}
            <div className="flex pl-12 pr-2 mt-2">
              <div className="flex-1 flex justify-between mx-2" style={{ paddingLeft: "7.1428%", paddingRight: "7.1428%" }}>
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
            <span>Kept as wallet credit</span>
          </div>
          <div className="flex items-center gap-1.5 text-text-primary">
            <span className="w-2.5 h-2.5 bg-text-primary rounded-xs" />
            <span>Refunded to card</span>
          </div>
        </div>

      </div>
    </div>
  );
}
