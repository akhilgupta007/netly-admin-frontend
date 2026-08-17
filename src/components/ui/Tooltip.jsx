"use client";

import React from "react";

/**
 * A small label that appears on hover or keyboard focus.
 *
 * Replaces the browser's native `title`, which waits about a second before
 * appearing, cannot be styled, and renders differently on every OS — none of
 * which suits an icon-only button, where the label is the only thing telling
 * you what the button does.
 *
 * ### Why `side` matters here
 *
 * A table that scrolls horizontally is wrapped in `overflow-x-auto`, and CSS
 * will not let one axis scroll while the other stays visible: `overflow-y`
 * computes to `auto` as well. Anything drawn above or below a row is therefore
 * clipped by that container, which is exactly where a tooltip on the first or
 * last row would go. `side="left"` keeps the label inside the row's own height,
 * so it survives — use it inside tables, and `"top"` elsewhere.
 *
 * @param {object} props - Options.
 * @param {string} props.label - Text to show. Also used as the accessible name.
 * @param {"top"|"bottom"|"left"|"right"} props.side - Where to place it.
 * @param {React.ReactNode} props.children - The trigger, usually a button.
 * @return {JSX.Element} The wrapped trigger.
 */
export default function Tooltip({ label, side = "top", children }) {
  if (!label) return children;

  const position = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  }[side];

  return (
    <span className="relative inline-flex group/tt">
      {children}
      <span
        role="tooltip"
        // pointer-events-none so the label cannot swallow the click it is
        // describing, and group-focus-within so it appears for keyboard users
        // too rather than only on hover.
        className={`pointer-events-none absolute z-30 whitespace-nowrap rounded-md bg-alt-bg px-2 py-1 text-[10px] font-medium text-white shadow-md opacity-0 scale-95 transition-all duration-150 group-hover/tt:opacity-100 group-hover/tt:scale-100 group-focus-within/tt:opacity-100 group-focus-within/tt:scale-100 ${position}`}
      >
        {label}
      </span>
    </span>
  );
}
