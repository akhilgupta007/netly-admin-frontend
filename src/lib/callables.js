import { functions, httpsCallable } from "@/lib/firebase";

const FRIENDLY_CODES = {
  unauthenticated: "Your session expired. Please sign in again.",
  "permission-denied": "You do not have permission to perform this action.",
  "not-found": "That record no longer exists.",
  "already-exists": "That record already exists.",
  "failed-precondition": "This action is not allowed right now.",
  unavailable: "Could not reach the server. Check your connection and retry."
};

/**
 * Calls a Cloud Function by name and returns its payload.
 */
export async function callFunction(name, payload = {}) {
  try {
    const fn = httpsCallable(functions, name);
    const result = await fn(payload);
    return result.data;
  } catch (error) {
    const message =
      error?.message && !error.message.startsWith("INTERNAL")
        ? error.message
        : FRIENDLY_CODES[error?.code?.replace("functions/", "")] ||
          "Something went wrong. Please try again.";

    const wrapped = new Error(message);
    wrapped.code = error?.code;
    throw wrapped;
  }
}

export const inviteAdmin = ({ email, role }) =>
  callFunction("inviteAdmin", { email, role });

export const updateAdminRole = ({ uid, role }) =>
  callFunction("updateAdminRole", { uid, role });

export const revokeAdminAccess = ({ uid, reason }) =>
  callFunction("revokeAdminAccess", { uid, reason });

/**
 * Updates the calling admin's own profile.
 *
 * photoBase64 replaces the picture, removePhoto clears it; omitting both
 * leaves whatever is already stored.
 */
export const updateAdminProfile = ({
  firstName,
  lastName,
  phoneNumber,
  photoBase64,
  photoContentType,
  removePhoto
}) =>
  callFunction("updateAdminProfile", {
    firstName,
    lastName,
    phoneNumber,
    photoBase64,
    photoContentType,
    removePhoto
  });

/** Changes the calling admin's password; requires the current one. */
export const adminChangePassword = ({ currentPassword, newPassword }) =>
  callFunction("adminChangePassword", { currentPassword, newPassword });

/** accountType must be "client" or "provider" — the backend rejects anything else. */
export const inviteUser = ({ email, name, accountType, foundingPartnerBadge }) =>
  callFunction("inviteUser", { email, name, accountType, foundingPartnerBadge });

/** action is "suspend" | "ban" | "reactivate". Reason required except on reactivate. */
export const updateAccountStatus = ({ uid, action, durationDays, reason, notifyEmail }) =>
  callFunction("updateAccountStatus", { uid, action, durationDays, reason, notifyEmail });

export const resetUserPassword = ({ uid }) =>
  callFunction("resetUserPassword", { uid });

/** Read-only dry run: reports what mergeDuplicateAccounts would move. */
export const previewAccountMerge = ({ keepUid, mergeUid }) =>
  callFunction("previewAccountMerge", { keepUid, mergeUid });

export const mergeDuplicateAccounts = ({ keepUid, mergeUid, reason }) =>
  callFunction("mergeDuplicateAccounts", { keepUid, mergeUid, reason });

/**
 * decision is "verified" | "rejected" | "resubmission".
 * expectedStatus is the kycStatus the reviewer was shown — the backend aborts
 * if someone else has decided in the meantime.
 */
export const reviewKycSubmission = ({ uid, decision, reasonCategory, reason, expectedStatus }) =>
  callFunction("reviewKycSubmission", {
    uid,
    decision,
    reasonCategory,
    reason,
    expectedStatus
  });

// ─── Wallets ───────────────────────────────────────────────

/** type is "credit" | "debit". Reason must be at least 20 characters. */
export const adjustWalletBalance = ({ uid, amount, type, reason, requestId }) =>
  callFunction("adjustWalletBalance", { uid, amount, type, reason, requestId });

/** action is "approve" | "reject" — one function handles both. */
/**
 * Approves or rejects a client withdrawal. Funds were held at request time, so
 * approve settles the hold and reject returns it to the wallet.
 * action is "approve" | "reject"; reason is required on reject.
 */
export const approveWalletWithdrawal = ({ requestId, action, reason }) =>
  callFunction("approveWalletWithdrawal", { requestId, action, reason });

export const approveWalletCreditRequest = ({ requestId, action }) =>
  callFunction("approveWalletCreditRequest", { requestId, action });

// ─── Compliance ────────────────────────────────────────────

/** dataType must be one of the closed list the backend accepts. */
export const logDataAccess = ({ dataType, recordId, subjectUid, reason }) =>
  callFunction("logDataAccess", { dataType, recordId, subjectUid, reason });

/** Withdrawal only — passing true is rejected by the backend. */
export const updateUserConsent = ({ uid, marketingConsent, dataConsent, reason }) =>
  callFunction("updateUserConsent", { uid, marketingConsent, dataConsent, reason });

export const exportUserData = ({ uid }) =>
  callFunction("exportUserData", { uid });

// ─── Transactions ──────────────────────────────────────────

/** raisedBy is "client" | "provider". Admins may raise on a client's behalf. */
export const raiseDispute = ({ bookingId, reason, raisedBy }) =>
  callFunction("raiseDispute", { bookingId, reason, raisedBy });

// ─── Disputes ──────────────────────────────────────────────

/** resolution is "client_favour" | "provider_favour" | "split". */
export const resolveDispute = ({
  disputeId,
  resolution,
  clientRefundAmount,
  providerCreditAmount,
  refundToCard,
  adminNotes
}) =>
  callFunction("resolveDispute", {
    disputeId,
    resolution,
    clientRefundAmount,
    providerCreditAmount,
    refundToCard,
    adminNotes
  });

/**
 * Posts into a dispute's group chat. Either message or image is enough.
 * The image travels as base64 and is uploaded to Storage by the callable.
 */
export const postDisputeMessage = ({
  bookingId,
  message,
  disputeId,
  imageBase64,
  imageContentType
}) =>
  callFunction("postDisputeMessage", {
    bookingId,
    message,
    disputeId,
    imageBase64,
    imageContentType
  });

/* ── Service catalogue ─────────────────────────────────────────── */

/** French name is required — the apps are bilingual. */
export const createCategory = ({
  name, frenchName, image, isActive, imageBase64, imageContentType,
}) =>
  callFunction("createCategory", {
    name, frenchName, image, isActive, imageBase64, imageContentType,
  });

/** Renaming also rewrites categoryName on every affected listing. */
/**
 * Renaming also rewrites categoryName on every affected listing.
 * imageBase64 uploads a new picture; image: "" clears it.
 */
export const updateCategory = ({
  categoryId, name, frenchName, image, isActive, imageBase64, imageContentType,
}) =>
  callFunction("updateCategory", {
    categoryId, name, frenchName, image, isActive, imageBase64, imageContentType,
  });

/** Refused while any provider listing still references the category. */
export const deleteCategory = ({ categoryId, reason }) =>
  callFunction("deleteCategory", { categoryId, reason });

export const createSubCategory = ({
  categoryId, name, frenchName, message, frenchMessage, image, isActive,
  imageBase64, imageContentType,
}) =>
  callFunction("createSubCategory", {
    categoryId, name, frenchName, message, frenchMessage, image, isActive,
    imageBase64, imageContentType,
  });

/** subCategoryName selects which one; name renames it. */
export const updateSubCategory = ({
  categoryId, subCategoryName, name, frenchName, message, frenchMessage, image,
  isActive, imageBase64, imageContentType,
}) =>
  callFunction("updateSubCategory", {
    categoryId, subCategoryName, name, frenchName, message, frenchMessage, image,
    isActive, imageBase64, imageContentType,
  });

export const deleteSubCategory = ({ categoryId, subCategoryName, reason }) =>
  callFunction("deleteSubCategory", { categoryId, subCategoryName, reason });

/* ── Finance ───────────────────────────────────────────────────── */

/** Rates are fractions: 0.05 means 5%. Affects new offers only. */
export const updateCommissionSettings = ({ clientFeePercent, providerFeePercent, reason }) =>
  callFunction("updateCommissionSettings", {
    clientFeePercent, providerFeePercent, reason,
  });

/** Aggregates provider earnings into CRA box 048 for a tax year. */
export const generateT4AReport = ({ year, minimumAmount }) =>
  callFunction("generateT4AReport", { year, minimumAmount });

/* ── Content moderation ────────────────────────────────────────── */

/**
 * Moderates a provider listing. Removal is a soft delete — bookings reference
 * the listing, so the document is kept.
 * action is "deactivate" | "reactivate" | "remove"; reason required except on
 * reactivate.
 */
export const moderateListing = ({ listingId, action, reason }) =>
  callFunction("moderateListing", { listingId, action, reason });

/**
 * Moderates a review. Reviews are hidden, never deleted.
 * action is "hide" | "restore" | "dismiss"; reason required on hide.
 */
export const moderateReview = ({ reviewId, action, reason }) =>
  callFunction("moderateReview", { reviewId, action, reason });

/** Closes a user-submitted report. action is "resolve" | "dismiss". */
export const resolveReport = ({ reportId, action, resolution, reason }) =>
  callFunction("resolveReport", { reportId, action, resolution, reason });

/* ── Admin actions ─────────────────────────────────────────────── */

/**
 * Claims a dispute for review, or releases the claim. Status-only — it moves
 * no money and reaches no verdict. action is "claim" | "release".
 */
export const claimDispute = ({ disputeId, action = "claim" }) =>
  callFunction("claimDispute", { disputeId, action });

/**
 * Holds or releases a provider's weekly payout. Held balances stay in ACTIVE
 * and roll to the following week — nothing is lost.
 * action is "hold" | "release"; reason required on hold.
 */
export const holdProviderPayout = ({ providerId, action, reason }) =>
  callFunction("holdProviderPayout", { providerId, action, reason });

/** Grants or revokes a provider's founding-partner badge. Display-only. */
export const setFoundingPartnerBadge = ({ providerId, granted, reason }) =>
  callFunction("setFoundingPartnerBadge", { providerId, granted, reason });

/**
 * Nudges a client to pay for a priced booking. Rate-limited to one reminder
 * every 6 hours, and does not extend the 48h auto-reject clock.
 */
export const resendPaymentReminder = ({ bookingId }) =>
  callFunction("resendPaymentReminder", { bookingId });

/* ── Sponsored listings ────────────────────────────────────────── */

/*
 * All four are super-admin only, enforced by requireSuperAdmin server-side.
 *
 * Field names are snake_case to match the Sponsored Listings briefing, which
 * is what the mobile app reads from `sponsored_listings`. That differs from
 * the camelCase used elsewhere in this panel, and is deliberate.
 */

/** Creates a listing. `logoBase64` is uploaded server-side, as elsewhere. */
export const createSponsoredListing = (payload) =>
  callFunction("createSponsoredListing", payload);

/** Patches a listing — only the fields supplied are changed. */
export const updateSponsoredListing = ({ listingId, ...changes }) =>
  callFunction("updateSponsoredListing", { listingId, ...changes });

/**
 * Activates or deactivates a listing.
 *
 * Reactivating one whose end date has passed is refused unless endDate comes
 * with it, since it would otherwise be expired again by the next nightly run.
 */
export const setSponsoredListingStatus = ({ listingId, status, endDate }) =>
  callFunction("setSponsoredListingStatus", { listingId, status, endDate });

/** Permanently removes a listing. Its click records are kept for billing. */
export const deleteSponsoredListing = ({ listingId, reason }) =>
  callFunction("deleteSponsoredListing", { listingId, reason });

/* ── Simulation (testing aids) ─────────────────────────────────── */

/*
 * Super-admin only. These fabricate and remove test data in the live project,
 * so everything they write is flagged `isSimulated` — the queue badges those
 * rows, and the finance read paths exclude them.
 */

/** Builds a complete test dispute: booking, dispute and chat. */
export const simulateDispute = ({ scenario } = {}) =>
  callFunction("simulateDispute", { scenario });

/** Removes a simulated dispute with its chat and booking. Refuses real ones. */
export const deleteSimulatedDispute = ({ disputeId }) =>
  callFunction("deleteSimulatedDispute", { disputeId });
