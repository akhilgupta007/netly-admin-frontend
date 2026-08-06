"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronDown, MoreHorizontal, Edit3, Trash2, Plus } from "lucide-react";
import { toast } from "react-toastify";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import InviteAdminModal from "@/components/platform/InviteAdminModal";
import ChangeRoleModal from "@/components/platform/ChangeRoleModal";
import RevokeAccessModal from "@/components/platform/RevokeAccessModal";
import CardWrapper from "@/components/ui/CardWrapper";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inviteAdmin, updateAdminRole, revokeAdminAccess } from "@/lib/callables";
import { useAdmins } from "@/hooks/useAdmins";
import { useAuthStore } from "@/store/useAuthStore";
import { ADMIN_ROLES, roleLabel, canManageAdmins } from "@/lib/adminRoles";
import { toMillis } from "@/services/firestoreReads";
import { ListSkeleton, RefreshingBar } from "@/components/ui/Skeleton";

export default function AdminUsersTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected row/modal parameters
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);

  // Dropdown row control state
  const [activeMenuRowId, setActiveMenuRowId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const { admins, isLoading, isFetching, isError, error } = useAdmins();
  const queryClient = useQueryClient();
  const currentRole = useAuthStore((state) => state.role);
  const currentUid = useAuthStore((state) => state.uid);
  const isSuperAdmin = canManageAdmins(currentRole);

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

  const invalidateAdmins = () =>
    queryClient.invalidateQueries({ queryKey: ["admins"] });

  const inviteMutation = useMutation({
    mutationFn: inviteAdmin,
    onSuccess: (_data, variables) => {
      invalidateAdmins();
      setInviteOpen(false);
      toast.success(`Invite sent to ${variables.email}.`);
    },
    onError: (error) => toast.error(error.message)
  });

  const roleMutation = useMutation({
    mutationFn: updateAdminRole,
    onSuccess: (_data, variables) => {
      invalidateAdmins();
      setChangeRoleOpen(false);
      setSelectedAdmin(null);
      toast.success(`Role updated to ${roleLabel(variables.role)}.`);
    },
    onError: (error) => toast.error(error.message)
  });

  const revokeMutation = useMutation({
    mutationFn: revokeAdminAccess,
    onSuccess: () => {
      invalidateAdmins();
      setRevokeOpen(false);
      setSelectedAdmin(null);
      toast.success("Admin access revoked.");
    },
    onError: (error) => toast.error(error.message)
  });

  const handleInviteSubmit = (data) => {
    inviteMutation.mutate({ email: data.email, role: data.role });
  };

  const handleChangeRoleSubmit = (admin, newRole) => {
    roleMutation.mutate({ uid: admin.uid, role: newRole });
  };

  const handleRevokeConfirm = (admin, reason) => {
    revokeMutation.mutate({ uid: admin.uid, reason });
  };

  // Filtering
  const filteredAdmins = admins.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "All" || a.status === filterStatus;

    let matchesDate = true;
    if (startDate && endDate) {
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      const createdAt = toMillis(a.createdAtRaw);
      matchesDate = createdAt === null || (createdAt >= start && createdAt <= end);
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Dynamic calculations for Stats Cards
  const countByRole = (slug) => admins.filter((a) => a.role === slug).length;
  const statsFinance = countByRole(ADMIN_ROLES.FINANCE_ADMIN);
  const statsCompliance = countByRole(ADMIN_ROLES.COMPLIANCE_ADMIN);
  const statsSupport = countByRole(ADMIN_ROLES.SUPPORT_ADMIN);
  const statsModerator = countByRole(ADMIN_ROLES.MODERATOR);

  // Pagination
  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage) || 1;
  const paginatedAdmins = filteredAdmins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4 font-onest animate-scale-up text-xs text-text-primary">

      {/* Summary Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {[
          { title: "Finance", count: statsFinance, sub: "Manages the transactions, refunds, etc." },
          { title: "Compliance", count: statsCompliance, sub: "Manages the KYC, disputes, audit logs, etc." },
          { title: "Support", count: statsSupport, sub: "Manages accounts, disputes, etc." },
          { title: "Moderator", count: statsModerator, sub: "Manages content, service categories, etc." }
        ].map((card, i) => (
          <CardWrapper
            key={i}
            name={card.title}
            value={card.count}
            subtext={card.sub}
          />
        ))}
      </div>

      {/* Main Table Container Box */}
      <div className="bg-white rounded-3xl border border-border-main hover:shadow-xs relative overflow-visible">
        <RefreshingBar active={isFetching && !isLoading} />

        {/* Filters control bar */}
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
                <option value="active">Active</option>
                <option value="invited">Invited</option>
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

            {isSuperAdmin && <button
              onClick={() => setInviteOpen(true)}
              className="bg-primary-bg hover:opacity-90 text-white font-medium text-sm py-2.5 px-4 rounded-lg transition cursor-pointer select-none flex items-center gap-1.5 h-9.5 shrink-0"
            >
              <Plus size={18} /> Invite Admin
            </button>}
          </div>
        </div>

        {/* Table data list */}
        {isLoading ? (
          <ListSkeleton rows={6} columns={5} firstColAvatar />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-2 select-none bg-white min-h-80">
            <h3 className="text-sm font-semibold text-red-600">Could not load admin users</h3>
            <p className="text-xs text-text-muted font-light max-w-sm">
              {error?.message || "Check your connection and try again."}
            </p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white min-h-80">
            <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75 animate-pulse" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">No Admin Users Found</h3>
              <p className="text-xs text-text-muted font-light">No admin users match the filtered parameters.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto overflow-y-visible rounded-b-3xl">
              <table className="min-w-full divide-y divide-secondary-bg md:text-sm text-xs tracking-tight">
                <thead className="bg-secondary-bg text-text-primary text-left md:text-sm text-xs">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email Address</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Last Login</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold w-10">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-bg md:text-sm text-xs text-text-primary">
                  {paginatedAdmins.map((item, index) => {
                    const displayUpwards = index > 0 && (index === paginatedAdmins.length - 1 || (index >= 3 && paginatedAdmins.length > 3));

                    return (
                      <tr key={item.id} className="hover:bg-page-bg/50 transition">
                        <td className="px-4 py-3">{item.name}</td>
                        <td className="px-4 py-3">{item.email}</td>
                        <td className="px-4 py-3">{roleLabel(item.role)}</td>
                        <td className="px-4 py-3 text-nowrap">
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
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full md:text-xs text-[10px] capitalize ${item.status === "active" ? "text-emerald-500 bg-emerald-50" :
                              item.status === "invited" ? "text-amber-500 bg-amber-50" :
                                "text-red-500 bg-red-50"
                            }`}>
                            <span className="h-1 w-1 rounded-full bg-current" />
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3" data-dropdown-container>
                          {/* Sofia Kim as Super Admin shouldn't have edit/revoke capabilities in Screenshot 1 */}
                          {isSuperAdmin &&
                          item.role !== ADMIN_ROLES.SUPER_ADMIN &&
                          item.uid !== currentUid ? (
                            <div className="relative inline-block">
                              <button
                                onClick={(e) => {
                                  if (activeMenuRowId === item.id) {
                                    setActiveMenuRowId(null);
                                  } else {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const isLastItem = index === paginatedAdmins.length - 1;
                                    const top = isLastItem ? rect.top - 80 : rect.bottom + 4;
                                    setDropdownPos({ top, left: rect.left - 120 });
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
                                  className="fixed w-30 bg-white border border-border-main rounded-xl shadow-lg p-1.5 space-y-0.5 text-left text-xs animate-scale-up text-text-primary z-50"
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
      {inviteOpen && (
        <InviteAdminModal
          isOpen
          onClose={() => setInviteOpen(false)}
          onInvite={handleInviteSubmit}
          isPending={inviteMutation.isPending}
        />
      )}

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
            isPending={roleMutation.isPending}
          />

          <RevokeAccessModal
            isOpen={revokeOpen}
            user={selectedAdmin}
            onClose={() => {
              setRevokeOpen(false);
              setSelectedAdmin(null);
            }}
            onRevoke={handleRevokeConfirm}
            isPending={revokeMutation.isPending}
          />
        </>
      )}

    </div>
  );
}
