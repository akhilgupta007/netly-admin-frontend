"use client";

import React from "react";
import { X, Download, AlertTriangle } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { exportPDF } from "@/utils/exportHelper";

/**
 * Netly's own details as the payer on a slip.
 *
 * The business number is deliberately absent rather than invented. A T4A is
 * filed against a real CRA payroll account, and a made-up number on a document
 * headed "T4A" is the kind of thing that gets submitted by mistake. Set this
 * once the account exists.
 */
const PAYER = {
  name: "Netly Technologies Inc.",
  businessNumber: null,
};

/**
 * Preview of one provider's T4A figures, and the PDF export.
 *
 * Every amount here comes from generateT4AReport. The previous version showed
 * a fixed $12,840.00 for every provider and the Download button only raised a
 * toast — nothing was ever produced.
 *
 * @param {object} props - Options.
 * @param {object} props.slip - Row from the generated report.
 * @param {Function} props.onClose - Close handler.
 * @return {JSX.Element} The dialog.
 */
export default function T4APreviewModal({ slip, onClose }) {
  const money = (n) =>
    typeof n === "number" ?
      `$${n.toLocaleString("en-CA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}` :
      "—";

  const name = slip.provider || "Provider";
  const year = slip.taxYear || "—";
  const warnings = slip.warnings || [];

  const rows = [
    ["Recipient name", name],
    ["Recipient email", slip.email || "—"],
    ["SIN (last 3)", slip.sinLast3 ? `••• ••• ${slip.sinLast3}` : "Not on file"],
    ["Business number", slip.businessNumber || "—"],
    ["Province", slip.province || "—"],
    ["Tax year", String(year)],
    ["Jobs completed", String(slip.jobs ?? "—")],
    ["Box 048 — fees for services", money(slip.amount)],
    ["Box 020 — self-employed commissions", money(0)],
    ["Gross billed to clients", money(slip.grossBilled)],
    ["Platform commission", money(slip.platformCommission)],
    ["Payer name", PAYER.name],
    ["Payer business number", PAYER.businessNumber || "Not configured"],
  ];

  const handleDownload = () => {
    const safeName = name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    exportPDF(
        `T4A ${year} — ${name}`,
        ["Field", "Value"],
        [
          ...rows,
          ["", ""],
          ["Status", warnings.length ? "NOT FILABLE" : "Ready to file"],
          ...warnings.map((w) => ["Warning", w]),
          ["", ""],
          ["Note", "System-generated preview. Not an official CRA slip."],
        ],
        `t4a-${year}-${safeName}.pdf`,
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-border-main shadow-xl overflow-hidden flex flex-col animate-scale-up max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-main shrink-0">
          <h3 className="text-sm font-semibold text-text-primary">T4A Preview</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 rounded-full bg-[#0F172A] text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 space-y-4 text-xs overflow-y-auto">

          {/* User profile banner row */}
          <div className="bg-page-bg rounded-2xl p-3 border border-border-main/50 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-bg-muted text-white flex items-center justify-center text-[10px] font-light">
              {getInitials(name)}
            </div>
            <strong className="text-sm font-semibold text-text-primary">{name}</strong>
          </div>

          {warnings.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                <AlertTriangle size={13} />
                This slip cannot be filed yet
              </div>
              <ul className="list-disc pl-5 text-[10px] text-amber-700 font-light space-y-0.5">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Statement details box layout */}
          <div className="border border-border-main rounded-2xl bg-white shadow-2xs">
            <div className="border-b border-border-main pb-2 bg-page-bg p-3">
              <h4 className="text-text-primary text-xs tracking-wide">
                T4A Statement of Pension, Retirement, Annuity, and Other Income
              </h4>
              <span className="text-[10px] text-text-muted font-light block mt-0.5">Tax year {year}</span>
            </div>

            <div className="space-y-2.5 text-xs p-3">
              {rows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-text-muted font-light shrink-0">{label}</span>
                  <strong
                    className={`font-normal text-right ${
                      value === "Not configured" || value === "Not on file" ?
                        "text-amber-600" :
                        "text-text-primary"
                    }`}
                  >
                    {value}
                  </strong>
                </div>
              ))}
            </div>

            <p className="p-3 border-t border-page-bg text-[10px] text-text-primary leading-relaxed">
              System-generated preview of the figures Netly holds. It is not an
              official CRA slip and is not filed by downloading it.
            </p>
          </div>

          <button
            onClick={handleDownload}
            className="w-full bg-primary-bg hover:opacity-90 text-white font-medium text-xs py-2.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Download size={13} /> Download PDF
          </button>

        </div>
      </div>
    </div>
  );
}
