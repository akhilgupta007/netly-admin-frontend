"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";

/**
 * Edits a category or sub-service.
 *
 * Both documents are bilingual and sub-services carry a description in each
 * language, but the panel only ever exposed the English name, so a French name
 * could be set once at creation and never corrected. That left "Food Bank"
 * reading "0 - 12 mois" to every French user with no way to fix it from here.
 *
 * Only changed fields are sent: renaming the English name rewrites the
 * denormalised name on every listing that points here, which is work worth
 * skipping when the edit was to a description.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.isOpen - Whether the dialog is shown.
 * @param {object} props.target - Row being edited, from the catalogue query.
 * @param {Function} props.onClose - Dismisses without saving.
 * @param {Function} props.onSave - Receives the changed fields only.
 * @param {boolean} props.isPending - True while the write is in flight.
 * @return {React.ReactElement|null} The dialog, or null when closed.
 */
export default function EditCatalogueModal({
  isOpen,
  target,
  onClose,
  onSave,
  isPending,
}) {
  const isSub = Boolean(target?.isSub);

  // Seeded once per row. The page gives this component a key derived from the
  // row, so opening a different one remounts it rather than carrying the
  // previous row's values over and renaming the wrong thing.
  const [name, setName] = useState(() => target?.name || "");
  const [frenchName, setFrenchName] = useState(() => target?.frenchName || "");
  const [message, setMessage] = useState(() => target?.message || "");
  const [frenchMessage, setFrenchMessage] = useState(
    () => target?.frenchMessage || "",
  );

  if (!isOpen || !target) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {
      name: name.trim(),
      frenchName: frenchName.trim(),
      message: message.trim(),
      frenchMessage: frenchMessage.trim(),
    };

    if (!next.name) {
      toast.error("An English name is required.");
      return;
    }
    // The backend refuses an empty French name — the apps are bilingual and the
    // row would render blank for French users.
    if (!next.frenchName) {
      toast.error("A French name is required.");
      return;
    }

    const changed = {};
    if (next.name !== (target.name || "")) changed.name = next.name;
    if (next.frenchName !== (target.frenchName || "")) {
      changed.frenchName = next.frenchName;
    }
    if (isSub) {
      if (next.message !== (target.message || "")) changed.message = next.message;
      if (next.frenchMessage !== (target.frenchMessage || "")) {
        changed.frenchMessage = next.frenchMessage;
      }
    }

    if (Object.keys(changed).length === 0) {
      onClose();
      return;
    }
    onSave(changed);
  };

  const field =
    "w-full bg-white border border-border-main text-xs rounded-lg p-3 " +
    "focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary " +
    "placeholder:text-text-muted/60";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-border-main shadow-xl overflow-hidden flex flex-col animate-scale-up">

        <div className="flex items-center justify-between p-4 border-b border-border-main">
          <h3 className="font-semibold text-text-primary">
            {isSub ? "Edit sub-service" : "Edit category"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 rounded-full bg-[#0F172A] text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 space-y-4 text-xs text-text-primary font-onest max-h-[70vh] overflow-y-auto"
        >
          <div className="space-y-1">
            <label htmlFor="cat-edit-name" className="text-xs text-text-primary block">
              English name <span className="text-red-500">*</span>
            </label>
            <input
              id="cat-edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={field}
              autoFocus
            />
            <span className="text-[10px] text-text-muted block mt-0.5">
              Renaming this also updates every provider listing that uses it.
            </span>
          </div>

          <div className="space-y-1">
            <label htmlFor="cat-edit-fr-name" className="text-xs text-text-primary block">
              French name <span className="text-red-500">*</span>
            </label>
            <input
              id="cat-edit-fr-name"
              type="text"
              value={frenchName}
              onChange={(e) => setFrenchName(e.target.value)}
              className={field}
            />
            <span className="text-[10px] text-text-muted block mt-0.5">
              Shown to French users in the apps.
            </span>
          </div>

          {isSub && (
            <>
              <div className="space-y-1">
                <label htmlFor="cat-edit-msg" className="text-xs text-text-primary block">
                  English description
                </label>
                <textarea
                  id="cat-edit-msg"
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g., Interior and exterior glass cleaning."
                  className={`${field} resize-y`}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="cat-edit-fr-msg" className="text-xs text-text-primary block">
                  French description
                </label>
                <textarea
                  id="cat-edit-fr-msg"
                  rows={2}
                  value={frenchMessage}
                  onChange={(e) => setFrenchMessage(e.target.value)}
                  placeholder="e.g., Nettoyage des vitres intérieures et extérieures."
                  className={`${field} resize-y`}
                />
              </div>
            </>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 hover:bg-page-bg bg-secondary-bg text-text-primary font-medium text-xs py-2.5 rounded-lg transition cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-primary-bg hover:bg-primary-bg-muted text-white font-medium text-xs py-2.5 rounded-lg transition cursor-pointer text-center shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
