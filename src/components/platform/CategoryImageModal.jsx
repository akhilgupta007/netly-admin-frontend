"use client";

import React, { useState } from "react";
import { X, Upload, Loader2, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "react-toastify";
import { readImageForUpload } from "@/lib/imageFile";

/** Category tiles are square in the apps; 800px is plenty for a phone. */
const MAX_EDGE = 800;

/**
 * Changes the picture on a category or sub-service.
 *
 * Split from the add/edit forms because changing a picture is what an admin
 * usually comes here to do on an existing row — the name and French name are
 * set once and rarely touched, and making someone open a full edit form to
 * swap an image is the reason none of them have one.
 *
 * @param {object} props - Options.
 * @param {boolean} props.isOpen - Whether the dialog is shown.
 * @param {object} props.target - {name, image, isSub, parentName}.
 * @param {Function} props.onClose - Close handler.
 * @param {Function} props.onSave - Receives {imageBase64, imageContentType} or
 *   {image: ""} to clear it.
 * @param {boolean} props.isPending - True while the write is in flight.
 * @return {JSX.Element|null} The dialog.
 */
export default function CategoryImageModal({
  isOpen,
  target,
  onClose,
  onSave,
  isPending = false,
}) {
  const [picked, setPicked] = useState(null);
  const [isReading, setIsReading] = useState(false);
  const [clear, setClear] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Re-seed when reopened on a different row, during render rather than in an
  // effect so the previous row's picture is never shown for a frame.
  const [lastKey, setLastKey] = useState(null);
  const key = target ? `${target.parentName || ""}/${target.name}` : null;
  if (key !== lastKey) {
    setLastKey(key);
    setPicked(null);
    setClear(false);
  }

  if (!isOpen || !target) return null;

  const accept = async (file) => {
    if (!file) return;
    setIsReading(true);
    try {
      setPicked(await readImageForUpload(file, { maxEdge: MAX_EDGE }));
      setClear(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsReading(false);
    }
  };

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    await accept(file);
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setDragging(false);
    await accept(e.dataTransfer.files?.[0]);
  };

  const shown = picked?.dataUrl || (clear ? "" : target.image || "");

  const submit = () => {
    if (isPending) return;
    if (picked) {
      onSave({
        imageBase64: picked.dataUrl,
        imageContentType: picked.contentType,
      });
      return;
    }
    if (clear) {
      onSave({ image: "" });
      return;
    }
    toast.info("Pick a new image first, or remove the current one.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-onest p-4">
      <div
        className="absolute inset-0 bg-alt-bg/40 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl w-full max-w-sm shadow-2xl z-10 border border-border-main animate-scale-up">
        <div className="flex items-start justify-between p-4 border-b border-border-main gap-4">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {target.image ? "Change image" : "Add image"}
            </h3>
            <p className="text-[10px] text-text-muted font-light truncate">
              {target.parentName ?
                `${target.parentName} › ${target.name}` :
                target.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-text-primary text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`block rounded-2xl border-2 border-dashed transition cursor-pointer overflow-hidden ${
              dragging ?
                "border-primary-bg bg-primary-bg/5" :
                "border-border-main hover:border-primary-bg/60 bg-page-bg/40"
            }`}
          >
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onPick}
              className="hidden"
            />
            <div className="h-44 flex flex-col items-center justify-center gap-2">
              {isReading ? (
                <Loader2 size={20} className="animate-spin text-text-muted" />
              ) : shown ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={shown}
                  alt=""
                  className="max-h-40 w-auto max-w-full object-contain"
                />
              ) : (
                <>
                  <ImageIcon size={22} className="text-text-muted" />
                  <span className="text-[11px] text-text-muted font-light">
                    Drop an image here, or click to browse
                  </span>
                </>
              )}
            </div>
          </label>

          <p className="text-[10px] text-text-muted font-light text-center">
            {picked ?
              "New image selected — press Save to apply it." :
              clear ?
                "The image will be removed when you save." :
                "PNG, JPEG or WebP. Resized to 800px before upload."}
          </p>

          {(picked || (target.image && !clear)) && (
            <button
              type="button"
              onClick={() => (picked ? setPicked(null) : setClear(true))}
              className="w-full text-[11px] text-text-muted hover:text-red-500 transition cursor-pointer flex items-center justify-center gap-1"
            >
              <Trash2 size={12} />
              {picked ? "Discard selection" : "Remove current image"}
            </button>
          )}
        </div>

        <div className="flex gap-2 p-4 border-t border-border-main">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 bg-white border border-border-main text-text-primary hover:bg-page-bg font-semibold text-xs py-2.5 rounded-lg transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isPending || isReading || (!picked && !clear)}
            className="flex-1 bg-primary-bg hover:bg-primary-bg-muted text-white font-semibold text-xs py-2.5 rounded-lg transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {isPending && <Loader2 size={13} className="animate-spin" />}
            {isPending ? "Saving…" : "Save image"}
          </button>
        </div>
      </div>
    </div>
  );
}
