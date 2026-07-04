"use client";

import React, { useState } from "react";
import Link from "next/link";
import CardWrapper from "@/components/ui/CardWrapper";
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

  // Time filter state
  const [timeFilter, setTimeFilter] = useState("This week");

  // Chart type state (Bar or Line)
  const [chartType, setChartType] = useState("Bar");

  // Mock data for weekly chart
  const chartData = [
    { label: "Mon", outbound: 5400, retained: 3700 },
    { label: "Tue", outbound: 6600, retained: 4800 },
    { label: "Wed", outbound: 4700, retained: 3000 },
    { label: "Thu", outbound: 7800, retained: 6000 },
    { label: "Fri", outbound: 9600, retained: 7600 },
    { label: "Sat", outbound: 6100, retained: 4300 },
    { label: "Sun", outbound: 4800, retained: 3100 },
  ];

  const maxVal = 10000;

  // Operations metrics data
  const operationsCards = [
    {
      name: "Bookings",
      value: "1,284",
      note: "This week",
      icon: Calendar,
    },
    {
      name: "Completion rate",
      value: "94.2%",
      note: "Completed + canceled",
      icon: CheckCircle,
    },
    {
      name: "Open disputes",
      value: "7",
      note: "Tap to review",
      icon: AlertTriangle,
      href: "/compliance/disputes",
    },
    {
      name: "Wallet credits pending",
      value: "3",
      note: "Awaiting approval",
      icon: Clock,
    },
    {
      name: "Refund requests",
      value: "11",
      note: "Awaiting approval",
      icon: Clock,
    },
    {
      name: "KYC docs in queue",
      value: "23",
      note: "Identity verification",
      icon: ShieldCheck,
      href: "/compliance/kyc",
    },
  ];

  // Money info cards data
  const moneyCards = [
    {
      name: "Gross Merchandise Value",
      value: "$48,291.00",
      note: "This week",
      icon: ShieldCheck,
    },
    {
      name: "NETLY net revenue",
      value: "$9,820.45",
      note: "5% + 15% commission",
      icon: ShieldCheck,
    },
    {
      name: "Non-refundable 5% fees",
      value: "$2,414.55",
      note: "Total collected",
      icon: ShieldCheck,
    },
    {
      name: "Client wallet balance",
      value: "$31,847.20",
      note: "Live liability - no trend",
      icon: ShieldCheck,
    },
  ];

  // Accounts & Compliance cards data
  const accountsCards = [
    {
      name: "New clients",
      value: "284",
      note: "This week",
      icon: ShieldCheck,
    },
    {
      name: "New providers",
      value: "61",
      note: "This week",
      icon: ShieldCheck,
    },
    {
      name: "Suspended accounts",
      value: "14",
      note: "Tap to manage",
      icon: ShieldCheck,
    },
    {
      name: "Unresolved disputes",
      value: "7",
      note: "Compliance visibility",
      href: "/compliance/disputes",
      icon: ShieldCheck,
    },
  ];

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
        {/* Time filters matching mockup selector */}
        <div className="inline-flex bg-white border border-secondary-bg p-2 rounded-xl self-start gap-2">
          {["Today", "This week", "This month", "Custom"].map((tab) => (
            <button
              key={tab}
              onClick={() => setTimeFilter(tab)}
              className={`px-2 py-2 text-xs rounded-lg transition-all duration-200 cursor-pointer ${
                timeFilter === tab
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
              note={card.note}
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
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {moneyCards.map((card, idx) => (
              <CardWrapper 
                key={idx} 
                name={card.name}
                value={card.value}
                note={card.note}
                icon={card.icon}
              />
            ))}
          </div>

          {/* Chart card column */}
          <div className="bg-white rounded-2xl p-4 border border-secondary-bg hover:shadow-xs transition-all duration-200 lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium text-text-primary">
                    Outbound vs Wallet Credits Retained
                  </h3>
                </div>
                <div className="flex gap-2 items-center">
                  <p className="text-[10px] text-text-muted">This week · USD</p>
                  {/* Bar / Line Selector Toggle */}
                  <div className="inline-flex bg-primary-bg/10 p-1 rounded-xl">
                    {["Bar", "Line"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setChartType(type)}
                        className={`px-3 py-1 text-[10px] font-semibold rounded-lg transition-all cursor-pointer ${
                          chartType === type
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
              <div className="mt-4 relative w-full">
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
                      const x_center = 85 + index * 68;
                      const outboundHeight = (data.outbound / maxVal) * 120;
                      const retainedHeight = (data.retained / maxVal) * 120;
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
                        d={`M ${85} ${140 - (chartData[0].outbound / maxVal) * 120} 
                            L ${85 + 68} ${140 - (chartData[1].outbound / maxVal) * 120} 
                            L ${85 + 68 * 2} ${140 - (chartData[2].outbound / maxVal) * 120} 
                            L ${85 + 68 * 3} ${140 - (chartData[3].outbound / maxVal) * 120} 
                            L ${85 + 68 * 4} ${140 - (chartData[4].outbound / maxVal) * 120} 
                            L ${85 + 68 * 5} ${140 - (chartData[5].outbound / maxVal) * 120} 
                            L ${85 + 68 * 6} ${140 - (chartData[6].outbound / maxVal) * 120}`}
                        fill="none"
                        stroke="#6FB5BD"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                      <path
                        d={`M ${85} ${140 - (chartData[0].retained / maxVal) * 120} 
                            L ${85 + 68} ${140 - (chartData[1].retained / maxVal) * 120} 
                            L ${85 + 68 * 2} ${140 - (chartData[2].retained / maxVal) * 120} 
                            L ${85 + 68 * 3} ${140 - (chartData[3].retained / maxVal) * 120} 
                            L ${85 + 68 * 4} ${140 - (chartData[4].retained / maxVal) * 120} 
                            L ${85 + 68 * 5} ${140 - (chartData[5].retained / maxVal) * 120} 
                            L ${85 + 68 * 6} ${140 - (chartData[6].retained / maxVal) * 120}`}
                        fill="none"
                        stroke="#0B163F"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />

                      {/* Dots and Labels */}
                      {chartData.map((data, index) => {
                        const x_center = 85 + index * 68;
                        const cyOut = 140 - (data.outbound / maxVal) * 120;
                        const cyRet = 140 - (data.retained / maxVal) * 120;
                        return (
                          <g key={index}>
                            {/* Outbound Dot */}
                            <circle cx={x_center} cy={cyOut} r="4" fill="#6FB5BD" className="cursor-pointer" />
                            {/* Retained Dot */}
                            <circle cx={x_center} cy={cyRet} r="4" fill="#0B163F" className="cursor-pointer" />
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
              note={card.note}
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
          <div className="bg-white rounded-2xl p-4 border border-secondary-bg hover:shadow-xs transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
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
          <div className="bg-white rounded-2xl p-4 border border-secondary-bg hover:shadow-xs transition-all duration-200 flex flex-col justify-between">
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
