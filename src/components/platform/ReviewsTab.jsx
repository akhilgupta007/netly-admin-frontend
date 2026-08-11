"use client";

import React, { useState, useEffect } from "react";
import { Search, Star, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import RemoveReviewModal from "@/components/platform/RemoveReviewModal";
import { useReviews } from "@/hooks/usePlatform";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { moderateReview } from "@/lib/callables";
import { ListSkeleton, RefreshingBar } from "@/components/ui/Skeleton";

// Initial Mock Reviews list

export default function ReviewsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const {
    reviews,
    totalCount,
    counts,
    isLoading,
    isFetching,
    isError,
  } = useReviews({
    searchTerm,
    filterStatus,
    page: currentPage,
    limit: 8,
  });
  const itemsPerPage = 8;

  // Selected entities for modals
  const [selectedReview, setSelectedReview] = useState(null);
  const [removeOpen, setRemoveOpen] = useState(false);

  // Load from LocalStorage


  const moderate = useMutation({
    mutationFn: moderateReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["flaggedContent"] });
      setRemoveOpen(false);
      setSelectedReview(null);
      // Hidden, not deleted — the review belongs to the client who wrote it
      // and is tied to a booking.
      toast.success("Review hidden from the marketplace.");
    },
    onError: (err) => toast.error(err.message),
  });

  const confirmRemoveReview = (review, reason) => {
    moderate.mutate({ reviewId: review?.id, action: "hide", reason });
  };

  // Filtering
  const filteredReviews = reviews.filter((rev) => {
    const matchesSearch =
      rev.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rev.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rev.reviewText.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (startDate && endDate) {
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      const revVal = new Date(rev.dateTime).getTime();
      matchesDate = revVal >= start && revVal <= end;
    }

    return matchesSearch && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage) || 1;
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4 animate-scale-up">

      {/* Inline Filters bar inside the white container card */}
      <div className="bg-white border border-border-main rounded-3xl overflow-hidden shadow-2xs relative">
        <RefreshingBar active={isFetching && !isLoading} />
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-border-main">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by client/provider name ..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-sm w-full border border-border-main md:text-xs text-[10px] rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
            />
          </div>

          <div className="flex items-center gap-2 justify-center">
            {/* Removed reviews are excluded from the list by default; this is
                how an admin gets back to one to restore it. */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-border-main md:text-xs text-[10px] rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
              >
                <option value="All">Status</option>
                <option value="Published">Published</option>
                <option value="Flagged">Flagged</option>
                <option value="Removed">Removed</option>
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

        {/* Reviews Data List */}
        {isLoading ? (
          <ListSkeleton rows={6} columns={6} firstColAvatar={false} />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-2 select-none bg-white">
            <h3 className="text-sm font-semibold text-text-primary">Could not load reviews</h3>
            <p className="text-xs text-text-muted font-light">
              Check your connection and refresh.
            </p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white">
            <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">No Reviews Found</h3>
              <p className="text-xs text-text-muted font-light">No reviews match current criteria.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-bg md:text-sm text-xs tracking-tight">
                <thead className="bg-secondary-bg text-text-primary text-left md:text-sm text-xs">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Client</th>
                    <th className="px-4 py-3 font-semibold">Provider</th>
                    <th className="px-4 py-3 font-semibold">Rating</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Review Text</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-bg md:text-sm text-xs text-text-primary">
                  {paginatedReviews.map((item) => (
                    <tr key={item.id} className="hover:bg-page-bg/50 transition">
                      <td className="px-4 py-3">{item.client}</td>
                      <td className="px-4 py-3">{item.provider}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1">
                          <Star size={13} className="fill-amber-500 text-amber-500" />
                          {item.rating.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-nowrap">{item.date}</td>
                      <td className="px-4 py-3 leading-normal min-w-2xs max-w-xs whitespace-normal wrap-break-word">
                        {item.reviewText}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedReview(item);
                            setRemoveOpen(true);
                          }}
                          className="border border-red-500 text-red-500 hover:bg-red-50 font-medium py-1.5 px-4 rounded-lg transition cursor-pointer select-none"
                        >
                          Remove
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
              totalItems={filteredReviews.length}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Remove Review Modal overlay */}
      {selectedReview && (
        <RemoveReviewModal
          isOpen={removeOpen}
          review={selectedReview}
          onClose={() => {
            setRemoveOpen(false);
            setSelectedReview(null);
          }}
          onRemove={confirmRemoveReview}
        />
      )}

    </div>
  );
}
