"use client";

import React, { useMemo } from "react";
import { X, Check, AlertCircle } from "lucide-react";

const mockHistory = [
  { date: "Jul 4, 2027", status: "Completed", detail: null, amount: 320.50, type: "success" },
  { date: "Jun 27, 2027", status: "Completed", detail: null, amount: 298.00, type: "success" },
  { date: "Jun 20, 2027", status: "Failed", detail: "Stripe transfer declined.", amount: null, type: "fail" },
  { date: "Jun 13, 2027", status: "Skipped", detail: "Missing payout account.", amount: null, type: "skip" },
  { date: "Jun 6, 2027", status: "Completed", detail: null, amount: 245.75, type: "success" }
];

export default function ViewPayoutDetailsModal({ isOpen, onClose, payout }) {
  const bookings = useMemo(() => {
    if (!payout) return [];
    // Scale bookings dynamically to total up exactly to provider's wallet balance
    const scale = payout.walletBalance / 434.50;
    return [
      { id: "BK-4821", date: "Jul 8, 2027", gross: 120.00 * scale, commission: -18.00 * scale, tip: 10.00 * scale, net: 112.00 * scale },
      { id: "BK-4805", date: "Jul 6, 2027", gross: 85.00 * scale, commission: -12.75 * scale, tip: 0, net: 72.25 * scale },
      { id: "BK-4790", date: "Jul 3, 2027", gross: 200.00 * scale, commission: -30.00 * scale, tip: 20.00 * scale, net: 190.00 * scale },
      { id: "BK-4772", date: "Jun 30, 2027", gross: 65.00 * scale, commission: -9.75 * scale, tip: 5.00 * scale, net: 60.25 * scale }
    ];
  }, [payout]);

  if (!isOpen || !payout) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-4 max-w-xl w-full space-y-4 shadow-xl relative animate-scale-up max-h-[90vh] overflow-y-auto scrollbar-thin font-onest">
        <div className="flex items-center justify-between gap-4 border-b border-border-main pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base text-text-primary leading-none">{payout.provider}</span>
            </div>
            <span className="text-[11px] text-text-muted font-light block">{payout.email}</span>
            <span className="text-[11px] text-primary-bg font-medium block">
              Wallet: <strong className="font-bold text-primary-bg">${payout.walletBalance.toFixed(2)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 h-full">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full md:text-xs text-[10px] font-medium ${payout.status === "Completed" ? "bg-[#E8F8F5] text-[#10B981]" :
                payout.status === "Processing" ? "bg-blue-50 text-blue-500" :
                  payout.status === "Pending" ? "bg-amber-50 text-amber-500" :
                    "bg-red-50 text-red-500"
              }`}>
              • {payout.status}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-5 h-5 rounded-full bg-[#0F172A] text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Current Wallet Breakdown</h3>
            <p className="text-[10px] text-text-muted font-light">Completed bookings contributing to this provider's wallet balance.</p>
          </div>
          <div className="border border-border-main rounded-2xl overflow-hidden bg-white">
            <table className="min-w-full divide-y divide-secondary-bg text-left md:text-xs text-[10px]">
              <thead className="bg-secondary-bg text-text-primary md:text-[10px] text-[7px] font-semibold">
                <tr>
                  <th className="px-4 py-2 font-semibold">Booking ID</th>
                  <th className="px-4 py-2 font-semibold">Date</th>
                  <th className="px-4 py-2 font-semibold">Gross</th>
                  <th className="px-4 py-2 font-semibold">Commission</th>
                  <th className="px-4 py-2 font-semibold">Tip</th>
                  <th className="px-4 py-2 font-semibold text-right pr-6">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-bg text-text-primary md:text-xs text-[10px]">
                {bookings.map((bk) => (
                  <tr key={bk.id} className="hover:bg-page-bg/30">
                    <td className="px-4 py-2.5">{bk.id}</td>
                    <td className="px-4 py-2.5 text-text-muted font-light">{bk.date}</td>
                    <td className="px-4 py-2.5">${bk.gross.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-red-500">-${Math.abs(bk.commission).toFixed(2)}</td>
                    <td className="px-4 py-2.5">
                      {bk.tip > 0 ? (
                        <span className="text-[#10B981]">+${bk.tip.toFixed(2)}</span>
                      ) : (
                        <span className="text-text-muted font-light">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right pr-6">${bk.net.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="bg-[#F7F9FA] px-4 py-2.5 flex justify-end items-center gap-4 text-xs border-t border-border-main">
              <span className="text-text-primary">Total Wallet Balance</span>
              <span className="text-text-primary pr-2 font-semibold">${payout.walletBalance.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Payout History</h3>
            <p className="text-[10px] text-text-muted font-light">Read-only audit log of all past payout events.</p>
          </div>
          <div className="space-y-4 relative pl-2">
            <div className="absolute left-5.75 top-4 bottom-4 w-0.5 bg-secondary-bg" />
            {mockHistory.map((hist, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4 relative">
                <div className="flex items-center gap-3">
                  {hist.type === "success" && (
                    <div className="w-7 h-7 rounded-full bg-green-100 text-green-500 flex items-center justify-center shrink-0 z-10 border border-white">
                      <Check size={14} className="stroke-3" />
                    </div>
                  )}
                  {hist.type === "fail" && (
                    <div className="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0 z-10 border border-white">
                      <X size={14} className="stroke-3" />
                    </div>
                  )}
                  {hist.type === "skip" && (
                    <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center shrink-0 z-10 border border-white">
                      <AlertCircle size={14} className="stroke-3" />
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-text-primary">{hist.date}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full md:text-xs text-[10px] font-medium text-nowrap ${hist.type === "success" ? "bg-[#E8F8F5] text-[#10B981]" :
                          hist.type === "fail" ? "bg-[#FDF2F2] text-red-500" :
                            "bg-[#FEF8EC] text-amber-500"
                        }`}>
                        • {hist.status}
                      </span>
                    </div>
                    {hist.detail && (
                      <span className="text-[10px] text-text-muted font-light block leading-none">{hist.detail}</span>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs font-semibold">
                  {hist.amount ? (
                    <span className="text-[#10B981] font-semibold">${hist.amount.toFixed(2)}</span>
                  ) : (
                    <span className="text-text-primary font-extralight text-xl">-</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
