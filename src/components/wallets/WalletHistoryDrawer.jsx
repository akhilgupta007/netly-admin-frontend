"use client";

import React, { useState } from "react";
import { Search, ChevronDown, X, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { getInitials } from "@/lib/utils";

export default function WalletHistoryDrawer({ wallet, isOpen, onClose }) {
  const [historySearch, setHistorySearch] = useState("");
  const [historyType, setHistoryType] = useState("All");
  const [historyPage, setHistoryPage] = useState(1);

  if (!isOpen || !wallet) return null;

  // Mock Wallet History details (Slide 8)
  const walletHistory = [
    { date: "Jun 24, 2027, 09:00", description: "Provider cancellation refund", type: "Credit", amount: 90.25, txn: "TXN-0018945687", running: 247.50 },
    { date: "Jul 12, 2027, 14:30", description: "Booking payment", type: "Debit", amount: 50.00, txn: "TXN-0018945687", running: 197.50 },
    { date: "Aug 05, 2027, 11:15", description: "Admin wallet credit", type: "Credit", amount: 75.00, txn: "TXN-0018945687", running: 122.50 },
    { date: "Sep 09, 2027, 15:45", description: "Booking payment", type: "Debit", amount: 40.00, txn: "TXN-0018945687", running: 82.50 },
    { date: "Oct 20, 2027, 08:00", description: "Tip returned", type: "Credit", amount: 20.50, txn: "TXN-0018945687", running: 62.00 }
  ];

  // Dynamic client-side filtering and pagination configuration
  const itemsPerPage = 6;
  const filteredHistory = walletHistory.filter(item => {
    const matchS = item.description.toLowerCase().includes(historySearch.toLowerCase()) || item.txn.toLowerCase().includes(historySearch.toLowerCase());
    const matchT = historyType === "All" || item.type === historyType;
    return matchS && matchT;
  });

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const paginatedHistory = filteredHistory.slice(
    (historyPage - 1) * itemsPerPage,
    historyPage * itemsPerPage
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-onest">
      <div 
        className="absolute inset-0 bg-alt-bg/20 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-lg md:max-w-xl bg-white flex flex-col shadow-2xl h-full transition-all">
          
          {/* Drawer Header */}
          <div className="p-4 border-b border-secondary-bg flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-base font-semibold text-text-primary">
                Wallet History
              </h2>
            </div>
            <button 
              onClick={onClose} 
              className="w-5 h-5 rounded-full bg-alt-bg text-white flex items-center justify-center hover:opacity-90 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            
            {/* Client / Available balance header blocks */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-page-bg rounded-2xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-text-muted">Client</span>
                  <Link 
                    href="/accounts" 
                    className="text-[10px] text-primary-bg hover:underline font-light flex items-center gap-0.5"
                  >
                    View account <ArrowUpRight size={10} />
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary-bg text-white flex items-center justify-center text-xs font-semibold font-mono">
                    {getInitials(wallet.client.name)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">{wallet.client.name}</h4>
                    <p className="text-xs text-text-muted font-light">{wallet.client.email}</p>
                  </div>
                </div>
              </div>
              <div className="bg-primary-bg-muted/15 rounded-2xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-text-muted block font-medium">Available balance</span>
                <strong className="text-xl text-text-primary font-bold block -mb-1">${wallet.balance.toFixed(2)}</strong>
              </div>
            </div>

            {/* Inner Filters row */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={historySearch}
                  onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                  className="w-full border border-border-main text-xs rounded-full pl-9 pr-3 py-2 focus:outline-none text-text-primary"
                />
              </div>
              <div className="relative">
                <select
                  value={historyType}
                  onChange={(e) => { setHistoryType(e.target.value); setHistoryPage(1); }}
                  className="border border-border-main text-xs rounded-full pl-3 pr-8 py-2 focus:outline-none appearance-none text-text-primary cursor-pointer"
                >
                  <option value="All">Type</option>
                  <option value="Credit">Credit</option>
                  <option value="Debit">Debit</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-text-muted pointer-events-none" />
              </div>
            </div>

            {/* History Table */}
            <div className="border border-secondary-bg rounded-2xl overflow-hidden">
              <table className="min-w-full divide-y divide-secondary-bg text-xs">
                <thead className="bg-secondary-bg text-text-primary">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold">Linked Txn.</th>
                    <th className="px-4 py-3 text-left font-semibold">Running</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-bg">
                  {paginatedHistory.length > 0 ? (
                    paginatedHistory.map((item, index) => (
                      <tr key={index} className="hover:bg-page-bg/50 transition">
                        <td className="px-4 py-3">
                          <span className="text-text-primary block">{item.date}</span>
                          <span className="text-[10px] text-text-muted block mt-1">{item.description}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-[9px] font-light ${
                            item.type === "Credit" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-primary">${item.amount.toFixed(2)}</td>
                        <td className="px-4 py-3 text-text-primary">{item.txn}</td>
                        <td className="px-4 py-3 text-text-primary">${item.running.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-12 text-center text-text-muted font-light">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75" />
                          <span>No transactions found matching filter criteria.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* History Drawer Pagination */}
            {totalPages > 0 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-text-muted font-medium">
                  Showing {(historyPage - 1) * itemsPerPage + 1}-{Math.min(historyPage * itemsPerPage, filteredHistory.length)} of {filteredHistory.length}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={historyPage === 1}
                    onClick={() => setHistoryPage(prev => Math.max(prev - 1, 1))}
                    className="w-6 h-6 flex items-center justify-center border border-secondary-bg rounded hover:bg-page-bg text-xs font-bold disabled:opacity-50 transition cursor-pointer"
                  >
                    &larr;
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setHistoryPage(idx + 1)}
                      className={`w-6 h-6 rounded text-xs font-bold transition cursor-pointer ${
                        historyPage === idx + 1
                          ? "bg-primary-bg text-white"
                          : "border border-secondary-bg hover:bg-page-bg text-text-primary"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  <button
                    disabled={historyPage === totalPages}
                    onClick={() => setHistoryPage(prev => Math.min(prev + 1, totalPages))}
                    className="w-6 h-6 flex items-center justify-center border border-secondary-bg rounded hover:bg-page-bg text-xs font-bold disabled:opacity-50 transition cursor-pointer"
                  >
                    &rarr;
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
