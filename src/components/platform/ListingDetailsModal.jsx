"use client";

import React from "react";
import { X } from "lucide-react";

export default function ListingDetailsModal({ listing, isOpen, onClose }) {
  if (!isOpen || !listing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-secondary-bg shadow-xl overflow-hidden flex flex-col animate-scale-up">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-bg">
          <h3 className="text-sm font-semibold text-text-primary">Listing details</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-page-bg transition cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Badges row */}
          <div className="flex items-center gap-1.5">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
              listing.status === "Active" ? "text-emerald-500 bg-emerald-50" : "text-red-500 bg-red-50"
            }`}>
              {listing.status}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-blue-500 bg-blue-50">
              {listing.pricing} Basis
            </span>
          </div>

          {/* Provider, Category, Area Split Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-b border-secondary-bg py-4 text-text-primary">
            <div className="space-y-1">
              <span className="text-[10px] text-text-muted font-light block">Provider</span>
              <strong className="font-semibold block text-text-primary">{listing.provider}</strong>
              <span className="text-[10px] text-text-muted font-light block break-all">{listing.email}</span>
            </div>

            <div className="space-y-1 md:border-l md:border-secondary-bg md:pl-4">
              <span className="text-[10px] text-text-muted font-light block">Category</span>
              <strong className="font-semibold block text-text-primary">{listing.category}</strong>
              <span className="text-[10px] text-text-muted font-light block">({listing.subCategory})</span>
            </div>

            <div className="space-y-1 md:border-l md:border-secondary-bg md:pl-4">
              <span className="text-[10px] text-text-muted font-light block">Service Area</span>
              <strong className="font-semibold block text-text-primary">{listing.serviceArea || "Not Specified"}</strong>
            </div>
          </div>

          {/* Description section */}
          <div className="bg-page-bg/40 rounded-2xl p-4 space-y-1.5 border border-secondary-bg/50">
            <span className="text-[10px] text-text-muted font-medium block">Description</span>
            <p className="text-xs text-text-primary leading-relaxed font-light">
              {listing.description}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
