/**
 * Audit action slugs and their display labels.
 *
 * Must stay in sync with AUDIT_ACTIONS in
 * netly-functions/functions/src/helpers/constants.js — every admin mutation
 * writes one of these into the `audit_logs` collection.
 */

export const AUDIT_ACTION_LABELS = {
  "user.invited": "User Invited",
  "admin.invited": "Admin Invited",
  "admin.role_changed": "Admin Role Changed",
  "admin.access_revoked": "Admin Access Revoked",
  "admin.profile_updated": "Admin Profile Updated",
  "admin.password_changed": "Admin Password Changed",
  "account.suspended": "Account Suspended",
  "account.banned": "Account Banned",
  "account.reactivated": "Account Reactivated",
  "account.password_reset_sent": "Password Reset Sent",
  "account.merged": "Accounts Merged",
  "kyc.reviewed": "KYC Reviewed"
};

/**
 * Tone for the action badge. Destructive actions read red, restorative green,
 * everything else neutral.
 */
const DESTRUCTIVE = new Set([
  "admin.access_revoked",
  "account.suspended",
  "account.banned",
  "account.merged"
]);

const POSITIVE = new Set([
  "user.invited",
  "admin.invited",
  "account.reactivated"
]);

/**
 * Display label for an action slug.
 * @param {string} action - Slug such as "kyc.reviewed".
 * @return {string} Label, or the raw slug if unrecognised.
 */
export function auditActionLabel(action) {
  return AUDIT_ACTION_LABELS[action] || action || "—";
}

/**
 * Tailwind classes for the action badge.
 * @param {string} action - Slug.
 * @return {string} Class string.
 */
export function auditActionClass(action) {
  if (DESTRUCTIVE.has(action)) return "bg-red-50 text-red-600";
  if (POSITIVE.has(action)) return "bg-emerald-50 text-emerald-600";
  return "bg-amber-50 text-amber-600";
}
