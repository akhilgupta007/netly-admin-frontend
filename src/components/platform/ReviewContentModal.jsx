"use client";

import React from "react";
import { X, Check, Trash2, Flag, AlertOctagon } from "lucide-react";

export default function ReviewContentModal({ flag, isOpen, onClose, onAction }) {
  if (!isOpen || !flag) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-secondary-bg shadow-xl overflow-hidden flex flex-col animate-scale-up">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-bg">
          <h3 className="text-sm font-semibold text-text-primary">Review content</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-page-bg transition cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* reported preview details card */}
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] text-text-muted font-medium block">Type</span>
              <span className="font-semibold text-text-primary block">{flag.type}</span>
            </div>

            <div className="bg-page-bg/40 rounded-2xl p-4 space-y-1.5 border border-secondary-bg/50">
              <span className="text-[10px] text-text-muted font-medium block">Reported content preview</span>
              <p className="text-xs text-text-primary leading-normal font-light">
                {flag.content}
              </p>
            </div>
          </div>

          {/* Split grid details row */}
          <div className="grid grid-cols-3 gap-2 border-t border-b border-secondary-bg py-4 text-[10px] text-text-muted font-light">
            <div className="space-y-1">
              <span className="block text-[9px] font-medium text-text-muted/80">Reported by</span>
              <span className="block font-medium text-text-primary truncate">{flag.email || "reporter@clean.io"}</span>
            </div>
            <div className="space-y-1 border-l border-secondary-bg pl-3">
              <span className="block text-[9px] font-medium text-text-muted/80">Date reported</span>
              <span className="block font-medium text-text-primary">{flag.date}</span>
            </div>
            <div className="space-y-1 border-l border-secondary-bg pl-3">
              <span className="block text-[9px] font-medium text-text-muted/80">Subject email</span>
              <span className="block font-medium text-text-primary truncate">{flag.subjectEmail}</span>
            </div>
          </div>

          {/* Actions Button Stack */}
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={() => onAction("approve", flag)}
              className="bg-[#6FB5BD] hover:bg-[#5da0a8] text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition duration-150"
            >
              <Check size={14} /> Approve
            </button>

            <button
              onClick={() => onAction("remove", flag)}
              className="bg-white border border-red-500 text-red-500 hover:bg-red-50 font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition duration-150"
            >
              <Trash2 size={14} /> Remove Content
            </button>

            <button
              onClick={() => onAction("warn", flag)}
              className="bg-white border border-amber-500 text-amber-500 hover:bg-amber-50 font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition duration-150"
            >
              <Flag size={14} /> Warn user
            </button>

            <button
              onClick={() => onAction("suspend", flag)}
              className="bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition duration-150"
            >
              <AlertOctagon size={14} /> Suspend User
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
