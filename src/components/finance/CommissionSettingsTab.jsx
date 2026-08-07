"use client";

import React, { useState } from "react";
import { Edit3 } from "lucide-react";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import EditRatesModal from "./EditRatesModal";
import { useCommissionSettings, useFeeHistory } from "@/hooks/useCatalogue";
import { updateCommissionSettings } from "@/lib/callables";

export default function CommissionSettingsTab() {
  const queryClient = useQueryClient();
  const { settings, isLoading, isError } = useCommissionSettings();
  const { history } = useFeeHistory();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Stored as fractions, shown as percentages.
  const clientFee = settings ? Math.round(settings.clientFeePercent * 10000) / 100 : 0;
  const providerCommission = settings ?
    Math.round(settings.providerFeePercent * 10000) / 100 :
    0;


  const saveRates = useMutation({
    mutationFn: updateCommissionSettings,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["commissionSettings"] });
      queryClient.invalidateQueries({ queryKey: ["feeHistory"] });
      setIsEditModalOpen(false);
      const e = result?.example;
      toast.success(
          e ?
            `Rates updated. A $100 job now charges $${e.clientPays} and pays $${e.providerReceives}.` :
            "Rates updated.",
      );
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSaveRates = (data) => {
    // The UI works in percentages; the backend takes fractions.
    saveRates.mutate({
      clientFeePercent: Number(data.clientFee) / 100,
      providerFeePercent: Number(data.providerCommission) / 100,
      reason: data.reason,
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-border-main p-8 min-h-60 flex items-center justify-center animate-scale-up">
        <span className="text-xs text-text-muted animate-pulse font-light">Loading current rates…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-3xl border border-border-main p-8 min-h-60 flex flex-col items-center justify-center space-y-2 animate-scale-up">
        <h3 className="text-sm font-semibold text-text-primary">Could not load fee settings</h3>
        <p className="text-xs text-text-muted font-light">Check your connection and refresh.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-scale-up">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* LEFT COLUMN: CURRENT RATES CARD */}
        <div className="bg-white rounded-3xl p-4 space-y-4 hover:shadow-xs h-min">
          <div className="flex justify-between items-center pb-2 shrink-0">
            <div>
              <span className="text-sm font-semibold text-text-primary block">Current Rates</span>
              <span className="text-[10px] text-text-muted font-light block">
                {settings?.isDefault ?
                  "Platform defaults — never edited" :
                  `Updated ${settings?.updatedAt}${settings?.updatedByEmail ? ` by ${settings.updatedByEmail}` : ""}`}
              </span>
            </div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="border border-primary-bg-muted hover:border-primary-bg text-primary-bg font-semibold text-sm px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 size={16} /> Edit Rates
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Client platform fee */}
            <div className="bg-page-bg rounded-2xl p-4 flex flex-col justify-between">
              <div className="text-xs text-text-primary font-medium block">Client platform fee</div>
              <div>
                <strong className="text-2xl text-emerald-500 font-semibold block pt-3">{clientFee}%</strong>
                <div className="text-[9px] text-text-muted font-light">Added to service price at checkout</div>
              </div>
            </div>

            {/* Provider commission */}
            <div className="bg-page-bg rounded-2xl p-4 flex flex-col justify-between">
              <div className="text-xs text-text-primary font-medium block">Provider commission</div>
              <div>
                <strong className="text-2xl text-red-500 font-semibold block pt-3">{providerCommission}%</strong>
                <div className="text-[9px] text-text-muted font-light">Deducted from provider gross payout</div>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: RATE CHANGE HISTORY TIMELINE */}
        <div className="bg-white rounded-3xl p-4 space-y-4 hover:shadow-xs">
          <span className="text-sm font-semibold text-text-primary block pb-2">Rate Change History</span>
          
          {history.length === 0 && (
            <p className="text-xs text-text-muted font-light">
              No rate changes recorded yet. The rates in force are the platform defaults.
            </p>
          )}

          <div className="space-y-4 relative pl-3.5 before:absolute before:left-1.25 before:top-1.5 before:bottom-1.5 before:w-[1.5px] before:bg-primary-bg-muted divide-y divide-border-main">
            {history.map((log, idx) => (
              <div key={idx} className="relative text-xs space-y-1 pl-2 flex gap-5">
                <span className="absolute -left-3.5 top-0.5 h-2.5 w-2.5 rounded-full bg-primary-bg" />
                <span className="text-text-primary block">{log.date}</span>
                <div>
                  <span className="text-text-primary block">{log.details}</span>
                  {log.previous && (
                    <span className="text-text-muted font-light block text-[10px]">{log.previous}</span>
                  )}
                  {log.reason && (
                    <p className="text-text-primary block pb-2">&ldquo;{log.reason}&rdquo;</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Edit Rates Modal overlay */}
      {isEditModalOpen && (
        <EditRatesModal
          currentClientFee={clientFee}
          currentProviderCommission={providerCommission}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveRates}
        />
      )}
    </div>
  );
}
