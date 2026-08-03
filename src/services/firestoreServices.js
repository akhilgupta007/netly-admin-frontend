import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
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
} from "@/services/firestoreReads";

export { formatFirestoreDate, formatFirestoreDateTime };

/** Human labels for the `type` values written into the wallet ledgers. */
const WALLET_TX_LABELS = {
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
        console.warn("Could not read the kyc collection:", error?.code || error?.message);
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
    documents,
    verificationDocuments: files,
    // notSubmitted must not read as Pending — that put providers who uploaded
    // nothing into the review queue as though awaiting a decision.
    status: KYC_DISPLAY[status] === "Verified" ? "Approved" : KYC_DISPLAY[status] || "Not Submitted",
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
        const profiles = await loadProfileMap(
          type,
          users.map((u) => u.uid),
        );
        return users.map(({ uid, data }) => {
          const profile = profiles.get(uid) || {};
          return {
            id: `W-${uid.slice(0, 6)}`,
            uid,
            accountType: type,
            client: {
              name: displayName(data, type === "client" ? "Client" : "Provider"),
              email: data.email || "",
            },
            name: displayName(data, "Account"),
            email: data.email || "",
            balance: Number(profile.walletBalance) || 0,
            creditUsed: Number(profile.creditUsed) || 0,
            lastTxDate: formatFirestoreDate(profile.updatedAt),
            lastTxTime: "",
            updatedAtRaw: profile.updatedAt || null,
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
      (await Promise.all(
        uids.map(async (uid) => {
          try {
            const snap = await getDoc(doc(db, "users", uid));
            return snap.exists() ? [uid, snap.data()] : null;
          } catch {
            return null;
          }
        }),
      )).filter(Boolean),
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
 * The two account types keep separate ledgers under their profile document:
 *   clients   → users/{uid}/client/{uid}/walletTransactions
 *   providers → users/{uid}/provider/{uid}/transactions
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
  const path = isClient ?
    ["users", uid, "client", uid, "walletTransactions"] :
    ["users", uid, "provider", uid, "transactions"];

  try {
    const snapshot = await getDocs(
      query(collection(db, ...path), orderBy("createdAt", "desc"), fsLimit(max)),
    );

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const amount = Number(data.amount ?? data.transactionAmount) || 0;
      // Debits are the entries that take money out of the wallet.
      const isDebit = ["payment", "adminDebit", "payout"].includes(data.type);

      return {
        id: docSnap.id,
        date: formatFirestoreDateTime(data.createdAt),
        createdAtRaw: data.createdAt || null,
        description: WALLET_TX_LABELS[data.type] || data.reason || data.type || "Transaction",
        reason: data.reason || "",
        type: isDebit ? "Debit" : "Credit",
        rawType: data.type || "",
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
      (await Promise.all(
        uids.map(async (uid) => {
          try {
            const snap = await getDoc(doc(db, "users", uid));
            return snap.exists() ? [uid, snap.data()] : null;
          } catch {
            return null;
          }
        }),
      )).filter(Boolean),
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
      (a, b) => (toMillis(b.createdAtRaw) || 0) - (toMillis(a.createdAtRaw) || 0),
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
    console.error("Firestore fetchAuditLogs error:", error);
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
        (a, b) => (toMillis(b.createdAtRaw) || 0) - (toMillis(a.createdAtRaw) || 0),
      );
  } catch (error) {
    console.error("Firestore fetchAdmins error:", error);
    throw error;
  }
}
