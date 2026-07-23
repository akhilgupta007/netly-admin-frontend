"use client";

import React from "react";
import { X, Check, Trash2, Flag, AlertOctagon } from "lucide-react";

export default function ReviewContentModal({ flag, isOpen, onClose, onAction }) {
  if (!isOpen || !flag) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-border-main shadow-xl overflow-hidden flex flex-col animate-scale-up">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-main">
          <h3 className="text- font-semibold text-text-primary">Review content</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 rounded-full bg-[#0F172A] text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 text-xs">
          {/* reported preview details card */}
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] text-text-muted font-medium block">Type</span>
              <span className="font-semibold text-text-primary block">{flag.type}</span>
            </div>

            <div className="bg-page-bg rounded-2xl p-3 space-y-1.5 border border-border-main/50">
              <span className="text-[10px] text-text-muted block">Reported content preview</span>
              <p className="text-xs text-text-primary leading-normal font-light">
                {flag.content}
              </p>
            </div>
          </div>

          {/* Split grid details row */}
          <div className="grid sm:grid-cols-3 sm:justify-between justify-center gap-2 border-t border-b border-border-main py-4 text-xs text-text-muted font-light">
            <div className="space-y-1">
              <span className="block text-[10px] text-text-muted">Reported by</span>
              <span className="block font-medium text-text-primary truncate">{flag.email || "reporter@clean.io"}</span>
            </div>
            <div className="space-y-1 sm:border-l border-border-main sm:pl-3">
              <span className="block text-[10px] text-text-muted">Date reported</span>
              <span className="block font-medium text-text-primary">{flag.date}</span>
            </div>
            <div className="space-y-1 sm:border-l border-border-main sm:pl-3">
              <span className="block text-[10px] text-text-muted">Subject email</span>
              <span className="block font-medium text-text-primary truncate">{flag.subjectEmail}</span>
            </div>
          </div>

          {/* Actions Button Stack */}
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={() => onAction("approve", flag)}
              className="bg-primary-bg hover:bg-primary-bg-muted text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition duration-150"
            >
              <Check size={14} /> Approve
            </button>

            <button
              onClick={() => onAction("remove", flag)}
              className="bg-white border border-red-500 text-red-500 hover:bg-red-50 font-medium py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition duration-150"
            >
              <Trash2 size={14} /> Remove Content
            </button>

            <button
              onClick={() => onAction("warn", flag)}
              className="bg-white border border-amber-500 text-amber-500 hover:bg-amber-50 font-medium py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition duration-150"
            >
              <Flag size={14} /> Warn user
            </button>

            <button
              onClick={() => onAction("suspend", flag)}
              className="bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition duration-150"
            >
              <AlertOctagon size={14} /> Suspend User
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
