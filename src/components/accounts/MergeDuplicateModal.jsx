"use client";

import React, { useState } from "react";
import { X, Search, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import { getInitials } from "@/lib/utils";
import { db, collection, query, where, getDocs } from "@/lib/firebase";
import { previewAccountMerge, mergeDuplicateAccounts } from "@/lib/callables";

/**
 * Merges a duplicate account into the one currently open.
 *
 * Three steps: find the duplicate, review exactly what will move, confirm.
 * The preview matters — the merge is not automatically reversible.
 */
export default function MergeDuplicateModal({ account, accountType, isOpen, onClose, onMerged }) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [merging, setMerging] = useState(false);
  const [reason, setReason] = useState("");

  if (!isOpen || !account) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    const needle = term.trim().toLowerCase();
    if (needle.length < 3) {
      toast.error("Enter at least 3 characters to search.");
      return;
    }

    setSearching(true);
    setResults(null);
    setSelected(null);
    setPreview(null);
    try {
      const snap = await getDocs(
        query(collection(db, "users"), where("accountType", "==", accountType))
      );
      const matches = snap.docs
        .map((d) => ({ uid: d.id, ...d.data() }))
        // Never offer the account being kept, or one already merged away.
        .filter((u) => u.uid !== account.uid && !u.mergedInto)
        .filter((u) => {
          const name = (u.fullName || "").toLowerCase();
          const email = (u.email || "").toLowerCase();
          return name.includes(needle) || email.includes(needle);
        })
        .slice(0, 8);
      setResults(matches);
    } catch (error) {
      console.error("Duplicate search failed:", error);
      toast.error("Could not search accounts.");
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = async (candidate) => {
    setSelected(candidate);
    setPreview(null);
    setLoadingPreview(true);
    try {
      const result = await previewAccountMerge({
        keepUid: account.uid,
        mergeUid: candidate.uid
      });
      setPreview(result);
    } catch (error) {
      toast.error(error.message);
      setSelected(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleMerge = async () => {
    setMerging(true);
    try {
      const result = await mergeDuplicateAccounts({
        keepUid: account.uid,
        mergeUid: selected.uid,
        reason: reason.trim()
      });
      toast.success(
        `Merged. Moved ${result.movedBookings} booking(s) and ${result.movedAddresses} address(es).`
      );
      onMerged?.();
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-onest">
      <div className="absolute inset-0 bg-alt-bg/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-lg p-4 shadow-2xl z-10 border border-border-main animate-scale-up mx-4 max-h-[90vh] overflow-y-auto scrollbar-thin">

        <div className="flex justify-between items-center pb-2 mb-4 border-b border-border-main">
          <h3 className="font-semibold text-text-primary">Merge Duplicate Accounts</h3>
          <button
            onClick={onClose}
            className="w-5 h-5 rounded-full bg-alt-bg text-white flex items-center justify-center hover:opacity-90 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* The account being kept */}
        <div className="bg-page-bg rounded-2xl p-3 flex items-center gap-3 mb-4">
          <div className="w-7 h-7 rounded-lg bg-primary-bg-muted text-white flex items-center justify-center text-[10px]">
            {getInitials(account.name)}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-text-primary">
              Keeping: {account.name}
            </h4>
            <p className="text-[10px] text-text-muted font-light truncate">{account.email}</p>
          </div>
        </div>

        {/* Step 1 — find the duplicate */}
        <form onSubmit={handleSearch} className="space-y-1.5 mb-3">
          <label className="text-xs text-text-primary block">
            Find the duplicate account
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full bg-white border border-border-main text-xs rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted/60"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="bg-secondary-bg hover:bg-border-main text-text-primary font-semibold text-xs px-4 rounded-xl transition cursor-pointer disabled:opacity-60"
            >
              {searching ? <Loader2 size={13} className="animate-spin" /> : "Search"}
            </button>
          </div>
        </form>

        {results && results.length === 0 && (
          <p className="text-[11px] text-text-muted font-light py-2">
            No other {accountType} accounts match that search.
          </p>
        )}

        {results && results.length > 0 && (
          <div className="space-y-1 mb-4">
            {results.map((candidate) => (
              <button
                key={candidate.uid}
                type="button"
                onClick={() => handleSelect(candidate)}
                className={`w-full text-left rounded-xl border p-2.5 transition cursor-pointer ${
                  selected?.uid === candidate.uid
                    ? "border-primary-bg bg-primary-bg-muted/10"
                    : "border-border-main hover:bg-page-bg"
                }`}
              >
                <div className="text-xs text-text-primary">
                  {candidate.fullName || candidate.email}
                </div>
                <div className="text-[10px] text-text-muted font-light">
                  {candidate.email} · {candidate.status || "active"}
                </div>
              </button>
            ))}
          </div>
        )}

        {loadingPreview && (
          <div className="flex items-center gap-2 text-[11px] text-text-muted py-3">
            <Loader2 size={13} className="animate-spin" /> Checking what will move...
          </div>
        )}

        {/* Step 2 — what will move */}
        {preview && (
          <div className="space-y-3 animate-scale-up">
            <div className="rounded-2xl border border-border-main p-3 space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-text-primary">
                <span className="truncate max-w-[38%]">{preview.merge.email}</span>
                <ArrowRight size={12} className="text-text-muted shrink-0" />
                <span className="truncate max-w-[38%]">{preview.keep.email}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { label: "Bookings", value: preview.bookings },
                  { label: "Addresses", value: preview.addresses },
                  { label: "Wallet", value: `$${Number(preview.walletBalance).toFixed(2)}` }
                ].map((stat) => (
                  <div key={stat.label} className="bg-page-bg rounded-xl p-2 text-center">
                    <div className="text-sm font-semibold text-text-primary">{stat.value}</div>
                    <div className="text-[10px] text-text-muted font-light">{stat.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-text-muted font-light pt-1">
                Resulting wallet balance: $
                {Number(preview.resultingWalletBalance).toFixed(2)}
              </p>
            </div>

            <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-3 flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[10px] text-text-muted font-light leading-relaxed">
                <span className="text-text-primary">{preview.merge.email}</span> will be
                closed and its sign-in disabled. Bookings, addresses and wallet balance
                move to the kept account. This is not automatically reversible.
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-text-primary block">
                Reason <span className="text-text-muted font-light">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Recorded in the audit log"
                className="w-full bg-white border border-border-main text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted/60 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={merging}
                className="flex-1 bg-secondary-bg text-text-primary hover:bg-border-main font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMerge}
                disabled={merging}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {merging && <Loader2 size={13} className="animate-spin" />}
                {merging ? "Merging..." : "Merge Accounts"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
