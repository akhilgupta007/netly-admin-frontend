"use client";

import React, { useState } from "react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import CardWrapper from "@/components/ui/CardWrapper";

export default function FeeReportTab({
  startDate,
  endDate,
  onDateChange
}) {
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 py-20 px-4 text-center select-none bg-white rounded-3xl border border-secondary-bg hover:shadow-xs animate-scale-up">
        <span className="text-xs text-text-muted animate-pulse font-light">Loading Reports Data...</span>
      </div>
    );
  }

  const getMondayAndSunday = (date) => {
    const day = date.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { monday, sunday };
  };

  const { monday: defaultMon, sunday: defaultSun } = getMondayAndSunday(new Date());
  const displayStart = startDate || defaultMon;
  const displayEnd = endDate || defaultSun;

  return (
    <div className="space-y-4 animate-scale-up">
      {/* Header row with date display */}
      <div className="flex justify-end items-center gap-3">
        <div>
          <div className="text-sm font-medium text-text-primary block mt-0.5">
            {`${displayStart.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} - ${displayEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
          </div>
        </div>
        <DateRangePicker
          startDate={startDate || defaultMon}
          endDate={endDate || defaultSun}
          onChange={onDateChange}
          isWeekView={true}
        />
      </div>

      {/* Metric cards layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardWrapper
          name="Total 5% fees collected"
          value="$2,625.25"
          subtext="This week"
        />
        <CardWrapper
          name="Transaction count"
          value="47"
          subtext="This week"
        />
        <CardWrapper
          name="Average fee per transaction"
          value="$55.86"
          subtext="This week"
        />
      </div>

      {/* Bar Chart section */}
      <div className="bg-white border border-secondary-bg p-4 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-sm text-text-primary">5% Fees Collected by Day</h3>
          <span className="text-[10px] text-text-muted font-medium pr-4">This week · USD</span>
        </div>
        <div className="relative w-full overflow-x-auto [ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
          <div className="min-w-[500px] sm:min-w-0">
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
              {(() => {
                const baseStart = startDate || new Date(2026, 6, 1);
                const staticValues = [4000, 8200, 4800, 6900, 3200, 6000, 8000];
                return Array.from({ length: 7 }).map((_, index) => {
                  const d = new Date(baseStart);
                  d.setDate(baseStart.getDate() + index);
                  const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                  const fullDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                  return {
                    dayName,
                    fullDate,
                    val: staticValues[index]
                  };
                });
              })().map((item, index) => {
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
                      className="text-[6px] fill-current"
                    >
                      <tspan x={x_center} dy="0" className="text-text-primary fill-current">{item.dayName}</tspan>
                      <tspan x={x_center} dy="8" className="text-[5px] text-text-muted fill-current">{item.fullDate}</tspan>
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
