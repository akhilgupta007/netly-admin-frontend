"use client";

import React from "react";
import { X, ShieldAlert, Key, GitMerge } from "lucide-react";
import { toast } from "react-toastify";
import { getInitials } from "@/lib/utils";

export default function ClientDetailModal({ client, isOpen, onClose, onSuspendBanTrigger, onReactivateTrigger }) {
  if (!isOpen || !client) return null;

  // Mock static booking history list for clients matching layout (Slide 5 & 6)
  const recentBookings = [
    { category: "Post-Construction", date: "Jun 22, 2027", amount: 95.00, status: "Refund Requested", statusClass: "bg-blue-50 text-blue-600" },
    { category: "Move-Out", date: "Jun 22, 2027", amount: 95.00, status: "Completed", statusClass: "bg-emerald-50 text-emerald-600" },
    { category: "Office Daily", date: "Jun 22, 2027", amount: 95.00, status: "In Progress", statusClass: "bg-orange-50 text-orange-600" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-onest">
      <div className="absolute inset-0 bg-alt-bg/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-3xl max-w-2xl w-full p-4 shadow-2xl z-10 border border-secondary-bg animate-scale-up mx-4 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-2 mb-4 border-b border-border-main shrink-0">
          <h3 className="font-semibold text-text-primary">Client Detail</h3>
          <button 
            onClick={onClose} 
            className="w-5 h-5 rounded-full bg-alt-bg text-white flex items-center justify-center hover:opacity-90 cursor-pointer text-xs"
          >
            <X size={12} />
          </button>
        </div>

        {/* Inner scrollable wrapper */}
        <div className="space-y-4 overflow-y-auto pr-2 flex-1 scrollbar-thin">
          
          {/* User metadata header box */}
          <div className="bg-page-bg rounded-2xl p-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary-bg-muted text-white flex items-center justify-center text-xs font-light">
              {getInitials(client.name)}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text-primary">{client.name}</h4>
              <p className="text-xs text-text-muted font-light">{client.email}</p>
            </div>
          </div>

          {/* Details layout with vertical column dividers (x-axis separators) */}
          <div className="pb-4 space-y-4">
            <div className="grid grid-cols-3 divide-x divide-border-main text-xs">
              <div className="pr-4">
                <span className="text-[10px] text-text-muted block font-light">Email Address</span>
                <strong className="text-text-primary font-normal block mt-0.5 break-all">{client.email}</strong>
              </div>
              <div className="px-4">
                <span className="text-[10px] text-text-muted block font-light">Phone</span>
                <strong className="text-text-primary font-normal block mt-0.5">+233 24 123 4567</strong>
              </div>
              <div className="pl-4">
                <span className="text-[10px] text-text-muted block font-light">Joined</span>
                <strong className="text-text-primary font-normal block mt-0.5">{client.joinDate || "Jan 12, 2027"}</strong>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-border-main text-xs">
              <div className="pr-4">
                <span className="text-[10px] text-text-muted block font-light">Wallet</span>
                <strong className="text-text-primary font-semibold block mt-0.5">${parseFloat(client.wallet || 0).toFixed(2)}</strong>
              </div>
              <div className="px-4">
                <span className="text-[10px] text-text-muted block font-light">OTP</span>
                <strong className="text-text-primary font-normal block mt-0.5">{client.otp || "Verified"}</strong>
              </div>
              <div className="pl-4">
                <span className="text-[10px] text-text-muted block font-light">Status</span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] mt-1 ${
                  client.status === "Active" 
                    ? "bg-emerald-50 text-emerald-600" 
                    : client.status === "Pending Verification"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-red-50 text-red-600"
                }`}>
                  {client.status}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Bookings section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-muted text-[10px]">Recent Bookings (21)</span>
              <button 
                onClick={() => toast.info("Viewing all client bookings...")}
                className="text-primary-bg hover:underline font-light text-[10px]"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-secondary-bg">
              {recentBookings.map((b, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 text-xs">
                  <div>
                    <span className="font-semibold text-text-primary block">{b.category}</span>
                    <span className="text-[10px] text-text-muted font-light">{b.date}</span>
                  </div>
                  <div className="flex items-center gap-3.5">
                    <strong className="text-text-primary font-semibold">${b.amount.toFixed(2)}</strong>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] ${b.statusClass}`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suspension History Log Banner (Conditional, Slide 6) */}
          {client.status === "Suspended" && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex justify-between items-center text-[10px] text-text-primary leading-snug animate-fade-in">
              <div className="flex gap-2">
                <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={14} />
                <div>
                  <span className="font-semibold block text-red-700">Jun 10, 2027</span>
                  <p className="text-text-primary font-light">Multiple payment disputes filed without evidence.</p>
                </div>
              </div>
              <span className="text-[10px] text-text-muted font-medium shrink-0 ml-4">By Admin A</span>
            </div>
          )}

          {/* Moderate stacked action controls */}
          <div className="space-y-2 pt-2">
            {["Suspended", "Banned"].includes(client.status) ? (
              <button
                onClick={() => onReactivateTrigger(client.id)}
                className="w-full bg-primary-bg hover:opacity-90 text-white font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                ✓ Reactivate Account
              </button>
            ) : (
              <button
                onClick={() => onSuspendBanTrigger(client)}
                className="w-full bg-white border border-red-200 text-red-500 hover:bg-red-50 font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                🚫 Suspend/Ban Account
              </button>
            )}

            <button
              onClick={() => toast.success(`Password reset email successfully sent to ${client.name}!`)}
              className="w-full bg-white border border-primary-bg-muted text-primary-bg hover:bg-page-bg font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Key size={14} /> Reset Password
            </button>

            <button
              onClick={() => toast.info("Initializing account duplication merges tool...")}
              className="w-full bg-white border border-primary-bg-muted text-primary-bg hover:bg-page-bg font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <GitMerge size={14} /> Merge Duplicate Accounts
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
