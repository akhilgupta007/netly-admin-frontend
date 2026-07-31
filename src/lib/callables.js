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
export const adjustWalletBalance = ({ uid, amount, type, reason }) =>
  callFunction("adjustWalletBalance", { uid, amount, type, reason });

/** action is "approve" | "reject" — one function handles both. */
export const approveWalletCreditRequest = ({ requestId, action }) =>
  callFunction("approveWalletCreditRequest", { requestId, action });
