"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, MoreHorizontal, Edit3, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import InviteAdminModal from "@/components/platform/InviteAdminModal";
import ChangeRoleModal from "@/components/platform/ChangeRoleModal";
import RevokeAccessModal from "@/components/platform/RevokeAccessModal";

// Initial Mock Admins list matching Screenshot 1
const initialAdmins = [
  {
    id: "ADM-001",
    name: "Sofia Kim",
    email: "sofia.kim@example.com",
    role: "Super Admin",
    lastLogin: "June 25, 2027 12:30 PM",
    dateTime: new Date(2027, 5, 25, 12, 30),
    twoFA: "Enabled"
  },
  {
    id: "ADM-002",
    name: "Lucas Wright",
    email: "lucas.wright@example.com",
    role: "Finance Admin",
    lastLogin: "July 15, 2027 11:15 AM",
    dateTime: new Date(2027, 6, 15, 11, 15),
    twoFA: "Enabled"
  },
  {
    id: "ADM-003",
    name: "Ava Johnson",
    email: "ava.johnson@example.com",
    role: "Compliance Admin",
    lastLogin: "July 10, 2027 10:30 AM",
    dateTime: new Date(2027, 6, 10, 10, 30),
    twoFA: "Setup Pending"
  },
  {
    id: "ADM-004",
    name: "Ethan Brown",
    email: "ethan.brown@example.com",
    role: "Moderator",
    lastLogin: "July 05, 2027 09:55 AM",
    dateTime: new Date(2027, 6, 5, 9, 55),
    twoFA: "Disabled"
  },
  {
    id: "ADM-005",
    name: "Jessica Wu",
    email: "jessica.wu@example.com",
    role: "Support Admin",
    lastLogin: "July 01, 2027 08:25 AM",
    dateTime: new Date(2027, 6, 1, 8, 25),
    twoFA: "Enabled"
  },
  {
    id: "ADM-006",
    name: "Mason Lee",
    email: "mason.lee@example.com",
    role: "Moderator",
    lastLogin: "July 25, 2027 02:45 PM",
    dateTime: new Date(2027, 6, 25, 14, 45),
    twoFA: "Enabled"
  },
  {
    id: "ADM-007",
    name: "Omar Ibrahim",
    email: "omar.ibrahim@example.com",
    role: "Support Admin",
    lastLogin: "June 20, 2027 10:05 AM",
    dateTime: new Date(2027, 5, 20, 10, 5),
    twoFA: "Setup Pending"
  }
];

export default function AdminUsersTab() {
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Selected row/modal parameters
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);

  // Dropdown row control state
  const [activeMenuRowId, setActiveMenuRowId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  // Load from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem("netly_admin_users");
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map(item => ({
          ...item,
          dateTime: item.dateTime ? new Date(item.dateTime) : new Date()
        }));
        setAdmins(parsed);
      } catch (e) {
        setAdmins(initialAdmins);
      }
    } else {
      setAdmins(initialAdmins);
      localStorage.setItem("netly_admin_users", JSON.stringify(initialAdmins));
    }
  }, []);

  const saveAdmins = (updatedList) => {
    setAdmins(updatedList);
    localStorage.setItem("netly_admin_users", JSON.stringify(updatedList));
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

  // Modal actions
  const handleInviteSubmit = (data) => {
    const newAdmin = {
      id: `ADM-${Date.now()}`,
      name: data.email.split("@")[0].split(/[._-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
      email: data.email,
      role: data.role,
      lastLogin: "Never logged in",
      dateTime: new Date(),
      twoFA: "Setup Pending"
    };
    const updated = [...admins, newAdmin];
    saveAdmins(updated);
    setInviteOpen(false);
    toast.success(`Invite sent successfully to ${data.email}!`);
  };

  const handleChangeRoleSubmit = (admin, newRole) => {
    const updated = admins.map(a => 
      a.id === admin.id ? { ...a, role: newRole } : a
    );
    saveAdmins(updated);
    setChangeRoleOpen(false);
    setSelectedAdmin(null);
    toast.success(`Role for ${admin.name} updated to ${newRole}.`);
  };

  const handleRevokeConfirm = (admin) => {
    const updated = admins.filter(a => a.id !== admin.id);
    saveAdmins(updated);
    setRevokeOpen(false);
    setSelectedAdmin(null);
    toast.success(`Access has been successfully revoked for ${admin.name}.`);
  };

  // Filtering
  const filteredAdmins = admins.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "All" ||
      a.twoFA === filterStatus;

    let matchesDate = true;
    if (startDate && endDate) {
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      const loginVal = new Date(a.dateTime).getTime();
      matchesDate = loginVal >= start && loginVal <= end;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Dynamic calculations for Stats Cards
  const statsFinance = admins.filter(a => a.role === "Finance Admin").length;
  const statsCompliance = admins.filter(a => a.role === "Compliance Admin").length;
  const statsSupport = admins.filter(a => a.role === "Support Admin").length;
  const statsModerator = admins.filter(a => a.role === "Moderator").length;

  // Pagination
  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage) || 1;
  const paginatedAdmins = filteredAdmins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4 animate-scale-up text-xs text-text-primary">

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Finance", count: statsFinance, sub: "Manages the transactions, refunds, etc." },
          { title: "Compliance", count: statsCompliance, sub: "Manages the KYC, disputes, audit logs, etc." },
          { title: "Support", count: statsSupport, sub: "Manages accounts, disputes, etc." },
          { title: "Moderator", count: statsModerator, sub: "Manages content, service categories, etc." }
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-3xl border border-secondary-bg hover:shadow-xs p-5 flex flex-col justify-between h-28 select-none">
            <span className="text-[10px] text-text-muted font-medium">{card.title}</span>
            <span className="text-2xl font-bold text-text-primary mt-2">{card.count}</span>
            <span className="text-[9px] text-text-muted font-light mt-auto block truncate">{card.sub}</span>
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
                <option value="Enabled">Enabled</option>
                <option value="Setup Pending">Setup Pending</option>
                <option value="Disabled">Disabled</option>
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

            <button
              onClick={() => setInviteOpen(true)}
              className="bg-primary-bg hover:bg-primary-bg-muted text-white font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer select-none flex items-center gap-1.5 shadow-2xs h-9.5 shrink-0"
            >
              + Invite Admin
            </button>
          </div>
        </div>

        {/* Table data list */}
        {filteredAdmins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white">
            <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75 animate-pulse" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">No Admin Users Found</h3>
              <p className="text-xs text-text-muted font-light">No admin users match the filtered parameters.</p>
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
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Last Login</th>
                    <th className="px-4 py-3 font-semibold">2FA Status</th>
                    <th className="px-4 py-3 font-semibold w-10">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-bg text-sm text-text-primary">
                  {paginatedAdmins.map((item, index) => {
                    const displayUpwards = index > 0 && (index === paginatedAdmins.length - 1 || (index >= 3 && paginatedAdmins.length > 3));

                    return (
                      <tr key={item.id} className="hover:bg-page-bg/50 transition">
                        <td className="px-4 py-3">{item.name}</td>
                        <td className="px-4 py-3">{item.email}</td>
                        <td className="px-4 py-3">{item.role}</td>
                        <td className="px-4 py-3">
                          {item.lastLogin.includes(" ") ? (
                            <>
                              <div>{item.lastLogin.split(" ").slice(0, 3).join(" ")}</div>
                              <div className="text-[10px] text-text-muted/75 mt-0.5">
                                {item.lastLogin.split(" ").slice(3).join(" ")}
                              </div>
                            </>
                          ) : (
                            item.lastLogin
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.twoFA === "Enabled" ? "text-emerald-500 bg-emerald-50" :
                            item.twoFA === "Setup Pending" ? "text-amber-500 bg-amber-50" :
                            "text-red-500 bg-red-50"
                          }`}>
                            {item.twoFA}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {/*Sofia Kim as Super Admin shouldn't have edit/revoke capabilities in Screenshot 1*/}
                          {item.role !== "Super Admin" ? (
                            <div data-dropdown-container>
                              <button
                                onClick={(e) => {
                                  if (activeMenuRowId === item.id) {
                                    setActiveMenuRowId(null);
                                  } else {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const isLastItem = index === paginatedAdmins.length - 1;
                                    const top = isLastItem ? rect.top - 80 : rect.bottom + 4;
                                    setDropdownPos({ top, left: rect.left - 100 });
                                    setActiveMenuRowId(item.id);
                                  }
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-page-bg transition cursor-pointer text-text-muted hover:text-text-primary mx-auto"
                              >
                                <MoreHorizontal size={14} />
                              </button>

                              {/* Actions overlay menu list */}
                              {activeMenuRowId === item.id && (
                                <div
                                  className="fixed w-32 bg-white border border-secondary-bg rounded-xl shadow-lg p-1.5 space-y-0.5 text-left text-xs animate-scale-up text-text-primary z-50"
                                  style={{ top: dropdownPos.top, left: dropdownPos.left }}
                                >
                                  <button
                                    onClick={() => {
                                      setSelectedAdmin(item);
                                      setChangeRoleOpen(true);
                                      setActiveMenuRowId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.75 rounded-lg hover:bg-page-bg transition cursor-pointer font-medium"
                                  >
                                    <Edit3 size={13} className="text-text-muted" /> Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedAdmin(item);
                                      setRevokeOpen(true);
                                      setActiveMenuRowId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.75 rounded-lg hover:bg-red-50 text-red-500 transition cursor-pointer font-medium"
                                  >
                                    <Trash2 size={13} className="text-red-400" /> Revoke
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-text-muted select-none font-light">—</span>
                          )}
                        </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <Pagination
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredAdmins.length}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Dialog Modals */}
      <InviteAdminModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInviteSubmit}
      />

      {selectedAdmin && (
        <>
          <ChangeRoleModal
            isOpen={changeRoleOpen}
            user={selectedAdmin}
            onClose={() => {
              setChangeRoleOpen(false);
              setSelectedAdmin(null);
            }}
            onChangeRole={handleChangeRoleSubmit}
          />

          <RevokeAccessModal
            isOpen={revokeOpen}
            user={selectedAdmin}
            onClose={() => {
              setRevokeOpen(false);
              setSelectedAdmin(null);
            }}
            onRevoke={handleRevokeConfirm}
          />
        </>
      )}

    </div>
  );
}
