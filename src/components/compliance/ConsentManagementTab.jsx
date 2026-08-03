"use client";

import React, { useState, useMemo } from "react";
import { Search, Download, Clock, MailX, Trash } from "lucide-react";
import { toast } from "react-toastify";
import { exportCSV } from "@/utils/exportHelper";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConsentRecords } from "@/hooks/useCompliance";
import { updateUserConsent, exportUserData } from "@/lib/callables";

import DeleteUserDataModal from "./DeleteUserDataModal";

export default function ConsentManagementTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const { records: consentList, isLoading, isError, error } = useConsentRecords();
  const queryClient = useQueryClient();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState(null);

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Last Updated", "Data Consent", "Data Consent Time", "Marketing Consent", "Marketing Consent Time"];
    const rows = consentList.map(c => `"${c.name}","${c.email}","${c.lastUpdated}",${c.dataConsent},"${c.dataConsentTime}",${c.marketingConsent},"${c.marketingConsentTime}"`);
    exportCSV(headers, rows, `consent_records_${Date.now()}.csv`);
  };

  const matchedRecord = useMemo(() => {
    if (!searchTerm.trim()) return consentList[0] || null;
    return consentList.find(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || null;
  }, [consentList, searchTerm]);

  const consentMutation = useMutation({
    mutationFn: updateUserConsent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consentRecords"] });
      toast.success("Marketing consent withdrawn.");
    },
    onError: (error) => toast.error(error.message)
  });

  const exportMutation = useMutation({
    mutationFn: exportUserData,
    onSuccess: (result) => {
      // Hand the archive over as a download rather than emailing someone's
      // personal data around.
      const blob = new Blob([JSON.stringify(result.archive, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `netly-data-export-${result.subject.email || result.subject.uid}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data archive downloaded.");
    },
    onError: (error) => toast.error(error.message)
  });

  const handleUnsubscribeUser = (record) => {
    consentMutation.mutate({
      uid: record.uid,
      marketingConsent: false,
      reason: "Opt-out actioned by admin on the user's request"
    });
  };

  const handleExportUserData = (record) => {
    exportMutation.mutate({ uid: record.uid });
  };

  const handleDeleteUserData = (user) => {
    setSelectedUserForDelete(user);
    setIsDeleteModalOpen(true);
  };

  // Erasure is not implemented. It cannot be a simple delete: bookings and
  // payouts are financial records that must be retained for tax and Stripe
  // reconciliation, so "delete my data" has to mean anonymise-and-retain for
  // those, and that boundary is a policy decision rather than a code one.
  // Failing loudly is better than a success toast that deletes nothing.
  const handleConfirmDeleteUserData = () => {
    setIsDeleteModalOpen(false);
    setSelectedUserForDelete(null);
    toast.error(
      "Data erasure is not implemented yet — it needs a retention policy for financial records first."
    );
  };

  return (
    <div className="animate-scale-up text-xs text-text-primary p-4">
      {/* Search Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white rounded-t-3xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md w-full border border-border-main md:text-xs text-[10px] rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
          />
        </div>

      </div>

      {/* Main Consent Form Body */}
      {!matchedRecord ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white rounded-b-3xl">
          <img src="/empty.png" alt="No data" className="w-16 h-16 object-contain opacity-75" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-text-primary">User not found</h3>
            <p className="text-xs text-text-muted font-light">Try searching a different name or email address.</p>
          </div>
        </div>
      ) : (
        <div className="pt-4 space-y-5 bg-white rounded-b-3xl">
          {/* Header Info bar */}
          <div className="bg-page-bg/40 border border-border-main rounded-2xl p-4 text-xs text-text-primary">
            <div className="block text-xs text-text-primary">Search a user to view their consent record</div>
            <p className="text-[10px] text-text-muted font-light mt-0.5">Covers marketing opt-in (CASL), data processing consent, and PII rights (PIPEDA)</p>
          </div>

          {/* Matched user record block */}
          <div className="border border-border-main rounded-3xl p-4 space-y-5 shadow-2xs">
            <div className="flex justify-between items-center pb-3 border-b border-border-main">
              <div>
                <h3 className="text-sm text-text-primary">{matchedRecord.name}</h3>
                <p className="text-[10px] text-text-muted font-light mt-0.5">{matchedRecord.email}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Clock size={16} />
                <span>Last updated: {matchedRecord.lastUpdated}</span>
              </div>
            </div>

            {/* Status Boxes row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data Processing Consent */}
              <div className="border border-border-main rounded-2xl p-4 space-y-2">
                <span className="text-sm text-text-primary block">Data processing consent</span>
                <strong className={`text-xl block ${matchedRecord.dataConsent ? "text-emerald-500" : "text-red-500"}`}>
                  {matchedRecord.dataConsent ? "Opted in" : "Opted out"}
                </strong>
                <span className="text-xs text-text-muted block font-light">Since: {matchedRecord.dataConsentTime}</span>
              </div>

              {/* Marketing opt-in (CASL) */}
              <div className="border border-border-main rounded-2xl p-4 space-y-2">
                <span className="text-sm text-text-primary block">Marketing opt-in (CASL)</span>
                <strong className={`text-xl block ${matchedRecord.marketingConsent ? "text-emerald-500" : "text-red-500"}`}>
                  {matchedRecord.marketingConsent ? "Opted in" : "Opted out"}
                </strong>
                <span className="text-xs text-text-muted block font-light">Since: {matchedRecord.marketingConsentTime}</span>
              </div>
            </div>

            {/* Action buttons row */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={() => handleExportUserData(matchedRecord)}
                disabled={exportMutation.isPending}
                className="flex-1 min-w-37.5 bg-primary-bg hover:opacity-90 text-white font-medium text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download size={13} /> Export User Data
              </button>
              <button
                onClick={() => handleUnsubscribeUser(matchedRecord)}
                disabled={consentMutation.isPending || matchedRecord.marketingConsent !== true}
                className="flex-1 min-w-37.5 bg-white border border-primary-bg-muted text-primary-bg hover:bg-page-bg font-medium text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <MailX size={13} /> Unsubscribe User
              </button>
              <button
                onClick={() => handleDeleteUserData(matchedRecord)}
                className="flex-1 min-w-37.5 bg-white border border-red-500 text-red-500 hover:bg-red-50 font-medium text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash size={13} /> Delete User Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Data Modal */}
      {isDeleteModalOpen && selectedUserForDelete && (
        <DeleteUserDataModal
          user={selectedUserForDelete}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedUserForDelete(null);
          }}
          onDeleteConfirm={handleConfirmDeleteUserData}
        />
      )}
    </div>
  );
}
