"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronDown,
  Plus,
  Megaphone,
  MousePointerClick,
  Phone,
  CalendarClock,
  Pencil,
  Ban,
  Play,
  RefreshCw,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import CardWrapper from "@/components/ui/CardWrapper";
import Pagination from "@/components/ui/Pagination";
import Tooltip from "@/components/ui/Tooltip";
import { ListSkeleton, RefreshingBar } from "@/components/ui/Skeleton";
import SponsoredListingModal from "@/components/platform/SponsoredListingModal";
import { useSponsoredListings } from "@/hooks/useSponsoredListings";
import {
  createSponsoredListing,
  updateSponsoredListing,
  setSponsoredListingStatus,
  deleteSponsoredListing,
} from "@/lib/callables";
import { useAuthStore } from "@/store/useAuthStore";
import { canManageAdmins } from "@/lib/adminRoles";

/** Pill colours for the three statuses. */
function statusClass(status) {
  switch (status) {
    case "Active":
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "Inactive":
      return "text-text-muted bg-secondary-bg border-border-main";
    case "Expired":
      return "text-red-500 bg-red-50 border-red-200";
    default:
      return "text-text-muted bg-page-bg border-border-main";
  }
}

export default function SponsoredListingsPage() {
  const role = useAuthStore((state) => state.role);
  const isSuperAdmin = canManageAdmins(role);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPosition, setFilterPosition] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const itemsPerPage = 8;
  const params = useMemo(
    () => ({
      searchTerm,
      filterStatus,
      filterPosition,
      page: currentPage,
      limit: itemsPerPage,
    }),
    [searchTerm, filterStatus, filterPosition, currentPage],
  );

  const { listings, total, counts, isLoading, isFetching, isError } =
    useSponsoredListings(params, { enabled: isSuperAdmin });

  const queryClient = useQueryClient();
  const afterWrite = (message) => ({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsoredListings"] });
      setIsFormOpen(false);
      setEditing(null);
      toast.success(message);
    },
    onError: (err) => toast.error(err.message),
  });

  const create = useMutation({
    mutationFn: createSponsoredListing,
    ...afterWrite("Sponsored listing published."),
  });
  const update = useMutation({
    mutationFn: updateSponsoredListing,
    ...afterWrite("Listing updated."),
  });
  const setStatus = useMutation({
    mutationFn: setSponsoredListingStatus,
    ...afterWrite("Listing status changed."),
  });
  const remove = useMutation({
    mutationFn: deleteSponsoredListing,
    ...afterWrite("Listing deleted."),
  });

  const handleDelete = (listing) => {
    // Confirmed because it cannot be undone, and named so the admin sees which
    // campaign they are about to remove.
    if (
      !window.confirm(
        `Delete the sponsored listing for ${listing.companyName}?\n\n` +
          "This cannot be undone. Its click history is kept for billing.",
      )
    ) {
      return;
    }
    remove.mutate({ listingId: listing.id });
  };

  // Advertising spend and placement are commercial decisions, so this is the
  // super admin's alone. The sidebar already hides it; this is the page
  // refusing to render for anyone who reaches it by URL.
  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-2 text-center px-4 font-onest">
        <h3 className="text-sm font-semibold text-text-primary">
          Sponsored Listings is restricted
        </h3>
        <p className="text-xs text-text-muted font-light max-w-sm">
          Only a super admin can create or manage paid placements.
        </p>
      </div>
    );
  }

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };
  const openEdit = (listing) => {
    setEditing(listing);
    setIsFormOpen(true);
  };

  const handleSubmit = (payload) =>
    (payload.listingId ? update : create).mutate(payload);

  const busy = create.isPending || update.isPending;

  return (
    <div className="space-y-4 font-onest">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text-primary">
            Sponsored Listings
          </h2>
          <p className="text-[11px] text-text-muted font-light mt-0.5">
            Paid placements for businesses that do not transact on Netly. They
            appear in category results with a Sponsored badge and redirect out.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="bg-primary-bg hover:bg-primary-bg-muted text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus size={14} /> Create listing
        </button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardWrapper
          name="Active"
          value={isLoading ? "—" : counts.active}
          subtext={`${counts.total} total`}
          icon={Megaphone}
          className="border border-border-main"
        />
        <CardWrapper
          name="Website clicks"
          value={isLoading ? "—" : counts.websiteClicks.toLocaleString()}
          subtext="All listings"
          icon={MousePointerClick}
          className="border border-border-main"
        />
        <CardWrapper
          name="Call clicks"
          value={isLoading ? "—" : counts.callClicks.toLocaleString()}
          subtext="All listings"
          icon={Phone}
          className="border border-border-main"
        />
        <CardWrapper
          name="Expiring soon"
          value={isLoading ? "—" : counts.expiringSoon}
          subtext="Ends within 7 days"
          icon={CalendarClock}
          className="border border-border-main"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-border-main rounded-3xl shadow-2xs relative">
        <RefreshingBar active={isFetching && !isLoading} />

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-border-main">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by company, category, city or billing reference..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-md w-full border border-border-main md:text-xs text-[10px] rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-border-main md:text-xs text-[10px] rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-24"
              >
                <option value="All">Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Expired">Expired</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filterPosition}
                onChange={(e) => {
                  setFilterPosition(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-border-main md:text-xs text-[10px] rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-24"
              >
                <option value="All">Position</option>
                <option value="Featured">Featured</option>
                <option value="Standard">Standard</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <ListSkeleton rows={5} />
          ) : isError ? (
            <p className="py-16 text-center text-xs text-text-muted font-light">
              Sponsored listings could not be loaded.
            </p>
          ) : listings.length === 0 ? (
            <div className="py-16 text-center px-4">
              <p className="text-xs text-text-primary font-medium">
                No sponsored listings yet
              </p>
              <p className="text-[11px] text-text-muted font-light mt-1">
                {total === 0
                  ? "Create one to place a paid advert in category results."
                  : "Nothing matches the current filters."}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-secondary-bg text-left">
              <thead className="bg-secondary-bg/40 text-text-primary md:text-[10px] text-[9px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Clicks</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-bg md:text-xs text-[10px] text-text-primary">
                {listings.map((l) => (
                  <tr key={l.id} className="hover:bg-page-bg/40 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-secondary-bg border border-border-main overflow-hidden shrink-0 flex items-center justify-center">
                          {l.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={l.logoUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Megaphone size={13} className="text-text-muted" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="block font-medium truncate max-w-48">
                            {l.companyName}
                          </span>
                          <span className="block text-[10px] text-text-muted font-light truncate max-w-48">
                            {l.city}
                            {l.province ? `, ${l.province}` : ""}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block">{l.mainCategory || "—"}</span>
                      {l.subcategory && (
                        <span className="block text-[10px] text-text-muted font-light">
                          {l.subcategory}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          l.displayPosition === "Featured"
                            ? "bg-primary-bg/10 text-primary-bg"
                            : "bg-page-bg text-text-muted"
                        }`}
                      >
                        {l.displayPosition}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize text-text-muted">
                      {l.geoTarget}
                    </td>
                    <td className="px-4 py-3 text-text-muted font-light whitespace-nowrap">
                      {l.startDate} — {l.endDate}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {/* An emoji and a number do not say what was counted. */}
                      <Tooltip label="Website clicks" side="top">
                        <span>🌐 {l.websiteClicks}</span>
                      </Tooltip>
                      <span className="text-text-muted"> · </span>
                      <Tooltip label="Call clicks" side="top">
                        <span>📞 {l.callClicks}</span>
                      </Tooltip>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${statusClass(l.status)}`}
                      >
                        <span className="h-1 w-1 rounded-full bg-current" />
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {l.websiteUrl && (
                          <Tooltip label="Open the advertised site" side="left">
                            <a
                              href={l.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Open the advertised site"
                              className="p-1.5 rounded-lg text-text-muted hover:text-primary-bg hover:bg-page-bg transition"
                            >
                              <ExternalLink size={13} />
                            </a>
                          </Tooltip>
                        )}
                        <Tooltip label="Edit listing" side="left">
                          <button
                            type="button"
                            onClick={() => openEdit(l)}
                            aria-label="Edit listing"
                            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-page-bg transition cursor-pointer"
                          >
                            <Pencil size={13} />
                          </button>
                        </Tooltip>
                        {/* An expired campaign cannot simply be switched back
                            on — its end date is in the past, so it would be
                            expired again immediately. Renew is the honest
                            action there. */}
                        {l.isExpired ? (
                          <Tooltip
                            label="Renew — set a new end date"
                            side="left"
                          >
                            <button
                              type="button"
                              onClick={() => openEdit(l)}
                              aria-label="Renew — set a new end date"
                              className="p-1.5 rounded-lg text-primary-bg hover:bg-primary-bg/10 transition cursor-pointer"
                            >
                              <RefreshCw size={13} />
                            </button>
                          </Tooltip>
                        ) : l.status === "Active" ? (
                          <Tooltip
                            label="Deactivate — stop showing it"
                            side="left"
                          >
                            <button
                              type="button"
                              disabled={setStatus.isPending}
                              onClick={() =>
                                setStatus.mutate({
                                  listingId: l.id,
                                  status: "inactive",
                                })
                              }
                              aria-label="Deactivate listing"
                              // Amber and always tinted, rather than grey until
                              // hovered. Taking an advert off the app is a real
                              // intervention and should be findable at a
                              // glance — but it is reversible, so red stays
                              // reserved for Delete beside it and the two are
                              // not the same shout.
                              className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 hover:border-amber-300 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Ban size={14} strokeWidth={2.4} />
                            </button>
                          </Tooltip>
                        ) : (
                          <Tooltip
                            label="Activate — start showing it"
                            side="left"
                          >
                            <button
                              type="button"
                              disabled={setStatus.isPending}
                              onClick={() =>
                                setStatus.mutate({
                                  listingId: l.id,
                                  status: "active",
                                })
                              }
                              aria-label="Activate listing"
                              // Given the same weight as Deactivate — they are
                              // the same control in two states, so one being a
                              // tinted chip and the other a grey ghost would
                              // read as two different kinds of action.
                              className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 hover:border-emerald-300 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Play size={14} strokeWidth={2.4} />
                            </button>
                          </Tooltip>
                        )}
                        <Tooltip label="Delete permanently" side="left">
                          <button
                            type="button"
                            disabled={remove.isPending}
                            onClick={() => handleDelete(l)}
                            aria-label="Delete listing permanently"
                            className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 size={13} />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!isLoading && listings.length > 0 && (
          <Pagination
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={total}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      <SponsoredListingModal
        isOpen={isFormOpen}
        listing={editing}
        onClose={() => {
          setIsFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        isPending={busy}
      />
    </div>
  );
}
