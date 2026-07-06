import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getInitials(name) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  return parts.map(p => p[0]).join("").toUpperCase().substring(0, 2);
}
