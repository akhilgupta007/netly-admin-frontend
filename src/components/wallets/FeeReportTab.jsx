"use client";

import React, { useState } from "react";
import DateRangePicker from "@/components/ui/DateRangePicker";

export default function FeeReportTab({
  startDate,
  endDate,
  onDateChange
}) {
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  return (
    <div className="space-y-4 animate-scale-up">
      {/* Header row with date display */}
      <div className="flex justify-end items-center gap-3">
        <div>
          <div className="text-sm font-medium text-text-primary block mt-0.5">
            {startDate && endDate ? (
              `${startDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
            ) : (
              "July 1, 2026 - July 8, 2026"
            )}
          </div>
        </div>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={onDateChange}
        />
      </div>

      {/* Metric cards layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-secondary-bg p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <span className="text-xs text-text-primary block">Total 5% fees collected</span>
          <strong className="text-2xl text-text-primary font-semibold block mt-3">$2,625.25</strong>
          <span className="text-[10px] text-text-muted block">This week</span>
        </div>
        <div className="bg-white border border-secondary-bg p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-xs text-text-primary block">Transaction count</span>
            <strong className="text-2xl text-text-primary font-semibold block mt-3">47</strong>
          </div>
          <span className="text-[10px] text-text-muted block">This week</span>
        </div>
        <div className="bg-white border border-secondary-bg p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-xs text-text-primary block">Average fee per transaction</span>
            <strong className="text-2xl text-text-primary font-semibold block mt-3">$55.86</strong>
          </div>
          <span className="text-[10px] text-text-muted block">This week</span>
        </div>
      </div>

      {/* Bar Chart section */}
      <div className="bg-white border border-secondary-bg p-4 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-sm text-text-primary">5% Fees Collected by Day</h3>
          <span className="text-[10px] text-text-muted font-medium pr-4">This week · USD</span>
        </div>
        <div className="relative w-full">
          <svg className="w-full" viewBox="0 0 540 180" preserveAspectRatio="none">
            {/* Horizontal grid lines */}
            <line x1="45" y1="20" x2="520" y2="20" stroke="#EDF3F3" strokeWidth="1" strokeDasharray="3" />
            <line x1="45" y1="50" x2="520" y2="50" stroke="#EDF3F3" strokeWidth="1" strokeDasharray="3" />
            <line x1="45" y1="80" x2="520" y2="80" stroke="#EDF3F3" strokeWidth="1" strokeDasharray="3" />
            <line x1="45" y1="110" x2="520" y2="110" stroke="#EDF3F3" strokeWidth="1" strokeDasharray="3" />
            <line x1="45" y1="140" x2="520" y2="140" stroke="#EDF3F3" strokeWidth="1" />

            {/* Y-axis labels */}
            <text x="5" y="24" className="text-[6px] text-text-muted fill-current">$10.0k</text>
            <text x="5" y="54" className="text-[6px] text-text-muted fill-current">$7.5k</text>
            <text x="5" y="84" className="text-[6px] text-text-muted fill-current">$5.0k</text>
            <text x="5" y="114" className="text-[6px] text-text-muted fill-current">$2.5k</text>
            <text x="5" y="144" className="text-[6px] text-text-muted fill-current">$0.0k</text>

            {/* Bars group */}
            {[
              { label: "Mon", val: 4000 },
              { label: "Tue", val: 8200 },
              { label: "Wed", val: 4800 },
              { label: "Thu", val: 6900 },
              { label: "Fri", val: 3200 },
              { label: "Sat", val: 6000 },
              { label: "Sun", val: 8000 }
            ].map((item, index) => {
              const x_center = 75 + index * 65;
              const barHeight = (item.val / 10000) * 120;
              return (
                <g key={index}>
                  {hoveredBarIndex === index && (
                    <text
                      x={x_center}
                      y={140 - barHeight - 6}
                      textAnchor="middle"
                      className="text-[7px] font-semibold text-text-primary fill-current animate-scale-up"
                    >
                      ${item.val.toLocaleString()}
                    </text>
                  )}
                  <rect
                    x={x_center - 15}
                    y={140 - barHeight}
                    width="30"
                    height={barHeight}
                    rx="6"
                    onMouseEnter={() => setHoveredBarIndex(index)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    className="fill-[#5FB5BD] hover:opacity-90 transition cursor-pointer"
                  />
                  <text
                    x={x_center}
                    y="152"
                    textAnchor="middle"
                    className="text-[6px] text-text-muted fill-current"
                  >
                    {item.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
