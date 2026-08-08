"use client";

import React from "react";
import { X } from "lucide-react";

/**
 * Shows a category or sub-service image at full size.
 *
 * Images are Firebase Storage URLs with a token in the query string, so they
 * are rendered with a plain <img>: next/image would need every storage host
 * whitelisted in next.config, and the token makes the URL unstable for the
 * optimiser's cache anyway.
 *
 * @param {object} props - Options.
 * @param {boolean} props.isOpen - Whether the dialog is shown.
 * @param {Function} props.onClose - Close handler.
 * @param {string} props.src - Image URL.
 * @param {string} props.title - Name of the category or sub-service.
 * @param {string} props.subtitle - Optional secondary line.
 * @return {JSX.Element|null} The dialog.
 */
export default function ImagePreviewModal({
  isOpen,
  onClose,
  src,
  title,
  subtitle,
  contentType,
}) {
  if (!isOpen) return null;

  // Attachments are not always images — dispute evidence can be a PDF, which
  // has to render in a frame rather than an <img>.
  const isPdf = String(contentType || "").includes("pdf") ||
    /\.pdf(\?|$)/i.test(src || "");
  const isImage = !isPdf &&
    (String(contentType || "").startsWith("image/") ||
      /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(src || ""));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-onest p-4">
      <div
        className="absolute inset-0 bg-alt-bg/50 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl z-10 border border-border-main animate-scale-up overflow-hidden">
        <div className="flex items-start justify-between p-4 border-b border-border-main gap-4">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {title || "Image"}
            </h3>
            {subtitle && (
              <p className="text-[10px] text-text-muted font-light truncate">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-text-muted hover:text-text-primary transition cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 bg-page-bg/40 flex items-center justify-center min-h-60">
          {!src ? (
            <span className="text-xs text-text-muted font-light">
              No file is stored for this item.
            </span>
          ) : isPdf ? (
            <iframe
              src={src}
              title={title || "Document"}
              className="w-full h-96 rounded-xl border border-border-main bg-white"
            />
          ) : isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={title || "Attachment"}
              className="max-h-96 w-auto max-w-full object-contain rounded-xl"
            />
          ) : (
            // An unknown type cannot be rendered inline; the link below opens it.
            <span className="text-xs text-text-muted font-light text-center">
              This file type cannot be previewed here.
              <br />
              Use &ldquo;Open original&rdquo; below to download it.
            </span>
          )}
        </div>

        {src && (
          <div className="px-4 py-3 border-t border-border-main flex justify-end">
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary-bg hover:underline"
            >
              Open original
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
