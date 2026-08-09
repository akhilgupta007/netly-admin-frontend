"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  Bell,
  CheckCheck,
  FileCheck2,
  Loader2,
  Scale,
  Wallet,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

/** Icon and accent per notification kind. */
const KIND_STYLE = {
  dispute: { Icon: Scale, tone: "text-red-600 bg-red-50" },
  refund: { Icon: Wallet, tone: "text-amber-600 bg-amber-50" },
  withdrawal: { Icon: Banknote, tone: "text-blue-600 bg-blue-50" },
  kyc: { Icon: FileCheck2, tone: "text-violet-600 bg-violet-50" },
  payout: { Icon: AlertTriangle, tone: "text-red-600 bg-red-50" },
};

/**
 * Renders a timestamp as an age.
 *
 * @param {number} ms - Epoch milliseconds.
 * @return {string} e.g. "3h ago".
 */
function timeAgo(ms) {
  if (!ms) return "";
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/**
 * The header bell: unread count, dropdown, and per-item navigation.
 *
 * Everything listed is something waiting on an admin decision, so each row
 * links to the screen where that decision is made.
 *
 * @return {JSX.Element} The bell and its dropdown.
 */
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const router = useRouter();

  const {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
    isLoading,
    isError,
  } = useNotifications();

  // Close on an outside click or Escape. Without this the panel stays open
  // behind whatever the admin clicks next.
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleOpen = (item) => {
    markRead(item.id);
    setOpen(false);
    if (item.href) router.push(item.href);
  };

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={open}
        className="relative p-2.5 sm:p-3 rounded-xl border border-border-main text-text-primary bg-primary-bg/10 hover:bg-secondary-bg transition cursor-pointer"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-border-main z-50 overflow-hidden animate-scale-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-main">
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Notifications
              </p>
              <p className="text-[10px] text-text-muted font-light">
                {unreadCount > 0
                  ? `${unreadCount} awaiting your attention`
                  : "You are all caught up"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[10px] text-primary-bg hover:underline cursor-pointer"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-xs text-text-muted">
                <Loader2 size={14} className="animate-spin" />
                Loading
              </div>
            ) : isError ? (
              <p className="px-4 py-10 text-xs text-text-muted font-light text-center">
                Notifications could not be loaded.
              </p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-10 text-xs text-text-muted font-light text-center">
                Nothing needs your attention right now.
              </p>
            ) : (
              notifications.map((n) => {
                const { Icon, tone } =
                  KIND_STYLE[n.kind] || KIND_STYLE.withdrawal;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleOpen(n)}
                    className={`w-full flex gap-3 px-4 py-3 text-left border-b border-border-main/60 last:border-0 hover:bg-page-bg/60 transition cursor-pointer ${
                      n.isRead ? "" : "bg-primary-bg/5"
                    }`}
                  >
                    <span
                      className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${tone}`}
                    >
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-xs font-medium text-text-primary truncate">
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-red-500" />
                        )}
                      </span>
                      <span className="block text-[11px] text-text-muted font-light line-clamp-2 mt-0.5">
                        {n.message}
                      </span>
                      <span className="block text-[10px] text-text-muted/70 mt-1">
                        {timeAgo(n.at)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
