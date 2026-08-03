"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import CardWrapper from "@/components/ui/CardWrapper";
import { useDashboardMetrics } from "@/hooks/useDashboard";
import DateRangePicker from "@/components/ui/DateRangePicker";
import {
  Calendar,
  X,
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from "lucide-react";

export default function DashboardPage() {

  // Banner visibility state
  const [showBanner, setShowBanner] = useState(true);
  const [hoveredValue, setHoveredValue] = useState(null);

  // Time filter state
  const [timeFilter, setTimeFilter] = useState("This week");

  // Custom date range state
  const [startDate, setStartDate] = useState(new Date(2026, 6, 1));
  const [endDate, setEndDate] = useState(new Date(2026, 6, 7));

  // Chart type state (Bar or Line)
  const [chartType, setChartType] = useState("Bar");

  // Resolve the active filter to a concrete range, then read real aggregates.
  const activeRange = useMemo(() => {
    const now = new Date();
    if (timeFilter === "Today") {
      return { startDate: now, endDate: now, note: "Today" };
    }
    if (timeFilter === "This month") {
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: now,
        note: "This month",
      };
    }
    if (timeFilter === "Custom" && startDate && endDate) {
      return {
        startDate,
        endDate,
        note: `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      };
    }
    // Default: the current week, Monday to today.
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    return { startDate: monday, endDate: now, note: "This week" };
  }, [timeFilter, startDate, endDate]);

  const { metrics, isLoading, isError, error } = useDashboardMetrics({
    startDate: activeRange.startDate,
    endDate: activeRange.endDate,
  });


  const formatDateStr = (dateObj) => {
    if (!dateObj) return "";
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const startStr = formatDateStr(startDate);
  const endStr = formatDateStr(endDate);

  const getMondayAndSunday = (date) => {
    const day = date.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { monday, sunday };
  };

  const { monday: thisWeekMonday, sunday: thisWeekSunday } = getMondayAndSunday(new Date());
  const thisWeekMondayStr = formatDateStr(thisWeekMonday);
  const thisWeekSundayStr = formatDateStr(thisWeekSunday);

  // Daily booking value across the selected range, from real bookings.
  const chartData = metrics?.series || [];

  // Scale to the data rather than a fixed ceiling, with a floor so an empty
  // range renders a flat baseline instead of dividing by zero.
  const maxVal = Math.max(
    100,
    ...chartData.map((d) => Math.max(d.outbound || 0, d.retained || 0))
  );

  // Geometry is derived from the number of points, not a fixed 7-day week —
  // the range picker can yield anywhere from 1 to 31 days.
  const PLOT_LEFT = 85;
  const PLOT_WIDTH = 408;
  const pointX = (i) =>
    chartData.length > 1
      ? PLOT_LEFT + (i * PLOT_WIDTH) / (chartData.length - 1)
      : PLOT_LEFT + PLOT_WIDTH / 2;
  const pointY = (v) => 140 - ((Number(v) || 0) / maxVal) * 120;
  const linePath = (key) =>
    chartData
      .map((d, i) => `${i === 0 ? "M" : "L"} ${pointX(i)} ${pointY(d[key])}`)
      .join(" ");

  const EMPTY = "—";
  const dynamicStats = {
    bookings: metrics?.bookings ?? EMPTY,
    completionRate: metrics?.completionRate ?? EMPTY,
    openDisputes: metrics?.openDisputes ?? EMPTY,
    walletCreditsPending: metrics?.walletCreditsPending ?? EMPTY,
    refundRequests: metrics?.refundRequests ?? EMPTY,
    kycDocsInQueue: metrics?.kycDocsInQueue ?? EMPTY,
    gmv: metrics?.gmv ?? EMPTY,
    revenue: metrics?.revenue ?? EMPTY,
    fees: metrics?.fees ?? EMPTY,
    liability: metrics?.liability ?? EMPTY,
    newClients: metrics?.newClients ?? EMPTY,
    newProviders: metrics?.newProviders ?? EMPTY,
    suspended: metrics?.suspended ?? EMPTY,
    unresolvedDisputes: metrics?.unresolvedDisputes ?? EMPTY,
    note: activeRange.note,
  };


  // Operations metrics data
  const operationsCards = [
    {
      name: "Bookings",
      value: dynamicStats.bookings,
      note: dynamicStats.note,
      href: `/transactions?startDate=${startStr}&endDate=${endStr}`,
      icon: Calendar,
    },
    {
      name: "Completion rate",
      value: dynamicStats.completionRate,
      note: "Completed + canceled",
      href: `/transactions?status=completed,cancelled&startDate=${startStr}&endDate=${endStr}`,
      icon: CheckCircle,
    },
    {
      name: "Open disputes",
      value: dynamicStats.openDisputes,
      note: "Tap to review",
      icon: AlertTriangle,
      href: "/compliance/disputes",
    },
    {
      name: "Wallet credits pending",
      value: dynamicStats.walletCreditsPending,
      note: "Awaiting approval",
      href: "/wallets?tab=credit",
      icon: Clock,
    },
    {
      name: "Refund requests",
      value: dynamicStats.refundRequests,
      note: "Awaiting approval",
      href: "/transactions?status=refund requested",
      icon: Clock,
    },
    {
      name: "KYC docs in queue",
      value: dynamicStats.kycDocsInQueue,
      note: "Identity verification",
      icon: ShieldCheck,
      href: "/compliance/kyc",
    },
  ];



  // Money info cards data
  const moneyCards = [
    {
      name: "Gross Merchandise Value",
      value: dynamicStats.gmv,
      note: dynamicStats.note,
      href: `/transactions?status=confirmed,in progress,completed,finalised&startDate=${thisWeekMondayStr}&endDate=${thisWeekSundayStr}`,
      icon: ShieldCheck,
    },
    {
      name: "NETLY net revenue",
      value: dynamicStats.revenue,
      note: "5% + 15% commission",
      href: `/transactions?status=finalised&startDate=${startStr}&endDate=${endStr}`,
      icon: ShieldCheck,
    },
    {
      name: "Non-refundable 5% fees",
      value: dynamicStats.fees,
      note: "Total collected",
      href: `/wallets?tab=fee&startDate=${thisWeekMondayStr}&endDate=${thisWeekSundayStr}`,
      icon: ShieldCheck,
    },
    {
      name: "Client wallet balance",
      value: dynamicStats.liability,
      note: "Live liability - no trend",
      href: "/wallets",
      icon: ShieldCheck,
    },
  ];

  // Accounts & Compliance cards data
  const accountsCards = [
    {
      name: "New clients",
      value: dynamicStats.newClients,
      note: dynamicStats.note,
      href: "/accounts?tab=Clients",
      icon: ShieldCheck,
    },
    {
      name: "New providers",
      value: dynamicStats.newProviders,
      note: dynamicStats.note,
      href: "/accounts?tab=Providers",
      icon: ShieldCheck,
    },
    {
      name: "Suspended accounts",
      value: dynamicStats.suspended,
      note: "Tap to manage",
      href: "/accounts?tab=Clients&status=Suspended",
      icon: ShieldCheck,
    },
    {
      name: "Unresolved disputes",
      value: dynamicStats.unresolvedDisputes,
      note: "Compliance visibility",
      href: "/compliance/disputes",
      icon: ShieldCheck,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-120 py-20 px-4 text-center select-none bg-white rounded-3xl border border-border-main hover:shadow-xs animate-scale-up">
        <span className="text-xs text-text-muted animate-pulse font-light">Loading Dashboard Data...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-120 py-20 px-4 text-center space-y-2 select-none bg-white rounded-3xl border border-border-main">
        <h3 className="text-sm font-semibold text-red-600">Could not load dashboard data</h3>
        <p className="text-xs text-text-muted font-light max-w-sm">
          {error?.message || "Check your connection and try again."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Needs Action Alert Banner */}
      {showBanner && (
        <div className="flex items-center justify-between gap-4 py-3 px-4 bg-white/90 rounded-xl animate-fade-in transition-all">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-text-primary py-1 rounded-full">
              <AlertTriangle size={18} className="text-amber-500" />
              Needs action
            </span>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <Link
                href="/wallets"
                className="text-blue-400 hover:underline bg-blue-50 px-2.5 py-1 rounded-xl transition"
              >
                3 wallet credits pending
              </Link>
              <Link
                href="/wallets"
                className="text-orange-500 hover:underline bg-orange-50 px-2.5 py-1 rounded-xl transition"
              >
                11 Refund queue
              </Link>
              <Link
                href="/compliance/kyc"
                className="text-amber-700 hover:underline bg-amber-50 px-2.5 py-1 rounded-xl transition"
              >
                23 KYC queue
              </Link>
              <Link
                href="/compliance/disputes"
                className="text-rose-500 hover:underline bg-red-50 px-2.5 py-1 rounded-xl transition"
              >
                7 Open disputes
              </Link>
            </div>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="p-1 rounded-lg hover:text-red-600 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Title / Time filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
        {timeFilter === "Custom" && (
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />
        )}
        {/* Time filters matching mockup selector */}
        <div className="inline-flex bg-white border border-border-main p-2 rounded-xl self-start gap-2">
          {["Today", "This week", "This month", "Custom"].map((tab) => (
            <button
              key={tab}
              onClick={() => setTimeFilter(tab)}
              className={`px-2 py-2 text-xs rounded-lg transition-all duration-200 cursor-pointer ${timeFilter === tab
                  ? "bg-primary-bg text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Operations Grid */}
      <div className="pb-2">
        <h2 className="text-sm font-medium tracking-wider text-text-primary uppercase mb-2">
          Operations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {operationsCards.map((card, idx) => (
            <CardWrapper
              key={idx}
              name={card.name}
              value={card.value}
              subtext={card.note}
              icon={card.icon}
              href={card.href}
            />
          ))}
        </div>
      </div>

      {/* 3. Money Section & Charts Layout */}
      <div className="pb-2">
        <h2 className="text-sm font-medium tracking-wider text-text-primary uppercase mb-2">
          Money
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Money Info Cards Column */}
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
            {moneyCards.map((card, idx) => (
              <CardWrapper
                key={idx}
                name={card.name}
                value={card.value}
                subtext={card.note}
                icon={card.icon}
                href={card.href}
              />
            ))}
          </div>

          {/* Chart card column */}
          <div className="bg-white rounded-2xl p-4 hover:shadow-xs transition-all duration-200 lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium md:text-base text-sm text-text-primary">
                    Real Refunds vs. Wallet Credits
                  </h3>
                </div>
                <div className="flex gap-2 items-center">
                  <p className="text-[10px] text-text-muted">This week · USD</p>
                  {/* Bar / Line Selector Toggle */}
                  <div className="inline-flex md:flex-row flex-col bg-primary-bg/10 p-1 rounded-xl">
                    {["Bar", "Line"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setChartType(type)}
                        className={`px-3 py-1 text-[10px] font-semibold rounded-lg transition-all cursor-pointer ${chartType === type
                            ? "bg-white text-text-primary shadow-xs"
                            : "text-text-muted hover:text-text-primary"
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart visualization */}
              <div className="mt-4 relative w-full overflow-x-auto [ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
                <div className="min-w-125 sm:min-w-0 relative">
                  <svg className="w-full" viewBox="0 0 540 180" preserveAspectRatio="none">
                    {/* Grid Lines */}
                    <line x1="55" y1="20" x2="520" y2="20" stroke="#EDF3F3" strokeWidth="1" strokeDasharray="3" />
                    <line x1="55" y1="50" x2="520" y2="50" stroke="#EDF3F3" strokeWidth="1" strokeDasharray="3" />
                    <line x1="55" y1="80" x2="520" y2="80" stroke="#EDF3F3" strokeWidth="1" strokeDasharray="3" />
                    <line x1="55" y1="110" x2="520" y2="110" stroke="#EDF3F3" strokeWidth="1" strokeDasharray="3" />
                    <line x1="55" y1="140" x2="520" y2="140" stroke="#EDF3F3" strokeWidth="1" />

                    {/* Y-Axis Labels */}
                    <text x="10" y="24" className="text-[10px] text-text-muted fill-current font-medium">$10.0k</text>
                    <text x="10" y="54" className="text-[10px] text-text-muted fill-current font-medium">$7.5k</text>
                    <text x="10" y="84" className="text-[10px] text-text-muted fill-current font-medium">$5.0k</text>
                    <text x="10" y="114" className="text-[10px] text-text-muted fill-current font-medium">$2.5k</text>
                    <text x="10" y="144" className="text-[10px] text-text-muted fill-current font-medium">$0.0k</text>

                    {chartType === "Bar" ? (
                      // Bar Chart Option
                      chartData.map((data, index) => {
                        const x_center = pointX(index);
                        const outboundHeight = ((Number(data.outbound) || 0) / maxVal) * 120;
                        const retainedHeight = ((Number(data.retained) || 0) / maxVal) * 120;
                        return (
                          <g key={index} className="group">
                            {/* Outbound bar */}
                            <rect
                              x={x_center - 20}
                              y={140 - outboundHeight}
                              width="24"
                              height={outboundHeight}
                              fill="#6FB5BD"
                              rx="3"
                              className="transition-all duration-300 hover:opacity-95 cursor-pointer"
                              onMouseEnter={() => setHoveredValue({
                                x: x_center - 8,
                                y: 140 - outboundHeight,
                                value: `$${data.outbound.toLocaleString()}`,
                                label: `Outbound (${data.label})`
                              })}
                              onMouseLeave={() => setHoveredValue(null)}
                            />
                            {/* Retained bar */}
                            <rect
                              x={x_center + 6}
                              y={140 - retainedHeight}
                              width="24"
                              height={retainedHeight}
                              fill="#0B163F"
                              rx="3"
                              className="transition-all duration-300 hover:opacity-95 cursor-pointer"
                              onMouseEnter={() => setHoveredValue({
                                x: x_center + 18,
                                y: 140 - retainedHeight,
                                value: `$${data.retained.toLocaleString()}`,
                                label: `Retained (${data.label})`
                              })}
                              onMouseLeave={() => setHoveredValue(null)}
                            />
                            {/* X-Axis Label */}
                            <text
                              x={x_center + 5}
                              y="155"
                              textAnchor="middle"
                              className="text-[11px] text-text-muted fill-current font-medium"
                            >
                              {data.label}
                            </text>
                          </g>
                        );
                      })
                    ) : (
                      // Line Chart Option
                      <g>
                        {/* Lines Paths */}
                        <path
                          d={linePath("outbound")}
                          fill="none"
                          stroke="#6FB5BD"
                          strokeWidth="3"
                          strokeLinecap="round"
                          className="transition-all duration-500"
                        />
                        <path
                          d={linePath("retained")}
                          fill="none"
                          stroke="#0B163F"
                          strokeWidth="3"
                          strokeLinecap="round"
                          className="transition-all duration-500"
                        />

                        {/* Dots and Labels */}
                        {chartData.map((data, index) => {
                          const x_center = pointX(index);
                          const cyOut = pointY(data.outbound);
                          const cyRet = pointY(data.retained);
                          return (
                            <g key={index}>
                              {/* Outbound Dot */}
                              <circle
                                cx={x_center}
                                cy={cyOut}
                                r="4"
                                fill="#6FB5BD"
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredValue({
                                  x: x_center,
                                  y: cyOut,
                                  value: `$${data.outbound.toLocaleString()}`,
                                  label: `Outbound (${data.label})`
                                })}
                                onMouseLeave={() => setHoveredValue(null)}
                              />
                              {/* Retained Dot */}
                              <circle
                                cx={x_center}
                                cy={cyRet}
                                r="4"
                                fill="#0B163F"
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredValue({
                                  x: x_center,
                                  y: cyRet,
                                  value: `$${data.retained.toLocaleString()}`,
                                  label: `Retained (${data.label})`
                                })}
                                onMouseLeave={() => setHoveredValue(null)}
                              />
                              {/* X-Axis Label */}
                              <text
                                x={x_center}
                                y="155"
                                textAnchor="middle"
                                className="text-[11px] text-text-muted fill-current font-medium"
                              >
                                {data.label}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    )}
                  </svg>
                  {hoveredValue && (
                    <div
                      className="absolute bg-alt-bg/95 backdrop-blur-xs text-white p-2 rounded-lg text-[10px] pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 z-30 transition-all duration-150 shadow-md border border-white/10"
                      style={{
                        left: `${(hoveredValue.x / 540) * 100}%`,
                        top: `${(hoveredValue.y / 180) * 100}%`
                      }}
                    >
                      <div className="font-semibold text-[11px]">{hoveredValue.value}</div>
                      <div className="text-white/70 text-[9px] whitespace-nowrap mt-0.5">{hoveredValue.label}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Legend indicators */}
            <div className="flex items-center gap-6 justify-center">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-primary-bg rounded-xs" />
                <span className="text-[10px] text-primary-bg">Outbound</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-alt-bg rounded-xs" />
                <span className="text-[10px] text-text-primary">Retained</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Accounts & Compliance Grid */}
      <div className="pb-2">
        <h2 className="text-sm font-medium tracking-wider text-text-primary uppercase mb-2">
          Accounts & Compliance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {accountsCards.map((card, idx) => (
            <CardWrapper
              key={idx}
              name={card.name}
              value={card.value}
              subtext={card.note}
              href={card.href}
              icon={card.icon}
            />
          ))}
        </div>
      </div>

      {/* 5. Market Intelligence Row */}
      <div>
        <h2 className="text-sm font-medium tracking-wider text-text-primary uppercase mb-2">
          Market Intelligence
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Cities */}
          <div className="bg-white rounded-2xl p-4 hover:shadow-xs transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary-bg/10 rounded-full">
                    <BookOpen size={18} className="text-primary-bg" />
                  </div>
                  <h3 className="text-sm font-medium text-text-primary">Top cities with unmet demand</h3>
                </div>
                <Link
                  href="/platform/market-intelligence"
                  className="text-[10px] text-primary-bg hover:underline flex items-center gap-1"
                >
                  View full report <ArrowRight size={12} />
                </Link>
              </div>

              {/* Progress Bars matching Figma */}
              <div className="space-y-4">
                {[
                  { city: "Lagos", gap: 87 },
                  { city: "Nairobi", gap: 74 },
                  { city: "Accra", gap: 61 },
                  { city: "Abuja", gap: 55 },
                  { city: "Kampala", gap: 48 },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-medium">
                      <span className="text-text-primary">{idx + 1}. {item.city}</span>
                      <span className="text-red-500">{item.gap}% gap</span>
                    </div>
                    <div className="h-1 w-full bg-secondary-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-bg rounded-full transition-all duration-500"
                        style={{ width: `${item.gap}` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trending Searches */}
          <div className="bg-white rounded-2xl p-4 hover:shadow-xs transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary-bg/10 rounded-full">
                    <TrendingUp size={18} className="text-primary-bg" />
                  </div>
                  <h3 className="text-sm font-medium text-text-primary">Trending searches this week</h3>
                </div>
                <Link
                  href="/platform/market-intelligence"
                  className="text-[10px] text-primary-bg hover:underline flex items-center gap-1"
                >
                  Market intelligence <ArrowRight size={12} />
                </Link>
              </div>

              {/* Search listings with index */}
              <div>
                {[
                  { term: "Deep clean apartment", count: "1,840" },
                  { term: "Move-out cleaning", count: "1,432" },
                  { term: "Carpet steam clean", count: "987" },
                  { term: "Post-construction clean", count: "841" },
                  { term: "Office cleaning daily", count: "620" },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2.5 text-[10px] font-medium">
                    <span className="text-text-muted">{idx + 1} <span className="text-text-primary font-medium ml-2">{item.term}</span></span>
                    <span className="text-primary-bg">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
