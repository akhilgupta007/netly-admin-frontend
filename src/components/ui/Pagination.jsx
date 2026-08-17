"use client";

import React from "react";

/** Inclusive integer range. */
const range = (from, to) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

/** Marks a gap in the page list. Rendered as an ellipsis, not a button. */
const GAP = "gap";

/**
 * The page numbers to show, with gaps where numbers are skipped.
 *
 * Every page used to get a button, so an audit log with 22 pages rendered 22
 * of them and the row of controls ran the width of the table. The first page,
 * the last page and a window around the current one are what a reader needs;
 * the arrows cover stepping through the rest.
 *
 * @param {number} current - Current page, 1-based.
 * @param {number} total - Total pages.
 * @param {number} siblings - Pages shown either side of the current one.
 * @return {Array<number|string>} Page numbers interleaved with GAP markers.
 */
export function pageItems(current, total, siblings = 1) {
  // first + last + current + siblings either side + two gaps. Below this a gap
  // would replace as many numbers as it hides, so show them all.
  const maxSlots = siblings * 2 + 5;
  if (total <= maxSlots) return range(1, total);

  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, total);

  // A gap is only worth drawing when it hides more than one number.
  const gapLeft = left > 2;
  const gapRight = right < total - 1;
  const edgeCount = siblings * 2 + 3;

  if (!gapLeft && gapRight) return [...range(1, edgeCount), GAP, total];
  if (gapLeft && !gapRight) {
    return [1, GAP, ...range(total - edgeCount + 1, total)];
  }
  return [1, GAP, ...range(left, right), GAP, total];
}

export default function Pagination({ currentPage, itemsPerPage, totalItems, onPageChange }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between border-t border-border-main px-5 py-3 bg-white select-none rounded-b-3xl">
      <span className="text-[10px] text-text-muted font-medium">
        Showing {totalItems === 0 ? 0 : startItem}-{endItem} of {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous page"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          className="w-7 h-7 flex items-center justify-center border border-border-main rounded-lg hover:bg-page-bg transition disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-bold cursor-pointer"
        >
          &larr;
        </button>

        {pageItems(currentPage, totalPages).map((item, idx) =>
          item === GAP ? (
            <span
              key={`gap-${idx}`}
              aria-hidden="true"
              className="w-7 h-7 flex items-center justify-center text-[10px] font-semibold text-text-muted"
            >
              &hellip;
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-label={`Page ${item}`}
              aria-current={currentPage === item ? "page" : undefined}
              onClick={() => onPageChange(item)}
              className={`w-7 h-7 flex items-center justify-center border rounded-lg transition text-[10px] font-semibold cursor-pointer ${currentPage === item
                  ? "border-text-primary bg-text-primary text-white"
                  : "border-border-main hover:bg-page-bg text-text-muted"
                }`}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          aria-label="Next page"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          className="w-7 h-7 flex items-center justify-center border border-border-main rounded-lg hover:bg-page-bg transition disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-bold cursor-pointer"
        >
          &rarr;
        </button>
      </div>
    </div>
  );
}
