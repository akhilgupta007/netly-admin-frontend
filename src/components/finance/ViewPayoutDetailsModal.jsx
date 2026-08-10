"use client";

import React from "react";
import { X, Check, AlertCircle, Loader2 } from "lucide-react";
import { useProviderPayoutDetail } from "@/hooks/useFinance";

/**
 * Payout detail for one provider.
 *
 * The wallet breakdown lists the ledger entries that built the balance, not
 * bookings — a manual adjustment or a dispute clawback moved the money just as
 * a completed job did, and a booking query would show neither.
 *
 * Reserved-versus-payable is shown once in the header, from the wallet
 * summary. It cannot be shown per row: promoteReservedToActive updates the
 * summary totals without stamping the individual ledger entries, so an entry
 * carries no reliable record of which bucket it now sits in.
 *
 * @param {object} props - Options.
 * @param {boolean} props.isOpen - Whether the dialog is shown.
 * @param {Function} props.onClose - Close handler.
 * @param {object} props.payout - The payout queue row.
 * @return {JSX.Element|null} The dialog.
 */
export default function ViewPayoutDetailsModal({ isOpen, onClose, payout }) {
  const { entries, history, isLoading, isError } = useProviderPayoutDetail(
    payout?.uid,
    { enabled: Boolean(isOpen && payout?.uid) },
  );

  if (!isOpen || !payout) return null;

  const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

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
              Wallet: <strong className="font-bold text-primary-bg">{money(payout.walletBalance)}</strong>
              {(payout.reserved > 0 || payout.active > 0) && (
                <span className="text-text-muted font-light">
                  {" "}· {money(payout.active)} payable · {money(payout.reserved)} reserved
                </span>
              )}
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
            <p className="text-[10px] text-text-muted font-light">Earnings and adjustments that make up this provider&apos;s balance.</p>
          </div>
          <div className="border border-border-main rounded-2xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-bg text-left md:text-xs text-[10px]">
                <thead className="bg-secondary-bg text-text-primary md:text-[10px] text-[7px] font-semibold">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Booking</th>
                    <th className="px-4 py-2 font-semibold">Date</th>
                    <th className="px-4 py-2 font-semibold">Gross</th>
                    <th className="px-4 py-2 font-semibold">Commission</th>
                    <th className="px-4 py-2 font-semibold text-right pr-6">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-bg text-text-primary md:text-xs text-[10px]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                        <Loader2 size={14} className="animate-spin inline mr-1.5" />
                        Loading
                      </td>
                    </tr>
                  ) : isError ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-text-muted font-light">
                        This provider&apos;s ledger could not be loaded.
                      </td>
                    </tr>
                  ) : entries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-text-muted font-light">
                        No earnings recorded yet.
                      </td>
                    </tr>
                  ) : (
                    entries.map((e) => (
                      <tr key={e.id} className="hover:bg-page-bg/30">
                        <td className="px-4 py-2.5 max-w-40 truncate" title={e.bookingId || ""}>
                          {e.label}
                        </td>
                        <td className="px-4 py-2.5 text-text-muted font-light">{e.date}</td>
                        <td className="px-4 py-2.5">
                          {e.gross === null ? (
                            <span className="text-text-muted font-light">—</span>
                          ) : money(e.gross)}
                        </td>
                        <td className="px-4 py-2.5 text-red-500">
                          {e.commission === null ? (
                            <span className="text-text-muted font-light">—</span>
                          ) : `-${money(e.commission)}`}
                        </td>
                        <td className="px-4 py-2.5 text-right pr-6">{money(e.net)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-[#F7F9FA] px-4 py-2.5 flex justify-end items-center gap-4 text-xs border-t border-border-main">
              <span className="text-text-primary">Total Wallet Balance</span>
              <span className="text-text-primary pr-2 font-semibold">{money(payout.walletBalance)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Payout History</h3>
            <p className="text-[10px] text-text-muted font-light">Read-only audit log of all past payout events.</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-text-muted">
              <Loader2 size={14} className="animate-spin" />
              Loading
            </div>
          ) : history.length === 0 ? (
            <p className="py-8 text-xs text-text-muted font-light text-center">
              No payout has been attempted for this provider yet.
            </p>
          ) : (
            <div className="space-y-4 relative pl-2">
              <div className="absolute left-5.75 top-4 bottom-4 w-0.5 bg-secondary-bg" />
              {history.map((hist) => (
                <div key={hist.id} className="flex items-center justify-between gap-4 relative">
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
                        <span className="text-[10px] text-text-muted font-light block leading-tight">{hist.detail}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs font-semibold">
                    {hist.amount !== null ? (
                      <span className="text-[#10B981] font-semibold">{money(hist.amount)}</span>
                    ) : (
                      <span className="text-text-primary font-extralight text-xl">-</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
