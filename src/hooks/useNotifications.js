"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminNotificationsFromFirestore } from "@/services/firestoreServices";
import { useAuthStore } from "@/store/useAuthStore";

/** localStorage key holding the read watermark, per admin. */
const STORAGE_PREFIX = "netly:notifications:read:";

/**
 * Reads the stored watermark.
 *
 * Two things are kept: a timestamp, which marks everything older as read, and
 * a set of ids dismissed individually. The timestamp alone would not cover an
 * item read out of order; the id list alone would grow forever.
 *
 * @param {string} uid - Admin uid.
 * @return {{seenAt: number, seenIds: Array<string>}} The watermark.
 */
function readWatermark(uid) {
  if (typeof window === "undefined" || !uid) return { seenAt: 0, seenIds: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + uid);
    if (!raw) return { seenAt: 0, seenIds: [] };
    const parsed = JSON.parse(raw);
    return {
      seenAt: Number(parsed.seenAt) || 0,
      seenIds: Array.isArray(parsed.seenIds) ? parsed.seenIds : [],
    };
  } catch (_) {
    // Corrupt or unparseable — treat as nothing read rather than crashing the
    // header on every route.
    return { seenAt: 0, seenIds: [] };
  }
}

/**
 * Persists the watermark.
 *
 * @param {string} uid - Admin uid.
 * @param {{seenAt: number, seenIds: Array<string>}} value - What to store.
 * @return {void}
 */
function writeWatermark(uid, value) {
  if (typeof window === "undefined" || !uid) return;
  try {
    window.localStorage.setItem(
        STORAGE_PREFIX + uid,
        // Capped: anything older than the timestamp is already covered by it,
        // so the id list only needs to hold recent out-of-order reads.
        JSON.stringify({ ...value, seenIds: value.seenIds.slice(0, 200) }),
    );
  } catch (_) {
    // Private browsing or a full quota. Read state is a convenience, not data
    // worth failing over.
  }
}

/**
 * The header's notification feed.
 *
 * Read state is per-admin and lives in localStorage, so it does not survive a
 * different browser — which is the accepted trade for not writing a document
 * on every glance at the bell.
 *
 * @param {object} options - Extra react-query options.
 * @return {object} Feed, unread count, and the read actions.
 */
export function useNotifications(options = {}) {
  const uid = useAuthStore((s) => s.uid);

  // Initialised from storage once. Subsequent updates go through setState so
  // the badge re-renders, with storage written alongside.
  const [watermark, setWatermark] = useState(() => readWatermark(uid));
  const [watermarkUid, setWatermarkUid] = useState(uid);

  // The uid arrives after hydration, and can change if an admin signs out and
  // another signs in. Adjusting during render rather than in an effect avoids
  // a pass where one admin briefly sees another's read state.
  if (uid !== watermarkUid) {
    setWatermarkUid(uid);
    setWatermark(readWatermark(uid));
  }

  const query = useQuery({
    queryKey: ["adminNotifications"],
    queryFn: () => fetchAdminNotificationsFromFirestore({ max: 50 }),
    enabled: Boolean(uid),
    // These are operational queues, not a live chat. A minute is fresh enough
    // and keeps the header off the read path of every navigation.
    //
    // The list only ever contains work that is still outstanding, so an item
    // disappears as soon as it is dealt with. Any successful mutation
    // invalidates this query (see QueryProvider), which covers actions taken
    // in this tab; the interval and the focus refetch cover another admin
    // clearing the same queue elsewhere.
    staleTime: 60_000,
    refetchInterval: 120_000,
    refetchOnWindowFocus: true,
    ...options,
  });

  const items = useMemo(() => {
    const list = query.data ?? [];
    const seen = new Set(watermark.seenIds);
    return list.map((n) => ({
      ...n,
      isRead: seen.has(n.id) || (n.at > 0 && n.at <= watermark.seenAt),
    }));
  }, [query.data, watermark]);

  const unreadCount = items.filter((n) => !n.isRead).length;

  const markAllRead = useCallback(() => {
    const next = { seenAt: Date.now(), seenIds: [] };
    setWatermark(next);
    writeWatermark(uid, next);
  }, [uid]);

  const markRead = useCallback(
      (id) => {
        setWatermark((prev) => {
          if (prev.seenIds.includes(id)) return prev;
          const next = { ...prev, seenIds: [id, ...prev.seenIds] };
          writeWatermark(uid, next);
          return next;
        });
      },
      [uid],
  );

  return {
    ...query,
    notifications: items,
    unreadCount,
    markAllRead,
    markRead,
    isFetching: query.isFetching,
  };
}
