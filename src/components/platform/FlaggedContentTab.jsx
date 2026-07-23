"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import ReviewContentModal from "@/components/platform/ReviewContentModal";
import RemoveListingModal from "@/components/platform/RemoveListingModal";
import RemoveReviewModal from "@/components/platform/RemoveReviewModal";

// Initial Mock Flags list
const initialFlags = [
  {
    id: "FLG-001",
    type: "Listing",
    reportedBy: "Noah Johnson",
    email: "noah@clean.io",
    date: "Apr 25, 2026",
    dateTime: new Date(2026, 3, 25),
    content: "Listing titled 'Cheap cleaning -- cash only' with no service description.",
    subjectEmail: "kwame@clean.io"
  },
  {
    id: "FLG-002",
    type: "Review",
    reportedBy: "Emma Thompson",
    email: "emma@clean.io",
    date: "Apr 25, 2026",
    dateTime: new Date(2026, 3, 25),
    content: "'This provider is a scammer and stole my wallet.' -- unsubstantiated claim.",
    subjectEmail: "noah@clean.io"
  },
  {
    id: "FLG-003",
    type: "Photo",
    reportedBy: "Michael Johnson",
    email: "michael@clean.io",
    date: "May 1, 2026",
    dateTime: new Date(2026, 4, 1),
    content: "Profile photo appears to show a different person than the ID on file.",
    subjectEmail: "samantha@clean.io"
  },
  {
    id: "FLG-004",
    type: "Profile",
    reportedBy: "Samantha Lee",
    email: "samantha@clean.io",
    date: "May 3, 2026",
    dateTime: new Date(2026, 4, 3),
    content: "Provider profile contains WhatsApp number asking clients to pay offline.",
    subjectEmail: "emma@clean.io"
  },
  {
    id: "FLG-005",
    type: "Listing",
    reportedBy: "David Kim",
    email: "david@clean.io",
    date: "May 5, 2026",
    dateTime: new Date(2026, 4, 5),
    content: "Listing description includes competitor platform links.",
    subjectEmail: "kwame@clean.io"
  },
  {
    id: "FLG-006",
    type: "Profile",
    reportedBy: "Ava Martinez",
    email: "ava@clean.io",
    date: "May 10, 2026",
    dateTime: new Date(2026, 4, 10),
    content: "Client profile has offensive language in bio field.",
    subjectEmail: "david@clean.io"
  },
  {
    id: "FLG-007",
    type: "Review",
    reportedBy: "Ava Martinez",
    email: "ava@clean.io",
    date: "May 10, 2026",
    dateTime: new Date(2026, 4, 10),
    content: "Listing titled 'Personal Training - Customized Plans' 'One star -- provider was 2 minutes late. TERRIBLE SERVICE!!!' with client success stories shared.",
    subjectEmail: "michael@clean.io"
  }
];

export default function FlaggedContentTab() {
  const [flags, setFlags] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected entities for modals
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [removeListingOpen, setRemoveListingOpen] = useState(false);
  const [removeReviewOpen, setRemoveReviewOpen] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem("netly_flagged_content");
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map(item => ({
          ...item,
          dateTime: item.dateTime ? new Date(item.dateTime) : new Date()
        }));
        setFlags(parsed);
      } catch (e) {
        setFlags(initialFlags);
      }
    } else {
      setFlags(initialFlags);
      localStorage.setItem("netly_flagged_content", JSON.stringify(initialFlags));
    }
  }, []);

  const saveFlags = (updatedList) => {
    setFlags(updatedList);
    localStorage.setItem("netly_flagged_content", JSON.stringify(updatedList));
  };

  // Moderation action dispatcher
  const handleAction = (actionType, flag) => {
    if (actionType === "approve") {
      const updated = flags.filter(f => f.id !== flag.id);
      saveFlags(updated);
      setReviewModalOpen(false);
      setSelectedFlag(null);
      toast.success(`Content has been approved and flagged queue updated!`);
    } else if (actionType === "warn") {
      const updated = flags.filter(f => f.id !== flag.id);
      saveFlags(updated);
      setReviewModalOpen(false);
      setSelectedFlag(null);
      toast.success(`Warning issued to user ${flag.subjectEmail} successfully.`);
    } else if (actionType === "suspend") {
      const updated = flags.filter(f => f.id !== flag.id);
      saveFlags(updated);
      setReviewModalOpen(false);
      setSelectedFlag(null);
      toast.success(`User ${flag.subjectEmail} has been suspended.`);
    } else if (actionType === "remove") {
      // Open respective removal prompts
      setReviewModalOpen(false);
      if (flag.type === "Listing") {
        setRemoveListingOpen(true);
      } else if (flag.type === "Review") {
        setRemoveReviewOpen(true);
      } else {
        // Generic content deletion
        const updated = flags.filter(f => f.id !== flag.id);
        saveFlags(updated);
        setSelectedFlag(null);
        toast.success(`Photo/Profile content successfully removed.`);
      }
    }
  };

  const confirmRemoveListing = (listing, reason) => {
    const updated = flags.filter(f => f.id !== selectedFlag.id);
    saveFlags(updated);
    setRemoveListingOpen(false);
    setSelectedFlag(null);
    toast.success(`Listing successfully removed. Reason logged: "${reason}"`);
  };

  const confirmRemoveReview = (review, reason) => {
    const updated = flags.filter(f => f.id !== selectedFlag.id);
    saveFlags(updated);
    setRemoveReviewOpen(false);
    setSelectedFlag(null);
    toast.success(`Review successfully removed. Reason logged: "${reason}"`);
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
      <div className="bg-white border border-border-main rounded-3xl overflow-hidden shadow-2xs">
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
        {filteredFlags.length === 0 ? (
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
