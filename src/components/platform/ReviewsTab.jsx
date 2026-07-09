"use client";

import React, { useState, useEffect } from "react";
import { Search, Star } from "lucide-react";
import { toast } from "react-toastify";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import RemoveReviewModal from "@/components/platform/RemoveReviewModal";

// Initial Mock Reviews list
const initialReviews = [
  {
    id: "REV-001",
    client: "Ella Young",
    provider: "Daniel King",
    rating: 4.6,
    date: "Feb 18, 2027",
    dateTime: new Date(2027, 1, 18),
    reviewText: "Quality service, very friendly staff, would hire them again!"
  },
  {
    id: "REV-002",
    client: "Evelyn Clark",
    provider: "Alexander Hall",
    rating: 4.3,
    date: "Jan 25, 2027",
    dateTime: new Date(2027, 0, 25),
    reviewText: "Good cleaning service, but a little slow. Would recommend for the price."
  },
  {
    id: "REV-003",
    client: "Amelia Harris",
    provider: "Elijah Thompson",
    rating: 4.9,
    date: "Nov 15, 2026",
    dateTime: new Date(2026, 10, 15),
    reviewText: "Top-notch services! They went above and beyond to make my home shine!"
  },
  {
    id: "REV-004",
    client: "Harper Martin",
    provider: "Benjamin White",
    rating: 4.8,
    date: "Dec 8, 2026",
    dateTime: new Date(2026, 11, 8),
    reviewText: "Consistent quality and dependable service. Highly satisfied!"
  },
  {
    id: "REV-005",
    client: "Charlotte Lee",
    provider: "Oliver Anderson",
    rating: 4.4,
    date: "Oct 20, 2026",
    dateTime: new Date(2026, 9, 20),
    reviewText: "Good service but room for improvement in timing. Overall a good experience."
  },
  {
    id: "REV-006",
    client: "Sophia Davis",
    provider: "Mason Wilson",
    rating: 4.6,
    date: "Sep 5, 2026",
    dateTime: new Date(2026, 8, 5),
    reviewText: "Very reliable and thorough service. I trust them with my home!"
  },
  {
    id: "REV-007",
    client: "Isabella Garcia",
    provider: "Lucas Taylor",
    rating: 5.0,
    date: "Aug 12, 2026",
    dateTime: new Date(2026, 7, 12),
    reviewText: "Absolutely flawless! They exceeded my expectations in every way!"
  },
  {
    id: "REV-008",
    client: "Ava Patel",
    provider: "Ethan Brown",
    rating: 4.8,
    date: "Jun 10, 2026",
    dateTime: new Date(2026, 5, 10),
    reviewText: "Impressive service! My house has never looked better. Thank you!"
  }
];

export default function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected entities for modals
  const [selectedReview, setSelectedReview] = useState(null);
  const [removeOpen, setRemoveOpen] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem("netly_reviews");
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map(item => ({
          ...item,
          dateTime: item.dateTime ? new Date(item.dateTime) : new Date()
        }));
        setReviews(parsed);
      } catch (e) {
        setReviews(initialReviews);
      }
    } else {
      setReviews(initialReviews);
      localStorage.setItem("netly_reviews", JSON.stringify(initialReviews));
    }
  }, []);

  const saveReviews = (updatedList) => {
    setReviews(updatedList);
    localStorage.setItem("netly_reviews", JSON.stringify(updatedList));
  };

  const confirmRemoveReview = (review, reason) => {
    const updated = reviews.filter((r) => r.id !== review.id);
    saveReviews(updated);
    setRemoveOpen(false);
    setSelectedReview(null);
    toast.success(`Review removed successfully. Reason logged: "${reason}"`);
  };

  // Filtering
  const filteredReviews = reviews.filter((rev) => {
    const matchesSearch =
      rev.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rev.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rev.reviewText.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (startDate && endDate) {
      const start = new Date(startDate).setHours(0,0,0,0);
      const end = new Date(endDate).setHours(23,59,59,999);
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
      <div className="bg-white border border-secondary-bg rounded-3xl overflow-hidden shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-secondary-bg">
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
              className="w-full border border-border-main text-xs rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
            />
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

        {/* Reviews Data List */}
        {filteredReviews.length === 0 ? (
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
              <table className="min-w-full divide-y divide-secondary-bg text-xs text-text-primary">
                <thead className="bg-secondary-bg text-text-primary text-left font-semibold">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Client</th>
                    <th className="px-4 py-3 font-semibold">Provider</th>
                    <th className="px-4 py-3 font-semibold">Rating</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Review Text</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-bg">
                  {paginatedReviews.map((item) => (
                    <tr key={item.id} className="hover:bg-page-bg/50 transition">
                      <td className="px-4 py-3.5 font-medium">{item.client}</td>
                      <td className="px-4 py-3.5 font-medium">{item.provider}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                          <Star size={13} fill="currentColor" />
                          {item.rating.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-text-muted">{item.date}</td>
                      <td className="px-4 py-3.5 text-text-primary leading-normal font-light max-w-sm md:max-w-xl whitespace-normal break-words">
                        {item.reviewText}
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => {
                            setSelectedReview(item);
                            setRemoveOpen(true);
                          }}
                          className="border border-red-500 text-red-500 hover:bg-red-50 font-semibold text-[10px] py-1.5 px-4 rounded-full transition cursor-pointer select-none"
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
