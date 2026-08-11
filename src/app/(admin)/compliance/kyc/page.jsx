"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  ChevronDown,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewKycSubmission } from "@/lib/callables";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { getInitials } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";

// Custom Document Review Modal
import KYCDocumentReviewModal from "@/components/compliance/KYCDocumentReviewModal";
import CardWrapper from "@/components/ui/CardWrapper";

// Import custom Firestore React Query hook
import { useKyc } from "@/hooks/useKyc";
import { RefreshingBar, TableSkeleton } from "@/components/ui/Skeleton";

export default function KYCVerificationPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDocType, setFilterDocType] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Modal actions states
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Memoize backend parameters
  const kycParams = useMemo(
    () => ({
      searchTerm,
      filterStatus,
      filterDocType,
      startDate,
      endDate,
      page: currentPage,
      limit: itemsPerPage,
    }),
    [searchTerm, filterStatus, filterDocType, startDate, endDate, currentPage],
  );

  // Firestore React Query hook with backend params
  const { kycList, total: totalKyc, isLoading, isFetching } = useKyc(kycParams);
  const queryClient = useQueryClient();

  // Map query items to submission row format
  const submissions = useMemo(() => {
    return kycList.map((item) => ({
      id: item.id,
      // The callable needs the real uid; item.id is a display code (PR-xxxxxx).
      uid: item.uid,
      name: item.providerName || "Provider",
      // Readable label, not the raw slug. The column rendered "governmentId"
      // and the filter compared that slug against labels like "Proof of
      // Address", so nothing ever matched.
      // A submission can carry more than one document, so show them all — the
      // column previously showed only the first, which read as though the
      // other had not been submitted.
      docType: (item.documentLabels || []).join(", ") || "Not specified",
      documentLabels: item.documentLabels || [],
      docFile:
        item.verificationDocuments?.[0]?.name ||
        `${item.documents?.[0] || "ID"}_Document.pdf`,
      submittedDate: item.submittedAt,
      status:
        item.status === "Approved"
          ? "Approved"
          : item.status === "Rejected"
            ? "Rejected"
            : "In Review",
      email: item.email || "",
      phone: item.phoneNumber || "—",
      // Account creation date, not the KYC submission date.
      joined: item.joinedAt,
      reviewedAt: item.reviewedAt,
      verificationDocuments: item.verificationDocuments,
      // Raw slug (notSubmitted/pending/verified/rejected) — sent as
      // expectedStatus so a concurrent decision is detected server-side.
      kycStatus: item.kycStatus,
      rejectionReason: item.rejectionReason,
    }));
  }, [kycList]);

  // Status statistics card counts
  // Built from what the submissions actually contain, so the filter cannot
  // drift from the document types the apps submit.
  const docTypeOptions = useMemo(
    () =>
      [...new Set(submissions.flatMap((s) => s.documentLabels || []))].sort(),
    [submissions],
  );

  const counts = useMemo(() => {
    const res = {
      Approved: 0,
      InReview: 0,
      Rejected: 0,
      NotSubmitted: 0,
      Expired: 0,
    };
    submissions.forEach((s) => {
      if (s.status === "Approved") res.Approved++;
      else if (s.status === "In Review" || s.status === "Pending")
        res.InReview++;
      else if (s.status === "Rejected") res.Rejected++;
      else if (s.status === "Not Submitted") res.NotSubmitted++;
      else if (s.status === "Expired") res.Expired++;
    });
    return res;
  }, [submissions]);

  // Filter Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        filterStatus === "All" ||
        (filterStatus === "In Review" &&
          ["In Review", "Pending"].includes(s.status)) ||
        s.status === filterStatus;

      const matchDocType =
        filterDocType === "All" ||
        // A submission can carry several documents, so it matches if any of
        // them is the selected type.
        (s.documentLabels || []).includes(filterDocType);

      let matchDate = true;
      if (startDate && endDate && s.submittedDate !== "-") {
        const itemDate = new Date(s.submittedDate);
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        matchDate = itemDate >= start && itemDate <= end;
      }

      return matchSearch && matchStatus && matchDocType && matchDate;
    });
  }, [
    submissions,
    searchTerm,
    filterStatus,
    filterDocType,
    startDate,
    endDate,
  ]);

  // Sliced page data
  const paginated = useMemo(() => {
    return filteredSubmissions.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  }, [filteredSubmissions, currentPage]);

  // Status CSS styling utilities
  const getStatusClass = (status) => {
    switch (status) {
      case "Approved":
        return "text-emerald-500 bg-emerald-50";
      case "In Review":
        return "text-blue-500 bg-blue-50";
      case "Pending":
        return "text-amber-500 bg-amber-50";
      case "Expired":
        return "text-red-500 bg-red-50";
      case "Rejected":
        return "text-red-500 bg-red-50";
      default:
        return "text-text-muted bg-page-bg";
    }
  };

  const getDocIcon = (docType) => {
    const isIdentity = /government id|passport|driving/i.test(docType || "");
    return (
      <FileText
        size={15}
        className={`${isIdentity ? "text-blue-500" : "text-amber-500"} shrink-0`}
      />
    );
  };

  const getActionButtonText = (status) => {
    switch (status) {
      case "Pending":
        return "Awaiting Verification";
      case "In Review":
        return "Review";
      case "Expired":
        return "Request Resubmission";
      case "Approved":
        return "Finalized";
      case "Rejected":
        return "Needs Revision";
      default:
        return "-";
    }
  };

  // Modal callback actions. The row's uid identifies the provider — the
  // decision is applied to kyc/{kycId} and mirrored onto the provider doc.
  const reviewMutation = useMutation({
    mutationFn: reviewKycSubmission,
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kycSubmissions"] });
      // A KYC decision also changes the provider's kycStatus column.
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      setIsModalOpen(false);
      setSelectedItem(null);
      const message = {
        verified: "Document approved.",
        rejected: "Document rejected.",
        resubmission: "Resubmission requested.",
      }[variables.decision];
      toast.success(message);
    },
    onError: (error) => toast.error(error.message),
  });

  const findRow = (idOrUid) =>
    submissions.find((s) => s.id === idOrUid || s.uid === idOrUid);

  // expectedStatus is the raw kycStatus this row was rendered from, so the
  // backend can abort if another reviewer decided first.
  const target = (idOrUid) => {
    const row = findRow(idOrUid);
    return { uid: row?.uid || idOrUid, expectedStatus: row?.kycStatus };
  };

  const handleApprove = (id) => {
    reviewMutation.mutate({ ...target(id), decision: "verified" });
  };

  const handleReject = (id, category, reason) => {
    reviewMutation.mutate({
      ...target(id),
      decision: "rejected",
      reasonCategory: category,
      reason,
    });
  };

  const handleRequestResubmission = (id) => {
    reviewMutation.mutate({ ...target(id), decision: "resubmission" });
  };

  return (
    <div className="space-y-4">
      {/* Metric Summary Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 shrink-0">
        {[
          { label: "Approved", count: counts.Approved },
          { label: "In Review", count: counts.InReview },
          { label: "Rejected", count: counts.Rejected },
          { label: "Not Submitted", count: counts.NotSubmitted },
          { label: "Expired", count: counts.Expired },
        ].map((card, idx) => (
          <CardWrapper key={idx} name={card.label} value={card.count} />
        ))}
      </div>

      {/* Main Container Section */}
      <div className="bg-white rounded-3xl border border-border-main hover:shadow-xs relative overflow-visible">
        <RefreshingBar active={isFetching && !isLoading} />

        {/* Table Filters controls row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white rounded-t-3xl border-b border-border-main">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-md w-full border border-border-main md:text-xs text-[10px] rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            {/* Status Dropdown Filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-border-main md:text-xs text-[10px] rounded-full px-3 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
              >
                <option value="All">Status</option>
                <option value="Approved">Approved</option>
                <option value="In Review">In Review</option>
                <option value="Rejected">Rejected</option>
                <option value="Not Submitted">Not Submitted</option>
                <option value="Expired">Expired</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
            </div>

            {/* Document Type Dropdown Filter */}
            <div className="relative">
              <select
                value={filterDocType}
                onChange={(e) => {
                  setFilterDocType(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-border-main md:text-xs text-[10px] rounded-full px-3 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
              >
                <option value="All">Document Type</option>
                {docTypeOptions.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
            </div>

            {/* Date Range Picker */}
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

        {/* Table Records Grid */}
        <div className="overflow-x-auto rounded-b-3xl">
          <table className="min-w-full divide-y divide-secondary-bg md:text-sm text-xs tracking-tight">
            <thead className="bg-secondary-bg text-text-primary text-left md:text-sm text-xs">
              <tr>
                <th className="px-4 py-2 font-semibold">User</th>
                <th className="px-4 py-2 font-semibold">Document</th>
                <th className="px-4 py-2 font-semibold">Submitted</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 text-right pr-6 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-bg md:text-sm text-xs text-text-primary">
              {isLoading ? (
                <TableSkeleton columns={6} rows={6} firstColAvatar />
              ) : submissions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-text-muted font-light"
                  >
                    <div className="flex flex-col items-center justify-center space-y-3 min-h-80">
                      <img
                        src="/empty.png"
                        alt="No data"
                        className="w-16 h-16 object-contain opacity-75"
                      />
                      <span>No KYC submissions found matching criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                submissions.map((row) => {
                  const actionText = getActionButtonText(row.status);
                  return (
                    <tr key={row.id} className="hover:bg-page-bg/50 transition">
                      {/* User Column */}
                      <td className="px-4 py-3 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-primary-bg-muted text-white flex items-center justify-center md:text-[10px] text-[7px]">
                          {getInitials(row.name)}
                        </div>
                        <span className="text-text-primary">{row.name}</span>
                      </td>

                      {/* Document Column */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          {getDocIcon(row.docType)}
                          <span>{row.docType}</span>
                        </div>
                      </td>

                      {/* Submitted Date Column */}
                      <td className="px-4 py-4 text-text-primary">
                        {row.submittedDate}
                      </td>

                      {/* Status Column */}
                      <td className="px-4 py-3">
                        {row.status === "Not Submitted" ? (
                          <span className="text-text-muted">-</span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full md:text-xs text-[10px] ${getStatusClass(row.status)}`}
                          >
                            <span className="h-1 w-1 rounded-full bg-current" />
                            {row.status}
                          </span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="px-4 py-3 text-right pr-6">
                        <button
                          onClick={() => {
                            setSelectedItem(row);
                            setIsModalOpen(true);
                          }}
                          className={`px-3 py-1.5 rounded-lg border md:text-xs text-[10px] font-semibold transition cursor-pointer ${
                            row.status === "Approved"
                              ? "border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                              : row.status === "Rejected"
                                ? "border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                                : "border-primary-bg text-primary-bg hover:bg-page-bg"
                          }`}
                        >
                          {actionText}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Navigation Footer */}
        <Pagination
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={totalKyc || submissions.length}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* OVERLAY DOCUMENT REVIEW MODALS */}
      {isModalOpen && selectedItem && (
        <KYCDocumentReviewModal
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedItem(null);
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          onRequestResubmission={handleRequestResubmission}
          isPending={reviewMutation.isPending}
        />
      )}
    </div>
  );
}
