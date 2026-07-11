"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, MoreHorizontal, Eye, Slash } from "lucide-react";
import { toast } from "react-toastify";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import PartnerDetailModal from "@/components/platform/PartnerDetailModal";
import PartnerSuspendBanModal from "@/components/platform/PartnerSuspendBanModal";

// Initial Mock Partners list matching Screenshot 1 values
const initialPartners = [
  {
    id: "PTN-001",
    name: "Maya Johnson",
    email: "maya.johnson@icloud.com",
    date: "Jul 20, 2026",
    dateTime: new Date(2026, 6, 20),
    status: "Active"
  },
  {
    id: "PTN-002",
    name: "Sofia Kumar",
    email: "sofia.kumar@yahoo.com",
    date: "May 15, 2026",
    dateTime: new Date(2026, 4, 15),
    status: "Banned"
  },
  {
    id: "PTN-003",
    name: "Zara Patel",
    email: "zara.patel@gmail.com",
    date: "Jun 10, 2026",
    dateTime: new Date(2026, 5, 10),
    status: "Active"
  },
  {
    id: "PTN-004",
    name: "Liam Thompson",
    email: "liam.thompson@outlook.com",
    date: "Jun 01, 2026",
    dateTime: new Date(2026, 5, 1),
    status: "Suspended"
  },
  {
    id: "PTN-005",
    name: "Ethan Zhang",
    email: "ethan.zhang@gmail.com",
    date: "Jul 05, 2026",
    dateTime: new Date(2026, 6, 5),
    status: "Active"
  },
  {
    id: "PTN-006",
    name: "Jamal Carter",
    email: "jamal.carter@example.com",
    date: "May 10, 2026",
    dateTime: new Date(2026, 4, 10),
    status: "Active"
  },
  {
    id: "PTN-007",
    name: "Amara Osei",
    email: "amara@gmail.com",
    date: "Apr 25, 2026",
    dateTime: new Date(2026, 3, 25),
    status: "Suspended"
  },
  {
    id: "PTN-008",
    name: "Liam Chen",
    email: "liam.chen@example.com",
    date: "May 10, 2026",
    dateTime: new Date(2026, 4, 10),
    status: "Active"
  },
  {
    id: "PTN-009",
    name: "Sofia Patel",
    email: "sofia.patel@email.com",
    date: "Jun 15, 2026",
    dateTime: new Date(2026, 5, 15),
    status: "Suspended"
  },
  {
    id: "PTN-010",
    name: "Ethan Martinez",
    email: "ethan.martinez@domain.com",
    date: "Jul 22, 2026",
    dateTime: new Date(2026, 6, 22),
    status: "Active"
  },
  {
    id: "PTN-011",
    name: "Benjamin White",
    email: "benjamin.white@clean.io",
    date: "Apr 18, 2026",
    dateTime: new Date(2026, 3, 18),
    status: "Invited"
  },
  {
    id: "PTN-012",
    name: "Oliver Anderson",
    email: "oliver@clean.io",
    date: "May 02, 2026",
    dateTime: new Date(2026, 4, 2),
    status: "Invited"
  },
  {
    id: "PTN-013",
    name: "Mason Wilson",
    email: "mason@clean.io",
    date: "Jun 11, 2026",
    dateTime: new Date(2026, 5, 11),
    status: "Invited"
  },
  {
    id: "PTN-014",
    name: "Lucas Taylor",
    email: "lucas@clean.io",
    date: "Jul 01, 2026",
    dateTime: new Date(2026, 6, 1),
    status: "Invited"
  },
  {
    id: "PTN-015",
    name: "Harper Martin",
    email: "harper@clean.io",
    date: "Jul 15, 2026",
    dateTime: new Date(2026, 6, 15),
    status: "Invited"
  },
  {
    id: "PTN-016",
    name: "Charlotte Lee",
    email: "charlotte@clean.io",
    date: "Apr 29, 2026",
    dateTime: new Date(2026, 3, 29),
    status: "Declined"
  }
];

export default function FoundingPartnersPage() {
  const [partners, setPartners] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // selected entities for modal actions
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [suspendBanOpen, setSuspendBanOpen] = useState(false);

  // Active dropdown row ID
  const [activeMenuRowId, setActiveMenuRowId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  // Load from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem("netly_founding_partners");
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map(item => ({
          ...item,
          dateTime: item.dateTime ? new Date(item.dateTime) : new Date()
        }));
        setPartners(parsed);
      } catch (e) {
        setPartners(initialPartners);
      }
    } else {
      setPartners(initialPartners);
      localStorage.setItem("netly_founding_partners", JSON.stringify(initialPartners));
    }
  }, []);

  const savePartners = (updatedList) => {
    setPartners(updatedList);
    localStorage.setItem("netly_founding_partners", JSON.stringify(updatedList));
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest("[data-dropdown-container]")) {
        setActiveMenuRowId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Modal handlers
  const handleSuspendBanSubmit = (partner, data) => {
    const updatedStatus = data.actionType === "Suspend (Temporary)" ? "Suspended" : "Banned";
    const updated = partners.map(p => 
      p.id === partner.id ? { ...p, status: updatedStatus } : p
    );
    savePartners(updated);
    setSuspendBanOpen(false);
    setSelectedPartner(null);
    toast.success(`Partner account status updated to ${updatedStatus}.`);
  };

  // Filtering
  const filteredPartners = partners.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "All" || p.status === filterStatus;

    let matchesDate = true;
    if (startDate && endDate) {
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      const signUpTime = new Date(p.dateTime).getTime();
      matchesDate = signUpTime >= start && signUpTime <= end;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Dynamic calculations for Stats Cards
  const statsTotal = partners.length;
  const statsInvited = partners.filter(p => p.status === "Invited").length;
  const statsActivated = partners.filter(p => p.status === "Active").length;
  const statsDeclined = partners.filter(p => p.status === "Declined").length;

  // Pagination
  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage) || 1;
  const paginatedPartners = filteredPartners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4 font-onest animate-scale-up">

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Sign Ups", count: statsTotal > 0 ? statsTotal : "-" },
          { title: "Invited", count: statsTotal > 0 ? statsInvited : "-" },
          { title: "Activated", count: statsTotal > 0 ? statsActivated : "-" },
          { title: "Declined", count: statsTotal > 0 ? statsDeclined : "-" }
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-3xl border border-secondary-bg hover:shadow-xs p-5 flex flex-col justify-between h-28 select-none">
            <span className="text-[10px] text-text-muted font-medium">{card.title}</span>
            <span className="text-2xl font-bold text-text-primary mt-auto">{card.count}</span>
          </div>
        ))}
      </div>

      {/* Table Card wrapper */}
      <div className="bg-white border border-secondary-bg rounded-3xl overflow-hidden shadow-2xs">
        
        {/* Filters Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-secondary-bg">
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
              className="w-full border border-border-main text-xs rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-border-main text-xs rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
              >
                <option value="All">Status</option>
                <option value="Active">Active</option>
                <option value="Invited">Invited</option>
                <option value="Declined">Declined</option>
                <option value="Suspended">Suspended</option>
                <option value="Banned">Banned</option>
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

        {/* Dynamic content area */}
        {filteredPartners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white">
            <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">No founding partners signups yet</h3>
              <p className="text-xs text-text-muted font-light">Users data will appear here, once they register themselves as founding provider.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto overflow-y-visible">
              <table className="min-w-full divide-y divide-secondary-bg text-sm tracking-tight">
                <thead className="bg-secondary-bg text-text-primary text-left text-sm">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email Address</th>
                    <th className="px-4 py-3 font-semibold">Sign Up Date</th>
                    <th className="px-4 py-3 font-semibold">Account status</th>
                    <th className="px-4 py-3 font-semibold w-10">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-bg text-sm text-text-primary">
                  {paginatedPartners.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-page-bg/50 transition">
                      <td className="px-4 py-3">{item.name}</td>
                      <td className="px-4 py-3">{item.email}</td>
                      <td className="px-4 py-3">{item.date}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          item.status === "Active" ? "text-emerald-500 bg-emerald-50" :
                          item.status === "Invited" ? "text-blue-500 bg-blue-50" :
                          item.status === "Declined" ? "text-text-muted bg-page-bg" :
                          "text-red-500 bg-red-50"
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
                              const isLastItem = idx === paginatedPartners.length - 1;
                              const top = isLastItem ? rect.top - 80 : rect.bottom + 4;
                              setDropdownPos({ top, left: rect.left - 120 });
                              setActiveMenuRowId(item.id);
                            }
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-page-bg transition cursor-pointer text-text-muted hover:text-text-primary"
                        >
                          <MoreHorizontal size={14} />
                        </button>

                        {/* Actions context menu overlay */}
                        {activeMenuRowId === item.id && (
                          <div
                            className="fixed w-40 bg-white border border-secondary-bg rounded-xl shadow-lg p-1.5 space-y-0.5 text-left text-xs animate-scale-up text-text-primary z-50"
                            style={{ top: dropdownPos.top, left: dropdownPos.left }}
                          >
                            <button
                              onClick={() => {
                                setSelectedPartner(item);
                                setDetailOpen(true);
                                setActiveMenuRowId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.75 rounded-lg hover:bg-page-bg transition cursor-pointer font-medium"
                            >
                              <Eye size={13} className="text-text-muted" /> View
                            </button>
                            <button
                              disabled={item.status === "Banned" || item.status === "Declined"}
                              onClick={() => {
                                setSelectedPartner(item);
                                setSuspendBanOpen(true);
                                setActiveMenuRowId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.75 rounded-lg hover:bg-page-bg transition cursor-pointer font-medium disabled:opacity-45 disabled:cursor-not-allowed"
                            >
                              <Slash size={13} className="text-text-muted" /> Suspend/Ban
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <Pagination
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredPartners.length}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Action Modals */}
      {selectedPartner && (
        <>
          <PartnerDetailModal
            isOpen={detailOpen}
            partner={selectedPartner}
            onClose={() => {
              setDetailOpen(false);
              setSelectedPartner(null);
            }}
          />

          <PartnerSuspendBanModal
            isOpen={suspendBanOpen}
            partner={selectedPartner}
            onClose={() => {
              setSuspendBanOpen(false);
              setSelectedPartner(null);
            }}
            onSubmit={handleSuspendBanSubmit}
          />
        </>
      )}

    </div>
  );
}
