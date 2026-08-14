"use client";

import React from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import KYCDocumentReviewModal from "@/components/compliance/KYCDocumentReviewModal";
import { useKyc } from "@/hooks/useKyc";
import { reviewKycSubmission } from "@/lib/callables";
import { toKycSubmissionRow } from "@/lib/kycRow";

/**
 * A provider's KYC submission, opened from their row on Accounts.
 *
 * Wraps the same review dialog the KYC queue uses rather than rendering a
 * second, read-only view of the documents — an admin who opens this to look at
 * an ID usually wants to act on it, and two dialogs showing the same documents
 * would drift apart.
 *
 * The submission is found by searching the queue for the provider's email,
 * which is what makes one row come back instead of a page of them. The uid is
 * still what identifies the match; the email only narrows the query.
 *
 * @param {object} props - Options.
 * @param {boolean} props.isOpen - Whether the dialog is shown.
 * @param {object} props.provider - The provider row from the Accounts table.
 * @param {Function} props.onClose - Close handler.
 * @return {JSX.Element|null} The dialog.
 */
export default function ProviderKycModal({ isOpen, provider, onClose }) {
  const queryClient = useQueryClient();

  const { kycList, isLoading, isError } = useKyc(
      { searchTerm: provider?.email || "", limit: 20 },
      { enabled: Boolean(isOpen && provider?.uid) },
  );

  const reviewMutation = useMutation({
    mutationFn: reviewKycSubmission,
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kycSubmissions"] });
      // The decision also changes the KYC column on this very table.
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      onClose();
      toast.success(
          {
            verified: "Document approved.",
            rejected: "Document rejected.",
            resubmission: "Resubmission requested.",
          }[variables.decision] || "Decision recorded.",
      );
    },
    onError: (error) => toast.error(error.message),
  });

  if (!isOpen || !provider) return null;

  const row = kycList
      .map(toKycSubmissionRow)
      .find((s) => s.uid === provider.uid);

  // expectedStatus is the raw kycStatus this row was rendered from, so the
  // backend can abort if another reviewer decided first.
  const decide = (decision, extra = {}) =>
    reviewMutation.mutate({
      uid: provider.uid,
      expectedStatus: row?.kycStatus,
      decision,
      ...extra,
    });

  // Once the submission is in hand, hand straight over to the shared dialog.
  if (row) {
    return (
      <KYCDocumentReviewModal
        item={row}
        isOpen
        onClose={onClose}
        onApprove={() => decide("verified")}
        onReject={(_id, category, reason) =>
          decide("rejected", { reasonCategory: category, reason })
        }
        onRequestResubmission={() => decide("resubmission")}
        isPending={reviewMutation.isPending}
      />
    );
  }

  // Loading, failed, or nothing submitted — each said plainly, because an
  // empty dialog reads as the feature being broken rather than the provider
  // simply not having sent anything.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-onest p-4">
      <div
        className="absolute inset-0 bg-alt-bg/40 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl max-w-sm w-full shadow-2xl z-10 border border-border-main animate-scale-up">
        <div className="flex items-center justify-between p-4 border-b border-border-main">
          <h3 className="text-sm font-semibold text-text-primary">
            KYC — {provider.name}
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
              Loading verification documents
            </p>
          ) : isError ? (
            <p className="text-xs text-text-muted font-light">
              This provider&apos;s verification record could not be loaded.
            </p>
          ) : (
            <p className="text-xs text-text-muted font-light">
              {provider.name} has not submitted any KYC documents yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
