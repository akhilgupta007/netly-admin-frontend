/**
 * Audit action slugs and their display labels.
 *
 * Must stay in sync with AUDIT_ACTIONS in
 * netly-functions/functions/src/helpers/constants.js — every admin mutation
 * writes one of these into the `audit_logs` collection. Anything missing here
 * falls back to a readable form of the slug rather than showing it raw.
 */

export const AUDIT_ACTION_LABELS = {
  // Accounts
  "user.invited": "User Invited",
  "account.suspended": "Account Suspended",
  "account.banned": "Account Banned",
  "account.reactivated": "Account Reactivated",
  "account.password_reset_sent": "Password Reset Sent",
  "account.merged": "Accounts Merged",
  "kyc.reviewed": "KYC Reviewed",
  "consent.updated": "Consent Updated",
  "user.data_exported": "User Data Exported",

  // Admin management
  "admin.invited": "Admin Invited",
  "admin.role_changed": "Admin Role Changed",
  "admin.access_revoked": "Admin Access Revoked",
  "admin.profile_updated": "Admin Profile Updated",
  "admin.password_changed": "Admin Password Changed",

  // Money
  "wallet.credit_approved": "Wallet Credit Approved",
  "wallet.credit_rejected": "Wallet Credit Rejected",
  "wallet.balance_adjusted": "Wallet Balance Adjusted",
  "withdrawal.requested": "Withdrawal Requested",
  "withdrawal.approved": "Withdrawal Approved",
  "withdrawal.rejected": "Withdrawal Rejected",
  "payout.held": "Payout Held",
  "settings.fees_updated": "Fee Settings Updated",
  "tax.t4a_generated": "T4A Report Generated",

  // Disputes and moderation
  "dispute.claimed": "Dispute Claimed",
  "dispute.message_posted": "Dispute Message Posted",
  "moderation.listing": "Listing Moderated",
  "moderation.review": "Review Moderated",
  "moderation.report_resolved": "Report Resolved",

  // Catalogue
  "category.created": "Category Created",
  "category.updated": "Category Updated",
  "category.deleted": "Category Deleted",
  "subcategory.created": "Sub-Category Created",
  "subcategory.updated": "Sub-Category Updated",
  "subcategory.deleted": "Sub-Category Deleted",

  // Platform
  "provider.founding_badge_changed": "Founding Badge Changed",
  "booking.payment_reminder_sent": "Payment Reminder Sent",
  "notification.sent": "Notification Sent",
};

/**
 * Tone for the action badge. Destructive actions read red, restorative green,
 * everything else neutral.
 */
const DESTRUCTIVE = new Set([
  "admin.access_revoked",
  "account.suspended",
  "account.banned",
  "account.merged",
  "wallet.credit_rejected",
  "withdrawal.rejected",
  "payout.held",
  "category.deleted",
  "subcategory.deleted",
  "moderation.listing",
  "moderation.review",
]);

const POSITIVE = new Set([
  "user.invited",
  "admin.invited",
  "account.reactivated",
  "wallet.credit_approved",
  "withdrawal.approved",
  "moderation.report_resolved",
]);

/**
 * Turns an unmapped slug into something readable.
 *
 * A new action added to the backend should not surface in the compliance log
 * as `provider.founding_badge_changed`. This is the fallback, not the plan —
 * add the action to AUDIT_ACTION_LABELS so the wording is deliberate.
 *
 * @param {string} action - Slug such as "tax.t4a_generated".
 * @return {string} e.g. "Tax T4a Generated".
 */
function humanise(action) {
  return String(action)
      .split(/[._]/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
}

/**
 * Display label for an action slug.
 *
 * @param {string} action - Slug such as "kyc.reviewed".
 * @return {string} Label.
 */
export function auditActionLabel(action) {
  if (!action) return "—";
  return AUDIT_ACTION_LABELS[action] || humanise(action);
}

/**
 * Tailwind classes for the action badge.
 *
 * @param {string} action - Slug.
 * @return {string} Class string.
 */
export function auditActionClass(action) {
  if (DESTRUCTIVE.has(action)) return "bg-red-50 text-red-600";
  if (POSITIVE.has(action)) return "bg-emerald-50 text-emerald-600";
  return "bg-amber-50 text-amber-600";
}
