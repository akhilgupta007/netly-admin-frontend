import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  limit as fsLimit,
} from "@/lib/firebase";
import {
  userSchema,
  clientProfileSchema,
  providerProfileSchema,
  kycSubmissionSchema,
} from "@/lib/schemas";
import {
  formatFirestoreDate,
  formatFirestoreDateTime,
  loadUsersByType,
  loadProfileMap,
  loadAddressMap,
  filterAndPaginate,
  titleCase,
  toMillis,
  toDate,
} from "@/services/firestoreReads";

export { formatFirestoreDate, formatFirestoreDateTime };

/** Human labels for the `type` values written into the wallet ledgers. */
const WALLET_TX_LABELS = {
  cancellation_credit: "Cancellation credit",
  booking_payment: "Booking payment",
  admin_credit: "Admin wallet credit",
  withdrawal: "Withdrawal",
  job_payout: "Job earnings",
  adjustment: "Adjustment",
  // Legacy entries written before the wallet schema migration.
  refund: "Refund credited",
  payment: "Booking payment",
  payout: "Payout to bank",
  adminCredit: "Admin wallet credit",
  adminDebit: "Admin wallet debit",
};

const KYC_DISPLAY = {
  verified: "Verified",
  pending: "Pending",
  rejected: "Rejected",
  notSubmitted: "Not Submitted",
};

/**
 * The status to show for an account.
 *
 * The schema has only active | invited | banned, so a timed suspension is
 * stored as `banned` plus `isSuspended` and a `suspendedUntil` date. Reading
 * `status` alone therefore showed every suspended user as "Banned" — which is
 * what an admin saw immediately after choosing Suspend (Temporary).
 *
 * @param {object} data - The users/{uid} document.
 * @return {string} Active | Invited | Suspended | Banned.
 */
function accountStatus(data) {
  const raw = String(data.status || "").toLowerCase();
  if (raw === "banned" && data.isSuspended) {
    const until = toMillis(data.suspendedUntil);
    // An elapsed suspension has not been lifted anywhere, so it still reads as
    // suspended rather than silently becoming a ban.
    return until && until < Date.now() ? "Suspension expired" : "Suspended";
  }
  return titleCase(data.status, "Active");
}

/**
 * Builds a display name from whatever the user document actually has.
 * @param {object} data - The users/{uid} data.
 * @param {string} fallback - Used when nothing is present.
 * @return {string} Display name.
 */
function displayName(data, fallback) {
  return (
    data.fullName ||
    [data.firstName, data.lastName].filter(Boolean).join(" ") ||
    data.email?.split("@")[0] ||
    fallback
  );
}

/**
 * 1. All user documents, lightly validated.
 * @return {Promise<Array<object>>} Users.
 */
export async function fetchUsersFromFirestore() {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    if (snapshot.empty) return [];

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return userSchema.parse({
        id: docSnap.id,
        uid: docSnap.id,
        email: data.email || "",
        accountType: data.accountType || null,
        otpVerified: Boolean(data.otpVerified),
        createdAt: data.createdAt,
        fullName: displayName(data, null),
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        phoneNumber: data.phoneNumber || "",
        countryCode: data.countryCode || "",
        photoUrl: data.photoUrl || "",
        status: accountStatus(data),
      });
    });
  } catch (error) {
    console.error("Firestore fetchUsers error:", error);
    throw error;
  }
}

/**
 * 2. Client accounts, joined with their client profile.
 * @param {object} params - Search / filter / pagination options.
 * @return {Promise<{items: Array<object>, total: number, totalPages: number}>} Page.
 */
export async function fetchClientsFromFirestore(params = {}) {
  const {
    searchTerm = "",
    filterStatus = "All",
    startDate = null,
    endDate = null,
    page = 1,
    limit = 8,
  } = params;

  try {
    const users = await loadUsersByType("client");
    // One read for the whole page rather than a query per row — the counts are
    // tallied in memory below.
    const bookingCounts = await countBookingsBy("clientId");
    if (users.length === 0) return { items: [], total: 0, totalPages: 1 };

    const uids = users.map((u) => u.uid);
    const profiles = await loadProfileMap("client", uids);

    const items = users.map(({ uid, data }) => {
      const profile = profiles.get(uid) || {};
      return clientProfileSchema.parse({
        id: `CL-${uid.slice(0, 6)}`,
        uid,
        name: displayName(data, "Client"),
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
        photoUrl: data.photoUrl || "",
        joinDate: formatFirestoreDate(data.createdAt || profile.createdAt),
        createdAtRaw: data.createdAt || profile.createdAt || null,
        otp: data.otpVerified ? "Verified" : "Pending",
        bookings: bookingCounts.get(uid) || 0,
        wallet: profile.walletBalance || 0.0,
        creditUsed: profile.creditUsed || 0.0,
        profileCompleted: Boolean(profile.profileCompleted),
        addressCompleted: Boolean(profile.addressCompleted),
        onboardingCompleted: Boolean(profile.onboardingCompleted),
        status: accountStatus(data),
      });
    });

    return filterAndPaginate(items, {
      searchTerm,
      searchFields: ["name", "email"],
      filterStatus,
      startDate,
      endDate,
      page,
      limit,
    });
  } catch (error) {
    console.error("Firestore fetchClients error:", error);
    throw error;
  }
}

/**
 * 3. Provider accounts, joined with their provider profile and default address.
 *
 * Address fields come from users/{uid}/addresses (Schema v3.0 §3). The legacy
 * provider-level street/city/postal fields are read only as a fallback, since
 * §5 lists them as removed.
 * @param {object} params - Search / filter / pagination options.
 * @return {Promise<{items: Array<object>, total: number, totalPages: number}>} Page.
 */
/**
 * Tallies bookings per account, in one read.
 *
 * A per-row query would be one read per user on every list render; a single
 * pass over bookings is cheaper and the collection is small enough to hold.
 *
 * @param {string} field - "clientId" or "providerId".
 * @return {Promise<Map<string, number>>} uid → booking count.
 */
async function countBookingsBy(field) {
  const counts = new Map();
  try {
    const snap = await getDocs(collection(db, "bookings"));
    snap.docs.forEach((d) => {
      const data = d.data();
      // Providers are stored under either key depending on when the booking
      // was written.
      const uid =
        field === "providerId"
          ? data.providerId || data.professionalId
          : data[field];
      if (uid) counts.set(uid, (counts.get(uid) || 0) + 1);
    });
  } catch (error) {
    // A count is supporting detail — the list must still render without it.
    console.warn("countBookingsBy failed:", error?.code || error?.message);
  }
  return counts;
}

export async function fetchProvidersFromFirestore(params = {}) {
  const {
    searchTerm = "",
    filterStatus = "All",
    filterKYC = "All",
    startDate = null,
    endDate = null,
    page = 1,
    limit = 8,
  } = params;

  try {
    const users = await loadUsersByType("provider");
    if (users.length === 0) return { items: [], total: 0, totalPages: 1 };

    const uids = users.map((u) => u.uid);
    const [profiles, addresses, bookingCounts] = await Promise.all([
      loadProfileMap("provider", uids),
      loadAddressMap(uids),
      countBookingsBy("providerId"),
    ]);

    let items = users.map(({ uid, data }) => {
      const profile = profiles.get(uid) || {};
      const address = addresses.get(uid) || {};
      const kycStatus = profile.kycStatus || "notSubmitted";

      return providerProfileSchema.parse({
        id: `PR-${uid.slice(0, 6)}`,
        uid,
        name: displayName(data, "Provider"),
        firstName: data.firstName || profile.firstName || "",
        lastName: data.lastName || profile.lastName || "",
        email: data.email || profile.email || "",
        phoneNumber: data.phoneNumber || profile.phoneNumber || "",
        // Address: subcollection first, legacy provider fields as fallback.
        city: address.city || profile.city || "",
        province: address.province || profile.province || "",
        country: address.country || profile.country || "",
        street: address.streetAddress || profile.street || "",
        apt: address.aptSuite || profile.apt || null,
        postalCode: address.postalCode || profile.postalCode || "",
        about: profile.about || "",
        yearsOfExperience: profile.yearsOfExperience || "",
        serviceRadiusKm: profile.serviceRadiusKm ?? null,
        rating: null,
        bookings: bookingCounts.get(uid) || 0,
        joinDate: formatFirestoreDate(data.createdAt || profile.createdAt),
        createdAtRaw: data.createdAt || profile.createdAt || null,
        kyc: KYC_DISPLAY[kycStatus] || "Not Submitted",
        kycStatus,
        isKycVerified: kycStatus === "verified",
        kycSubmittedAt: formatFirestoreDate(profile.kycSubmittedAt),
        kycReviewedAt: formatFirestoreDate(profile.kycReviewedAt),
        kycRejectionReason: profile.kycRejectionReason || "",
        verificationDocuments: profile.verificationDocuments || [],
        selectedDocuments: profile.selectedDocuments || [],
        skills: profile.skills || [],
        badges: profile.isFoundingPartner ? ["Founding Provider"] : [],
        isFoundingPartner: Boolean(profile.isFoundingPartner),
        walletBalance: profile.walletBalance || 0.0,
        creditUsed: profile.creditUsed || 0.0,
        stripeAccountId:
          profile.stripeAccountId || profile.stripeAccountid || "",
        stripeAccountType: profile.stripeAccountType || "",
        chargesEnabled: Boolean(profile.chargesEnabled),
        payoutsEnabled: Boolean(profile.payoutsEnabled),
        isActive: Boolean(profile.isActive),
        status: accountStatus(data),
      });
    });

    if (filterKYC !== "All") {
      items = items.filter(
        (p) => p.kyc.toLowerCase() === filterKYC.toLowerCase(),
      );
    }

    return filterAndPaginate(items, {
      searchTerm,
      searchFields: ["name", "email", "city"],
      filterStatus,
      startDate,
      endDate,
      page,
      limit,
    });
  } catch (error) {
    console.error("Firestore fetchProviders error:", error);
    throw error;
  }
}

/**
 * 4. KYC submissions.
 *
 * Reads the top-level `kyc` collection (Schema v3.0 §6), joining each record to
 * its provider. Falls back to deriving rows from provider profiles when that
 * collection is empty, which is the case until the app starts writing there.
 * @param {object} params - Search / filter / pagination options.
 * @return {Promise<{items: Array<object>, total: number, totalPages: number}>} Page.
 */
export async function fetchKycSubmissionsFromFirestore(params = {}) {
  const {
    searchTerm = "",
    filterStatus = "All",
    filterDocType = "All",
    startDate = null,
    endDate = null,
    page = 1,
    limit = 8,
  } = params;

  try {
    const users = await loadUsersByType("provider");
    if (users.length === 0) return { items: [], total: 0, totalPages: 1 };

    const usersByUid = new Map(users.map((u) => [u.uid, u.data]));
    const uids = users.map((u) => u.uid);

    const [kycSnap, profiles] = await Promise.all([
      getDocs(collection(db, "kyc")).catch((error) => {
        console.warn(
          "Could not read the kyc collection:",
          error?.code || error?.message,
        );
        return { docs: [] };
      }),
      loadProfileMap("provider", uids),
    ]);

    let rows;

    if (kycSnap.docs.length > 0) {
      rows = kycSnap.docs
        .map((d) => {
          const kyc = d.data();
          const uid = kyc.providerId || kyc.userId || kyc.userRef?.id;
          const user = uid ? usersByUid.get(uid) : null;
          if (!user) return null;
          const profile = profiles.get(uid) || {};
          return buildKycRow({
            kycId: d.id,
            uid,
            user,
            status: kyc.status || profile.kycStatus || "notSubmitted",
            submittedAt: kyc.submittedAt,
            reviewedAt: kyc.reviewedAt,
            selectedDocuments: kyc.selectedDocuments,
            verificationDocuments: kyc.verificationDocuments,
            rejectionReason: kyc.rejectionReason,
          });
        })
        .filter(Boolean);
    } else {
      // Legacy shape: KYC state denormalized onto the provider document.
      rows = users.map(({ uid, data }) => {
        const profile = profiles.get(uid) || {};
        return buildKycRow({
          kycId: null,
          uid,
          user: data,
          status: profile.kycStatus || "notSubmitted",
          submittedAt: profile.kycSubmittedAt,
          reviewedAt: profile.kycReviewedAt,
          selectedDocuments: profile.selectedDocuments,
          verificationDocuments: profile.verificationDocuments,
          rejectionReason: profile.kycRejectionReason,
        });
      });
    }

    let items = rows.map((row) => kycSubmissionSchema.parse(row));

    if (filterDocType !== "All") {
      // The panel filters by label ("Government ID"); older callers passed the
      // raw slug ("governmentId"). Match either, or this silently returns
      // nothing for whichever form it was not expecting.
      const wanted = filterDocType.toLowerCase();
      items = items.filter((k) =>
        (k.documents || []).some(
          (d) =>
            String(d).toLowerCase() === wanted ||
            kycDocLabel(d).toLowerCase() === wanted,
        ),
      );
    }

    if (filterStatus !== "All") {
      items = items.filter((k) => {
        if (filterStatus === "In Review") {
          return ["in review", "pending"].includes(k.status.toLowerCase());
        }
        return k.status.toLowerCase() === filterStatus.toLowerCase();
      });
    }

    return filterAndPaginate(items, {
      searchTerm,
      searchFields: ["providerName", "email"],
      filterStatus: "All", // already applied above, with the In Review alias
      startDate,
      endDate,
      dateField: "submittedAtRaw",
      page,
      limit,
    });
  } catch (error) {
    console.error("Firestore fetchKycSubmissions error:", error);
    throw error;
  }
}

/**
 * Shapes one KYC row from either the kyc collection or the legacy provider copy.
 * @param {object} source - Normalised inputs.
 * @return {object} Row ready for kycSubmissionSchema.
 */
/** The document slugs the apps submit, and how they read in the panel. */
const KYC_DOC_LABELS = {
  governmentId: "Government ID",
  proofOfAddress: "Proof of Address",
  businessRegistration: "Business Registration",
  drivingLicense: "Driving Licence",
  passport: "Passport",
};

/**
 * Readable label for a document slug.
 *
 * @param {string} slug - e.g. "governmentId".
 * @return {string} e.g. "Government ID".
 */
function kycDocLabel(slug) {
  return (
    KYC_DOC_LABELS[slug] ||
    String(slug || "")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (c) => c.toUpperCase())
      .trim()
  );
}

function buildKycRow({
  kycId,
  uid,
  user,
  status,
  submittedAt,
  reviewedAt,
  selectedDocuments,
  verificationDocuments,
  rejectionReason,
}) {
  const documents = selectedDocuments || [];
  const files = verificationDocuments || [];
  return {
    id: `PR-${uid.slice(0, 6)}`,
    kycId,
    uid,
    providerName: displayName(user, "Provider"),
    email: user.email || "",
    phoneNumber: user.phoneNumber || "",
    city: "",
    submittedAt: formatFirestoreDate(submittedAt),
    submittedAtRaw: submittedAt || null,
    date: formatFirestoreDate(submittedAt),
    // When the account was created — distinct from when KYC was submitted.
    // The modal previously showed the submission date under "Joined".
    joinedAt: formatFirestoreDate(user.createdAt),
    joinedAtRaw: user.createdAt || null,
    // When an admin last decided on this submission.
    reviewedAt: formatFirestoreDate(reviewedAt),
    documents,
    // Readable names for the Document Type filter. The page used to filter on
    // a `docType` field that nothing ever set, so selecting any type matched
    // nothing at all.
    documentLabels: documents.map(kycDocLabel),
    verificationDocuments: files,
    // notSubmitted must not read as Pending — that put providers who uploaded
    // nothing into the review queue as though awaiting a decision.
    status:
      KYC_DISPLAY[status] === "Verified"
        ? "Approved"
        : KYC_DISPLAY[status] || "Not Submitted",
    kycStatus: status,
    isKycVerified: status === "verified",
    rejectionReason: rejectionReason || "",
  };
}

/**
 * 7. Wallet balances across clients and providers.
 *
 * Wallet balance lives on the profile subdocument (client/provider), so this is
 * the same two-query join the account tables use.
 * @param {object} params - Search / filter / pagination options.
 * @return {Promise<{items: Array<object>, total: number, totalPages: number}>} Page.
 */
export async function fetchWalletsFromFirestore(params = {}) {
  const {
    searchTerm = "",
    accountType = "All",
    startDate = null,
    endDate = null,
    page = 1,
    limit = 8,
  } = params;

  try {
    const wanted =
      accountType === "All" ? ["client", "provider"] : [accountType];

    const groups = await Promise.all(
      wanted.map(async (type) => {
        const users = await loadUsersByType(type);
        if (users.length === 0) return [];
        const uids = users.map((u) => u.uid);
        // walletUser / walletProvider are the source of truth; the profile
        // mirrors are only a fallback for accounts that predate the wallet doc.
        const [wallets, profiles] = await Promise.all([
          loadProfileMap(
            type === "client" ? "walletUser" : "walletProvider",
            uids,
          ),
          loadProfileMap(type, uids),
        ]);
        return users.map(({ uid, data }) => {
          const mirror = profiles.get(uid) || {};
          const wallet = wallets.get(uid) || {};
          const balance =
            Number(wallet.balance ?? mirror.walletBalance ?? 0) || 0;
          const reserved = Number(wallet.reservedAmount) || 0;
          const active = Number(wallet.activeAmount) || 0;
          return {
            id: `W-${uid.slice(0, 6)}`,
            uid,
            accountType: type,
            client: {
              name: displayName(
                data,
                type === "client" ? "Client" : "Provider",
              ),
              email: data.email || "",
            },
            name: displayName(data, "Account"),
            email: data.email || "",
            balance,
            // Providers only. Reserved is this week's earnings, still locked;
            // active is what pays out on the coming Friday.
            reserved: type === "provider" ? reserved : null,
            active: type === "provider" ? active : null,
            creditUsed: Number(wallet.creditUsed ?? mirror.creditUsed) || 0,
            lastTxDate: formatFirestoreDate(
              wallet.updatedAt || mirror.updatedAt,
            ),
            lastTxTime: "",
            updatedAtRaw: wallet.updatedAt || mirror.updatedAt || null,
            status: accountStatus(data),
          };
        });
      }),
    );

    const items = groups.flat().sort((a, b) => b.balance - a.balance);

    return filterAndPaginate(items, {
      searchTerm,
      searchFields: ["name", "email"],
      filterStatus: "All",
      startDate,
      endDate,
      dateField: "updatedAtRaw",
      page,
      limit,
    });
  } catch (error) {
    console.error("Firestore fetchWallets error:", error);
    throw error;
  }
}

/**
 * 8. Wallet credit requests — the refund approval queue.
 *
 * Documents live in `wallet_credit_requests` and are created by the refund
 * paths in netly-functions (cancellations, auto-rejects, dispute outcomes).
 * @param {object} params - Search / filter / pagination options.
 * @return {Promise<{items: Array<object>, total: number, totalPages: number}>} Page.
 */
export async function fetchWalletCreditRequestsFromFirestore(params = {}) {
  const {
    searchTerm = "",
    filterStatus = "All",
    startDate = null,
    endDate = null,
    page = 1,
    limit = 8,
  } = params;

  try {
    const snapshot = await getDocs(
      query(
        collection(db, "wallet_credit_requests"),
        orderBy("createdAt", "desc"),
        fsLimit(500),
      ),
    );

    // Join to users so the queue can show who the refund is for.
    const uids = [
      ...new Set(
        snapshot.docs
          .map((d) => d.data().userId || d.data().userRef?.id)
          .filter(Boolean),
      ),
    ];
    const userMap = new Map(
      (
        await Promise.all(
          uids.map(async (uid) => {
            try {
              const snap = await getDoc(doc(db, "users", uid));
              return snap.exists() ? [uid, snap.data()] : null;
            } catch {
              return null;
            }
          }),
        )
      ).filter(Boolean),
    );

    const items = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const uid = data.userId || data.userRef?.id || null;
      const user = uid ? userMap.get(uid) : null;
      return {
        id: docSnap.id,
        uid,
        client: {
          name: user ? displayName(user, "Client") : "Unknown",
          email: user?.email || "",
        },
        name: user ? displayName(user, "Client") : "Unknown",
        email: user?.email || "",
        amount: Number(data.amount) || 0,
        txn: data.bookingId || "-",
        bookingId: data.bookingId || null,
        reason: data.reason || "",
        date: formatFirestoreDate(data.createdAt),
        createdAtRaw: data.createdAt || null,
        // Backend slugs are pending | approved | rejected.
        status: titleCase(data.status, "Pending"),
        rawStatus: data.status || "pending",
      };
    });

    return filterAndPaginate(items, {
      searchTerm,
      searchFields: ["name", "email", "reason"],
      filterStatus,
      startDate,
      endDate,
      page,
      limit,
    });
  } catch (error) {
    console.error("Firestore fetchWalletCreditRequests error:", error);
    throw error;
  }
}

/**
 * 10. One account's wallet ledger.
 *
 * Wallet schema v1.0 keys both ledgers off the wallet document:
 *   clients   → users/{uid}/walletUser/{uid}/transactions
 *   providers → users/{uid}/walletProvider/{uid}/transactions
 *
 * Entries record `balanceAfter`, so the running balance is read straight from
 * the ledger rather than recomputed — recomputing would drift the moment an
 * entry was missed.
 *
 * @param {object} params - Options.
 * @param {string} params.uid - Account id.
 * @param {string} params.accountType - "client" or "provider".
 * @param {number} params.max - Cap on entries (default 100).
 * @return {Promise<Array<object>>} Entries, newest first.
 */
export async function fetchWalletHistoryFromFirestore({
  uid,
  accountType = "client",
  max = 100,
} = {}) {
  if (!uid) return [];

  const isClient = accountType === "client";
  const path = isClient
    ? ["users", uid, "walletUser", uid, "transactions"]
    : ["users", uid, "walletProvider", uid, "transactions"];

  try {
    const snapshot = await getDocs(
      query(
        collection(db, ...path),
        orderBy("createdAt", "desc"),
        fsLimit(max),
      ),
    );

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const raw = Number(data.amount ?? data.transactionAmount) || 0;
      // Amounts are signed in the wallet schema. Fall back to the legacy
      // `type` field for entries written before the migration.
      const isDebit =
        data.isCredit === undefined
          ? ["payment", "adminDebit", "payout"].includes(data.type)
          : !data.isCredit;
      const amount = Math.abs(raw);

      return {
        id: docSnap.id,
        date: formatFirestoreDateTime(data.createdAt),
        createdAtRaw: data.createdAt || null,
        description:
          data.title ||
          WALLET_TX_LABELS[data.kind] ||
          WALLET_TX_LABELS[data.type] ||
          data.reason ||
          "Transaction",
        reason: data.subtitle || data.description || data.reason || "",
        type: isDebit ? "Debit" : "Credit",
        rawType: data.kind || data.type || "",
        // Provider earnings stay locked until the week closes.
        released: data.releasedAt ? true : null,
        amount,
        txn: data.bookingId || data.stripeTransferId || "-",
        // Older entries predate balanceAfter; null renders as a dash rather
        // than "$NaN".
        running:
          data.balanceAfter === undefined || data.balanceAfter === null
            ? null
            : Number(data.balanceAfter),
      };
    });
  } catch (error) {
    console.error("Firestore fetchWalletHistory error:", error);
    throw error;
  }
}

/**
 * 9. Payout history from `payout_logs`, written by processFridayPayouts.
 * @param {object} params - Search / filter / pagination options.
 * @return {Promise<{items: Array<object>, total: number, totalPages: number}>} Page.
 */
export async function fetchPayoutLogsFromFirestore(params = {}) {
  const {
    searchTerm = "",
    filterStatus = "All",
    startDate = null,
    endDate = null,
    page = 1,
    limit = 8,
  } = params;

  try {
    const snapshot = await getDocs(
      query(collection(db, "payout_logs"), fsLimit(500)),
    );
    if (snapshot.docs.length === 0) {
      return { items: [], total: 0, totalPages: 1 };
    }

    // Payout logs identify the provider by cleanerId only, so join to users
    // for a name and email.
    const uids = [
      ...new Set(snapshot.docs.map((d) => d.data().cleanerId).filter(Boolean)),
    ];
    const userMap = new Map(
      (
        await Promise.all(
          uids.map(async (uid) => {
            try {
              const snap = await getDoc(doc(db, "users", uid));
              return snap.exists() ? [uid, snap.data()] : null;
            } catch {
              return null;
            }
          }),
        )
      ).filter(Boolean),
    );

    const items = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const uid = data.cleanerId || null;
      const user = uid ? userMap.get(uid) : null;
      return {
        id: docSnap.id,
        uid,
        provider: {
          name: user ? displayName(user, "Provider") : uid || "Provider",
          email: user?.email || "",
        },
        name: user ? displayName(user, "Provider") : "Provider",
        email: user?.email || "",
        amount: Number(data.amount) || 0,
        currency: data.currency || "cad",
        txn: data.stripeTransferId || "-",
        stripeAccountId: data.stripeDestinationAccountId || "",
        errorMessage: data.errorMessage || "",
        // processFridayPayouts writes processedAt, and status succeeded|failed.
        date: formatFirestoreDate(data.processedAt),
        createdAtRaw: data.processedAt || null,
        status: data.status === "succeeded" ? "Transferred" : "Error",
        rawStatus: data.status || "",
      };
    });

    items.sort(
      (a, b) =>
        (toMillis(b.createdAtRaw) || 0) - (toMillis(a.createdAtRaw) || 0),
    );

    return filterAndPaginate(items, {
      searchTerm,
      searchFields: ["name", "email", "txn"],
      filterStatus,
      startDate,
      endDate,
      page,
      limit,
    });
  } catch (error) {
    console.error("Firestore fetchPayoutLogs error:", error);
    throw error;
  }
}

/**
 * 6. Audit log entries.
 *
 * Every admin mutation in netly-functions writes one of these via the
 * writeAuditLog helper. The log is append-only — nothing in the panel edits or
 * deletes entries, which is the point.
 *
 * @param {object} params - Options.
 * @param {number} params.max - Hard cap on documents fetched (default 500).
 * @return {Promise<Array<object>>} Entries, newest first.
 */
export async function fetchAuditLogsFromFirestore({ max = 500 } = {}) {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, "audit_logs"),
        orderBy("createdAt", "desc"),
        fsLimit(max),
      ),
    );

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        action: data.action || "",
        actorUid: data.actorUid || "",
        actorEmail: data.actorEmail || "—",
        actorRole: data.actorRole || null,
        targetType: data.targetType || "—",
        targetId: data.targetId || "—",
        reason: data.reason || "",
        before: data.before || null,
        after: data.after || null,
        metadata: data.metadata || null,
        ipAddress: data.ipAddress || "—",
        userAgent: data.userAgent || "",
        timestamp: formatFirestoreDateTime(data.createdAt),
        createdAtRaw: data.createdAt || null,
      };
    });
  } catch (error) {
    console.warn("Firestore fetchAuditLogs warning:", error.message || error);
    throw error;
  }
}

/**
 * 11. Data access log entries — who viewed personal data.
 *
 * Counterpart to the audit log: that records mutations, this records reads.
 * Written server-side by the logDataAccess callable.
 * @param {object} params - Options.
 * @param {number} params.max - Cap on documents fetched (default 500).
 * @return {Promise<Array<object>>} Entries, newest first.
 */
export async function fetchDataAccessLogsFromFirestore({ max = 500 } = {}) {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, "data_access_logs"),
        orderBy("createdAt", "desc"),
        fsLimit(max),
      ),
    );

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        timestamp: formatFirestoreDateTime(data.createdAt),
        createdAtRaw: data.createdAt || null,
        admin: data.adminEmail || "—",
        adminRole: data.adminRole || null,
        dataType: data.dataType || "—",
        recordId: data.recordId || "—",
        subjectUid: data.subjectUid || null,
        reason: data.reason || "",
        ipAddress: data.ipAddress || "—",
      };
    });
  } catch (error) {
    console.error("Firestore fetchDataAccessLogs error:", error);
    throw error;
  }
}

/**
 * 12. Consent records.
 *
 * Consent is captured by the app at sign-up; the admin panel only reads it and
 * can withdraw it on request. Users who have never been asked show as null
 * rather than false — "not recorded" is not the same as "declined".
 * @return {Promise<Array<object>>} One row per client and provider.
 */
export async function fetchConsentRecordsFromFirestore() {
  try {
    const groups = await Promise.all(
      ["client", "provider"].map((type) => loadUsersByType(type)),
    );

    return groups
      .flat()
      .map(({ uid, data }) => ({
        uid,
        name: displayName(data, "User"),
        email: data.email || "",
        accountType: data.accountType || "",
        dataConsent: data.dataConsent ?? null,
        marketingConsent: data.marketingConsent ?? null,
        dataConsentTime: formatFirestoreDateTime(
          data.dataConsentUpdatedAt || data.createdAt,
        ),
        marketingConsentTime: formatFirestoreDateTime(
          data.marketingConsentUpdatedAt || data.createdAt,
        ),
        lastUpdated: formatFirestoreDate(data.updatedAt || data.createdAt),
        updatedAtRaw: data.updatedAt || data.createdAt || null,
      }))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  } catch (error) {
    console.error("Firestore fetchConsentRecords error:", error);
    throw error;
  }
}

/**
 * 13. Dashboard metrics.
 *
 * Every figure is computed from live data. Where a collection is empty the
 * metric is genuinely zero rather than hidden — a dashboard that invents
 * plausible numbers is worse than one that admits there is no activity yet.
 *
 * @param {object} params - Options.
 * @param {Date} params.startDate - Range start (inclusive).
 * @param {Date} params.endDate - Range end (inclusive).
 * @return {Promise<object>} Formatted metric strings plus the daily series.
 */
export async function fetchDashboardMetricsFromFirestore({
  startDate,
  endDate,
} = {}) {
  const from = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
  const to = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;
  const inRange = (ts) => {
    const at = toMillis(ts);
    if (at === null) return false;
    if (from !== null && at < from) return false;
    if (to !== null && at > to) return false;
    return true;
  };

  /**
   * Reads a collection, tolerating one that does not exist or is unreadable.
   * @param {string} name - Collection name.
   * @return {Promise<Array<object>>} Documents.
   */
  const safeAll = async (name) => {
    try {
      const snap = await getDocs(collection(db, name));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.warn(
        `dashboard: could not read ${name}:`,
        error?.code || error?.message,
      );
      return [];
    }
  };

  try {
    const [
      clients,
      providers,
      bookings,
      disputes,
      creditRequests,
      withdrawals,
    ] = await Promise.all([
      loadUsersByType("client"),
      loadUsersByType("provider"),
      safeAll("bookings"),
      safeAll("disputes"),
      safeAll("wallet_credit_requests"),
      safeAll("withdrawal_requests"),
    ]);

    const [clientProfiles, providerProfiles, clientWallets, providerWallets] =
      await Promise.all([
        loadProfileMap(
          "client",
          clients.map((c) => c.uid),
        ),
        loadProfileMap(
          "provider",
          providers.map((p) => p.uid),
        ),
        loadProfileMap(
          "walletUser",
          clients.map((c) => c.uid),
        ),
        loadProfileMap(
          "walletProvider",
          providers.map((p) => p.uid),
        ),
      ]);

    // ── Bookings in range ──────────────────────────────────
    const ranged = bookings.filter((b) => inRange(b.createdAt || b.created_at));
    const norm = (v) => String(v || "").toLowerCase();
    const completed = ranged.filter(
      (b) => norm(b.status) === "completed",
    ).length;
    const cancelled = ranged.filter((b) =>
      norm(b.status).startsWith("cancelled"),
    ).length;
    const finished = completed + cancelled;

    const sum = (list, key) =>
      list.reduce((acc, b) => acc + (Number(b[key]) || 0), 0);

    const gmv = sum(ranged, "transactionAmount") || sum(ranged, "price");
    const revenue = sum(ranged, "platformRevenue");
    const fees = sum(ranged, "clientServiceFee");

    // ── Live wallet liability (not range-bound) ────────────
    // Everything the platform owes but has not yet paid out: client balances
    // plus both provider buckets. Reserved is not payable this Friday, but it
    // is still money owed, so it belongs in the liability total.
    let clientLiability = 0;
    clients.forEach(({ uid }) => {
      const w = clientWallets.get(uid);
      clientLiability +=
        Number(w?.balance ?? clientProfiles.get(uid)?.walletBalance ?? 0) || 0;
    });

    let providerReserved = 0;
    let providerActive = 0;
    providers.forEach(({ uid }) => {
      const w = providerWallets.get(uid);
      if (w) {
        providerReserved += Number(w.reservedAmount) || 0;
        providerActive += Number(w.activeAmount) || 0;
      } else {
        // Pre-migration provider: the whole mirrored balance is unclassified,
        // so treat it as payable rather than dropping it.
        providerActive += Number(providerProfiles.get(uid)?.walletBalance) || 0;
      }
    });

    const liability = clientLiability + providerReserved + providerActive;

    // ── Queues ─────────────────────────────────────────────
    const openDisputes = disputes.filter((d) =>
      ["open", "underreview"].includes(norm(d.status).replace(/[^a-z]/g, "")),
    ).length;
    const pendingCredits = creditRequests.filter(
      (r) => norm(r.status) === "pending",
    ).length;
    const pendingWithdrawals = withdrawals.filter(
      (r) => norm(r.status) === "pending",
    ).length;

    let kycQueue = 0;
    providerProfiles.forEach((p) => {
      if (norm(p.kycStatus) === "pending") kycQueue += 1;
    });

    // ── Accounts ───────────────────────────────────────────
    const newClients = clients.filter((c) => inRange(c.data.createdAt)).length;
    const newProviders = providers.filter((p) =>
      inRange(p.data.createdAt),
    ).length;
    const suspended = [...clients, ...providers].filter(
      (u) => norm(u.data.status) === "banned",
    ).length;

    // ── Daily series: real refunds vs wallet credits ───────
    // Outbound = money that actually left the platform back to a card.
    //   · bookings marked refundedToCard by the charge.refunded webhook
    //   · approved withdrawals, which refund to the original card
    // Retained = money kept in the ecosystem as wallet credit instead
    //   (approved wallet_credit_requests).
    const outboundEvents = [
      ...bookings
        .filter((b) => b.refundedToCard)
        .map((b) => ({
          at: toMillis(b.refundedToCardAt || b.refundedAt),
          amount: Number(b.refundedToCardAmount) || 0,
        })),
      ...withdrawals
        .filter((w) => norm(w.status) === "approved")
        .map((w) => ({
          at: toMillis(w.resolvedAt),
          amount: Number(w.refundedAmount ?? w.amount) || 0,
        })),
    ].filter((e) => e.at !== null);

    const retainedEvents = creditRequests
      .filter((r) => norm(r.status) === "approved")
      .map((r) => ({
        at: toMillis(r.resolvedAt || r.createdAt),
        amount: Number(r.amount) || 0,
      }))
      .filter((e) => e.at !== null);

    const bucket = (events, t, next) =>
      Math.round(
        events
          .filter((e) => e.at >= t && e.at < next)
          .reduce((a, e) => a + e.amount, 0),
      );

    const days = [];
    if (from !== null && to !== null) {
      for (let t = from; t <= to; t += 86400000) {
        const next = t + 86400000;
        days.push({
          label: new Date(t).toLocaleDateString("en-US", { weekday: "short" }),
          outbound: bucket(outboundEvents, t, next),
          retained: bucket(retainedEvents, t, next),
        });
        if (days.length >= 31) break;
      }
    }

    const currency = (n) =>
      `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return {
      bookings: ranged.length.toLocaleString(),
      completionRate:
        finished > 0 ? `${((completed / finished) * 100).toFixed(1)}%` : "—",
      openDisputes: String(openDisputes),
      walletCreditsPending: String(pendingCredits),
      // Client cash-out requests — the closest real analogue to a refund queue.
      refundRequests: String(pendingWithdrawals),
      kycDocsInQueue: String(kycQueue),

      gmv: currency(gmv),
      revenue: currency(revenue),
      fees: currency(fees),
      liability: currency(liability),
      // Broken out so the payout view can show what is actually due on Friday
      // versus what is still seasoning in this week's reserve.
      clientLiability: currency(clientLiability),
      providerReserved: currency(providerReserved),
      providerActive: currency(providerActive),

      newClients: newClients.toLocaleString(),
      newProviders: newProviders.toLocaleString(),
      suspended: String(suspended),
      unresolvedDisputes: String(openDisputes),

      series: days,
      totals: { clients: clients.length, providers: providers.length },
    };
  } catch (error) {
    console.error("Firestore fetchDashboardMetrics error:", error);
    throw error;
  }
}

/**
 * Maps a raw booking status onto the label the Transactions screens use.
 *
 * Three vocabularies are in play: the Cloud Functions write PascalCase
 * (`Requests`, `OnTheWay`), Schema v3.0 §8 specifies lowercase, and this UI was
 * built around a third set (`Finalised`, `Pending Provider Acceptance`).
 * Matching case-insensitively means the screen works whichever the app writes.
 *
 * @param {object} booking - Raw booking data.
 * @return {string} Display status.
 */
function transactionStatus(booking) {
  const raw = String(booking.status || "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

  // Terminal money states take precedence over the lifecycle status.
  if (booking.refundedToCard) return "Refunded";
  if (booking.disputeId || booking.hasOpenDispute) return "Dispute";

  switch (raw) {
    case "draft":
      return "Quote Pending";
    case "pending":
      return "Pending Payment";
    case "requests":
      return "Pending Provider Acceptance";
    case "confirmed":
      return "Confirmed";
    case "ontheway":
    case "inprogress":
      return "In Progress";
    case "completedbyprovider":
      // The provider says the job is done; the client has 24h to confirm.
      // Distinct from "completed", which is what credits the provider.
      return "Awaiting Client Confirmation";
    case "completed":
      // Payout released means the money is settled, not just the service.
      return booking.payoutReleased ? "Finalised" : "Completed";
    case "cancelled":
    case "cancelledbyprofessional":
      return "Cancelled";
    default:
      return booking.status || "Unknown";
  }
}

/**
 * Shapes one booking into the row the Transactions screens expect.
 * @param {string} id - Booking document id.
 * @param {object} b - Booking data.
 * @param {Map<string, object>} users - uid → user data.
 * @return {object} Transaction row.
 */
function toTransaction(id, b, users) {
  const client = users.get(b.clientId) || null;
  const provider = users.get(b.providerId || b.professionalId) || null;
  const when = b.serviceDateAndTime || b.scheduledAt || b.createdAt;
  const at = toDate(when);

  const serviceAmount = Number(b.transactionAmount ?? b.price) || 0;

  return {
    id,
    status: transactionStatus(b),
    rawStatus: b.status || "",
    client: {
      uid: b.clientId || null,
      name: client ? displayName(client, "Client") : "Unknown client",
      email: client?.email || "",
    },
    provider: {
      uid: b.providerId || b.professionalId || null,
      name: provider ? displayName(provider, "Provider") : "Unassigned",
      email: provider?.email || "",
    },
    category: b.serviceTitle || b.categoryId || "—",
    date: formatFirestoreDate(when),
    time: at
      ? at.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : "",
    createdAtRaw: b.createdAt || when || null,
    serviceAmount,
    totalPaid: Number(b.totalChargedToClient) || serviceAmount,
    providerPayout: Number(b.providerPayout) || 0,
    commission: Number(b.platformRevenue) || 0,
    clientServiceFee: Number(b.clientServiceFee) || 0,
    // Stamped by sendOffer at the time of the offer. Bookings made before
    // editable fee rates have none, so consumers must tolerate null.
    appliedRates: b.appliedRates || null,
    taxAmount: Number(b.taxAmount) || 0,
    tip: Number(b.tip) || 0,
    pricingType: b.pricingType || "—",
    description: b.notes || "",
    payoutReleased: Boolean(b.payoutReleased),
    refundAmount: Number(b.refundAmount) || 0,
    refundedToCard: Boolean(b.refundedToCard),
    stripePaymentIntentId: b.stripePaymentIntentId || null,
    // Needed by the detail screen's actions to link to the client's wallet
    // and to any dispute raised against this booking.
    clientId: b.clientId || null,
    providerId: b.providerId || b.professionalId || null,
    disputeId: b.disputeId || null,
    hasOpenDispute: Boolean(b.hasOpenDispute),
    stripeInvoicePdfUrl: b.stripeInvoicePdfUrl || null,
    stripeTransferId: b.stripeTransferId || null,
    isRecurring: Boolean(b.isRecurring),
    scheduleId: b.scheduleId || null,
    addressLines: b.addressLines || [],

    // Milestone timestamps. The detail timeline renders from these rather
    // than from invented dates, so a stage with no timestamp is shown as
    // not-yet-reached instead of being fabricated.
    timeline: {
      createdAt: b.createdAt || null,
      offerSentAt: b.offerSentAt || null,
      confirmedAt: b.confirmedAt || null,
      startedAt: b.startedAt || null,
      reachedAt: b.reachedAt || null,
      completedAt: b.completedAt || null,
      completedByClient: Boolean(b.completedByClient),
      isAutoCompleted: Boolean(b.isAutoCompleted),
      cancelledAt: b.cancelledAt || b.refundedAt || null,
      refundedAt: b.refundedAt || null,
      refundedToCardAt: b.refundedToCardAt || null,
      payoutReleasedAt: b.payoutReleasedAt || null,
      serviceDateAndTime: b.serviceDateAndTime || null,
    },
  };
}

/**
 * 14. Transactions — bookings with their payment detail.
 * @param {object} params - Search / filter / pagination options.
 * @return {Promise<{items: Array<object>, total: number, totalPages: number}>} Page.
 */
export async function fetchTransactionsFromFirestore(params = {}) {
  const {
    searchTerm = "",
    filterStatus = "All",
    filterCategory = "All",
    startDate = null,
    endDate = null,
    page = 1,
    limit = 8,
  } = params;

  try {
    const snapshot = await getDocs(
      query(collection(db, "bookings"), fsLimit(1000)),
    );
    if (snapshot.empty) return { items: [], total: 0, totalPages: 1 };

    // One lookup per distinct participant, not per booking.
    const uids = [
      ...new Set(
        snapshot.docs
          .flatMap((d) => {
            const b = d.data();
            return [b.clientId, b.providerId || b.professionalId];
          })
          .filter(Boolean),
      ),
    ];
    const users = new Map(
      (
        await Promise.all(
          uids.map(async (uid) => {
            try {
              const snap = await getDoc(doc(db, "users", uid));
              return snap.exists() ? [uid, snap.data()] : null;
            } catch {
              return null;
            }
          }),
        )
      ).filter(Boolean),
    );

    let items = snapshot.docs.map((d) => toTransaction(d.id, d.data(), users));

    if (filterCategory !== "All") {
      items = items.filter(
        (t) =>
          String(t.category).toLowerCase() === filterCategory.toLowerCase(),
      );
    }

    items.sort(
      (a, b) =>
        (toMillis(b.createdAtRaw) || 0) - (toMillis(a.createdAtRaw) || 0),
    );

    return filterAndPaginate(items, {
      searchTerm,
      searchFields: ["id", "category"],
      filterStatus,
      startDate,
      endDate,
      page,
      limit,
    });
  } catch (error) {
    console.error("Firestore fetchTransactions error:", error);
    throw error;
  }
}

/**
 * 15. A single transaction, for the detail screen.
 * @param {string} id - Booking document id.
 * @return {Promise<object|null>} The transaction, or null if absent.
 */
export async function fetchTransactionByIdFromFirestore(id) {
  if (!id) return null;
  try {
    const snap = await getDoc(doc(db, "bookings", id));
    if (!snap.exists()) return null;
    const b = snap.data();

    const uids = [b.clientId, b.providerId || b.professionalId].filter(Boolean);
    const users = new Map(
      (
        await Promise.all(
          uids.map(async (uid) => {
            try {
              const u = await getDoc(doc(db, "users", uid));
              return u.exists() ? [uid, u.data()] : null;
            } catch {
              return null;
            }
          }),
        )
      ).filter(Boolean),
    );

    return toTransaction(snap.id, b, users);
  } catch (error) {
    console.error("Firestore fetchTransactionById error:", error);
    throw error;
  }
}

/** Schema v3.0 §10 dispute statuses → the three the UI groups by. */
const DISPUTE_STATUS_LABELS = {
  open: "Open",
  underreview: "Under Review",
  // resolveDispute writes a plain "resolved"; the specific outcome lives in
  // the separate `resolution` field. Without this the label fell through to
  // the raw value and the Resolve button stayed on screen after resolving.
  resolved: "Resolved",
  resolvedinclientfavor: "Resolved",
  resolvedinproviderfavor: "Resolved",
  resolvedsplit: "Resolved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

/**
 * Display label plus the specific outcome, which "Resolved" alone loses.
 * @param {string} raw - Stored status.
 * @return {{label: string, outcome: string|null}} Display status.
 */
function disputeStatus(raw, resolution) {
  const key = String(raw || "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  const byResolution = {
    client_favour: "Favoured client",
    provider_favour: "Favoured provider",
    split: "Split decision",
  }[resolution];

  const outcome =
    byResolution ||
    (key === "resolvedinclientfavor"
      ? "Favoured client"
      : key === "resolvedinproviderfavor"
        ? "Favoured provider"
        : key === "resolvedsplit"
          ? "Split decision"
          : null);
  // Whether an admin can still act. Comparing against the "Resolved" label
  // alone let a rejected or withdrawn dispute keep its Claim and Resolve
  // buttons, because those carry different labels.
  const isClosed = !["open", "underreview"].includes(key);

  return {
    label: DISPUTE_STATUS_LABELS[key] || raw || "Open",
    outcome,
    isClosed,
  };
}

/**
 * Shapes one dispute for the list and detail screens.
 * @param {string} id - Dispute document id.
 * @param {object} d - Dispute data.
 * @param {Map<string, object>} users - uid → user data.
 * @return {object} Dispute row.
 */
/**
 * Builds the dispute's timeline from the timestamps actually recorded.
 *
 * There is no stored timeline array — `dispute.timeline` was simply never set,
 * so the tab rendered an empty list on every dispute. Each entry below comes
 * from a field the backend writes, and an entry is omitted rather than shown
 * blank when its timestamp is missing.
 *
 * @param {object} d - Raw dispute document.
 * @param {object} [booking] - The disputed booking, when it could be read.
 * @return {Array<{event: string, time: string, at: number}>} Oldest first.
 */
function buildDisputeTimeline(d, booking) {
  const entries = [];
  const add = (ts, event) => {
    const at = toMillis(ts);
    if (at === null) return;
    entries.push({ event, time: formatFirestoreDateTime(ts), at });
  };

  // Booking milestones give the dispute its context — what happened before
  // anyone complained.
  if (booking) {
    add(booking.createdAt, "Booking created");
    add(booking.confirmedAt, "Payment received, booking confirmed");
    add(booking.completedAt, "Service marked complete");
    if (
      String(booking.status || "")
        .toLowerCase()
        .includes("cancel")
    ) {
      add(booking.cancelledAt || booking.updatedAt, "Booking cancelled");
    }
  }

  const opener =
    d.raisedBy === "provider" ? "provider" : d.raisedBy || "client";
  add(d.createdAt, `Dispute opened by ${opener}`);

  if ((d.attachments || []).length > 0) {
    // Attachments carry no timestamp of their own, so they are pinned to the
    // moment the dispute was raised, which is when the app uploads them.
    const n = d.attachments.length;
    add(d.createdAt, `${n} piece${n === 1 ? "" : "s"} of evidence attached`);
  }

  add(
    d.claimedAt,
    d.claimedByEmail
      ? `Claimed for review by ${d.claimedByEmail}`
      : "Claimed for review",
  );

  add(d.lastMessageAt, "Latest message in the dispute chat");

  if (d.resolvedAt) {
    const outcome =
      {
        client_favour: "in the client's favour",
        provider_favour: "in the provider's favour",
        split: "as a split",
      }[d.resolution] || "";
    add(d.resolvedAt, `Dispute resolved ${outcome}`.trim());
  }

  return entries.sort((a, b) => a.at - b.at);
}

function toDispute(id, d, users, booking) {
  const client = users.get(d.clientId) || null;
  const provider = users.get(d.providerId) || null;
  const { label, outcome, isClosed } = disputeStatus(d.status, d.resolution);

  return {
    id,
    txnId: d.bookingId || "—",
    bookingId: d.bookingId || null,
    clientId: d.clientId || null,
    providerId: d.providerId || null,
    client: client ? displayName(client, "Client") : "Unknown client",
    clientEmail: client?.email || "",
    provider: provider ? displayName(provider, "Provider") : "Unassigned",
    providerEmail: provider?.email || "",
    category: d.serviceTitle || "—",
    dateOpened: formatFirestoreDate(d.createdAt),
    createdAtRaw: d.createdAt || null,
    status: label,
    outcome,
    isClosed,
    rawStatus: d.status || "",
    raisedBy: d.raisedBy || null,
    reason: d.reason || "—",
    description: d.description || "",
    serviceAmount: Number(d.bookingAmount) || 0,
    refundAmount: Number(d.refundAmount) || 0,
    creditAmount: Number(d.creditAmount) || 0,
    attachments: d.attachments || [],
    resolutionNote: d.resolutionNote || "",
    resolvedBy: d.resolvedBy || null,
    resolvedAt: formatFirestoreDateTime(d.resolvedAt),
    timeline: buildDisputeTimeline(d, booking),
  };
}

/**
 * 16. Disputes.
 * @param {object} params - Search / filter / pagination options.
 * @return {Promise<Array<object>>} Disputes, newest first.
 */
export async function fetchDisputesFromFirestore() {
  try {
    const snapshot = await getDocs(
      query(collection(db, "disputes"), fsLimit(500)),
    );
    if (snapshot.empty) return [];

    const uids = [
      ...new Set(
        snapshot.docs
          .flatMap((d) => [d.data().clientId, d.data().providerId])
          .filter(Boolean),
      ),
    ];
    const users = new Map(
      (
        await Promise.all(
          uids.map(async (uid) => {
            try {
              const u = await getDoc(doc(db, "users", uid));
              return u.exists() ? [uid, u.data()] : null;
            } catch {
              return null;
            }
          }),
        )
      ).filter(Boolean),
    );

    return snapshot.docs
      .map((d) => toDispute(d.id, d.data(), users))
      .sort(
        (a, b) =>
          (toMillis(b.createdAtRaw) || 0) - (toMillis(a.createdAtRaw) || 0),
      );
  } catch (error) {
    console.error("Firestore fetchDisputes error:", error);
    throw error;
  }
}

/**
 * 17. One dispute, for the detail screen.
 * @param {string} id - Dispute document id.
 * @return {Promise<object|null>} The dispute, or null.
 */
export async function fetchDisputeByIdFromFirestore(id) {
  if (!id) return null;
  try {
    const snap = await getDoc(doc(db, "disputes", id));
    if (!snap.exists()) return null;
    const d = snap.data();

    const users = new Map(
      (
        await Promise.all(
          [d.clientId, d.providerId].filter(Boolean).map(async (uid) => {
            try {
              const u = await getDoc(doc(db, "users", uid));
              return u.exists() ? [uid, u.data()] : null;
            } catch {
              return null;
            }
          }),
        )
      ).filter(Boolean),
    );

    // The booking supplies the timeline's earlier milestones. A missing one
    // must not fail the page, so the timeline simply starts at the dispute.
    let booking = null;
    if (d.bookingId) {
      try {
        const b = await getDoc(doc(db, "bookings", d.bookingId));
        if (b.exists()) booking = b.data();
      } catch (_) {
        // Ignored deliberately — see above.
      }
    }

    return toDispute(snap.id, d, users, booking);
  } catch (error) {
    console.error("Firestore fetchDisputeById error:", error);
    throw error;
  }
}

/**
 * 18. The chat thread for a booking, as the dispute screen renders it.
 *
 * Threads live at chat/{chatId} keyed on the booking, with messages in a
 * subcollection. Sender is a DocumentReference, so each message is attributed
 * by comparing it against the thread's client and provider.
 *
 * @param {object} params - Options.
 * @param {string} params.bookingId - Booking the thread belongs to.
 * @param {string} params.clientId - For attributing senders.
 * @return {Promise<{chatId: string|null, messages: Array<object>}>} The thread.
 */
export async function fetchDisputeChatFromFirestore({
  bookingId,
  clientId,
  providerId,
} = {}) {
  if (!bookingId) return { chatId: null, messages: [] };

  try {
    // Threads are per client-provider pair, not per booking: one thread
    // carries every booking those two have discussed, listed in bookingIds.
    // The top-level bookingId field is only the most recent one, so matching
    // on it finds nothing for any earlier booking — which is why an older
    // booking's dispute showed an empty conversation.
    let chatDoc = null;

    const byBookingIds = await getDocs(
      query(
        collection(db, "chat"),
        where("bookingIds", "array-contains", bookingId),
      ),
    ).catch(() => ({ empty: true, docs: [] }));

    if (!byBookingIds.empty) {
      chatDoc = byBookingIds.docs[0];
    } else if (clientId && providerId) {
      // Direct id, for threads written before bookingIds existed. Both
      // orderings are tried because the id depends on who opened it.
      for (const id of [
        `direct_${clientId}_${providerId}`,
        `direct_${providerId}_${clientId}`,
      ]) {
        const snap = await getDoc(doc(db, "chat", id));
        if (snap.exists()) {
          chatDoc = snap;
          break;
        }
      }
    }

    if (!chatDoc) {
      // Last resorts: the per-booking convention and the single-booking field.
      const legacy = await getDoc(doc(db, "chat", `booking_${bookingId}`));
      if (legacy.exists()) {
        chatDoc = legacy;
      } else {
        const byBookingId = await getDocs(
          query(collection(db, "chat"), where("bookingId", "==", bookingId)),
        ).catch(() => ({ empty: true, docs: [] }));
        if (byBookingId.empty) return { chatId: null, messages: [] };
        chatDoc = byBookingId.docs[0];
      }
    }

    const chat = chatDoc.data();
    const snapshot = await getDocs(
      query(
        collection(db, "chat", chatDoc.id, "messages"),
        orderBy("createdAt", "asc"),
        fsLimit(300),
      ),
    );

    const messages = snapshot.docs.map((m) => {
      const msg = m.data();
      const senderUid = msg.senderRef?.id || null;
      const role =
        msg.isAdminMessage || msg.senderRole === "admin"
          ? "admin"
          : senderUid && senderUid === (clientId || chat.clientId)
            ? "client"
            : "provider";

      // Booking-type messages carry JSON rather than prose.
      let text = msg.message || "";
      if (msg.messageType === "booking") {
        try {
          const parsed = JSON.parse(text);
          text =
            `Booking ${parsed.bookingId || ""} — ${parsed.service || ""}, ${parsed.date || ""} ${parsed.time || ""}`.trim();
        } catch {
          // Leave the raw text if it is not the expected JSON.
        }
      }

      return {
        id: m.id,
        role,
        sender:
          role === "admin"
            ? msg.senderEmail || "Netly admin"
            : role === "client"
              ? chat.clientName || "Client"
              : chat.professionalName || "Provider",
        text,
        image: msg.image || "",
        messageType: msg.messageType || "text",
        time: formatFirestoreDateTime(msg.createdAt),
        createdAtRaw: msg.createdAt || null,
      };
    });

    return { chatId: chatDoc.id, messages, chat };
  } catch (error) {
    console.error("Firestore fetchDisputeChat error:", error);
    throw error;
  }
}

/**
 * 5. Admin accounts, for the Admin Settings table.
 *
 * Revoked admins are retained in Firestore for the audit trail but excluded
 * from the management table.
 * @return {Promise<Array<object>>} Admin rows.
 */
export async function fetchAdminsFromFirestore() {
  try {
    const users = await loadUsersByType("admin");
    return users
      .map(({ uid, data }) => ({
        uid,
        id: uid,
        name: displayName(data, "Admin"),
        email: data.email || "",
        role: data.role || null,
        status: data.status || "active",
        phoneNumber: data.phoneNumber || "",
        lastLogin: formatFirestoreDateTime(data.lastLoginAt),
        createdAtRaw: data.createdAt || data.invitedAt || null,
        invitedByEmail: data.invitedByEmail || null,
      }))
      .filter((item) => item.status !== "revoked")
      .sort(
        (a, b) =>
          (toMillis(b.createdAtRaw) || 0) - (toMillis(a.createdAtRaw) || 0),
      );
  } catch (error) {
    console.error("Firestore fetchAdmins error:", error);
    throw error;
  }
}

/* ══════════════════════════════════════════════════════════════════
 * FINANCE & SETTINGS
 * ════════════════════════════════════════════════════════════════ */

/**
 * Reads a collection, tolerating one that does not exist or is unreadable.
 *
 * Several finance collections only appear once the first document is written,
 * so a missing collection is a normal state rather than an error.
 *
 * @param {string} name - Collection name.
 * @return {Promise<Array<object>>} Documents, id included.
 */
async function safeCollection(name) {
  try {
    const snap = await getDocs(collection(db, name));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn(
      `finance: could not read ${name}:`,
      error?.code || error?.message,
    );
    return [];
  }
}

/**
 * Has this booking been paid for?
 *
 * A PaymentIntent alone is not sufficient: a booking fully covered by wallet
 * credit may never reach Stripe, so it would be missing from every revenue
 * report. Status past Confirmed is the other proof of payment, since
 * onPaymentSucceeded is what sets it.
 *
 * @param {object} b - Booking document.
 * @return {boolean} True when money has changed hands.
 */
function isPaidBooking(b) {
  if (b.stripePaymentIntentId) return true;
  const st = String(b.status || "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  return [
    "confirmed",
    "inprogress",
    "completedbyprovider",
    "completed",
  ].includes(st);
}

/**
 * Has this booking's entire charge been given back?
 *
 * isPaidBooking only asks whether money ever changed hands, which a refunded
 * booking still satisfies — it has a PaymentIntent. Counting one as revenue
 * overstates every finance report: a provider-cancelled booking refunded in
 * full was contributing its GMV, its client fee and its commission to the
 * totals despite Netly keeping none of it.
 *
 * Partial refunds are deliberately left in. Under the cancellation policy the
 * 5% client fee is never returned and the platform does keep something, but
 * exactly how much commission survives a partial refund is an accounting
 * decision, not something to infer here.
 *
 * @param {object} b - Booking document.
 * @return {boolean} True when nothing was retained.
 */
function isFullyRefunded(b) {
  const charged = Number(b.totalChargedToClient) || 0;
  if (charged <= 0) return false;
  // Half a cent of tolerance, so rounding cannot leave a booking half-counted.
  return (Number(b.refundAmount) || 0) >= charged - 0.005;
}

/** Inclusive day-boundary range test built from a start/end pair. */
function rangeTest(startDate, endDate) {
  const from = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
  const to = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;
  return {
    from,
    to,
    inRange: (ts) => {
      const at = toMillis(ts);
      if (at === null) return false;
      if (from !== null && at < from) return false;
      if (to !== null && at > to) return false;
      return true;
    },
  };
}

/**
 * Buckets dated amounts into one entry per day across the range.
 *
 * @param {object} params - Options.
 * @param {number} params.from - Range start in ms.
 * @param {number} params.to - Range end in ms.
 * @param {object} params.serieses - Map of key → [{at, amount}].
 * @return {Array<object>} One row per day: {day, label, date, ...keys}.
 */
function dailySeries({ from, to, serieses }) {
  const rows = [];
  if (from === null || to === null) return rows;

  for (let t = from; t <= to; t += 86400000) {
    const next = t + 86400000;
    const d = new Date(t);
    const row = {
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      date: d.toISOString().slice(0, 10),
    };
    for (const [key, events] of Object.entries(serieses)) {
      row[key] =
        Math.round(
          events
            .filter((e) => e.at >= t && e.at < next)
            .reduce((a, e) => a + e.amount, 0) * 100,
        ) / 100;
    }
    rows.push(row);
    if (rows.length >= 62) break;
  }
  return rows;
}

/**
 * 19. The signed-in admin's own profile.
 *
 * Reads the users document rather than the auth token, because the token only
 * carries uid/email/role — the name and phone live in Firestore.
 *
 * @param {string} uid - The admin's uid.
 * @return {Promise<object|null>} Profile fields, or null when absent.
 */
export async function fetchAdminProfileFromFirestore(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    const d = snap.data();

    // Names are stored variously across records; derive both halves from
    // whichever fields are present so the form never opens blank.
    const full = (d.fullName || d.name || "").trim();
    const first = d.firstName || full.split(" ")[0] || "";
    const last = d.lastName || full.split(" ").slice(1).join(" ") || "";

    return {
      uid,
      firstName: first,
      lastName: last,
      fullName: full || `${first} ${last}`.trim(),
      email: d.email || "",
      phoneNumber: d.phoneNumber || d.phone || "",
      role: d.role || d.adminRole || "",
      status: titleCase(d.status, "Active"),
      createdAtRaw: d.createdAt || null,
      lastLoginRaw: d.lastLoginAt || null,
    };
  } catch (error) {
    console.error("Firestore fetchAdminProfile error:", error);
    throw error;
  }
}

/**
 * 20. Provider payout queue — who is owed what, and what has been paid.
 *
 * Under the weekly model a provider's wallet splits in two: reservedAmount is
 * the current Mon–Sun week and is not payable, activeAmount cleared last week
 * and goes out this Friday. The queue shows both, because "wallet balance"
 * alone would imply the whole figure is due.
 *
 * @param {object} params - Options.
 * @param {string} params.searchTerm - Free-text filter.
 * @param {string} params.status - "All" or a payout status.
 * @param {number} params.page - 1-based page.
 * @param {number} params.limit - Page size.
 * @return {Promise<object>} Paginated rows plus totals.
 */
export async function fetchPayoutQueueFromFirestore(params = {}) {
  const { searchTerm = "", status = "All", page = 1, limit = 8 } = params;

  try {
    const providers = await loadUsersByType("provider");
    const uids = providers.map((p) => p.uid);

    const [profiles, wallets, payoutLogs, bookings] = await Promise.all([
      loadProfileMap("provider", uids),
      loadProfileMap("walletProvider", uids),
      safeCollection("payout_logs"),
      safeCollection("bookings"),
    ]);

    // Most recent payout attempt per provider, and completed-booking counts.
    const lastPayout = new Map();
    payoutLogs.forEach((log) => {
      const at = toMillis(log.processedAt);
      const prev = lastPayout.get(log.cleanerId);
      if (!prev || (at !== null && at > prev.at)) {
        lastPayout.set(log.cleanerId, { ...log, at });
      }
    });

    const completedCount = new Map();
    bookings.forEach((b) => {
      if (String(b.status || "").toLowerCase() !== "completed") return;
      const pid = b.providerId || b.professionalId;
      if (pid) completedCount.set(pid, (completedCount.get(pid) || 0) + 1);
    });

    const items = providers.map(({ uid, data }) => {
      const profile = profiles.get(uid) || {};
      const wallet = wallets.get(uid) || {};
      const reserved = Number(wallet.reservedAmount) || 0;
      const active = Number(wallet.activeAmount) || 0;
      const balance = Number(wallet.balance ?? profile.walletBalance) || 0;
      const last = lastPayout.get(uid);
      const payoutReady = Boolean(
        profile.stripeAccountId && profile.payoutsEnabled,
      );

      // Status describes what happens next, which is what an admin needs to
      // know — not merely what happened last.
      let payoutStatus;
      let statusDesc;
      if (!payoutReady) {
        payoutStatus = "Blocked";
        statusDesc = profile.stripeAccountId
          ? "Stripe payouts not yet enabled"
          : "No Stripe Connect account";
      } else if (last?.status === "failed") {
        payoutStatus = "Failed";
        statusDesc = last.errorMessage || "Last transfer failed";
      } else if (active > 0) {
        payoutStatus = "Pending";
        statusDesc = "Payable this Friday";
      } else if (reserved > 0) {
        payoutStatus = "Reserved";
        statusDesc = "Seasoning until Sunday close";
      } else {
        payoutStatus = "Nothing due";
        statusDesc = "No balance to pay";
      }

      return {
        id: uid,
        uid,
        provider: displayName(data, "Provider"),
        email: data.email || "",
        initials:
          displayName(data, "Provider")
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase())
            .join("") || "P",
        walletBalance: balance,
        reserved,
        active,
        walletStatus: payoutReady ? "Ready for payout" : "Pending verification",
        payoutReady,
        completedBookings: completedCount.get(uid) || 0,
        lastPayoutDate: last ? formatFirestoreDate(last.processedAt) : "—",
        lastPayoutAmount: last ? Number(last.amount) || 0 : null,
        transferredAmount:
          last?.status === "succeeded" ? Number(last.amount) || 0 : null,
        stripeTransferId: last?.stripeTransferId || null,
        weekKey: last?.weekKey || null,
        status: payoutStatus,
        statusDesc,
      };
    });

    items.sort((a, b) => b.active - a.active || b.reserved - a.reserved);

    const result = filterAndPaginate(items, {
      searchTerm,
      searchFields: ["provider", "email"],
      filterStatus: status,
      statusField: "status",
      page,
      limit,
    });

    return {
      ...result,
      totals: {
        payableFriday: items.reduce((a, i) => a + i.active, 0),
        reserved: items.reduce((a, i) => a + i.reserved, 0),
        blocked: items.filter((i) => !i.payoutReady).length,
        providers: items.length,
      },
    };
  } catch (error) {
    console.error("Firestore fetchPayoutQueue error:", error);
    throw error;
  }
}

/**
 * 21. Finance report series — one call serves all four report tabs.
 *
 * Every tab is a daily aggregation over bookings, so they share one read
 * instead of four. Amounts come from the fee fields sendOffer wrote onto the
 * booking, which is what the money actually was at the time — recomputing from
 * percentages would silently rewrite history if a fee rate ever changes.
 *
 * @param {object} params - Options.
 * @param {Date} params.startDate - Range start.
 * @param {Date} params.endDate - Range end.
 * @return {Promise<object>} {volume, revenue, funding, totals}.
 */
export async function fetchFinanceReportsFromFirestore({
  startDate,
  endDate,
} = {}) {
  const { from, to, inRange } = rangeTest(startDate, endDate);

  try {
    const [bookings, creditRequests, withdrawals] = await Promise.all([
      safeCollection("bookings"),
      safeCollection("wallet_credit_requests"),
      safeCollection("withdrawal_requests"),
    ]);

    const paid = bookings.filter(
      (b) =>
        isPaidBooking(b) &&
        !isFullyRefunded(b) &&
        inRange(b.confirmedAt || b.createdAt),
    );
    const at = (b) => toMillis(b.confirmedAt || b.createdAt);
    const num = (v) => Number(v) || 0;

    // ── Transaction volume: bookings + GMV ──────────────────
    const volume = dailySeries({
      from,
      to,
      serieses: {
        gmv: paid.map((b) => ({ at: at(b), amount: num(b.transactionAmount) })),
        bookings: paid.map((b) => ({ at: at(b), amount: 1 })),
      },
    });

    // ── Net revenue: the 5% client fee vs the 15% provider commission ──
    // platformRevenue is the sum of both; the commission is the remainder.
    const revenue = dailySeries({
      from,
      to,
      serieses: {
        fee: paid.map((b) => ({ at: at(b), amount: num(b.clientServiceFee) })),
        commission: paid.map((b) => ({
          at: at(b),
          amount: num(b.platformRevenue) - num(b.clientServiceFee),
        })),
      },
    });

    // ── Funding mix: wallet credit applied vs card charged ──
    const funding = dailySeries({
      from,
      to,
      serieses: {
        wallet: paid.map((b) => ({ at: at(b), amount: num(b.creditAmount) })),
        card: paid.map((b) => ({
          at: at(b),
          amount: num(b.totalChargedToClient) - num(b.creditAmount),
        })),
      },
    });

    // ── Refund split: money that left vs money retained as credit ──
    const approved = (r) => String(r.status || "").toLowerCase() === "approved";
    const refunds = dailySeries({
      from,
      to,
      serieses: {
        toCard: withdrawals.filter(approved).map((w) => ({
          at: toMillis(w.resolvedAt),
          amount: num(w.refundedAmount ?? w.amount),
        })),
        toWallet: creditRequests.filter(approved).map((r) => ({
          at: toMillis(r.resolvedAt || r.createdAt),
          amount: num(r.amount),
        })),
      },
    });

    const sum = (key) => (list) =>
      Math.round(list.reduce((a, r) => a + (r[key] || 0), 0) * 100) / 100;

    return {
      volume,
      revenue,
      funding,
      refunds,
      totals: {
        bookings: paid.length,
        gmv: sum("gmv")(volume),
        fees: sum("fee")(revenue),
        commission: sum("commission")(revenue),
        netRevenue: sum("fee")(revenue) + sum("commission")(revenue),
        walletFunded: sum("wallet")(funding),
        cardFunded: sum("card")(funding),
        refundedToCard: sum("toCard")(refunds),
        retainedAsCredit: sum("toWallet")(refunds),
      },
    };
  } catch (error) {
    console.error("Firestore fetchFinanceReports error:", error);
    throw error;
  }
}

/**
 * 22. Monthly accounting — a transaction list plus a per-month roll-up.
 *
 * @param {object} params - Options.
 * @param {string} params.searchTerm - Free-text filter.
 * @param {number} params.year - Calendar year to roll up.
 * @param {number} params.page - 1-based page.
 * @param {number} params.limit - Page size.
 * @return {Promise<object>} Paginated rows plus the 12-month series.
 */
export async function fetchMonthlyAccountingFromFirestore(params = {}) {
  const {
    searchTerm = "",
    year = new Date().getFullYear(),
    page = 1,
    limit = 10,
  } = params;

  try {
    const [bookings, clients, providers] = await Promise.all([
      safeCollection("bookings"),
      loadUsersByType("client"),
      loadUsersByType("provider"),
    ]);

    const nameOf = new Map();
    [...clients, ...providers].forEach(({ uid, data }) =>
      nameOf.set(uid, displayName(data, "Account")),
    );

    const paid = bookings.filter(
      (b) => isPaidBooking(b) && !isFullyRefunded(b),
    );
    const num = (v) => Number(v) || 0;

    const items = paid
      .map((b) => {
        const ts = b.confirmedAt || b.createdAt;
        return {
          id: b.stripePaymentIntentId || b.id,
          bookingId: b.id,
          date: formatFirestoreDate(ts),
          time: formatFirestoreDateTime(ts).split(", ").pop() || "",
          createdAtRaw: ts || null,
          client: nameOf.get(b.clientId) || "—",
          provider: nameOf.get(b.providerId || b.professionalId) || "—",
          category: b.serviceTitle || b.categoryName || "—",
          gross: num(b.totalChargedToClient),
          net: num(b.transactionAmount),
          fee: num(b.clientServiceFee),
          commission: num(b.platformRevenue) - num(b.clientServiceFee),
          providerPayout: num(b.providerPayout),
          status: titleCase(b.status, "—"),
        };
      })
      .sort(
        (a, b) =>
          (toMillis(b.createdAtRaw) || 0) - (toMillis(a.createdAtRaw) || 0),
      );

    // ── 12-month roll-up for the chart ──────────────────────
    const months = Array.from({ length: 12 }, (_, m) => ({
      month: new Date(year, m, 1).toLocaleDateString("en-US", {
        month: "short",
      }),
      volume: 0,
      amount: 0,
      fees: 0,
      commission: 0,
      payout: 0,
    }));
    items.forEach((it) => {
      const d = toDate(it.createdAtRaw);
      if (!d || d.getFullYear() !== Number(year)) return;
      const m = months[d.getMonth()];
      m.volume += 1;
      m.amount += it.gross;
      m.fees += it.fee;
      m.commission += it.commission;
      m.payout += it.providerPayout;
    });
    months.forEach((m) => {
      ["amount", "fees", "commission", "payout"].forEach((k) => {
        m[k] = Math.round(m[k] * 100) / 100;
      });
    });

    return {
      ...filterAndPaginate(items, {
        searchTerm,
        searchFields: ["id", "client", "provider", "category"],
        filterStatus: "All",
        page,
        limit,
      }),
      months,
      year: Number(year),
    };
  } catch (error) {
    console.error("Firestore fetchMonthlyAccounting error:", error);
    throw error;
  }
}

/**
 * 23. Fee report — what Netly charged, split by side.
 *
 * @param {object} params - Options.
 * @param {Date} params.startDate - Range start.
 * @param {Date} params.endDate - Range end.
 * @return {Promise<object>} Daily series plus totals.
 */
export async function fetchFeeReportFromFirestore({ startDate, endDate } = {}) {
  const { from, to, inRange } = rangeTest(startDate, endDate);

  try {
    const bookings = await safeCollection("bookings");
    const paid = bookings.filter(
      (b) =>
        isPaidBooking(b) &&
        !isFullyRefunded(b) &&
        inRange(b.confirmedAt || b.createdAt),
    );
    const at = (b) => toMillis(b.confirmedAt || b.createdAt);
    const num = (v) => Number(v) || 0;

    const series = dailySeries({
      from,
      to,
      serieses: {
        clientFee: paid.map((b) => ({
          at: at(b),
          amount: num(b.clientServiceFee),
        })),
        providerCommission: paid.map((b) => ({
          at: at(b),
          amount: num(b.platformRevenue) - num(b.clientServiceFee),
        })),
        total: paid.map((b) => ({ at: at(b), amount: num(b.platformRevenue) })),
      },
    });

    const total = (k) =>
      Math.round(series.reduce((a, r) => a + (r[k] || 0), 0) * 100) / 100;

    return {
      series,
      totals: {
        clientFee: total("clientFee"),
        providerCommission: total("providerCommission"),
        total: total("total"),
        bookings: paid.length,
        // The effective take rate can drift from 20% when a booking predates a
        // fee change, so it is measured rather than assumed.
        effectiveRate: (() => {
          const gmv = paid.reduce((a, b) => a + num(b.transactionAmount), 0);
          return gmv > 0 ? Math.round((total("total") / gmv) * 1000) / 10 : 0;
        })(),
      },
    };
  } catch (error) {
    console.error("Firestore fetchFeeReport error:", error);
    throw error;
  }
}

/* ══════════════════════════════════════════════════════════════════
 * SERVICE CATALOGUE
 * ════════════════════════════════════════════════════════════════ */

/**
 * 24. The admin-managed service catalogue.
 *
 * `category` holds the catalogue; sub-services live in an embedded
 * `subCategory` array, not a subcollection, so they have no document id — the
 * English name identifies them, which is also how provider listings link back
 * via `subcategoryName`.
 *
 * Not to be confused with `services`, which is provider-created listings.
 * Those are counted here as usage, and are what blocks a delete.
 *
 * Bookings reach a category through their `serviceId`, because `categoryId` on
 * a booking is a slug that does not match the category document id.
 *
 * @return {Promise<Array<object>>} Categories with counts and sub-services.
 */
export async function fetchCategoriesFromFirestore() {
  try {
    const [catSnap, svcSnap, bookingSnap] = await Promise.all([
      getDocs(collection(db, "category")),
      safeCollection("services"),
      safeCollection("bookings"),
    ]);

    // ── listing counts, keyed by category name and sub-service name ──
    const listingsByCat = new Map();
    const listingsBySub = new Map();
    svcSnap.forEach((s) => {
      const cat = String(s.categoryName || "").toLowerCase();
      const sub = String(s.subcategoryName || "").toLowerCase();
      listingsByCat.set(cat, (listingsByCat.get(cat) || 0) + 1);
      listingsBySub.set(
        `${cat}||${sub}`,
        (listingsBySub.get(`${cat}||${sub}`) || 0) + 1,
      );
    });

    // ── bookings, resolved through the listing they were made against ──
    const svcById = new Map(svcSnap.map((s) => [s.id, s]));
    const bookingsByCat = new Map();
    const bookingsBySub = new Map();
    bookingSnap.forEach((b) => {
      const svc = svcById.get(b.serviceId);
      if (!svc) return;
      const cat = String(svc.categoryName || "").toLowerCase();
      const sub = String(svc.subcategoryName || "").toLowerCase();
      bookingsByCat.set(cat, (bookingsByCat.get(cat) || 0) + 1);
      bookingsBySub.set(
        `${cat}||${sub}`,
        (bookingsBySub.get(`${cat}||${sub}`) || 0) + 1,
      );
    });

    return catSnap.docs
      .map((docSnap) => {
        const d = docSnap.data();
        const catKey = String(d.name || "").toLowerCase();

        return {
          id: docSnap.id,
          name: d.name || "",
          frenchName: d.french_name || "",
          image: d.image || "",
          hasPhoto: Boolean(d.image),
          // Absent means active: the flag postdates the existing documents.
          active: d.isActive !== false,
          listingsCount: listingsByCat.get(catKey) || 0,
          bookings: bookingsByCat.get(catKey) || 0,
          createdAtRaw: d.created_at || null,

          subServices: (d.subCategory || []).map((sub) => {
            const subKey = `${catKey}||${String(sub.name || "").toLowerCase()}`;
            return {
              // The name is the identifier — the backend addresses
              // sub-services by name, so the UI must too.
              id: sub.name,
              name: sub.name || "",
              frenchName: sub.french_name || "",
              message: sub.message || "",
              frenchMessage: sub.french_message || "",
              image: sub.image || "",
              hasPhoto: Boolean(sub.image),
              active: sub.isActive !== false,
              listingsCount: listingsBySub.get(subKey) || 0,
              bookings: bookingsBySub.get(subKey) || 0,
            };
          }),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Firestore fetchCategories error:", error);
    throw error;
  }
}

/**
 * 25. The platform's current fee rates.
 *
 * Reads app_settings/fees, falling back to the rates compiled into the Cloud
 * Functions. The fallback is duplicated here deliberately: the settings
 * document does not exist until an admin saves for the first time, and the
 * form has to show what is actually in force until then.
 *
 * @return {Promise<object>} The rates, plus where they came from.
 */
export async function fetchCommissionSettingsFromFirestore() {
  // Mirrors CLIENT_FEE_PERCENT / PROVIDER_FEE_PERCENT in the backend
  // constants. If those change, change these.
  const DEFAULTS = { clientFeePercent: 0.05, providerFeePercent: 0.15 };

  try {
    const snap = await getDoc(doc(db, "app_settings", "fees"));
    const d = snap.exists() ? snap.data() : null;

    const valid = (v) =>
      typeof v === "number" && Number.isFinite(v) && v >= 0 && v < 1;
    const clientFeePercent = valid(d?.clientFeePercent)
      ? d.clientFeePercent
      : DEFAULTS.clientFeePercent;
    const providerFeePercent = valid(d?.providerFeePercent)
      ? d.providerFeePercent
      : DEFAULTS.providerFeePercent;

    return {
      clientFeePercent,
      providerFeePercent,
      providerPayoutPercent:
        Math.round((1 - providerFeePercent) * 10000) / 10000,
      isDefault: !d,
      updatedAt: formatFirestoreDateTime(d?.updatedAt),
      updatedByEmail: d?.updatedByEmail || null,
    };
  } catch (error) {
    console.error("Firestore fetchCommissionSettings error:", error);
    throw error;
  }
}

/**
 * 26. Rate-change history, from the audit log.
 *
 * Every fee change is audited, so the history is the audit trail rather than a
 * second record that could drift from it.
 *
 * @param {number} max - Cap on entries.
 * @return {Promise<Array<object>>} Changes, newest first.
 */
export async function fetchFeeHistoryFromFirestore(max = 20) {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, "audit_logs"),
        where("action", "==", "settings.fees_updated"),
        orderBy("createdAt", "desc"),
        fsLimit(max),
      ),
    );

    const pct = (v) =>
      typeof v === "number" ? `${Math.round(v * 10000) / 100}%` : "—";

    return snapshot.docs.map((docSnap) => {
      const d = docSnap.data();
      const after = d.after || {};
      const before = d.before || {};
      return {
        id: docSnap.id,
        date: formatFirestoreDateTime(d.createdAt),
        createdAtRaw: d.createdAt || null,
        details:
          `${pct(after.clientFeePercent)} client · ` +
          `${pct(after.providerFeePercent)} commission` +
          (d.actorEmail ? ` by ${d.actorEmail}` : ""),
        previous:
          before.clientFeePercent === undefined
            ? null
            : `was ${pct(before.clientFeePercent)} / ${pct(before.providerFeePercent)}`,
        reason: d.reason || "",
      };
    });
  } catch (error) {
    // The history is supporting detail — a failure here must not stop an
    // admin seeing or changing the current rates.
    console.warn("fetchFeeHistory failed:", error?.code || error?.message);
    return [];
  }
}

/**
 * 27. Unmet demand, from availability_alerts.
 *
 * The app writes an alert whenever a client searches and no provider covers
 * their area, so this is a direct record of demand the marketplace could not
 * serve — not an inference from bookings, which by definition only record
 * demand that *was* met.
 *
 * The "gap" is the share of a city's alerts that are still unresolved; a city
 * where every alert has since been covered scores 0.
 *
 * @param {number} max - Cap on rows per list.
 * @return {Promise<{cities: Array<object>, searches: Array<object>,
 *   services: Array<object>, total: number}>} Ranked demand signals.
 */
export async function fetchUnmetDemandFromFirestore(max = 5) {
  try {
    const alerts = await safeCollection("availability_alerts");
    if (alerts.length === 0) {
      return { cities: [], searches: [], services: [], rows: [], total: 0 };
    }

    const unresolved = (a) =>
      String(a.status || "pending").toLowerCase() === "pending";

    // ── by city ──
    const byCity = new Map();
    alerts.forEach((a) => {
      const city = (a.city || "").trim();
      if (!city) return;
      const row = byCity.get(city) || {
        city,
        total: 0,
        pending: 0,
        province: a.province || "",
      };
      row.total += 1;
      if (unresolved(a)) row.pending += 1;
      byCity.set(city, row);
    });

    const cities = [...byCity.values()]
      .map((r) => ({
        ...r,
        gap: r.total > 0 ? Math.round((r.pending / r.total) * 100) : 0,
      }))
      .sort((a, b) => b.pending - a.pending || b.gap - a.gap)
      .slice(0, max);

    // ── by search term ──
    // searchQuery is often empty; the service the client was looking at is the
    // better signal, so it stands in when there is no typed query.
    const byTerm = new Map();
    alerts.forEach((a) => {
      const term =
        (a.searchQuery || "").trim() ||
        (a.serviceTitle || "").trim() ||
        (a.subcategoryName || "").trim();
      if (!term) return;
      byTerm.set(term, (byTerm.get(term) || 0) + 1);
    });

    const searches = [...byTerm.entries()]
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, max);

    // ── by service ──
    const bySvc = new Map();
    alerts.forEach((a) => {
      const name = (a.subcategoryName || a.categoryName || "").trim();
      if (!name) return;
      bySvc.set(name, (bySvc.get(name) || 0) + 1);
    });

    const services = [...bySvc.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, max);

    // ── one row per city+category, for the market-intelligence table ──
    const byPair = new Map();
    alerts.forEach((a) => {
      const city = (a.city || "").trim();
      const category = (
        a.subcategoryName ||
        a.serviceTitle ||
        a.categoryName ||
        ""
      ).trim();
      if (!city && !category) return;
      const key = `${city}||${category}`;
      const at = toMillis(a.createdAt);
      const row = byPair.get(key) || {
        id: key,
        city: city || "—",
        category: category || "—",
        province: a.province || "",
        count: 0,
        pending: 0,
        lastAt: null,
      };
      row.count += 1;
      if (unresolved(a)) row.pending += 1;
      // "Last search" is the most recent alert in this city/category pair.
      if (at !== null && (row.lastAt === null || at > row.lastAt))
        row.lastAt = at;
      byPair.set(key, row);
    });

    const rows = [...byPair.values()]
      .map((r) => ({
        ...r,
        date: r.lastAt ? formatFirestoreDate(new Date(r.lastAt)) : "N/A",
        dateTime: r.lastAt ? new Date(r.lastAt) : null,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      cities,
      searches,
      services,
      rows,
      total: alerts.length,
      pending: alerts.filter(unresolved).length,
    };
  } catch (error) {
    console.error("Firestore fetchUnmetDemand error:", error);
    throw error;
  }
}

/**
 * 28. Client withdrawal requests — the transfer queue an admin acts on.
 *
 * Distinct from payout_logs, which records provider payouts the Friday cron
 * already sent and which nobody authorises. These are client cash-outs sitting
 * pending: the funds are already held (debited at request time), so approving
 * settles the hold and rejecting returns it.
 *
 * @param {object} params - Options.
 * @param {string} params.searchTerm - Free-text filter.
 * @param {string} params.filterStatus - "All" or a status label.
 * @param {Date} params.startDate - Range start.
 * @param {Date} params.endDate - Range end.
 * @param {number} params.page - 1-based page.
 * @param {number} params.limit - Page size.
 * @return {Promise<object>} Paginated rows plus queue totals.
 */
export async function fetchWithdrawalRequestsFromFirestore(params = {}) {
  const {
    searchTerm = "",
    filterStatus = "All",
    startDate = null,
    endDate = null,
    page = 1,
    limit = 8,
  } = params;

  try {
    const requests = await safeCollection("withdrawal_requests");
    if (requests.length === 0) {
      return { items: [], total: 0, totalPages: 1, totals: null };
    }

    // Join to users for the display name; the request stores only a uid.
    const uids = [...new Set(requests.map((r) => r.userId).filter(Boolean))];
    const users = new Map();
    await Promise.all(
      uids.map(async (uid) => {
        try {
          const snap = await getDoc(doc(db, "users", uid));
          if (snap.exists()) users.set(uid, snap.data());
        } catch (_) {
          // A missing user must not drop the request from the queue.
        }
      }),
    );

    const STATUS = {
      pending: "Pending",
      approved: "Transferred",
      rejected: "Rejected",
      failed: "Error",
    };

    const items = requests
      .map((r) => {
        const raw = String(r.status || "pending").toLowerCase();
        const user = users.get(r.userId);
        return {
          id: r.id,
          requestId: r.id,
          uid: r.userId || null,
          client: {
            name: user ? displayName(user, "Client") : "Unknown client",
            email: user?.email || r.email || "",
          },
          name: user ? displayName(user, "Client") : "Unknown client",
          email: user?.email || r.email || "",
          amount: Number(r.amount) || 0,
          currency: (r.currency || "CAD").toUpperCase(),
          status: STATUS[raw] || titleCase(raw, "Pending"),
          rawStatus: raw,
          isPending: raw === "pending",
          // How much of this can go back to a card, priced when requested.
          refundable: Number(r.refundableAtRequest) || 0,
          nonRefundable: Number(r.nonRefundableAtRequest) || 0,
          requestedDate: formatFirestoreDate(r.createdAt),
          requestedTime: formatFirestoreDateTime(r.createdAt),
          createdAtRaw: r.createdAt || null,
          resolvedDate: formatFirestoreDate(r.resolvedAt),
          resolvedByEmail: r.resolvedByEmail || null,
          rejectionReason: r.rejectionReason || "",
          refundedAmount: Number(r.refundedAmount) || 0,
          transferredAmount: Number(r.transferredAmount) || 0,
          errorMessage: (r.failures || [])[0]?.error || "",
          txn: (r.stripeRefundIds || [])[0] || r.stripeTransferId || "-",
        };
      })
      // Pending first — they are the only rows that need a decision.
      .sort((a, b) => {
        if (a.isPending !== b.isPending) return a.isPending ? -1 : 1;
        return (
          (toMillis(b.createdAtRaw) || 0) - (toMillis(a.createdAtRaw) || 0)
        );
      });

    const result = filterAndPaginate(items, {
      searchTerm,
      searchFields: ["name", "email", "id"],
      filterStatus,
      statusField: "status",
      startDate,
      endDate,
      dateField: "createdAtRaw",
      page,
      limit,
    });

    return {
      ...result,
      totals: {
        pending: items.filter((i) => i.isPending).length,
        pendingAmount:
          Math.round(
            items.filter((i) => i.isPending).reduce((a, i) => a + i.amount, 0) *
              100,
          ) / 100,
        failed: items.filter((i) => i.rawStatus === "failed").length,
      },
    };
  } catch (error) {
    console.error("Firestore fetchWithdrawalRequests error:", error);
    throw error;
  }
}

/**
 * 29. Activity for one account, for the detail modals.
 *
 * Fetched per account when a modal opens rather than joined into the list
 * query — the list shows dozens of rows and only one is ever expanded, so
 * loading every account's bookings up front would be wasted reads.
 *
 * A client's activity is the bookings they placed; a provider's also includes
 * what they offer and the questions they ask, which live on their listings.
 *
 * @param {object} params - Options.
 * @param {string} params.uid - Account id.
 * @param {string} params.accountType - "client" or "provider".
 * @param {number} params.max - Cap on recent bookings (default 5).
 * @return {Promise<object>} Bookings, counts, and provider listing detail.
 */
export async function fetchAccountActivityFromFirestore({
  uid,
  accountType = "client",
  max = 5,
} = {}) {
  if (!uid) return null;
  const isClient = accountType === "client";

  try {
    const field = isClient ? "clientId" : "providerId";

    const [bookingSnap, disputeSnap, serviceSnap] = await Promise.all([
      getDocs(query(collection(db, "bookings"), where(field, "==", uid))).catch(
        () => ({ docs: [] }),
      ),
      getDocs(query(collection(db, "disputes"), where(field, "==", uid))).catch(
        () => ({ docs: [] }),
      ),
      isClient
        ? Promise.resolve({ docs: [] })
        : getDocs(
            query(collection(db, "services"), where("providerId", "==", uid)),
          ).catch(() => ({ docs: [] })),
    ]);

    const bookings = bookingSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Status colouring mirrors the transactions list so the same booking does
    // not appear in two different colours in two places.
    const CLASSES = {
      Completed: "bg-emerald-50 text-emerald-600",
      Finalised: "bg-emerald-50 text-emerald-600",
      "In Progress": "bg-orange-50 text-orange-600",
      Confirmed: "bg-blue-50 text-blue-600",
      Refunded: "bg-blue-50 text-blue-600",
      Dispute: "bg-red-50 text-red-600",
    };

    const recent = bookings
      .map((b) => {
        const label = transactionStatus(b);
        return {
          id: b.id,
          category: b.serviceTitle || b.categoryId || "Service",
          date: formatFirestoreDate(b.serviceDateAndTime || b.createdAt),
          createdAtRaw: b.createdAt || b.serviceDateAndTime || null,
          amount:
            Number(b.totalChargedToClient) || Number(b.transactionAmount) || 0,
          status: label,
          statusClass: CLASSES[label] || "bg-secondary-bg text-text-muted",
        };
      })
      .sort(
        (a, b) =>
          (toMillis(b.createdAtRaw) || 0) - (toMillis(a.createdAtRaw) || 0),
      )
      .slice(0, max);

    const norm = (v) => String(v || "").toLowerCase();
    const cancelled = bookings.filter((b) =>
      norm(b.status).startsWith("cancel"),
    ).length;
    const completed = bookings.filter(
      (b) => norm(b.status) === "completed",
    ).length;

    // ── Provider listings: what they offer and what they ask ──
    const services = serviceSnap.docs.map((d) => d.data());
    const offered = [
      ...new Set(
        services
          .filter((s) => norm(s.status) === "active")
          .map((s) => s.subcategoryName || s.serviceName)
          .filter(Boolean),
      ),
    ];
    const questions = [];
    services.forEach((s) => {
      (s.ServiceQuestions || []).forEach((q) => {
        const text = typeof q === "string" ? q : q?.question;
        if (text && !questions.includes(text)) questions.push(text);
      });
    });

    return {
      uid,
      accountType,
      recentBookings: recent,
      totalBookings: bookings.length,
      completedBookings: completed,
      cancelledReservations: cancelled,
      disputes: disputeSnap.docs.length,
      servicesOffered: offered,
      serviceQuestions: questions.map((text, i) => ({ num: i + 1, text })),
      listings: services.length,
    };
  } catch (error) {
    console.error("Firestore fetchAccountActivity error:", error);
    throw error;
  }
}

/**
 * 30. Provider service listings, for content moderation.
 *
 * `services` is provider-created — not the admin catalogue in `category`.
 * Each listing names its category and sub-category, so this is where an
 * admin sees what providers are actually advertising.
 *
 * @param {object} params - Options.
 * @param {string} params.searchTerm - Free-text filter.
 * @param {string} params.filterStatus - "All" or a status label.
 * @param {string} params.filterCategory - "All" or a category name.
 * @param {number} params.page - 1-based page.
 * @param {number} params.limit - Page size.
 * @return {Promise<object>} Paginated rows plus the category list.
 */
export async function fetchServiceListingsFromFirestore(params = {}) {
  const {
    searchTerm = "",
    filterStatus = "All",
    filterCategory = "All",
    startDate = null,
    endDate = null,
    page = 1,
    limit = 8,
  } = params;

  try {
    const services = await safeCollection("services");
    if (services.length === 0) {
      return { items: [], total: 0, totalPages: 1, categories: [] };
    }

    // The listing denormalises providerName, but it can be stale or missing,
    // so the user document wins where one exists.
    const uids = [
      ...new Set(services.map((s) => s.providerId).filter(Boolean)),
    ];
    const users = new Map();
    await Promise.all(
      uids.map(async (uid) => {
        try {
          const snap = await getDoc(doc(db, "users", uid));
          if (snap.exists()) users.set(uid, snap.data());
        } catch (_) {
          // A missing user must not drop the listing.
        }
      }),
    );

    /**
     * Formats a listing's price.
     *
     * Pricing is a nested object, not a number: hourly carries HourlyRate plus
     * a minimum and an extra-hour fee, fixed carries a unit price and a unit
     * label. Note `UnitPice` — the typo is in the stored data, so reading the
     * corrected spelling would return nothing.
     *
     * @param {object} s - The service document.
     * @return {string} Display price.
     */
    const price = (s) => {
      const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;
      const hourly = s.hourlyPricing || null;
      const fixed = s.fixedPricing || null;

      if (hourly && Number(hourly.HourlyRate)) {
        const min = Number(hourly.minimumBooking) || 0;
        return `${money(hourly.HourlyRate)}/hr${min ? ` · min ${min}h` : ""}`;
      }
      if (fixed && Number(fixed.UnitPice ?? fixed.UnitPrice)) {
        const unit = fixed.Unit ? ` / ${fixed.Unit}` : "";
        return `${money(fixed.UnitPice ?? fixed.UnitPrice)}${unit}`;
      }
      return "—";
    };

    let items = services.map((s) => {
      const user = users.get(s.providerId);
      return {
        id: s.id,
        providerId: s.providerId || null,
        provider: user
          ? displayName(user, "Provider")
          : s.providerName || "Unknown",
        email: user?.email || "",
        category: s.categoryName || "—",
        subCategory: s.subcategoryName || "—",
        title: s.serviceName || "Untitled listing",
        description: s.description || "",
        pricing: price(s),
        pricingType: s.pricingType || "—",
        serviceArea:
          [s.serviceCity, s.serviceRadiusKm ? `${s.serviceRadiusKm} km` : null]
            .filter(Boolean)
            .join(" · ") || "—",
        image: s.image || "",
        questions: (s.ServiceQuestions || []).length,
        status: titleCase(s.status, "Active"),
        created: formatFirestoreDate(s.createdAt),
        createdTime: formatFirestoreDateTime(s.createdAt),
        createdAtRaw: s.createdAt || null,
      };
    });

    const categories = [
      "All",
      ...[
        ...new Set(items.map((i) => i.category).filter((c) => c && c !== "—")),
      ].sort(),
    ];

    if (filterCategory !== "All") {
      items = items.filter((i) => i.category === filterCategory);
    }

    return {
      ...filterAndPaginate(items, {
        searchTerm,
        searchFields: ["provider", "email", "title", "subCategory"],
        filterStatus,
        statusField: "status",
        startDate,
        endDate,
        dateField: "createdAtRaw",
        page,
        limit,
      }),
      categories,
    };
  } catch (error) {
    console.error("Firestore fetchServiceListings error:", error);
    throw error;
  }
}

/**
 * 31. Client reviews, for moderation.
 *
 * The same collection backs the flagged-content view: a review carries
 * isFlagged / flagStatus / flagReason, so a flagged item is a review with a
 * flag rather than a separate record.
 *
 * @param {object} params - Options.
 * @param {boolean} params.flaggedOnly - Restrict to flagged reviews.
 * @param {string} params.searchTerm - Free-text filter.
 * @param {string} params.filterRating - "All" or a star value.
 * @param {number} params.page - 1-based page.
 * @param {number} params.limit - Page size.
 * @return {Promise<object>} Paginated rows plus counts.
 */
export async function fetchReviewsFromFirestore(params = {}) {
  const {
    flaggedOnly = false,
    searchTerm = "",
    filterRating = "All",
    filterStatus = "All",
    startDate = null,
    endDate = null,
    page = 1,
    limit = 8,
  } = params;

  try {
    const reviews = await safeCollection("reviews");
    if (reviews.length === 0) {
      return { items: [], total: 0, totalPages: 1, counts: null };
    }

    // Reviews store the client name but not the provider's, so that side is
    // joined; the client name is trusted as written at review time.
    const uids = [...new Set(reviews.map((r) => r.providerId).filter(Boolean))];
    const users = new Map();
    await Promise.all(
      uids.map(async (uid) => {
        try {
          const snap = await getDoc(doc(db, "users", uid));
          if (snap.exists()) users.set(uid, snap.data());
        } catch (_) {
          // A missing provider must not hide the review.
        }
      }),
    );

    let items = reviews.map((r) => {
      const provider = users.get(r.providerId);
      return {
        id: r.id,
        clientId: r.clientId || null,
        providerId: r.providerId || null,
        client: r.clientName || "Client",
        clientPhotoUrl: r.clientPhotoUrl || "",
        provider: provider
          ? displayName(provider, "Provider")
          : "Unknown provider",
        providerEmail: provider?.email || "",
        service: r.serviceTitle || "—",
        bookingId: r.bookingId || null,
        rating: Number(r.rating) || 0,
        // The sub-scores the app collects, shown on the detail view.
        ratingQuality: Number(r.ratingQuality) || 0,
        ratingPunctuality: Number(r.ratingPunctuality) || 0,
        ratingProfessionalism: Number(r.ratingProfessionalism) || 0,
        ratingCompliance: Number(r.ratingCompliance) || 0,
        reviewText: r.comment || "",
        providerResponse: r.providerResponse || "",
        isFlagged: Boolean(r.isFlagged),
        flagReason: r.flagReason || "",
        flaggedBy: r.flaggedBy || "",
        flagStatus: titleCase(r.flagStatus, r.isFlagged ? "Pending" : "—"),
        // isVisible is the moderation outcome; absent means visible.
        isVisible: r.isVisible !== false,
        status:
          r.isVisible === false
            ? "Removed"
            : r.isFlagged
              ? "Flagged"
              : "Published",
        date: formatFirestoreDate(r.createdAt),
        dateTime: toDate(r.createdAt),
        createdAtRaw: r.createdAt || null,
      };
    });

    const counts = {
      total: items.length,
      flagged: items.filter((i) => i.isFlagged).length,
      removed: items.filter((i) => !i.isVisible).length,
      averageRating:
        items.length > 0
          ? Math.round(
              (items.reduce((a, i) => a + i.rating, 0) / items.length) * 10,
            ) / 10
          : 0,
    };

    if (flaggedOnly) items = items.filter((i) => i.isFlagged);
    if (filterRating !== "All") {
      items = items.filter((i) => String(i.rating) === String(filterRating));
    }

    // A removed review is gone from the marketplace, so it should not sit in
    // the moderation list either — an admin who had just removed one still saw
    // it in the table and reasonably read that as the removal having failed.
    // It stays reachable by asking for it explicitly, because hiding is
    // reversible and the record is kept deliberately.
    if (filterStatus !== "Removed") {
      items = items.filter((i) => i.isVisible);
    }

    items.sort(
      (a, b) =>
        (toMillis(b.createdAtRaw) || 0) - (toMillis(a.createdAtRaw) || 0),
    );

    return {
      ...filterAndPaginate(items, {
        searchTerm,
        searchFields: ["client", "provider", "reviewText", "service"],
        filterStatus,
        statusField: "status",
        startDate,
        endDate,
        dateField: "createdAtRaw",
        page,
        limit,
      }),
      counts,
    };
  } catch (error) {
    console.error("Firestore fetchReviews error:", error);
    throw error;
  }
}

/**
 * 32. User growth and activity statistics.
 *
 * Derived from users, bookings and addresses rather than a stats collection —
 * nothing aggregates these server-side, and at this scale a client-side pass
 * is cheaper than maintaining counters.
 *
 * @return {Promise<object>} Totals, per-city rows and a 12-month series.
 */
export async function fetchUserStatsFromFirestore() {
  try {
    const [clients, providers, bookings] = await Promise.all([
      loadUsersByType("client"),
      loadUsersByType("provider"),
      safeCollection("bookings"),
    ]);

    const all = [...clients, ...providers];
    const addresses = await loadAddressMap(all.map((u) => u.uid));

    const norm = (v) => String(v || "").toLowerCase();
    const bookingsByClient = new Map();
    bookings.forEach((b) => {
      if (b.clientId) {
        bookingsByClient.set(
          b.clientId,
          (bookingsByClient.get(b.clientId) || 0) + 1,
        );
      }
    });

    // ── per-city breakdown ──
    const byCity = new Map();
    const addRow = (uid, type) => {
      const addr = addresses.get(uid) || {};
      const city = (addr.city || "").trim() || "Unknown";
      const row = byCity.get(city) || {
        id: city,
        city,
        country: addr.country || addr.province || "—",
        clients: 0,
        providers: 0,
        bookings: 0,
      };
      row[type === "client" ? "clients" : "providers"] += 1;
      if (type === "client") row.bookings += bookingsByClient.get(uid) || 0;
      byCity.set(city, row);
    };
    clients.forEach(({ uid }) => addRow(uid, "client"));
    providers.forEach(({ uid }) => addRow(uid, "provider"));

    // Per-city GMV and the dominant category, joined through the listing a
    // booking was made against.
    const svcById = new Map(
      (await safeCollection("services")).map((sv) => [sv.id, sv]),
    );
    const cityOf = (uid) =>
      (addresses.get(uid) || {}).city?.trim() || "Unknown";
    const gmvByCity = new Map();
    const catByCity = new Map();
    bookings.forEach((b) => {
      const city = b.clientId ? cityOf(b.clientId) : "Unknown";
      gmvByCity.set(
        city,
        (gmvByCity.get(city) || 0) + (Number(b.transactionAmount) || 0),
      );
      const svc = svcById.get(b.serviceId);
      if (svc) {
        const key = `${city}||${svc.categoryName || ""}||${svc.subcategoryName || ""}`;
        catByCity.set(key, (catByCity.get(key) || 0) + 1);
      }
    });

    /**
     * The most-booked category in a city.
     * @param {string} city - City name.
     * @return {{category: string, subCategory: string}} Top pair.
     */
    const topCategory = (city) => {
      let best = null;
      let bestN = 0;
      for (const [key, n] of catByCity) {
        if (!key.startsWith(`${city}||`) || n <= bestN) continue;
        best = key;
        bestN = n;
      }
      if (!best) return { category: "—", subCategory: "—" };
      const [, category, subCategory] = best.split("||");
      return { category: category || "—", subCategory: subCategory || "—" };
    };

    const cities = [...byCity.values()]
      .map((r) => {
        const { category, subCategory } = topCategory(r.city);
        // Clients per provider. A high ratio means demand outstrips supply.
        const ratio =
          r.providers > 0
            ? Math.round((r.clients / r.providers) * 10) / 10
            : r.clients;
        return {
          ...r,
          users: r.clients + r.providers,
          category,
          subCategory,
          ratio,
          volume: r.bookings,
          gmv: Math.round((gmvByCity.get(r.city) || 0) * 100) / 100,
          demandLevel:
            r.providers === 0 && r.clients > 0
              ? "Unserved"
              : ratio >= 4
                ? "High demand"
                : ratio >= 2
                  ? "Medium"
                  : "Balanced",
        };
      })
      .sort((a, b) => b.users - a.users);

    // ── 12-month signup series ──
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        month: d.toLocaleDateString("en-US", { month: "short" }),
        clients: 0,
        providers: 0,
      };
    });
    const bucket = new Map(months.map((m) => [m.key, m]));
    const place = (uid, data, type) => {
      const d = toDate(data.createdAt);
      if (!d) return;
      const m = bucket.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (m) m[type === "client" ? "clients" : "providers"] += 1;
    };
    clients.forEach(({ uid, data }) => place(uid, data, "client"));
    providers.forEach(({ uid, data }) => place(uid, data, "provider"));

    const active = (list) =>
      list.filter(({ data }) => norm(data.status) === "active").length;

    return {
      totals: {
        users: all.length,
        clients: clients.length,
        providers: providers.length,
        activeClients: active(clients),
        activeProviders: active(providers),
        suspended: all.filter(({ data }) =>
          ["suspended", "banned"].includes(norm(data.status)),
        ).length,
        invited: all.filter(({ data }) => norm(data.status) === "invited")
          .length,
        bookings: bookings.length,
        cities: cities.filter((c) => c.city !== "Unknown").length,
      },
      cities,
      months,
    };
  } catch (error) {
    console.error("Firestore fetchUserStats error:", error);
    throw error;
  }
}

/**
 * 33. The flagged-content queue.
 *
 * Two things land here and they are stored differently: user-submitted
 * `reports` (raised from the apps against a listing, review or user), and
 * reviews carrying an `isFlagged` marker. Merging them means an admin works
 * one queue instead of remembering which surface a complaint arrived through.
 *
 * @param {object} params - Options.
 * @param {string} params.searchTerm - Free-text filter.
 * @param {string} params.filterType - "All", "Listing", "Review" or "User".
 * @param {number} params.page - 1-based page.
 * @param {number} params.limit - Page size.
 * @return {Promise<object>} Paginated rows plus queue counts.
 */
export async function fetchFlaggedContentFromFirestore(params = {}) {
  const {
    searchTerm = "",
    filterType = "All",
    filterStatus = "All",
    startDate = null,
    endDate = null,
    page = 1,
    limit = 8,
  } = params;

  try {
    const [reports, reviews] = await Promise.all([
      safeCollection("reports"),
      safeCollection("reviews"),
    ]);

    // Resolve every uid mentioned by either source in one pass.
    const uids = new Set();
    reports.forEach((r) => {
      if (r.reportedBy) uids.add(r.reportedBy);
      if (r.targetUserId) uids.add(r.targetUserId);
    });
    reviews
      .filter((r) => r.isFlagged)
      .forEach((r) => {
        if (r.clientId) uids.add(r.clientId);
        if (r.providerId) uids.add(r.providerId);
      });

    const users = new Map();
    await Promise.all(
      [...uids].map(async (uid) => {
        try {
          const snap = await getDoc(doc(db, "users", uid));
          if (snap.exists()) users.set(uid, snap.data());
        } catch (_) {
          // A missing user must not hide the complaint.
        }
      }),
    );
    const nameOf = (uid, fallback) => {
      const u = users.get(uid);
      return u ? displayName(u, fallback) : fallback;
    };

    const rows = [
      // ── user-submitted reports ──
      ...reports.map((r) => ({
        id: r.id,
        source: "report",
        reportId: r.id,
        type: titleCase(r.targetType, "Content"),
        targetId: r.targetId || null,
        reportedBy: nameOf(r.reportedBy, "Reporter"),
        email: users.get(r.reportedBy)?.email || "",
        subjectEmail: users.get(r.targetUserId)?.email || "",
        content: r.reason || r.description || "No detail provided.",
        status: titleCase(r.status, "Pending"),
        isPending: String(r.status || "pending").toLowerCase() === "pending",
        date: formatFirestoreDate(r.createdAt),
        dateTime: toDate(r.createdAt),
        createdAtRaw: r.createdAt || null,
      })),

      // ── reviews flagged in-app ──
      ...reviews
        .filter((r) => r.isFlagged)
        .map((r) => ({
          id: `review-${r.id}`,
          source: "review",
          reviewId: r.id,
          type: "Review",
          targetId: r.id,
          // flaggedBy holds a uid when the flag came from a user, and is
          // blank when the app's own filters raised it.
          reportedBy: r.flaggedBy
            ? nameOf(r.flaggedBy, "Reporter")
            : "Automatic filter",
          email: users.get(r.flaggedBy)?.email || "",
          subjectEmail: users.get(r.providerId)?.email || "",
          content: r.flagReason
            ? `${r.flagReason} — “${r.comment || "(no comment)"}”`
            : `“${r.comment || "(no comment)"}”`,
          rating: Number(r.rating) || 0,
          status: titleCase(r.flagStatus, "Pending"),
          isPending:
            !r.flagStatus || String(r.flagStatus).toLowerCase() === "pending",
          date: formatFirestoreDate(r.createdAt),
          dateTime: toDate(r.createdAt),
          createdAtRaw: r.createdAt || null,
        })),
    ];

    const counts = {
      total: rows.length,
      pending: rows.filter((r) => r.isPending).length,
      listings: rows.filter((r) => r.type === "Listing").length,
      reviews: rows.filter((r) => r.type === "Review").length,
    };

    let items = rows;
    if (filterType !== "All")
      items = items.filter((r) => r.type === filterType);

    // Pending first — those are the only rows needing a decision.
    items.sort((a, b) => {
      if (a.isPending !== b.isPending) return a.isPending ? -1 : 1;
      return (toMillis(b.createdAtRaw) || 0) - (toMillis(a.createdAtRaw) || 0);
    });

    return {
      ...filterAndPaginate(items, {
        searchTerm,
        searchFields: ["reportedBy", "email", "content", "subjectEmail"],
        filterStatus,
        statusField: "status",
        startDate,
        endDate,
        dateField: "createdAtRaw",
        page,
        limit,
      }),
      counts,
    };
  } catch (error) {
    console.error("Firestore fetchFlaggedContent error:", error);
    throw error;
  }
}

/**
 * 34. The admin notification feed.
 *
 * There is no admin_notifications collection, and inventing one would mean
 * every function that already writes a queue entry also writing a duplicate
 * notification that could drift from it. Instead the feed is derived: the
 * things an admin needs to act on are exactly the rows sitting unresolved in
 * the operational queues, so those queues *are* the notifications.
 *
 * Everything listed is still waiting on a decision. An item leaves the feed the
 * moment it is dealt with, because it stops matching the filter that put it
 * there — resolving a dispute, approving a refund, reviewing a KYC submission.
 * Nothing here is ever "dismissed": the queue is the source of truth, so the
 * bell cannot disagree with the screen it links to.
 *
 * Ids are stable and derived from the source document, which is what lets the
 * read watermark in localStorage stay meaningful across refreshes.
 *
 * @param {object} params - Options.
 * @param {number} [params.max] - Cap on returned items.
 * @return {Promise<Array<object>>} Newest first.
 */
export async function fetchAdminNotificationsFromFirestore({ max = 50 } = {}) {
  try {
    const [disputes, creditRequests, withdrawals, kyc, payouts] =
      await Promise.all([
        safeCollection("disputes"),
        safeCollection("wallet_credit_requests"),
        safeCollection("withdrawal_requests"),
        safeCollection("kyc"),
        safeCollection("payout_logs"),
      ]);

    const items = [];
    const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

    // Open disputes — the only queue with a compliance clock on it.
    disputes
      .filter((d) => {
        const s = String(d.status || "")
          .toLowerCase()
          .replace(/[\s_-]/g, "");
        return s === "open" || s === "underreview";
      })
      .forEach((d) => {
        items.push({
          id: `dispute:${d.id}`,
          kind: "dispute",
          title: "Dispute needs a decision",
          message: `${d.clientName || "A client"} disputed ${
            d.serviceTitle || "a booking"
          }${d.bookingAmount ? ` (${money(d.bookingAmount)})` : ""}.`,
          href: `/compliance/disputes/${d.id}`,
          at: toMillis(d.createdAt) || 0,
          severity: "high",
        });
      });

    // Refunds waiting on approval — money owed to a client until cleared.
    creditRequests
      .filter((r) => String(r.status || "").toLowerCase() === "pending")
      .forEach((r) => {
        items.push({
          id: `credit:${r.id}`,
          kind: "refund",
          title: "Refund awaiting approval",
          message: `${money(r.amount)} to credit — ${
            r.reason || "no reason recorded"
          }.`,
          href: "/wallets",
          at: toMillis(r.createdAt) || 0,
          severity: "high",
        });
      });

    // Withdrawals waiting on approval.
    withdrawals
      .filter((w) => String(w.status || "").toLowerCase() === "pending")
      .forEach((w) => {
        items.push({
          id: `withdrawal:${w.id}`,
          kind: "withdrawal",
          title: "Withdrawal request",
          message: `${money(w.amount)} requested for payout.`,
          href: "/wallets",
          at: toMillis(w.createdAt) || 0,
          severity: "medium",
        });
      });

    // KYC submissions a provider cannot start earning without.
    kyc
      .filter((k) => String(k.status || "").toLowerCase() === "pending")
      .forEach((k) => {
        items.push({
          id: `kyc:${k.id}`,
          kind: "kyc",
          title: "KYC awaiting review",
          message: "A provider submitted verification documents.",
          href: "/compliance/kyc",
          at: toMillis(k.submittedAt) || toMillis(k.createdAt) || 0,
          severity: "medium",
        });
      });

    // Failed payouts. A provider has worked and not been paid, so this ranks
    // with disputes rather than with the informational rows.
    //
    // Unlike every other source here, a payout log has no resolved state — it
    // records what happened and is never updated. So recency is what retires
    // it: the next Friday run either pays the provider or writes a fresh
    // failure, which means anything older than two weeks has been superseded
    // either way and would otherwise sit in the bell forever.
    const PAYOUT_FAILURE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
    const payoutCutoff = Date.now() - PAYOUT_FAILURE_WINDOW_MS;

    payouts
      .filter((p) => String(p.status || "").toLowerCase() === "failed")
      .forEach((p) => {
        const at = toMillis(p.processedAt) || 0;
        if (at < payoutCutoff) return;
        items.push({
          id: `payout:${p.id}`,
          kind: "payout",
          title: "Payout failed",
          message: `${money(p.amount)} did not reach a provider${
            p.errorMessage ? `: ${p.errorMessage}` : "."
          }`,
          href: "/finance/commissions",
          at,
          severity: "high",
        });
      });

    return items.sort((a, b) => b.at - a.at).slice(0, max);
  } catch (error) {
    console.error("Firestore fetchAdminNotifications error:", error);
    throw error;
  }
}

/**
 * 35. One provider's payout detail — the wallet breakdown and payout history
 * behind the payout queue's View action.
 *
 * Both halves were hardcoded: four invented booking IDs scaled by
 * walletBalance/434.50, and a fixed five-event timeline dated 2027. The
 * numbers moved when the balance moved, which made the mock look live.
 *
 * The breakdown comes from the provider's wallet ledger rather than from
 * bookings, because the ledger is what actually built the balance — a manual
 * adjustment or a dispute clawback belongs in the list, and querying bookings
 * would miss both.
 *
 * @param {object} params - Options.
 * @param {string} params.uid - Provider uid.
 * @param {number} [params.max] - Cap on ledger rows.
 * @return {Promise<{entries: Array<object>, history: Array<object>}>} Detail.
 */
export async function fetchProviderPayoutDetailFromFirestore({
  uid,
  max = 25,
} = {}) {
  if (!uid) return { entries: [], history: [] };

  try {
    const ledgerPath = ["users", uid, "walletProvider", uid, "transactions"];

    const [ledgerSnap, payoutSnap] = await Promise.all([
      getDocs(
        query(
          collection(db, ...ledgerPath),
          orderBy("createdAt", "desc"),
          fsLimit(max),
        ),
      ).catch((error) => {
        console.warn(`payout detail: ledger read failed:`, error?.code);
        return { docs: [] };
      }),
      getDocs(
        query(collection(db, "payout_logs"), where("cleanerId", "==", uid)),
      ).catch((error) => {
        console.warn(`payout detail: payout_logs read failed:`, error?.code);
        return { docs: [] };
      }),
    ]);

    // Earnings and adjustments are what make up the balance. A withdrawal or a
    // payout is money leaving, which the history section below covers.
    const CONTRIBUTING = new Set(["job_payout", "adjustment", "admin_credit"]);

    const rawEntries = ledgerSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((e) => CONTRIBUTING.has(e.kind));

    // Join to bookings for the gross and the commission taken. The ledger
    // stores the net credit only, so without this the breakdown could not show
    // what the platform kept.
    const bookingIds = [
      ...new Set(rawEntries.map((e) => e.bookingId).filter(Boolean)),
    ];
    const bookings = new Map();
    await Promise.all(
      bookingIds.map(async (id) => {
        try {
          const snap = await getDoc(doc(db, "bookings", id));
          if (snap.exists()) bookings.set(id, snap.data());
        } catch (_) {
          // A deleted booking must not drop its earning from the list.
        }
      }),
    );

    const entries = rawEntries.map((e) => {
      const booking = e.bookingId ? bookings.get(e.bookingId) : null;
      const net = Number(e.amount) || 0;
      const gross = booking ? Number(booking.transactionAmount) || 0 : null;
      const commission = booking
        ? Number(booking.providerServiceFee) || 0
        : null;

      return {
        id: e.id,
        bookingId: e.bookingId || null,
        // Adjustments have no booking, so the ledger title is the only label.
        label: e.bookingId
          ? e.serviceTitle || e.serviceName || e.bookingId
          : e.title || "Adjustment",
        date: formatFirestoreDate(e.createdAt),
        at: toMillis(e.createdAt) || 0,
        gross,
        commission,
        net,
        kind: e.kind,
      };
    });

    const STATUS = {
      succeeded: { label: "Completed", type: "success" },
      failed: { label: "Failed", type: "fail" },
      skipped: { label: "Skipped", type: "skip" },
    };

    const history = payoutSnap.docs
      .map((d) => {
        const p = d.data();
        const raw = String(p.status || "").toLowerCase();
        const mapped = STATUS[raw] || {
          label: titleCase(raw, "Unknown"),
          type: "skip",
        };
        return {
          id: d.id,
          date: formatFirestoreDate(p.processedAt),
          at: toMillis(p.processedAt) || 0,
          status: mapped.label,
          type: mapped.type,
          // Only a completed transfer moved money; the others show a reason.
          amount: raw === "succeeded" ? Number(p.amount) || 0 : null,
          detail: raw === "succeeded" ? null : p.errorMessage || null,
          weekKey: p.weekKey || null,
          stripeTransferId: p.stripeTransferId || null,
        };
      })
      // Ordered here rather than in the query, so no composite index on
      // (cleanerId, processedAt) is needed.
      .sort((a, b) => b.at - a.at);

    return { entries, history };
  } catch (error) {
    console.error("Firestore fetchProviderPayoutDetail error:", error);
    throw error;
  }
}

/**
 * 36. A dispute's own group chat.
 *
 * Distinct from the booking thread. `disputes/{id}/disputeChat` is where the
 * apps put the client, the provider and NETLY support together once a dispute
 * is opened; the booking thread is the ordinary conversation those two were
 * already having and may span several bookings.
 *
 * The panel only ever read the booking thread, so the messages an admin most
 * needs — the ones actually arguing the dispute — were never on screen.
 *
 * Returned oldest-first, matching how the thread renders.
 *
 * @param {object} params - Options.
 * @param {string} params.disputeId - Dispute document id.
 * @param {string} [params.clientId] - Used to label messages.
 * @param {string} [params.providerId] - Used to label messages.
 * @return {Promise<{chatId: string|null, messages: Array<object>}>} Thread.
 */
export async function fetchDisputeThreadFromFirestore({
  disputeId,
  clientId,
  providerId,
} = {}) {
  if (!disputeId) return { chatId: null, messages: [] };

  try {
    const snap = await getDocs(
      query(
        collection(db, "disputes", disputeId, "disputeChat"),
        orderBy("createdAt", "asc"),
      ),
    ).catch((error) => {
      console.warn("dispute thread read failed:", error?.code);
      return { docs: [] };
    });

    const messages = snap.docs.map((d) => {
      const m = d.data();

      // senderRole is written by the apps and is the reliable signal. The uid
      // comparison is only a fallback, and deliberately second: a client and
      // provider can share a uid in seeded test data, which would otherwise
      // mislabel every message.
      let role = String(m.senderRole || "").toLowerCase();
      if (!["client", "provider", "admin", "system"].includes(role)) {
        if (m.senderId && m.senderId === providerId) role = "provider";
        else if (m.senderId && m.senderId === clientId) role = "client";
        else role = "system";
      }

      return {
        id: d.id,
        role,
        sender:
          role === "admin" || role === "system"
            ? m.senderName || "NETLY Support"
            : m.senderName || (role === "client" ? "Client" : "Provider"),
        text: m.message || "",
        image: m.image || "",
        messageType: m.messageType || "text",
        time: formatFirestoreDateTime(m.createdAt),
        createdAtRaw: m.createdAt || null,
      };
    });

    return { chatId: disputeId, messages };
  } catch (error) {
    console.error("Firestore fetchDisputeThread error:", error);
    throw error;
  }
}
