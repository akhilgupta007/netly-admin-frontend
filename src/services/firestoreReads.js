import {
  db,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "@/lib/firebase";

/**
 * Shared read primitives for the admin panel.
 *
 * All mutations go through Cloud Functions in netly-functions; this module is
 * the read side only, using the modular Firebase web SDK directly.
 *
 * The core problem it solves: the previous implementation ran one
 * `getDocs(collection(users/{uid}/provider))` per user — a collection scan each,
 * so 200 providers meant 201 round trips. Schema v3.0 fixes the document id to
 * the uid, which lets us fetch every profile in a single collectionGroup query
 * and join in memory.
 */

/**
 * Formats a Timestamp as a short date.
 * @param {*} timestamp - Firestore Timestamp, Date, string or number.
 * @return {string} Formatted date, or "N/A".
 */
export function formatFirestoreDate(timestamp) {
  const date = toDate(timestamp);
  if (!date) return "N/A";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Formats a Timestamp as date + time, for "last login"-style fields.
 * @param {*} timestamp - Firestore Timestamp, Date, string or number.
 * @return {string} Formatted date, or a dash.
 */
export function formatFirestoreDateTime(timestamp) {
  const date = toDate(timestamp);
  if (!date) return "—";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Coerces any of Firestore's timestamp representations to a Date.
 * @param {*} value - Timestamp, Date, ISO string or epoch number.
 * @return {Date|null} A valid Date, or null.
 */
export function toDate(value) {
  if (!value) return null;
  let date = null;
  if (typeof value.toDate === "function") date = value.toDate();
  else if (value.seconds) date = new Date(value.seconds * 1000);
  else if (typeof value === "string" || typeof value === "number") {
    date = new Date(value);
  } else if (value instanceof Date) date = value;
  return date && !isNaN(date.getTime()) ? date : null;
}

/**
 * Milliseconds since epoch for sorting/filtering, or null.
 * @param {*} value - Any timestamp representation.
 * @return {number|null} Epoch millis.
 */
export function toMillis(value) {
  const date = toDate(value);
  return date ? date.getTime() : null;
}

/**
 * Capitalises a status slug for display ("banned" → "Banned").
 * @param {string} value - The slug.
 * @param {string} fallback - Used when value is empty.
 * @return {string} Display form.
 */
export function titleCase(value, fallback = "") {
  if (!value) return fallback;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Loads every profile subdocument of one kind, keyed by owner uid.
 *
 * Prefers a single collectionGroup query. That requires a collection-group
 * security rule (`match /{path=**}/provider/{id}`) — if the project only has the
 * nested-path rule the query is denied, so we fall back to parallel point reads
 * (still one cheap document read per uid, rather than a collection scan each).
 *
 * @param {string} subcollection - "client" or "provider".
 * @param {string[]} uids - Owner uids to cover in the fallback path.
 * @return {Promise<Map<string, object>>} uid → profile data.
 */
export async function loadProfileMap(subcollection, uids) {
  try {
    const snap = await getDocs(collectionGroup(db, subcollection));
    const map = new Map();
    snap.docs.forEach((d) => {
      // users/{uid}/{subcollection}/{docId} — the grandparent is the user doc.
      const ownerUid = d.ref.parent.parent?.id;
      if (ownerUid) map.set(ownerUid, d.data());
    });
    return map;
  } catch (error) {
    console.warn(
      `collectionGroup('${subcollection}') denied or failed (${error?.code || error?.message}). ` +
        "Falling back to per-uid reads. Add a collection-group rule to enable the faster path.",
    );
    return loadProfileMapByUid(subcollection, uids);
  }
}

/**
 * Fallback for loadProfileMap: one direct document read per uid, in parallel.
 *
 * Schema v3.0 fixes the profile document id to the uid, so this is a point read
 * rather than a query.
 * @param {string} subcollection - "client" or "provider".
 * @param {string[]} uids - Owner uids.
 * @return {Promise<Map<string, object>>} uid → profile data.
 */
async function loadProfileMapByUid(subcollection, uids) {
  const entries = await Promise.all(
    uids.map(async (uid) => {
      try {
        const snap = await getDoc(doc(db, "users", uid, subcollection, uid));
        return snap.exists() ? [uid, snap.data()] : null;
      } catch {
        return null;
      }
    }),
  );
  return new Map(entries.filter(Boolean));
}

/**
 * Loads each user's default address, keyed by uid.
 *
 * Schema v3.0 §3 makes users/{uid}/addresses the only place street/city/postal
 * data lives — provider documents no longer carry those fields.
 * @param {string[]} uids - Owner uids to cover in the fallback path.
 * @return {Promise<Map<string, object>>} uid → address data.
 */
export async function loadAddressMap(uids) {
  const pick = (docs) =>
    docs.find((d) => d.data().isDefault)?.data() || docs[0]?.data() || null;

  try {
    const snap = await getDocs(collectionGroup(db, "addresses"));
    const byUid = new Map();
    snap.docs.forEach((d) => {
      const ownerUid = d.ref.parent.parent?.id;
      if (!ownerUid) return;
      if (!byUid.has(ownerUid)) byUid.set(ownerUid, []);
      byUid.get(ownerUid).push(d);
    });

    const map = new Map();
    byUid.forEach((docs, uid) => {
      const address = pick(docs);
      if (address) map.set(uid, address);
    });
    return map;
  } catch (error) {
    console.warn(
      `collectionGroup('addresses') denied or failed (${error?.code || error?.message}). ` +
        "Falling back to per-uid reads.",
    );
    const entries = await Promise.all(
      uids.map(async (uid) => {
        try {
          const snap = await getDocs(collection(db, "users", uid, "addresses"));
          const address = pick(snap.docs);
          return address ? [uid, address] : null;
        } catch {
          return null;
        }
      }),
    );
    return new Map(entries.filter(Boolean));
  }
}

/**
 * Reads all user documents of one account type.
 * @param {string} accountType - "client", "provider" or "admin".
 * @return {Promise<Array<{uid: string, data: object}>>} User documents.
 */
export async function loadUsersByType(accountType) {
  const snap = await getDocs(
    query(collection(db, "users"), where("accountType", "==", accountType)),
  );
  return snap.docs.map((d) => ({ uid: d.id, data: d.data() }));
}

/**
 * Applies the shared search / status / date filters, then paginates.
 *
 * Filtering happens client-side because Firestore has no substring operator,
 * and the tables offer jump-to-page navigation which cursor pagination cannot
 * support. Fine at admin-panel scale; revisit if accounts reach five figures.
 *
 * @param {Array<object>} items - Mapped rows.
 * @param {object} options - Filter options.
 * @param {string} options.searchTerm - Free text.
 * @param {string[]} options.searchFields - Row keys to match against.
 * @param {string} options.filterStatus - Display status, or "All".
 * @param {*} options.startDate - Range start.
 * @param {*} options.endDate - Range end.
 * @param {string} options.dateField - Row key holding the raw timestamp.
 * @param {number} options.page - 1-based page.
 * @param {number} options.limit - Page size.
 * @return {{items: Array<object>, total: number, totalPages: number}} Page.
 */
export function filterAndPaginate(items, options = {}) {
  const {
    searchTerm = "",
    searchFields = [],
    filterStatus = "All",
    startDate = null,
    endDate = null,
    dateField = "createdAtRaw",
    page = 1,
    limit = 8,
  } = options;

  let result = items;

  const term = searchTerm.trim().toLowerCase();
  if (term && searchFields.length > 0) {
    result = result.filter((item) =>
      searchFields.some((field) =>
        String(item[field] || "")
          .toLowerCase()
          .includes(term),
      ),
    );
  }

  if (filterStatus && filterStatus !== "All") {
    result = result.filter(
      (item) =>
        String(item.status || "").toLowerCase() === filterStatus.toLowerCase(),
    );
  }

  if (startDate || endDate) {
    const from = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
    const to = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;
    result = result.filter((item) => {
      const at = toMillis(item[dateField]);
      // Keep undated rows rather than hiding them behind a date filter.
      if (at === null) return true;
      if (from !== null && at < from) return false;
      if (to !== null && at > to) return false;
      return true;
    });
  }

  const total = result.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const paginated = result.slice((safePage - 1) * limit, safePage * limit);

  return { items: paginated, total, totalPages };
}
