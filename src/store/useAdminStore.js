import { create } from "zustand";

/**
 * Global Admin Zustand Store
 * Centralized state management for UI tabs, search filters, selected accounts, and modals.
 */
export const useAdminStore = create((set) => ({
  // Accounts page state
  accountsActiveTab: "Clients",
  setAccountsActiveTab: (tab) => set({ accountsActiveTab: tab }),

  searchTerm: "",
  setSearchTerm: (term) => set({ searchTerm: term }),

  filterStatus: "All",
  setFilterStatus: (status) => set({ filterStatus: status }),

  filterKYC: "All",
  setFilterKYC: (kyc) => set({ filterKYC: kyc }),

  // Modal control states
  selectedAccount: null,
  setSelectedAccount: (account) => set({ selectedAccount: account }),

  modalType: null, // 'viewClient' | 'viewProvider' | 'suspendBan'
  setModalType: (type) => set({ modalType: type }),

  inviteUserOpen: false,
  setInviteUserOpen: (isOpen) => set({ inviteUserOpen: isOpen }),

  // KYC Page state
  kycActiveTab: "Pending",
  setKycActiveTab: (tab) => set({ kycActiveTab: tab }),

  // Reset store helpers
  resetFilters: () => set({ searchTerm: "", filterStatus: "All", filterKYC: "All" }),
}));
