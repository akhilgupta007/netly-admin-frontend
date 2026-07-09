"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, ChevronDown, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { getInitials } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";

// Custom Document Review Modal
import KYCDocumentReviewModal from "@/components/compliance/KYCDocumentReviewModal";

const defaultKycSubmissions = [
  { id: "KYC-01", name: "Leonard Thomas", docType: "ID", docFile: "ID_Leonard_Thomas.jpg", submittedDate: "October 29, 2027", status: "Pending", email: "leonard@thomas.com", phone: "+233 24 123 4567", joined: "Oct 12, 2027" },
  { id: "KYC-02", name: "Amara Osei", docType: "Proof of Address", docFile: "Proof_of_Address_Amara_Osei.pdf", submittedDate: "May 22, 2027", status: "In Review", email: "amara@gmail.com", phone: "+233 24 123 4567", joined: "Jan 12, 2027" },
  { id: "KYC-03", name: "Kylie Smith", docType: "Business Registration", docFile: "Business_Registration_Kylie_Smith.pdf", submittedDate: "August 18, 2027", status: "Expired", email: "kylie@smith.com", phone: "+233 24 123 4567", joined: "Aug 10, 2027" },
  { id: "KYC-04", name: "Evelyn Smith", docType: "ID", docFile: "ID_Evelyn_Smith.jpg", submittedDate: "February 20, 2027", status: "Approved", email: "evelyn@smith.com", phone: "+233 24 123 4567", joined: "Feb 1, 2027" },
  { id: "KYC-05", name: "Isabella Quinn", docType: "Business Registration", docFile: "Business_Registration_Isabella_Quinn.pdf", submittedDate: "September 14, 2027", status: "Rejected", email: "isabella@quinn.com", phone: "+233 24 123 4567", joined: "Sep 1, 2027" },
  { id: "KYC-06", name: "James Robinson", docType: "Proof of Address", docFile: "Proof_of_Address_James_Robinson.pdf", submittedDate: "December 22, 2027", status: "In Review", email: "james@robinson.com", phone: "+233 24 123 4567", joined: "Dec 10, 2027" },
  { id: "KYC-07", name: "Derek Ryan", docType: "ID", docFile: "ID_Derek_Ryan.jpg", submittedDate: "March 5, 2027", status: "Rejected", email: "derek@ryan.com", phone: "+233 24 123 4567", joined: "Mar 1, 2027" },
  { id: "KYC-08", name: "Clara Quinn", docType: "Proof of Address", docFile: "Proof_of_Address_Clara_Quinn.pdf", submittedDate: "June 10, 2027", status: "Pending", email: "clara@quinn.com", phone: "+233 24 123 4567", joined: "Jun 1, 2027" },
  { id: "KYC-09", name: "Benny Patel", docType: "Business Registration", docFile: "Business_Registration_Benny_Patel.pdf", submittedDate: "April 15, 2027", status: "Approved", email: "benny@patel.com", phone: "+233 24 123 4567", joined: "Apr 1, 2027" },
  { id: "KYC-10", name: "Mason Green", docType: "ID", docFile: "-", submittedDate: "-", status: "Not Submitted", email: "mason@green.com", phone: "+233 24 123 4567", joined: "Dec 18, 2027" },
  { id: "KYC-11", name: "Lila Carter", docType: "Proof of Address", docFile: "-", submittedDate: "-", status: "Not Submitted", email: "lila@carter.com", phone: "+233 24 123 4567", joined: "Jul 1, 2027" },
  { id: "KYC-12", name: "Fatima Diallo", docType: "ID", docFile: "ID_Fatima_Diallo.jpg", submittedDate: "Jun 19, 2027", status: "In Review", email: "fatima@diallo.com", phone: "+233 24 123 4567", joined: "Jun 12, 2027" }
];

export default function KYCVerificationPage() {
  const [submissions, setSubmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDocType, setFilterDocType] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Modal actions states
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Initialize and Sync with localStorage
  useEffect(() => {
    const saved = localStorage.getItem("netly_kyc_submissions");
    if (saved) {
      setSubmissions(JSON.parse(saved));
    } else {
      setSubmissions(defaultKycSubmissions);
      localStorage.setItem("netly_kyc_submissions", JSON.stringify(defaultKycSubmissions));
    }
  }, []);

  const saveSubmissions = (updated) => {
    setSubmissions(updated);
    localStorage.setItem("netly_kyc_submissions", JSON.stringify(updated));
  };

  // Status statistics card counts
  const counts = useMemo(() => {
    const res = { Approved: 0, InReview: 0, Rejected: 0, NotSubmitted: 0, Expired: 0 };
    submissions.forEach((s) => {
      if (s.status === "Approved") res.Approved++;
      else if (s.status === "In Review" || s.status === "Pending") res.InReview++;
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
        (filterStatus === "In Review" && ["In Review", "Pending"].includes(s.status)) ||
        s.status === filterStatus;

      const matchDocType = 
        filterDocType === "All" || 
        s.docType === filterDocType;

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
  }, [submissions, searchTerm, filterStatus, filterDocType, startDate, endDate]);

  // Sliced page data
  const paginated = useMemo(() => {
    return filteredSubmissions.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
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
    if (docType === "ID") {
      return <FileText size={15} className="text-blue-500 shrink-0" />;
    }
    return <FileText size={15} className="text-amber-500 shrink-0" />;
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

  // Modal callback actions
  const handleApprove = (id) => {
    const updated = submissions.map((s) => 
      s.id === id ? { ...s, status: "Approved" } : s
    );
    saveSubmissions(updated);
    toast.success("Document approved successfully!");
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleReject = (id, category, reason) => {
    const updated = submissions.map((s) => 
      s.id === id ? { ...s, status: "Rejected", rejectCategory: category, rejectReason: reason } : s
    );
    saveSubmissions(updated);
    toast.error(`Document rejected. Reason: ${category}`);
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleRequestResubmission = (id) => {
    const updated = submissions.map((s) => 
      s.id === id ? { ...s, status: "Expired" } : s
    );
    saveSubmissions(updated);
    toast.info("Resubmission request sent to user.");
    setIsModalOpen(false);
    setSelectedItem(null);
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
          { label: "Expired", count: counts.Expired }
        ].map((card, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-4 flex flex-col justify-between min-h-22.5 hover:shadow-xs transition">
            <span className="text-xs text-text-primary font-medium">{card.label}</span>
            <strong className="text-2xl text-text-primary font-semibold block pt-2">{card.count}</strong>
          </div>
        ))}
      </div>

      {/* Main Container Section */}
      <div className="bg-white rounded-3xl border border-secondary-bg hover:shadow-xs relative overflow-hidden">
        
        {/* Table Filters controls row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white rounded-t-3xl border-b border-secondary-bg">
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
              className="max-w-md w-full border border-border-main text-xs rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            
            {/* Status Dropdown Filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-border-main text-xs rounded-full px-3 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
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
                className="appearance-none bg-white border border-border-main text-xs rounded-full px-3 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
              >
                <option value="All">Document Type</option>
                <option value="ID">ID Card</option>
                <option value="Proof of Address">Proof of Address</option>
                <option value="Business Registration">Business Registration</option>
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-bg text-sm tracking-tight">
            <thead className="bg-secondary-bg text-text-primary text-left text-sm">
              <tr>
                <th className="px-4 py-2 font-semibold">User</th>
                <th className="px-4 py-2 font-semibold">Document</th>
                <th className="px-4 py-2 font-semibold">Submitted</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 text-right pr-6 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-bg text-sm text-text-primary">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted font-light">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75" />
                      <span>No KYC submissions found matching filter criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((row) => {
                  const actionText = getActionButtonText(row.status);
                  return (
                    <tr key={row.id} className="hover:bg-page-bg/50 transition">
                      
                      {/* User Column */}
                      <td className="px-4 py-3 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-primary-bg-muted text-white flex items-center justify-center text-[10px]">
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
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs ${getStatusClass(row.status)}`}>
                            <span className="h-1 w-1 rounded-full bg-current" />
                            {row.status}
                          </span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="px-4 py-3 text-right pr-6">
                        {row.status === "Not Submitted" ? (
                          <span className="text-text-muted text-xs pr-4">-</span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedItem(row);
                              setIsModalOpen(true);
                            }}
                            className={`inline-block text-xs px-4 py-1.5 rounded-xl transition cursor-pointer text-center font-medium border border-primary-bg-muted hover:border-primary-bg text-primary-bg`}
                          >
                            {actionText}
                          </button>
                        )}
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
          totalItems={filteredSubmissions.length}
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
        />
      )}

    </div>
  );
}
