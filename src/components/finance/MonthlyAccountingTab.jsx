"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronDown, Download, FileText } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import CardWrapper from "@/components/ui/CardWrapper";
import { exportCSV, exportPDF } from "@/utils/exportHelper";

const mockTransactions = [
  { id: "TXN00192123500007", date: "June 9, 2027", time: "1:15 PM", client: "Logan Walker", provider: "Zoe Robinson", category: "Post-Construction Cleaning", amount: 500.00, fee: 25.00, commission: 30.00, tip: 20.00, status: "Completed" },
  { id: "TXN00192123500004", date: "June 6, 2027", time: "3:10 PM", client: "Isabella Thomas", provider: "Lucas Garcia", category: "Window Cleaning", amount: 250.00, fee: 12.50, commission: 15.00, tip: 10.00, status: "Completed" },
  { id: "TXN00192123500011", date: "June 13, 2027", time: "10:30 AM", client: "Chloe Torres", provider: "Daniel Baker", category: "Sanitization Services", amount: 300.00, fee: 15.00, commission: 20.00, tip: 15.00, status: "In Progress" },
  { id: "TXN00192123500009", date: "June 11, 2027", time: "5:30 PM", client: "Avery King", provider: "Jacob Wright", category: "Commercial Cleaning", amount: 700.00, fee: 35.00, commission: 45.00, tip: 30.00, status: "Refund Requested" },
  { id: "TXN00192123500006", date: "June 8, 2027", time: "4:00 PM", client: "Amelia Clark", provider: "Alexander Lewis", category: "Deep Cleaning", amount: 400.00, fee: 20.00, commission: 25.00, tip: 15.00, status: "Dispute" },
  { id: "TXN00192123500003", date: "June 5, 2027", time: "10:00 AM", client: "Ethan Martinez", provider: "Ava Anderson", category: "Pressure Washing", amount: 300.00, fee: 15.00, commission: 20.00, tip: 12.00, status: "Completed" },
  { id: "TXN00192123500005", date: "June 7, 2027", time: "9:30 AM", client: "Charlotte Lee", provider: "James Harris", category: "Floor Waxing", amount: 300.00, fee: 15.00, commission: 20.00, tip: 11.00, status: "In Progress" }
];

// Monthly grouped bar chart data
const chartMonths = [
  { month: "Jan", volume: 50, amount: 82, fees: 78, commission: 50, tips: 48 },
  { month: "Feb", volume: 65, amount: 12, fees: 46, commission: 32, tips: 22 },
  { month: "Mar", volume: 18, amount: 92, fees: 93, commission: 67, tips: 38 },
  { month: "Apr", volume: 33, amount: 24, fees: 52, commission: 40, tips: 42 },
  { month: "May", volume: 70, amount: 48, fees: 96, commission: 58, tips: 21 },
  { month: "Jun", volume: 67, amount: 64, fees: 25, commission: 86, tips: 60 },
  { month: "Jul", volume: 70, amount: 80, fees: 56, commission: 17, tips: 84 },
  { month: "Aug", volume: 50, amount: 69, fees: 30, commission: 92, tips: 95 },
  { month: "Sep", volume: 64, amount: 68, fees: 8, commission: 75, tips: 42 },
  { month: "Oct", volume: 86, amount: 37, fees: 7, commission: 49, tips: 31 },
  { month: "Nov", volume: 18, amount: 84, fees: 93, commission: 52, tips: 52 },
  { month: "Dec", volume: 10, amount: 85, fees: 6, commission: 46, tips: 49 }
];

export default function MonthlyAccountingTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [hoveredValue, setHoveredValue] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [isLoading, setIsLoading] = useState(true);
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleExportCSV = () => {
    const headers = ["Transaction ID", "Date", "Time", "Client", "Provider", "Category", "Amount ($)", "Client Fee ($)", "Commission ($)", "Tip ($)", "Status"];
    const rows = mockTransactions.map(item => `"${item.id}","${item.date}","${item.time}","${item.client}","${item.provider}","${item.category}",${item.amount},${item.fee},${item.commission},${item.tip},"${item.status}"`);
    exportCSV(headers, rows, `monthly_accounting_${Date.now()}.csv`);
  };

  const handleExportPDF = () => {
    const headers = ["TXN ID", "Date", "Time", "Client", "Provider", "Category", "Amount", "Client Fee", "Commission", "Tip", "Status"];
    const rows = mockTransactions.map(item => [
      item.id,
      item.date,
      item.time,
      item.client,
      item.provider,
      item.category,
      `$${item.amount.toFixed(2)}`,
      `$${item.fee.toFixed(2)}`,
      `$${item.commission.toFixed(2)}`,
      `$${item.tip.toFixed(2)}`,
      item.status
    ]);
    exportPDF("Monthly Accounting Report", headers, rows, `monthly_accounting_${Date.now()}.pdf`);
  };

  const filteredData = useMemo(() => {
    return mockTransactions.filter((t) => {
      const matchSearch = t.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === "All" || t.status === filterStatus;
      const matchCategory = filterCategory === "All" || t.category === filterCategory;

      let matchDate = true;
      if (startDate || endDate) {
        const itemDate = new Date(t.date);
        if (startDate && itemDate < new Date(startDate)) matchDate = false;
        if (endDate && itemDate > new Date(endDate)) matchDate = false;
      }

      return matchSearch && matchStatus && matchCategory && matchDate;
    });
  }, [searchTerm, filterStatus, filterCategory, startDate, endDate]);

  const paginated = useMemo(() => {
    return filteredData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredData, currentPage]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return "text-emerald-500 bg-emerald-50";
      case "In Progress":
        return "text-amber-500 bg-amber-50";
      case "Refund Requested":
        return "text-blue-500 bg-blue-50";
      case "Dispute":
        return "text-red-500 bg-red-50";
      default:
        return "text-text-muted bg-page-bg";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 py-20 px-4 text-center select-none bg-white rounded-3xl border border-secondary-bg hover:shadow-xs animate-scale-up">
        <span className="text-xs text-text-muted animate-pulse font-light">Loading Accounting Data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-scale-up font-onest">
      
      {/* Export Action Buttons matching TransactionVolumeTab & NetRevenueTab */}
      <div className="flex justify-end items-center pb-1">
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

      {/* 1. Primary Top Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <CardWrapper
          name="TOTAL TRANSACTIONS"
          value="14,283"
          subtext="8.2% vs last month"
        />
        <CardWrapper
          name="TRANSACTION VOLUME"
          value="$482,540"
          subtext="Total processed this month"
        />
        <CardWrapper
          name="PLATFORM REVENUE"
          value="$48,254"
          subtext="Fees + commissions collected"
        />
        <CardWrapper
          name="TOTAL TIPS"
          value="$12,860"
          subtext="Paid directly to providers"
        />
      </div>

      {/* 2. Grouped Multi-Bar Chart Container */}
      <div className="bg-white rounded-3xl p-4 hover:shadow-xs transition space-y-2">

        <div className="relative w-full overflow-x-auto [ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
          <div className="w-full flex flex-col justify-between gap-2 py-2 pl-8 min-w-162.5 sm:min-w-0">
            
            {/* Grid background lines */}
            <div className="relative h-48 w-full flex flex-col justify-between border-b border-secondary-bg">
              {[100, 80, 60, 40, 20, 0].map((val) => (
                <div key={val} className="relative w-full border-b border-dashed border-secondary-bg/75 flex items-center">
                  <span className="absolute -left-7 text-[10px] text-text-muted font-light">{val}</span>
                </div>
              ))}

              {/* Bars Group per Month */}
              <div className="absolute inset-0 flex justify-between items-end px-2">
                {chartMonths.map((item, idx) => {
                  const xPos = `${(idx + 0.5) * (100 / 12)}%`;
                  return (
                    <div key={idx} className="flex items-end gap-0.5 h-full group relative">
                      {/* Bar 1 - Volume */}
                      <div 
                        style={{ height: `${item.volume}%` }} 
                        className="w-1.5 md:w-3 bg-[#E57373] rounded-t-xs transition-all duration-200 cursor-pointer hover:opacity-80" 
                        onMouseEnter={() => setHoveredValue({
                          x: xPos,
                          y: `${100 - item.volume}%`,
                          isHigh: item.volume >= 50,
                          monthIndex: idx,
                          value: `${Math.round(item.volume * 25).toLocaleString()} txns`,
                          label: `Transaction Volume (${item.month})`
                        })}
                        onMouseLeave={() => setHoveredValue(null)}
                      />
                      {/* Bar 2 - Amount */}
                      <div 
                        style={{ height: `${item.amount}%` }} 
                        className="w-1.5 md:w-3 bg-[#81C784] rounded-t-xs transition-all duration-200 cursor-pointer hover:opacity-80" 
                        onMouseEnter={() => setHoveredValue({
                          x: xPos,
                          y: `${100 - item.amount}%`,
                          isHigh: item.amount >= 50,
                          monthIndex: idx,
                          value: `$${(item.amount * 500).toLocaleString()}`,
                          label: `Amount (${item.month})`
                        })}
                        onMouseLeave={() => setHoveredValue(null)}
                      />
                      {/* Bar 3 - Fees */}
                      <div 
                        style={{ height: `${item.fees}%` }} 
                        className="w-1.5 md:w-3 bg-[#4DD0E1] rounded-t-xs transition-all duration-200 cursor-pointer hover:opacity-80" 
                        onMouseEnter={() => setHoveredValue({
                          x: xPos,
                          y: `${100 - item.fees}%`,
                          isHigh: item.fees >= 50,
                          monthIndex: idx,
                          value: `$${(item.fees * 50).toLocaleString()}`,
                          label: `Fees (${item.month})`
                        })}
                        onMouseLeave={() => setHoveredValue(null)}
                      />
                      {/* Bar 4 - Commission */}
                      <div 
                        style={{ height: `${item.commission}%` }} 
                        className="w-1.5 md:w-3 bg-[#D7CCC8] rounded-t-xs transition-all duration-200 cursor-pointer hover:opacity-80" 
                        onMouseEnter={() => setHoveredValue({
                          x: xPos,
                          y: `${100 - item.commission}%`,
                          isHigh: item.commission >= 50,
                          monthIndex: idx,
                          value: `$${(item.commission * 50).toLocaleString()}`,
                          label: `Commission (${item.month})`
                        })}
                        onMouseLeave={() => setHoveredValue(null)}
                      />
                      {/* Bar 5 - Tips */}
                      <div 
                        style={{ height: `${item.tips}%` }} 
                        className="w-1.5 md:w-3 bg-[#B39DDB] rounded-t-xs transition-all duration-200 cursor-pointer hover:opacity-80" 
                        onMouseEnter={() => setHoveredValue({
                          x: xPos,
                          y: `${100 - item.tips}%`,
                          isHigh: item.tips >= 50,
                          monthIndex: idx,
                          value: `$${(item.tips * 25).toLocaleString()}`,
                          label: `Tips (${item.month})`
                        })}
                        onMouseLeave={() => setHoveredValue(null)}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Tooltip Overlay */}
              {hoveredValue && (
                <div 
                  className={`absolute bg-alt-bg/95 backdrop-blur-xs text-white px-2.5 py-1.5 rounded-lg text-[10px] pointer-events-none z-30 transition-all duration-150 shadow-md border border-white/10 ${
                    hoveredValue.monthIndex >= 10 
                      ? "-translate-x-full -ml-1" 
                      : hoveredValue.monthIndex <= 1 
                      ? "translate-x-0 ml-1" 
                      : "-translate-x-1/2"
                  } ${
                    hoveredValue.isHigh ? "translate-y-2" : "-translate-y-full -mt-2"
                  }`}
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

            {/* X-Axis Month Labels */}
            <div className="flex justify-between items-center px-5">
              {chartMonths.map((item, idx) => (
                <span key={idx} className="text-[10px] text-text-muted font-medium text-center w-10">
                  {item.month}
                </span>
              ))}
            </div>

          </div>
        </div>

        {/* Chart Legend */}
        <div className="flex items-center justify-center gap-4 flex-wrap text-[10px] text-text-muted font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#E57373]" />
            <span>Transaction Volume</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#81C784]" />
            <span>Amount</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#4DD0E1]" />
            <span>Fees</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#D7CCC8]" />
            <span>Commission</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#B39DDB]" />
            <span>Tips</span>
          </div>
        </div>
      </div>

      {/* 3. Secondary Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <CardWrapper
          name="HIGHEST REVENUE"
          value="$52,450"
          subtext="June"
        />
        <CardWrapper
          name="HIGHEST COUNT"
          value="1,684"
          subtext="August"
        />
        <CardWrapper
          name="HIGHEST COMMISSION"
          value="$4,820"
          subtext="July"
        />
        <CardWrapper
          name="HIGHEST TIPS"
          value="$2,140"
          subtext="December"
        />
      </div>

      {/* 4. Table Container Box */}
      <div className="bg-white rounded-3xl border border-secondary-bg hover:shadow-xs relative overflow-visible">
        
        {/* Filters control bar: Search bar on left, Status, Category & Date Range filters on right */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white rounded-t-3xl border-b border-secondary-bg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by client/provider's name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-md w-full border border-border-main text-xs rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Status selector */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-border-main text-xs rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
              >
                <option value="All">Status</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Refund Requested">Refund Requested</option>
                <option value="Dispute">Dispute</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
            </div>

            {/* Category selector */}
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-border-main text-xs rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
              >
                <option value="All">Category</option>
                <option value="Post-Construction Cleaning">Post-Construction</option>
                <option value="Window Cleaning">Window Cleaning</option>
                <option value="Sanitization Services">Sanitization Services</option>
                <option value="Commercial Cleaning">Commercial Cleaning</option>
                <option value="Deep Cleaning">Deep Cleaning</option>
                <option value="Pressure Washing">Pressure Washing</option>
                <option value="Floor Waxing">Floor Waxing</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
            </div>

            {/* Date range picker */}
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
                setCurrentPage(1);
              }}
            />

          </div>
        </div>

        {/* Data Table */}
        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white rounded-b-3xl min-h-80">
            <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">No Records Found</h3>
              <p className="text-xs text-text-muted font-light">No transaction records match current filters.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-b-3xl">
            <table className="min-w-full divide-y divide-secondary-bg text-sm tracking-tight">
              <thead className="bg-secondary-bg text-text-primary text-left text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3 font-semibold">Trans ID</th>
                  <th className="px-4 py-3 font-semibold">Date & Time</th>
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Provider</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Client Fee</th>
                  <th className="px-4 py-3 font-semibold">Commission</th>
                  <th className="px-4 py-3 font-semibold">Tip</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-bg text-xs text-text-primary">
                {paginated.map((item) => (
                  <tr key={item.id} className="hover:bg-page-bg/50 transition">
                    <td className="px-4 py-3 font-mono text-xs">{item.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-text-primary">{item.date}</span>
                        <span className="text-[10px] text-text-muted font-light">{item.time}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{item.client}</td>
                    <td className="px-4 py-3">{item.provider}</td>
                    <td className="px-4 py-3">{item.category}</td>
                    <td className="px-4 py-3">${item.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">${item.fee.toFixed(2)}</td>
                    <td className="px-4 py-3">${item.commission.toFixed(2)}</td>
                    <td className="px-4 py-3">${item.tip.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium ${getStatusBadge(item.status)}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Navigation Footer */}
        {filteredData.length > 0 && (
          <Pagination
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredData.length}
            onPageChange={setCurrentPage}
          />
        )}

      </div>

    </div>
  );
}
