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
        status: titleCase(data.status, "Active"),
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
        bookings: 0,
        wallet: profile.walletBalance || 0.0,
        creditUsed: profile.creditUsed || 0.0,
        profileCompleted: Boolean(profile.profileCompleted),
        addressCompleted: Boolean(profile.addressCompleted),
        onboardingCompleted: Boolean(profile.onboardingCompleted),
        status: titleCase(data.status, "Active"),
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
    const [profiles, addresses] = await Promise.all([
      loadProfileMap("provider", uids),
      loadAddressMap(uids),
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
        status: titleCase(data.status, "Active"),
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
      items = items.filter((k) =>
        (k.documents || []).some(
          (d) => String(d).toLowerCase() === filterDocType.toLowerCase(),
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
            status: titleCase(data.status, "Active"),
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
function disputeStatus(raw) {
  const key = String(raw || "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  const outcome =
    key === "resolvedinclientfavor"
      ? "Favoured client"
      : key === "resolvedinproviderfavor"
        ? "Favoured provider"
        : key === "resolvedsplit"
          ? "Split decision"
          : null;
  return { label: DISPUTE_STATUS_LABELS[key] || raw || "Open", outcome };
}

/**
 * Shapes one dispute for the list and detail screens.
 * @param {string} id - Dispute document id.
 * @param {object} d - Dispute data.
 * @param {Map<string, object>} users - uid → user data.
 * @return {object} Dispute row.
 */
function toDispute(id, d, users) {
  const client = users.get(d.clientId) || null;
  const provider = users.get(d.providerId) || null;
  const { label, outcome } = disputeStatus(d.status);

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

    return toDispute(snap.id, d, users);
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
} = {}) {
  if (!bookingId) return { chatId: null, messages: [] };

  try {
    // Conventional id first, then a query for older threads.
    let chatDoc = await getDoc(doc(db, "chat", `booking_${bookingId}`));
    if (!chatDoc.exists()) {
      const found = await getDocs(
        query(collection(db, "chat"), where("bookingId", "==", bookingId)),
      );
      if (found.empty) return { chatId: null, messages: [] };
      chatDoc = found.docs[0];
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
  return ["confirmed", "ontheway", "inprogress", "completed"].includes(st);
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
      (b) => isPaidBooking(b) && inRange(b.confirmedAt || b.createdAt),
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

    const paid = bookings.filter(isPaidBooking);
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
      (b) => isPaidBooking(b) && inRange(b.confirmedAt || b.createdAt),
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
      return { cities: [], searches: [], services: [], total: 0 };
    }

    const unresolved = (a) =>
      String(a.status || "pending").toLowerCase() === "pending";

    // ── by city ──
    const byCity = new Map();
    alerts.forEach((a) => {
      const city = (a.city || "").trim();
      if (!city) return;
      const row = byCity.get(city) || { city, total: 0, pending: 0, province: a.province || "" };
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
      const term = (a.searchQuery || "").trim() ||
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

    return {
      cities,
      searches,
      services,
      total: alerts.length,
      pending: alerts.filter(unresolved).length,
    };
  } catch (error) {
    console.error("Firestore fetchUnmetDemand error:", error);
    throw error;
  }
}
