"use client";

import React from "react";

export default function Pagination({ currentPage, itemsPerPage, totalItems, onPageChange }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between border-t border-secondary-bg px-5 py-3 bg-white select-none">
      <span className="text-[10px] text-text-muted font-medium">
        Showing {totalItems === 0 ? 0 : startItem}-{endItem} of {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          className="w-7 h-7 flex items-center justify-center border border-secondary-bg rounded-lg hover:bg-page-bg transition disabled:opacity-50 text-[10px] font-bold cursor-pointer"
        >
          &larr;
        </button>
        {Array.from({ length: totalPages }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => onPageChange(idx + 1)}
            className={`w-7 h-7 flex items-center justify-center border rounded-lg transition text-[10px] font-semibold cursor-pointer ${
              currentPage === idx + 1
                ? "border-text-primary bg-text-primary text-white"
                : "border-secondary-bg hover:bg-page-bg text-text-muted"
            }`}
          >
            {idx + 1}
          </button>
        ))}
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          className="w-7 h-7 flex items-center justify-center border border-secondary-bg rounded-lg hover:bg-page-bg transition disabled:opacity-50 text-[10px] font-bold cursor-pointer"
        >
          &rarr;
        </button>
      </div>
    </div>
  );
}
