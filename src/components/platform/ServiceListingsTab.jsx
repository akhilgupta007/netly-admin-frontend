"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, MoreHorizontal, Eye, Slash, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import ListingDetailsModal from "@/components/platform/ListingDetailsModal";
import DeactivateListingModal from "@/components/platform/DeactivateListingModal";
import RemoveListingModal from "@/components/platform/RemoveListingModal";
import { useServiceListings } from "@/hooks/usePlatform";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { moderateListing } from "@/lib/callables";
import { ListSkeleton, RefreshingBar } from "@/components/ui/Skeleton";

// Initial Mock Listings list

export default function ServiceListingsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPricing, setFilterPricing] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const queryClient = useQueryClient();

  const {
    listings,
    totalCount,
    categories,
    isLoading,
    isFetching,
    isError,
  } = useServiceListings({
    searchTerm,
    filterStatus,
    page: currentPage,
    limit: itemsPerPage,
  });


  // Active action dropdown row ID
  const [activeMenuRowId, setActiveMenuRowId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  // Modal control states
  const [selectedListing, setSelectedListing] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  // Load from LocalStorage


  // Close dropdown menu on clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest("[data-dropdown-container]")) {
        setActiveMenuRowId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Action callback executors
  const moderate = useMutation({
    mutationFn: moderateListing,
    onSuccess: (_r, variables) => {
      queryClient.invalidateQueries({ queryKey: ["serviceListings"] });
      queryClient.invalidateQueries({ queryKey: ["flaggedContent"] });
      setDeactivateOpen(false);
      setRemoveOpen(false);
      setSelectedListing(null);
      toast.success(
          variables.action === "remove" ?
            "Listing removed from the marketplace." :
            "Listing deactivated.",
      );
    },
    onError: (err) => toast.error(err.message),
  });

  const confirmDeactivate = (listing, reason) => {
    moderate.mutate({
      listingId: (listing || selectedListing)?.id,
      action: "deactivate",
      reason,
    });
  };

  const confirmRemove = (listing, reason) => {
    // Soft delete on the backend — bookings reference the listing.
    moderate.mutate({
      listingId: (listing || selectedListing)?.id,
      action: "remove",
      reason,
    });
  };

  // Filtering
  const filteredListings = listings.filter((lst) => {
    const matchesSearch =
      lst.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lst.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lst.provider.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "All" || lst.status === filterStatus;
    const matchesPricing = filterPricing === "All" || lst.pricing === filterPricing;

    let matchesDate = true;
    if (startDate && endDate) {
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      const createdVal = new Date(lst.createdTime).getTime();
      matchesDate = createdVal >= start && createdVal <= end;
    }

    return matchesSearch && matchesStatus && matchesPricing && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage) || 1;
  const paginatedListings = filteredListings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4 animate-scale-up">

      {/* Inline Filters bar inside the white container */}
      <div className="bg-white border border-border-main rounded-3xl overflow-hidden shadow-2xs relative">
        <RefreshingBar active={isFetching && !isLoading} />
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-border-main">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name or category..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-sm w-full border border-border-main md:text-xs text-[10px] rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
            />
          </div>

          <div className="flex items-center gap-2 justify-center flex-wrap">
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
                <option value="Active">Active</option>
                <option value="Deactivated">Deactivated</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filterPricing}
                onChange={(e) => {
                  setFilterPricing(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-border-main md:text-xs text-[10px] rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
              >
                <option value="All">Pricing</option>
                <option value="Hourly">Hourly</option>
                <option value="Quote based">Quote based</option>
                <option value="Per Item">Per Item</option>
                <option value="Fixed priced">Fixed priced</option>
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

        {/* Listings Data List */}
        {isLoading ? (
          <ListSkeleton rows={6} columns={6} firstColAvatar={false} />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-2 select-none bg-white">
            <h3 className="text-sm font-semibold text-text-primary">Could not load listings</h3>
            <p className="text-xs text-text-muted font-light">
              Check your connection and refresh.
            </p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white">
            <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">No Listings Found</h3>
              <p className="text-xs text-text-muted font-light">No listings match current criteria.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto overflow-y-visible">
              <table className="min-w-full divide-y divide-secondary-bg md:text-sm text-xs tracking-tight">
                <thead className="bg-secondary-bg text-text-primary text-left md:text-sm text-xs">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Provider</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Sub Category</th>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 font-semibold">Pricing</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold w-10">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-bg md:text-sm text-xs text-text-primary">
                  {paginatedListings.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-page-bg/50 transition">
                      <td className="px-4 py-3">{item.provider}</td>
                      <td className="px-4 py-3">{item.category}</td>
                      <td className="px-4 py-3">{item.subCategory}</td>
                      <td className="px-4 py-3 text-wrap">
                        {item.title}
                      </td>
                      <td className="px-4 py-3 text-nowrap">{item.created}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.pricing === "Hourly" ? "text-blue-500 bg-blue-50" :
                            item.pricing === "Quote based" || item.pricing === "Fixed priced" ? "text-amber-500 bg-amber-50" :
                              item.pricing === "Per Item" ? "text-purple-500 bg-purple-50" :
                                "text-emerald-500 bg-emerald-50"
                          }`}>
                          {item.pricing}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${item.status === "Active" ? "text-emerald-500 bg-emerald-50" : "text-red-500 bg-red-50"
                          }`}>
                          <span className="h-1.25 w-1.25 rounded-full bg-current" />
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3" data-dropdown-container>
                        <button
                          onClick={(e) => {
                            if (activeMenuRowId === item.id) {
                              setActiveMenuRowId(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const isLastItem = idx === paginatedListings.length - 1;
                              const top = isLastItem ? rect.top - 110 : rect.bottom + 4;
                              setDropdownPos({ top, left: rect.left - 130 });
                              setActiveMenuRowId(item.id);
                            }
                          }}
                          className="flex items-center justify-center rounded-full hover:bg-page-bg transition cursor-pointer text-text-primary"
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        {/* Actions overlay menu list */}
                        {activeMenuRowId === item.id && (
                          <div
                            className="fixed w-44 bg-white border border-border-main rounded-xl shadow-lg p-1.5 space-y-0.5 text-left text-xs animate-scale-up text-text-primary z-50"
                            style={{ top: dropdownPos.top, left: dropdownPos.left }}
                          >
                            <button
                              onClick={() => {
                                setSelectedListing(item);
                                setDetailsOpen(true);
                                setActiveMenuRowId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.75 rounded-lg hover:bg-page-bg transition cursor-pointer font-medium"
                            >
                              <Eye size={13} className="text-text-muted" /> View Listing
                            </button>
                            <button
                              disabled={item.status === "Deactivated"}
                              onClick={() => {
                                setSelectedListing(item);
                                setDeactivateOpen(true);
                                setActiveMenuRowId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.75 rounded-lg hover:bg-page-bg transition cursor-pointer font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Slash size={13} className="text-text-muted" /> Deactivate Listing
                            </button>
                            <button
                              onClick={() => {
                                setSelectedListing(item);
                                setRemoveOpen(true);
                                setActiveMenuRowId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.75 rounded-lg hover:bg-red-50 text-red-500 transition cursor-pointer font-medium"
                            >
                              <Trash2 size={13} className="text-red-400" /> Remove Listing
                            </button>
                          </div>
                        )}
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
              totalItems={filteredListings.length}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Listing Action Modals */}
      {selectedListing && (
        <>
          <ListingDetailsModal
            isOpen={detailsOpen}
            listing={selectedListing}
            onClose={() => {
              setDetailsOpen(false);
              setSelectedListing(null);
            }}
          />

          <DeactivateListingModal
            isOpen={deactivateOpen}
            listing={selectedListing}
            onClose={() => {
              setDeactivateOpen(false);
              setSelectedListing(null);
            }}
            onDeactivate={confirmDeactivate}
          />

          <RemoveListingModal
            isOpen={removeOpen}
            listing={selectedListing}
            onClose={() => {
              setRemoveOpen(false);
              setSelectedListing(null);
            }}
            onRemove={confirmRemove}
          />
        </>
      )}

    </div>
  );
}
