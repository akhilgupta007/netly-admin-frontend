"use client";

import React from "react";

/**
 * A single shimmering placeholder block.
 *
 * @param {object} props - Options.
 * @param {string} props.className - Tailwind sizing/spacing classes.
 * @return {JSX.Element} The placeholder.
 */
export function Skeleton({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`block rounded-md bg-secondary-bg/70 animate-pulse ${className}`}
    />
  );
}

/**
 * Placeholder rows for a table body, sized to the real column count.
 *
 * Shaped like the data it replaces so the layout does not jump when the rows
 * arrive — a centred "Loading…" line collapses the table height and then
 * snaps back, which reads as a flash of broken layout.
 *
 * @param {object} props - Options.
 * @param {number} props.columns - Number of columns in the table.
 * @param {number} props.rows - Number of placeholder rows.
 * @param {boolean} props.firstColAvatar - Render an avatar block in column one.
 * @return {JSX.Element} Placeholder rows.
 */
export function TableSkeleton({ columns, rows = 6, firstColAvatar = false }) {
  // Varying widths look like real content rather than a uniform grid.
  const widths = ["w-24", "w-32", "w-20", "w-28", "w-16", "w-24", "w-20"];

  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-t border-border-main/60">
          {Array.from({ length: columns }).map((_, c) => (
            <td key={c} className="px-4 py-3.5">
              {firstColAvatar && c === 0 ? (
                <span className="flex items-center gap-1.5">
                  <Skeleton className="w-7 h-7 rounded-md shrink-0" />
                  <Skeleton className="h-3 w-24" />
                </span>
              ) : (
                <Skeleton
                  className={`h-3 ${widths[(r + c) % widths.length]} max-w-full`}
                />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * Placeholder for a metric card row.
 *
 * @param {object} props - Options.
 * @param {number} props.count - Number of cards.
 * @return {JSX.Element} Placeholder cards.
 */
export function CardSkeleton({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-3xl border border-border-main p-4 space-y-3 h-32 flex flex-col justify-center"
        >
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-2 w-36" />
        </div>
      ))}
    </>
  );
}

/**
 * Placeholder for a chart panel.
 *
 * @param {object} props - Options.
 * @param {number} props.bars - Number of placeholder bars.
 * @param {string} props.height - Tailwind height for the plot area.
 * @return {JSX.Element} The placeholder chart.
 */
export function ChartSkeleton({ bars = 7, height = "h-40" }) {
  // A fixed pattern rather than random heights, so it does not reshuffle on
  // every re-render while loading.
  const pattern = [55, 80, 42, 68, 90, 50, 72, 38, 84, 60, 46, 76];

  return (
    <div className="bg-white rounded-3xl border border-border-main p-4 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-page-bg">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className={`flex items-end justify-between gap-2 ${height} px-2`}>
        {Array.from({ length: bars }).map((_, i) => (
          <span key={i} className="flex-1 flex flex-col justify-end h-full">
            <Skeleton
              className="w-full rounded-t-md rounded-b-none"
              // Inline height because Tailwind cannot generate arbitrary
              // percentages from a runtime value.
              style={{ height: `${pattern[i % pattern.length]}%` }}
            />
          </span>
        ))}
      </div>
      <div className="flex justify-between gap-2 px-2">
        {Array.from({ length: bars }).map((_, i) => (
          <Skeleton key={i} className="h-2 w-8" />
        ))}
      </div>
    </div>
  );
}

/**
 * Placeholder rows for a panel where the table itself is not rendered while
 * loading, so a <tr>-based skeleton has nowhere to live.
 *
 * @param {object} props - Options.
 * @param {number} props.rows - Number of placeholder rows.
 * @param {number} props.columns - Columns to suggest per row.
 * @param {boolean} props.firstColAvatar - Render an avatar block in column one.
 * @return {JSX.Element} The placeholder panel.
 */
export function ListSkeleton({ rows = 6, columns = 5, firstColAvatar = true }) {
  const widths = ["w-24", "w-32", "w-20", "w-28", "w-16", "w-24"];

  return (
    <div className="bg-white divide-y divide-secondary-bg min-h-80">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: columns }).map((_, c) =>
            firstColAvatar && c === 0 ? (
              <span key={c} className="flex items-center gap-1.5 flex-1 min-w-0">
                <Skeleton className="w-7 h-7 rounded-md shrink-0" />
                <Skeleton className="h-3 w-24" />
              </span>
            ) : (
              <span key={c} className="flex-1 min-w-0">
                <Skeleton
                  className={`h-3 ${widths[(r + c) % widths.length]} max-w-full`}
                />
              </span>
            ),
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * A thin progress bar shown while a background refetch is in flight.
 *
 * react-query serves cached rows during a refetch, so without this the table
 * silently shows stale data and then swaps it — which looks like a glitch. This
 * marks the window as "updating" instead.
 *
 * @param {object} props - Options.
 * @param {boolean} props.active - Whether a refetch is in flight.
 * @return {JSX.Element|null} The indicator, or nothing when idle.
 */
export function RefreshingBar({ active }) {
  if (!active) return null;
  return (
    <div
      role="status"
      aria-label="Updating"
      className="absolute inset-x-0 top-0 h-0.5 overflow-hidden rounded-t-3xl z-30"
    >
      <span className="block h-full w-1/3 bg-primary-bg animate-refresh-sweep" />
    </div>
  );
}
