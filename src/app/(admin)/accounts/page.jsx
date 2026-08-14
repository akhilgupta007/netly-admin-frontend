"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inviteUser, updateAccountStatus, resetUserPassword } from "@/lib/callables";

// Import custom components
import ClientsTab from "@/components/accounts/ClientsTab";
import ProvidersTab from "@/components/accounts/ProvidersTab";

// Import custom modals
import SuspendBanModal from "@/components/accounts/SuspendBanModal";
import MergeDuplicateModal from "@/components/accounts/MergeDuplicateModal";
import ClientDetailModal from "@/components/accounts/ClientDetailModal";
import ProviderDetailModal from "@/components/accounts/ProviderDetailModal";
import InviteClientModal from "@/components/accounts/InviteClientModal";
import InviteProviderModal from "@/components/accounts/InviteProviderModal";
import ProviderKycModal from "@/components/accounts/ProviderKycModal";
import ProviderPayoutModal from "@/components/accounts/ProviderPayoutModal";

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

  const queryClient = useQueryClient();

  const [pendingDetailUid, setPendingDetailUid] = useState(() =>
    typeof window === "undefined" ?
      null :
      new URLSearchParams(window.location.search).get("uid"),
  );
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // The provider whose KYC documents or payout history is open, if any.
  const [kycProvider, setKycProvider] = useState(null);
  const [payoutProvider, setPayoutProvider] = useState(null);

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

  // Open the deep-linked account once its list has loaded. Adjusted during
  // render rather than in an effect to avoid a cascading re-render, and
  // cleared immediately so it fires only once.
  if (pendingDetailUid) {
    const pool = activeTab === "Clients" ? clients : providers;
    if (pool && pool.length > 0) {
      const match = pool.find((a) => a.uid === pendingDetailUid);
      setPendingDetailUid(null);
      if (match) setSelectedAccount(match);
    }
  }

  // Close row dropdown menu safely when clicking elsewhere
  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Refetch whichever tab we are on rather than patching a local copy.
  const invalidateAccounts = () =>
    queryClient.invalidateQueries({
      queryKey: [activeTab === "Clients" ? "clients" : "providers"]
    });

  const statusMutation = useMutation({
    mutationFn: updateAccountStatus,
    onSuccess: (_result, variables) => {
      invalidateAccounts();
      setModalType(null);
      setSelectedAccount(null);
      const label = { suspend: "suspended", ban: "banned", reactivate: "reactivated" }[
        variables.action
      ];
      toast.success(`Account ${label}.`);
    },
    onError: (error) => toast.error(error.message)
  });

  const resetPasswordMutation = useMutation({
    mutationFn: resetUserPassword,
    onSuccess: (result) =>
      toast.success(`Password reset email sent to ${result.email}.`),
    onError: (error) => toast.error(error.message)
  });

  const handleSuspendBanSubmit = ({ uid, actionType, duration, reason, notifyEmail }) => {
    statusMutation.mutate({
      uid,
      action: actionType === "Suspend (Temporary)" ? "suspend" : "ban",
      durationDays: actionType === "Suspend (Temporary)" ? duration : undefined,
      reason,
      notifyEmail
    });
  };

  const handleReactivateSubmit = (account) => {
    statusMutation.mutate({ uid: account.uid, action: "reactivate" });
  };

  const handleResetPassword = (account) => {
    resetPasswordMutation.mutate({ uid: account.uid });
  };

  const inviteMutation = useMutation({
    mutationFn: inviteUser,
    onSuccess: (_result, variables) => {
      // Refetch from Firestore rather than guessing the new row — the backend
      // decides the uid, timestamps and profile defaults.
      queryClient.invalidateQueries({
        queryKey: [variables.accountType === "provider" ? "providers" : "clients"]
      });
      setInviteUserOpen(false);
      toast.success(`Invite sent to ${variables.email}.`);
    },
    onError: (error) => toast.error(error.message)
  });

  const handleInviteUser = (data) => {
    const generatedName = data.email
      .split("@")[0]
      .split(/[._-]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // The Role dropdown is the source of truth, not which tab opened the
    // modal — either modal lets you pick Client or Professional.
    const accountType = data.role === "Professional" ? "provider" : "client";

    inviteMutation.mutate({
      email: data.email,
      name: data.name || generatedName,
      accountType,
      foundingPartnerBadge: accountType === "provider"
        ? Boolean(data.foundingPartnerBadge)
        : false
    });
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
          // Both of these used to be a toast and nothing else. The screens
          // that hold this data already exist, so they open there with the
          // provider preselected rather than being rebuilt here.
          // Opens here rather than navigating away: checking an ID is a
          // glance, and bouncing the admin onto the KYC queue loses the place
          // they had in the provider list.
          onKYCDocuments={(provider) => {
            if (!provider.uid) {
              toast.error("This provider has no account id on record.");
              return;
            }
            setKycProvider(provider);
          }}
          onPayouts={(provider) => {
            if (!provider.uid) {
              toast.error("This provider has no account id on record.");
              return;
            }
            setPayoutProvider(provider);
          }}
          onSuspendBan={(provider) => {
            setSelectedAccount(provider);
            setModalType("suspendBan");
          }}
          onInviteClick={() => setInviteUserOpen(true)}
        />
      )}

      {/* OVERLAY MODAL CONTAINERS */}

      {/* 0. A provider's KYC documents and payout history, from their action
             menu. Both open here rather than navigating away, so the admin
             keeps their place in the provider list. */}
      <ProviderKycModal
        isOpen={Boolean(kycProvider)}
        provider={kycProvider}
        onClose={() => setKycProvider(null)}
      />

      <ProviderPayoutModal
        isOpen={Boolean(payoutProvider)}
        provider={payoutProvider}
        onClose={() => setPayoutProvider(null)}
      />

      {/* 1. Suspend/Ban Modal */}
      {modalType === "suspendBan" && (
        <SuspendBanModal
          account={selectedAccount}
          activeTab={activeTab}
          isOpen={true}
          onClose={() => { setModalType(null); setSelectedAccount(null); }}
          onSubmit={handleSuspendBanSubmit}
          isPending={statusMutation.isPending}
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
          isReactivating={statusMutation.isPending}
          onResetPassword={handleResetPassword}
          isResettingPassword={resetPasswordMutation.isPending}
          onMergeTrigger={(client) => { setSelectedAccount(client); setModalType("merge"); }}
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
          isReactivating={statusMutation.isPending}
          onResetPassword={handleResetPassword}
          isResettingPassword={resetPasswordMutation.isPending}
        />
      )}

      {/* 3b. Merge Duplicate Accounts Modal */}
      {modalType === "merge" && (
        <MergeDuplicateModal
          account={selectedAccount}
          accountType={activeTab === "Clients" ? "client" : "provider"}
          isOpen={true}
          onClose={() => { setModalType(null); setSelectedAccount(null); }}
          onMerged={invalidateAccounts}
        />
      )}

      {/* 4. Invite User Modal */}
      {activeTab === "Clients" ? (
        <InviteClientModal
          isOpen={inviteUserOpen}
          onClose={() => setInviteUserOpen(false)}
          onInvite={handleInviteUser}
          isPending={inviteMutation.isPending}
        />
      ) : (
        <InviteProviderModal
          isOpen={inviteUserOpen}
          onClose={() => setInviteUserOpen(false)}
          onInvite={handleInviteUser}
          isPending={inviteMutation.isPending}
        />
      )}

    </div>
  );
}
