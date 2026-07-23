"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, MoreHorizontal, Eye, Slash, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import ListingDetailsModal from "@/components/platform/ListingDetailsModal";
import DeactivateListingModal from "@/components/platform/DeactivateListingModal";
import RemoveListingModal from "@/components/platform/RemoveListingModal";

// Initial Mock Listings list
const initialListings = [
  {
    id: "LST-001",
    provider: "Kwame Adjei",
    email: "kwame@clean.io",
    category: "Home Cleaning",
    subCategory: "Deep Cleaning",
    title: "Professional Deep Clean -- Any Size Home",
    created: "May 22, 2027",
    createdTime: new Date(2027, 4, 22),
    pricing: "Hourly",
    status: "Active",
    description: "Thorough room-by-room clean including oven, fridge, bathrooms. Eco-friendly products. 5-star rated.",
    serviceArea: "Accra Metro"
  },
  {
    id: "LST-002",
    provider: "Emily Chen",
    email: "emily@clean.io",
    category: "Lawn Care",
    subCategory: "Seasonal Maintenance",
    title: "Comprehensive Lawn Service -- All Seasons",
    created: "Aug 1, 2027",
    createdTime: new Date(2027, 7, 1),
    pricing: "Quote based",
    status: "Active",
    description: "Full lawn mowing, leaf blowing, weed control, edging, and seasonal aeration/overseeding. Reliable weekly slots.",
    serviceArea: "Toronto West"
  },
  {
    id: "LST-003",
    provider: "Jamal Robinson",
    email: "jamal@clean.io",
    category: "Pet Care",
    subCategory: "Daily Walks",
    title: "Regular Dog Walking Service -- Up to 3 Dogs",
    created: "Jul 10, 2027",
    createdTime: new Date(2027, 6, 10),
    pricing: "Per Item",
    status: "Active",
    description: "Professional dog walking. 30/60 minute options. Photo updates, water refills, and clean paws guaranteed.",
    serviceArea: "Brooklyn Heights"
  },
  {
    id: "LST-004",
    provider: "Liam Patel",
    email: "liam@clean.io",
    category: "Graphic Design",
    subCategory: "Brand Identity",
    title: "Comprehensive Branding Package -- Logo and Visuals",
    created: "Sep 5, 2027",
    createdTime: new Date(2027, 8, 5),
    pricing: "Hourly",
    status: "Deactivated",
    description: "Complete brand identity setup, logo, business card design, brand style guide, social media kits.",
    serviceArea: "Vancouver Metro"
  },
  {
    id: "LST-005",
    provider: "Sophia Martinez",
    email: "sophia@clean.io",
    category: "Lawn Care",
    subCategory: "Seasonal Maintenance",
    title: "Full Lawn Restoration -- Large Yard",
    created: "Jun 15, 2027",
    createdTime: new Date(2027, 5, 15),
    pricing: "Hourly",
    status: "Active",
    description: "Weed removal, top dressing, seeding, and organic fertilizing for large properties.",
    serviceArea: "Austin North"
  },
  {
    id: "LST-006",
    provider: "Olivia Kim",
    email: "olivia@clean.io",
    category: "Web Development",
    subCategory: "E-commerce Solutions",
    title: "Custom E-commerce Website Development",
    created: "Oct 12, 2027",
    createdTime: new Date(2027, 9, 12),
    pricing: "Quote based",
    status: "Active",
    description: "Fully responsive Shopify or NextJS ecommerce portal development with payment integrations.",
    serviceArea: "Seattle Central"
  },
  {
    id: "LST-007",
    provider: "Ethan Carter",
    email: "ethan@clean.io",
    category: "Mobile Development",
    subCategory: "Social Media App",
    title: "iOS and Android App Development",
    created: "Feb 15, 2028",
    createdTime: new Date(2028, 1, 15),
    pricing: "Fixed priced",
    status: "Active",
    description: "Native or React Native cross-platform app design and launch services.",
    serviceArea: "Accra Metro"
  }
];

export default function ServiceListingsTab() {
  const [listings, setListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPricing, setFilterPricing] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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
  useEffect(() => {
    const stored = localStorage.getItem("netly_service_listings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map(item => ({
          ...item,
          createdTime: item.createdTime ? new Date(item.createdTime) : new Date()
        }));
        setListings(parsed);
      } catch (e) {
        setListings(initialListings);
      }
    } else {
      setListings(initialListings);
      localStorage.setItem("netly_service_listings", JSON.stringify(initialListings));
    }
  }, []);

  const saveListings = (updatedList) => {
    setListings(updatedList);
    localStorage.setItem("netly_service_listings", JSON.stringify(updatedList));
  };

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
  const confirmDeactivate = (listing, reason) => {
    const updated = listings.map((lst) =>
      lst.id === listing.id ? { ...lst, status: "Deactivated" } : lst
    );
    saveListings(updated);
    setDeactivateOpen(false);
    setSelectedListing(null);
    toast.success(`Listing deactivated successfully. Reason: "${reason}"`);
  };

  const confirmRemove = (listing, reason) => {
    const updated = listings.filter((lst) => lst.id !== listing.id);
    saveListings(updated);
    setRemoveOpen(false);
    setSelectedListing(null);
    toast.success(`Listing has been permanently removed.`);
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
      <div className="bg-white border border-border-main rounded-3xl overflow-hidden shadow-2xs">
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
        {filteredListings.length === 0 ? (
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
