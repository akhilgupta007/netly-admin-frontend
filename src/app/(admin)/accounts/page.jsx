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

const defaultClients = [
  { id: "CL-01", name: "Amara Osei", email: "amara@gmail.com", joinDate: "May 22, 2027", otp: "Verified", bookings: 14, wallet: 247.50, status: "Active" },
  { id: "CL-02", name: "Lila Carter", email: "lila.carter@email.com", joinDate: "July 1, 2027", otp: "Verified", bookings: 20, wallet: 350.00, status: "Active" },
  { id: "CL-03", name: "Hannah White", email: "hannah.white@email.com", joinDate: "January 25, 2028", otp: "Verified", bookings: 11, wallet: 300.00, status: "Active" },
  { id: "CL-04", name: "Sofia Martinez", email: "sofia.martinez@email.com", joinDate: "September 30, 2027", otp: "Pending", bookings: 12, wallet: 210.75, status: "Banned" },
  { id: "CL-05", name: "Ravi Patel", email: "ravi.patel@email.com", joinDate: "August 15, 2027", otp: "Verified", bookings: 10, wallet: 180.25, status: "Active" },
  { id: "CL-06", name: "Mason Green", email: "mason.green@email.com", joinDate: "December 18, 2027", otp: "Pending", bookings: 9, wallet: 125.00, status: "Active" },
  { id: "CL-07", name: "Thomas Kim", email: "thomas.kim@email.com", joinDate: "October 20, 2027", otp: "Verified", bookings: 6, wallet: 100.50, status: "Pending Verification" },
  { id: "CL-08", name: "Jordan Bailey", email: "jordan.bailey@email.com", joinDate: "June 12, 2027", otp: "Pending", bookings: 8, wallet: 159.00, status: "Active" },
  { id: "CL-09", name: "Ella Robinson", email: "ella.robinson@email.com", joinDate: "November 5, 2027", otp: "Verified", bookings: 15, wallet: 400.00, status: "Suspended" },
  { id: "CL-10", name: "Michael Thompson", email: "michael.thompson@email.com", joinDate: "December 15, 2027", otp: "Pending", bookings: 22, wallet: 750.00, status: "Active" }
];

const defaultProviders = [
  { id: "PR-01", name: "Amara Osei", email: "amara@gmail.com", city: "Accra", rating: "4.9", joinDate: "Feb 22, 2027", kyc: "Verified", badges: ["Founding Provider", "Provider Pro"], status: "Active" },
  { id: "PR-02", name: "Gina Hall", email: "gina.hall@example.com", city: "Boston", rating: "4.2", joinDate: "Jul 19, 2027", kyc: "Unverified", badges: ["Provider Pro"], status: "Pending Verification" },
  { id: "PR-03", name: "Bola Tunde", email: "bola.tunde@example.com", city: "Lagos", rating: "4.5", joinDate: "Mar 15, 2027", kyc: "Pending", badges: ["Provider Pro"], status: "Banned" },
  { id: "PR-04", name: "Kira Mehta", email: "kira.mehta@example.com", city: "Mumbai", rating: "4.0", joinDate: "Nov 8, 2027", kyc: "Pending", badges: ["Provider Pro"], status: "Suspended" },
  { id: "PR-05", name: "Carmen Diaz", email: "carmen.diaz@example.com", city: "Madrid", rating: "4.8", joinDate: "Apr 10, 2027", kyc: "Verified", badges: ["Founding Provider"], status: "Active" },
  { id: "PR-06", name: "Dmitri Koval", email: "dmitri.koval@example.com", city: "Moscow", rating: "4.7", joinDate: "May 25, 2027", kyc: "Pending", badges: ["Founding Provider"], status: "Active" },
  { id: "PR-07", name: "Evelyn Foster", email: "evelyn.foster@example.com", city: "Toronto", rating: "4.6", joinDate: "Jun 30, 2027", kyc: "Verified", badges: ["Provider Pro"], status: "Banned" },
  { id: "PR-08", name: "Isla Liu", email: "isla.liu@example.com", city: "Beijing", rating: "4.3", joinDate: "Sep 20, 2027", kyc: "Pending", badges: ["Provider Pro"], status: "Active" },
  { id: "PR-09", name: "Liam Reilly", email: "liam.reilly@example.com", city: "Sydney", rating: "4.9", joinDate: "Dec 6, 2027", kyc: "Verified", badges: ["Founding Provider"], status: "Suspended" },
  { id: "PR-10", name: "Jasper Quinn", email: "jasper.quinn@example.com", city: "Dublin", rating: "4.1", joinDate: "Oct 11, 2027", kyc: "Verified", badges: ["Founding Provider"], status: "Banned" }
];

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState("Clients"); // 'Clients' | 'Providers'
  
  // Filter settings
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterOTP, setFilterOTP] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Database lists
  const [clients, setClients] = useState([]);
  const [providers, setProviders] = useState([]);

  // Active action menu states
  const [openMenuId, setOpenMenuId] = useState(null);

  // Modal display targets
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [modalType, setModalType] = useState(null); // 'viewClient' | 'viewProvider' | 'suspendBan'

  // Pagination states
  const [clientPage, setClientPage] = useState(1);
  const [providerPage, setProviderPage] = useState(1);
  const itemsPerPage = 8;

  // Sync state with localStorage
  useEffect(() => {
    const storedClients = localStorage.getItem("netly_accounts_clients");
    const storedProviders = localStorage.getItem("netly_accounts_providers");

    if (storedClients) {
      setClients(JSON.parse(storedClients));
    } else {
      setClients(defaultClients);
      localStorage.setItem("netly_accounts_clients", JSON.stringify(defaultClients));
    }

    if (storedProviders) {
      setProviders(JSON.parse(storedProviders));
    } else {
      setProviders(defaultProviders);
      localStorage.setItem("netly_accounts_providers", JSON.stringify(defaultProviders));
    }
  }, []);

  const saveClients = (list) => {
    setClients(list);
    localStorage.setItem("netly_accounts_clients", JSON.stringify(list));
  };

  const saveProviders = (list) => {
    setProviders(list);
    localStorage.setItem("netly_accounts_providers", JSON.stringify(list));
  };

  // Close row dropdown menu safely when clicking elsewhere
  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Filter actions
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === "All" || c.status === filterStatus;
      const matchOTP = filterOTP === "All" || c.otp === filterOTP;

      let matchRange = true;
      if (startDate && endDate) {
        const joinDate = new Date(c.joinDate);
        matchRange = joinDate >= startDate && joinDate <= endDate;
      }
      return matchSearch && matchStatus && matchOTP && matchRange;
    });
  }, [clients, searchTerm, filterStatus, filterOTP, startDate, endDate]);

  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === "All" || p.status === filterStatus;
      const matchKYC = filterOTP === "All" || p.kyc === filterOTP; // Match KYC for providers under OTP filter state

      let matchRange = true;
      if (startDate && endDate) {
        const joinDate = new Date(p.joinDate);
        matchRange = joinDate >= startDate && joinDate <= endDate;
      }
      return matchSearch && matchStatus && matchKYC && matchRange;
    });
  }, [providers, searchTerm, filterStatus, filterOTP, startDate, endDate]);

  // Pagination calculation slices
  const currentClients = useMemo(() => {
    const start = (clientPage - 1) * itemsPerPage;
    return filteredClients.slice(start, start + itemsPerPage);
  }, [filteredClients, clientPage]);

  const currentProviders = useMemo(() => {
    const start = (providerPage - 1) * itemsPerPage;
    return filteredProviders.slice(start, start + itemsPerPage);
  }, [filteredProviders, providerPage]);

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

  // OTP/KYC status helper
  const getOtpClass = (otp) => {
    switch (otp) {
      case "Verified":
        return "text-emerald-500 bg-emerald-50";
      case "Pending":
        return "text-amber-500 bg-amber-50";
      default:
        return "text-red-500 bg-red-50";
    }
  };

  return (
    <div className="space-y-4">
      
      {/* 2 Navigation Tabs matching Wallets styling */}
      <div className="flex border-b border-secondary-bg text-xs">
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
              setFilterOTP("All");
              setStartDate(null);
              setEndDate(null);
            }}
            className={`px-4 py-2 -mb-px font-semibold transition hover:text-primary-bg ${
              activeTab === tab.id
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
          clients={filteredClients}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
          filterOTP={filterOTP}
          onOTPChange={setFilterOTP}
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
          getOtpClass={getOtpClass}
          onViewClient={(client) => {
            setSelectedAccount(client);
            setModalType("viewClient");
          }}
          onSuspendBan={(client) => {
            setSelectedAccount(client);
            setModalType("suspendBan");
          }}
        />
      ) : (
        <ProvidersTab
          providers={filteredProviders}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
          filterOTP={filterOTP}
          onOTPChange={setFilterOTP}
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
          getOtpClass={getOtpClass}
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

    </div>
  );
}
