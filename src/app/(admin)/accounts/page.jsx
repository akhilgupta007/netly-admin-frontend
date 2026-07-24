"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";

// Import custom components
import ClientsTab from "@/components/accounts/ClientsTab";
import ProvidersTab from "@/components/accounts/ProvidersTab";

// Import custom modals
import SuspendBanModal from "@/components/accounts/SuspendBanModal";
import ClientDetailModal from "@/components/accounts/ClientDetailModal";
import ProviderDetailModal from "@/components/accounts/ProviderDetailModal";
import InviteClientModal from "@/components/accounts/InviteClientModal";
import InviteProviderModal from "@/components/accounts/InviteProviderModal";

// Import custom Firestore React Query hooks
import { useClients } from "@/hooks/useClients";
import { useProviders } from "@/hooks/useProviders";

// Import Zustand store
import { useAdminStore } from "@/store/useAdminStore";

export default function AccountsPage() {
  const {
    accountsActiveTab: activeTab,
    setAccountsActiveTab: setActiveTab,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterKYC,
    setFilterKYC,
    selectedAccount,
    setSelectedAccount,
    modalType,
    setModalType,
    inviteUserOpen,
    setInviteUserOpen
  } = useAdminStore();

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Pagination states
  const [clientPage, setClientPage] = useState(1);
  const [providerPage, setProviderPage] = useState(1);
  const itemsPerPage = 8;

  // Memoize backend search & filter params
  const clientParams = useMemo(() => ({
    searchTerm,
    filterStatus,
    startDate,
    endDate,
    page: clientPage,
    limit: itemsPerPage
  }), [searchTerm, filterStatus, startDate, endDate, clientPage]);

  const providerParams = useMemo(() => ({
    searchTerm,
    filterStatus,
    filterKYC,
    startDate,
    endDate,
    page: providerPage,
    limit: itemsPerPage
  }), [searchTerm, filterStatus, filterKYC, startDate, endDate, providerPage]);

  // Custom React Query Firestore hooks with backend search, filter, and pagination
  const { clients, total: totalClients, isLoading: isClientsLoading } = useClients(clientParams, {
    enabled: activeTab === "Clients"
  });
  const { providers, total: totalProviders, isLoading: isProvidersLoading } = useProviders(providerParams, {
    enabled: activeTab === "Providers"
  });

  // Active action menu states
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      const statusParam = params.get("status");
      if (tabParam) {
        setActiveTab(tabParam);
      }
      if (statusParam) {
        setFilterStatus(statusParam);
      }
    }
  }, [setActiveTab, setFilterStatus]);

  // Close row dropdown menu safely when clicking elsewhere
  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Moderate Submit action handlers
  const handleSuspendBanSubmit = ({ accountId, actionType, duration, reason }) => {
    const nextStatus = actionType === "Suspend (Temporary)" ? "Suspended" : "Banned";

    if (activeTab === "Clients") {
      const updated = clients.map((c) =>
        c.id === accountId ? { ...c, status: nextStatus } : c
      );
      saveClients(updated);
      toast.error(`Client ${actionType === "Suspend (Temporary)" ? "suspended" : "banned"} successfully!`);
    } else {
      const updated = providers.map((p) =>
        p.id === accountId ? { ...p, status: nextStatus } : p
      );
      saveProviders(updated);
      toast.error(`Provider ${actionType === "Suspend (Temporary)" ? "suspended" : "banned"} successfully!`);
    }

    setModalType(null);
    setSelectedAccount(null);
  };

  const handleReactivateSubmit = (accountId) => {
    if (activeTab === "Clients") {
      const updated = clients.map((c) =>
        c.id === accountId ? { ...c, status: "Active" } : c
      );
      saveClients(updated);
      toast.success("Client account reactivated successfully!");
    } else {
      const updated = providers.map((p) =>
        p.id === accountId ? { ...p, status: "Active" } : p
      );
      saveProviders(updated);
      toast.success("Provider account reactivated successfully!");
    }

    setModalType(null);
    setSelectedAccount(null);
  };

  const handleInviteUser = (data) => {
    const formattedDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const generatedName = data.email
      .split("@")[0]
      .split(/[._-]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const finalName = data.name || generatedName;

    if (data.type === "Client") {
      const newClient = {
        id: `CL-${String(clients.length + 1).padStart(2, "0")}`,
        name: finalName,
        email: data.email,
        joinDate: formattedDate,
        otp: "Verified",
        bookings: 0,
        wallet: 0.00,
        status: "Active"
      };
      const updated = [newClient, ...clients];
      saveClients(updated);
      toast.success(`Client invite sent successfully to ${data.email}!`);
    } else {
      const badgesList = ["Provider Pro"];
      if (data.foundingPartnerBadge) {
        badgesList.unshift("Founding Provider");
      }
      const newProvider = {
        id: `PR-${String(providers.length + 1).padStart(2, "0")}`,
        name: finalName,
        email: data.email,
        city: "Boston", // default city
        rating: "5.0",
        joinDate: formattedDate,
        kyc: "Verified",
        badges: badgesList,
        status: "Active"
      };
      const updated = [newProvider, ...providers];
      saveProviders(updated);
      toast.success(`Provider invite sent successfully to ${data.email}!`);
    }
  };

  // Status color codes helper
  const getStatusClass = (status) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 text-emerald-600";
      case "Banned":
        return "bg-red-50 text-red-600";
      case "Suspended":
        return "bg-red-50 text-red-600  ";
      case "Pending Verification":
        return "bg-orange-50 text-orange-600";
      default:
        return "bg-secondary-bg text-text-muted";
    }
  };

  return (
    <div className="space-y-4">

      {/* 2 Navigation Tabs matching Wallets styling */}
      <div className="flex border-b border-border-main text-xs">
        {[
          { id: "Clients", label: "Clients" },
          { id: "Providers", label: "Providers" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setClientPage(1);
              setProviderPage(1);
              setSearchTerm("");
              setFilterStatus("All");
              setFilterKYC("All");
              setStartDate(null);
              setEndDate(null);
            }}
            className={`px-4 py-2 -mb-px font-semibold transition hover:text-primary-bg ${activeTab === tab.id
                ? "border-b-2 border-text-primary text-text-primary font-bold"
                : "text-text-muted"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "Clients" ? (
        <ClientsTab
          clients={clients}
          totalItems={totalClients}
          isLoading={isClientsLoading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
          startDate={startDate}
          endDate={endDate}
          onDateChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
          currentPage={clientPage}
          setCurrentPage={setClientPage}
          itemsPerPage={itemsPerPage}
          getStatusClass={getStatusClass}
          onViewClient={(client) => {
            setSelectedAccount(client);
            setModalType("viewClient");
          }}
          onSuspendBan={(client) => {
            setSelectedAccount(client);
            setModalType("suspendBan");
          }}
          onInviteClick={() => setInviteUserOpen(true)}
        />
      ) : (
        <ProvidersTab
          providers={providers}
          totalItems={totalProviders}
          isLoading={isProvidersLoading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
          filterKYC={filterKYC}
          onKYCChange={setFilterKYC}
          startDate={startDate}
          endDate={endDate}
          onDateChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
          currentPage={providerPage}
          setCurrentPage={setProviderPage}
          itemsPerPage={itemsPerPage}
          getStatusClass={getStatusClass}
          onViewProvider={(provider) => {
            setSelectedAccount(provider);
            setModalType("viewProvider");
          }}
          onKYCDocuments={(provider) => {
            toast.success(`Viewing verification documents for ${provider.name}!`);
          }}
          onPayouts={(provider) => {
            toast.info(`Viewing Payout reports for ${provider.name}...`);
          }}
          onSuspendBan={(provider) => {
            setSelectedAccount(provider);
            setModalType("suspendBan");
          }}
          onInviteClick={() => setInviteUserOpen(true)}
        />
      )}

      {/* OVERLAY MODAL CONTAINERS */}

      {/* 1. Suspend/Ban Modal */}
      {modalType === "suspendBan" && (
        <SuspendBanModal
          account={selectedAccount}
          activeTab={activeTab}
          isOpen={true}
          onClose={() => { setModalType(null); setSelectedAccount(null); }}
          onSubmit={handleSuspendBanSubmit}
        />
      )}

      {/* 2. Client Details Modal */}
      {modalType === "viewClient" && (
        <ClientDetailModal
          client={selectedAccount}
          isOpen={true}
          onClose={() => { setModalType(null); setSelectedAccount(null); }}
          onSuspendBanTrigger={(client) => { setSelectedAccount(client); setModalType("suspendBan"); }}
          onReactivateTrigger={handleReactivateSubmit}
        />
      )}

      {/* 3. Provider Details Modal */}
      {modalType === "viewProvider" && (
        <ProviderDetailModal
          provider={selectedAccount}
          isOpen={true}
          onClose={() => { setModalType(null); setSelectedAccount(null); }}
          onSuspendBanTrigger={(provider) => { setSelectedAccount(provider); setModalType("suspendBan"); }}
          onReactivateTrigger={handleReactivateSubmit}
        />
      )}

      {/* 4. Invite User Modal */}
      {activeTab === "Clients" ? (
        <InviteClientModal
          isOpen={inviteUserOpen}
          onClose={() => setInviteUserOpen(false)}
          onInvite={handleInviteUser}
        />
      ) : (
        <InviteProviderModal
          isOpen={inviteUserOpen}
          onClose={() => setInviteUserOpen(false)}
          onInvite={handleInviteUser}
        />
      )}

    </div>
  );
}
