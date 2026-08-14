"use client";

import React, { useState } from "react";
import DateRangePicker, {
  getMondayAndSunday,
} from "@/components/ui/DateRangePicker";
import CardWrapper from "@/components/ui/CardWrapper";
import { useFeeReport } from "@/hooks/useFinance";

/** Formats a number as CAD, or an em dash while loading. */
const currency = (n) =>
  n === null || n === undefined ?
    "—" :
    `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Rounds a maximum up to a readable axis top. */
function axisTop(max) {
  if (!max || max <= 0) return 100;
  const mag = Math.pow(10, Math.floor(Math.log10(max)));
  return Math.ceil(max / mag) * mag;
}

/** Abbreviates an axis value, e.g. 7500 → "$7.5k". */
const axisLabel = (v) =>
  v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`;

export default function FeeReportTab({
  startDate,
  endDate,
  onDateChange
}) {
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  // The range this tab actually queries.
  //
  // The Wallets page opens with startDate and endDate null, shared across all
  // four of its tabs. Passed through unchanged, the read layer's dailySeries
  // returns nothing at all for a null bound — and the totals are summed from
  // that series — so every figure came out $0.00 and the chart was empty,
  // while the header above it displayed the current week. The page was showing
  // one range and querying another.
  //
  // Defaulted here rather than on the page, because the other three tabs treat
  // "no range" as "everything" and would start filtering if it changed there.
  const { monday: defaultMon, sunday: defaultSun } = getMondayAndSunday(
      new Date(),
  );
  const displayStart = startDate || defaultMon;
  const displayEnd = endDate || defaultSun;

  const { series, totals, isLoading, isError } = useFeeReport({
    startDate: displayStart,
    endDate: displayEnd,
  });

  // The axis was fixed at $0–$10k, which would clip any larger day. It now
  // scales to the range actually returned.
  const top = axisTop(Math.max(0, ...series.map((r) => r.clientFee)));
  // Bars are laid out across the fixed 540-unit viewBox, so the spacing has to
  // come from the day count rather than a hardcoded 65.
  const plotWidth = 520 - 60;
  const step = series.length > 0 ? plotWidth / series.length : plotWidth;
  const barWidth = Math.max(6, Math.min(30, step * 0.55));

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
          name="Client fees collected (5%)"
          value={currency(totals?.clientFee)}
          subtext="Selected range"
        />
        <CardWrapper
          name="Transaction count"
          value={totals ? totals.bookings.toLocaleString() : "—"}
          subtext="Paid bookings in range"
        />
        <CardWrapper
          name="Provider commission (15%)"
          value={currency(totals?.providerCommission)}
          subtext={totals ? `Effective take rate ${totals.effectiveRate}%` : "Selected range"}
        />
      </div>

      {/* Bar Chart section */}
      <div className="bg-white border border-border-main p-4 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-sm text-text-primary">5% Fees Collected by Day</h3>
          <span className="text-[10px] text-text-muted font-medium pr-4">Selected range · CAD</span>
        </div>
        <div className="relative w-full overflow-x-auto [ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
          <div className="min-w-125 sm:min-w-0">
            <svg className="w-full" viewBox="0 0 540 180" preserveAspectRatio="none">
              {/* Horizontal grid lines */}
              <line x1="45" y1="20" x2="520" y2="20" stroke="#EDF3F3" strokeWidth="1" strokeDasharray="3" />
              <line x1="45" y1="50" x2="520" y2="50" stroke="#EDF3F3" strokeWidth="1" strokeDasharray="3" />
              <line x1="45" y1="80" x2="520" y2="80" stroke="#EDF3F3" strokeWidth="1" strokeDasharray="3" />
              <line x1="45" y1="110" x2="520" y2="110" stroke="#EDF3F3" strokeWidth="1" strokeDasharray="3" />
              <line x1="45" y1="140" x2="520" y2="140" stroke="#EDF3F3" strokeWidth="1" />

              {/* Y-axis labels — scaled to the data */}
              {[0, 1, 2, 3, 4].map((i) => (
                <text
                  key={i}
                  x="5"
                  y={24 + i * 30}
                  className="md:text-[6px] text-[10px] text-text-muted fill-current"
                >
                  {axisLabel((top * (4 - i)) / 4)}
                </text>
              ))}

              {/* Bars group */}
              {series.map((row, index) => {
                const item = {
                  dayName: row.day,
                  fullDate: new Date(row.date).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  }),
                  val: row.clientFee,
                };
                const x_center = 60 + step * (index + 0.5);
                const barHeight = top > 0 ? (item.val / top) * 120 : 0;
                return (
                  <g key={index}>
                    {hoveredBarIndex === index && (
                      <text
                        x={x_center}
                        y={140 - barHeight - 6}
                        textAnchor="middle"
                        className="sm:text-[7px] text-[10px] font-semibold text-text-primary fill-current animate-scale-up"
                      >
                        {currency(item.val)}
                      </text>
                    )}
                    <rect
                      x={x_center - barWidth / 2}
                      y={140 - barHeight}
                      width={barWidth}
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
                      className="sm:text-[6px] text-[10px] fill-current"
                    >
                      <tspan x={x_center} dy="0" className="text-text-primary fill-current">{item.dayName}</tspan>
                      <tspan x={x_center} dy="8" className="sm:text-[5px] text-[8px] text-text-muted fill-current">{item.fullDate}</tspan>
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
