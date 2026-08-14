"use client";

import React from "react";
import { X, Loader2 } from "lucide-react";
import ViewPayoutDetailsModal from "@/components/finance/ViewPayoutDetailsModal";
import { usePayoutQueue } from "@/hooks/useFinance";

/**
 * A provider's payout history, opened from their row on Accounts.
 *
 * Wraps the dialog the Payout Queue already uses, so the wallet breakdown and
 * the payout log are the same ones finance sees rather than a second rendering
 * that could disagree with them.
 *
 * The queue row is what carries the wallet figures in the header — reserved
 * versus payable, and the current balance — so it is fetched rather than
 * assembled from the accounts row, which holds none of that. Searching by
 * email narrows the paginated queue to one row; the uid still decides the
 * match.
 *
 * @param {object} props - Options.
 * @param {boolean} props.isOpen - Whether the dialog is shown.
 * @param {object} props.provider - The provider row from the Accounts table.
 * @param {Function} props.onClose - Close handler.
 * @return {JSX.Element|null} The dialog.
 */
export default function ProviderPayoutModal({ isOpen, provider, onClose }) {
  const { payouts, isLoading, isError } = usePayoutQueue(
      { searchTerm: provider?.email || "", limit: 20 },
      { enabled: Boolean(isOpen && provider?.uid) },
  );

  if (!isOpen || !provider) return null;

  const payout = payouts.find((p) => p.uid === provider.uid);

  if (payout) {
    return (
      <ViewPayoutDetailsModal isOpen onClose={onClose} payout={payout} />
    );
  }

  // Every provider has a queue row, so reaching here means the row has not
  // arrived yet or the read failed — not that the provider has no payouts.
  // Each case says which, because an empty dialog reads as a broken feature.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-onest p-4">
      <div
        className="absolute inset-0 bg-alt-bg/40 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl max-w-sm w-full shadow-2xl z-10 border border-border-main animate-scale-up">
        <div className="flex items-center justify-between p-4 border-b border-border-main">
          <h3 className="text-sm font-semibold text-text-primary">
            Payouts — {provider.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-[#0F172A] text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer"
            aria-label="Close"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-6 text-center">
          {isLoading ? (
            <p className="flex items-center justify-center gap-2 text-xs text-text-muted">
              <Loader2 size={14} className="animate-spin" />
              Loading payout history
            </p>
          ) : isError ? (
            <p className="text-xs text-text-muted font-light">
              This provider&apos;s payout record could not be loaded.
            </p>
          ) : (
            <p className="text-xs text-text-muted font-light">
              No payout record was found for {provider.name}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
