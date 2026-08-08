"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import ReviewContentModal from "@/components/platform/ReviewContentModal";
import RemoveListingModal from "@/components/platform/RemoveListingModal";
import RemoveReviewModal from "@/components/platform/RemoveReviewModal";
import { useFlaggedContent } from "@/hooks/usePlatform";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { moderateListing, moderateReview, resolveReport } from "@/lib/callables";
import { ListSkeleton, RefreshingBar } from "@/components/ui/Skeleton";

// Initial Mock Flags list

export default function FlaggedContentTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const queryClient = useQueryClient();
  const {
    flagged: flags,
    counts,
    isLoading,
    isFetching,
    isError,
  } = useFlaggedContent({ searchTerm, filterType });

  /** Refetches the queue and closes whichever modal was open. */
  const afterModeration = (message) => ({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flaggedContent"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["serviceListings"] });
      setReviewModalOpen(false);
      setRemoveListingOpen(false);
      setRemoveReviewOpen(false);
      setSelectedFlag(null);
      toast.success(message);
    },
    onError: (err) => toast.error(err.message),
  });

  const reportMutation = useMutation({
    mutationFn: resolveReport,
    ...afterModeration("Report closed."),
  });
  const reviewMutation = useMutation({
    mutationFn: moderateReview,
    ...afterModeration("Review updated."),
  });
  const listingMutation = useMutation({
    mutationFn: moderateListing,
    ...afterModeration("Listing removed from the marketplace."),
  });
  const itemsPerPage = 8;

  // Selected entities for modals
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [removeListingOpen, setRemoveListingOpen] = useState(false);
  const [removeReviewOpen, setRemoveReviewOpen] = useState(false);

  // Load from LocalStorage


  // Moderation action dispatcher
  /**
   * Applies a moderation decision.
   *
   * A flag is either a user-submitted report or a review flagged in-app, and
   * they close differently — a report is resolved, a review is dismissed or
   * hidden. `flag.source` says which.
   *
   * @param {string} actionType - "approve" | "warn" | "suspend" | "remove".
   * @param {object} flag - The queue row.
   */
  const handleAction = (actionType, flag) => {
    const reason = `Moderation decision: ${actionType}`;

    if (actionType === "approve") {
      // The complaint was unfounded; the content stays up.
      if (flag.source === "review") {
        reviewMutation.mutate({ reviewId: flag.reviewId, action: "dismiss", reason });
      } else {
        reportMutation.mutate({
          reportId: flag.reportId,
          action: "dismiss",
          resolution: "no_action",
          reason: "Reviewed and found no policy breach.",
        });
      }
      return;
    }

    if (actionType === "remove") {
      // Removal needs a typed reason, so hand off to the confirm modal.
      setReviewModalOpen(false);
      if (flag.type === "Listing") {
        setRemoveListingOpen(true);
      } else if (flag.type === "Review") {
        setRemoveReviewOpen(true);
      } else {
        toast.info(
            "Removing this content type is not implemented yet — only listings " +
          "and reviews can be actioned.",
        );
      }
      return;
    }

    // Warning and suspension act on the *user*, which is the Accounts page's
    // job — updateAccountStatus lives there and carries its own audit trail.
    toast.info(
        actionType === "suspend" ?
          "Suspend the account from Accounts → the user's row, so the action is " +
        "recorded against the account." :
          "Issuing a warning is not implemented yet.",
    );
  };

  const confirmRemoveListing = (listing, reason) => {
    listingMutation.mutate({
      listingId: selectedFlag?.targetId,
      action: "remove",
      reason,
    });
  };

  const confirmRemoveReview = (review, reason) => {
    reviewMutation.mutate({
      reviewId: selectedFlag?.reviewId || selectedFlag?.targetId,
      action: "hide",
      reason,
    });
  };

  // Filtering
  const filteredFlags = flags.filter((f) => {
    const matchesSearch =
      f.reportedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "All" || f.type === filterType;

    let matchesDate = true;
    if (startDate && endDate) {
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      const fDate = new Date(f.dateTime).getTime();
      matchesDate = fDate >= start && fDate <= end;
    }

    return matchesSearch && matchesType && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredFlags.length / itemsPerPage) || 1;
  const paginatedFlags = filteredFlags.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4 animate-scale-up">

      {/* Search & filters inside the table card */}
      <div className="bg-white border border-border-main rounded-3xl overflow-hidden shadow-2xs relative">
        <RefreshingBar active={isFetching && !isLoading} />
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-border-main">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name ..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-sm w-full border border-border-main md:text-xs text-[10px] rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
            />
          </div>

          <div className="flex items-center gap-2 justify-center">
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-border-main md:text-xs text-[10px] rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
              >
                <option value="All">Type</option>
                <option value="Listing">Listing</option>
                <option value="Review">Review</option>
                <option value="Photo">Photo</option>
                <option value="Profile">Profile</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
            </div>

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

        {/* Table / Empty state content */}
        {isLoading ? (
          <ListSkeleton rows={6} columns={6} firstColAvatar={false} />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-2 select-none bg-white">
            <h3 className="text-sm font-semibold text-text-primary">Could not load flagged content</h3>
            <p className="text-xs text-text-muted font-light">
              Check your connection and refresh.
            </p>
          </div>
        ) : filteredFlags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white">
            <img src="/empty.png" alt="No flagged queue" className="w-16 h-16 object-contain opacity-75" />

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">No flagged queue</h3>
              <p className="text-xs text-text-muted font-light">If any content is found inappropriate, it will be displayed here.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-bg md:text-sm text-xs tracking-tight">
                <thead className="bg-secondary-bg text-text-primary text-left md:text-sm text-xs">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Reported By</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Content</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-bg md:text-sm text-xs text-text-primary">
                  {paginatedFlags.map((item) => (
                    <tr key={item.id} className="hover:bg-page-bg/50 transition">
                      <td className="px-4 py-3">{item.type}</td>
                      <td className="px-4 py-3">{item.reportedBy}</td>
                      <td className="px-4 py-3">{item.date}</td>
                      <td className="px-4 py-3 max-w-xs md:max-w-md truncate">
                        {item.content}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedFlag(item);
                            setReviewModalOpen(true);
                          }}
                          className="border border-primary-bg hover:bg-primary-bg/5 text-primary-bg py-1.5 px-3 rounded-lg transition cursor-pointer select-none"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredFlags.length}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Audit Review Modals overlay */}
      {selectedFlag && (
        <>
          <ReviewContentModal
            isOpen={reviewModalOpen}
            flag={selectedFlag}
            onClose={() => {
              setReviewModalOpen(false);
              setSelectedFlag(null);
            }}
            onAction={handleAction}
          />

          <RemoveListingModal
            isOpen={removeListingOpen}
            listing={selectedFlag}
            onClose={() => {
              setRemoveListingOpen(false);
              setSelectedFlag(null);
            }}
            onRemove={confirmRemoveListing}
          />

          <RemoveReviewModal
            isOpen={removeReviewOpen}
            review={selectedFlag}
            onClose={() => {
              setRemoveReviewOpen(false);
              setSelectedFlag(null);
            }}
            onRemove={confirmRemoveReview}
          />
        </>
      )}

    </div>
  );
}
