"use client";

import React, { useState, useMemo } from "react";
import { Search, Download, Clock, MailX } from "lucide-react";
import { toast } from "react-toastify";
import { exportCSV } from "@/utils/exportHelper";

const mockConsentRecords = [
  { name: "Amara Osei", email: "amara@gmail.com", lastUpdated: "Jan 12, 2027", dataConsent: true, dataConsentTime: "Jan 12, 2027 09:14", marketingConsent: false, marketingConsentTime: "Jan 12, 2027 09:14" },
  { name: "Kofi Mensah", email: "kofi.m@gmail.com", lastUpdated: "Jun 22, 2027", dataConsent: true, dataConsentTime: "Jun 22, 2027 18:05", marketingConsent: true, marketingConsentTime: "Jun 22, 2027 18:05" },
  { name: "Yetunde Balogun", email: "yetunde@example.com", lastUpdated: "May 15, 2027", dataConsent: false, dataConsentTime: "May 15, 2027 12:00", marketingConsent: false, marketingConsentTime: "May 15, 2027 12:00" }
];

export default function ConsentManagementTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [consentList, setConsentList] = useState(mockConsentRecords);

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

  const handleUnsubscribeUser = (email) => {
    const updated = consentList.map(c => {
      if (c.email === email) {
        return {
          ...c,
          marketingConsent: false,
          marketingConsentTime: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
        };
      }
      return c;
    });
    setConsentList(updated);
    toast.success(`User ${email} unsubscribed from marketing opt-in (CASL).`);
  };

  const handleExportUserData = (email) => {
    toast.success(`PII personal archive generated for ${email}. Export sent to admin email.`);
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
            className="max-w-md w-full border border-border-main text-xs rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
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
          <div className="bg-page-bg/40 border border-secondary-bg rounded-2xl p-4 text-xs text-text-primary">
            <div className="block text-xs text-text-primary">Search a user to view their consent record</div>
            <p className="text-[10px] text-text-muted font-light mt-0.5">Covers marketing opt-in (CASL), data processing consent, and PII rights (PIPEDA)</p>
          </div>

          {/* Matched user record block */}
          <div className="border border-secondary-bg rounded-3xl p-4 space-y-5 shadow-2xs">
            <div className="flex justify-between items-center pb-3 border-b border-secondary-bg">
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
              <div className="border border-secondary-bg rounded-2xl p-4 space-y-2">
                <span className="text-sm text-text-primary block">Data processing consent</span>
                <strong className={`text-xl block ${matchedRecord.dataConsent ? "text-emerald-500" : "text-red-500"}`}>
                  {matchedRecord.dataConsent ? "Opted in" : "Opted out"}
                </strong>
                <span className="text-xs text-text-muted block font-light">Since: {matchedRecord.dataConsentTime}</span>
              </div>

              {/* Marketing opt-in (CASL) */}
              <div className="border border-secondary-bg rounded-2xl p-4 space-y-2">
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
                onClick={() => handleExportUserData(matchedRecord.email)}
                className="flex-1 min-w-37.5 bg-primary-bg hover:opacity-90 text-white font-medium text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download size={13} /> Export User Data
              </button>
              <button
                onClick={() => handleUnsubscribeUser(matchedRecord.email)}
                className="flex-1 min-w-37.5 bg-white border border-primary-bg-muted text-primary-bg hover:bg-page-bg font-medium text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <MailX size={13} /> Unsubscribe User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
