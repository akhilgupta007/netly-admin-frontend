/**
 * Admin role slugs.
 *
 * Roles travel over the wire as slugs — these must match ASSIGNABLE_ADMIN_ROLES
 * in netly-functions/functions/src/helpers/constants.js, or the callables
 * reject the request with invalid-argument. Labels are display-only.
 */

export const ADMIN_ROLES = {
  SUPER_ADMIN: "super_admin",
  FINANCE_ADMIN: "finance_admin",
  COMPLIANCE_ADMIN: "compliance_admin",
  SUPPORT_ADMIN: "support_admin",
  MODERATOR: "moderator"
};

export const ADMIN_ROLE_LABELS = {
  super_admin: "Super Admin",
  finance_admin: "Finance Admin",
  compliance_admin: "Compliance Admin",
  support_admin: "Support Admin",
  moderator: "Moderator"
};

/** Roles a super admin can hand out. super_admin is seeded, never assigned. */
export const ASSIGNABLE_ADMIN_ROLES = [
  ADMIN_ROLES.FINANCE_ADMIN,
  ADMIN_ROLES.COMPLIANCE_ADMIN,
  ADMIN_ROLES.SUPPORT_ADMIN,
  ADMIN_ROLES.MODERATOR
];

/**
 * Display label for a role slug.
 * @param {string} slug - Role slug.
 * @return {string} Label, or the slug if unrecognised.
 */
export function roleLabel(slug) {
  return ADMIN_ROLE_LABELS[slug] || slug;
}

/**
 * Whether a role may manage other admins. Mirrors requireSuperAdmin on the
 * backend — this only hides UI, the callable is the real boundary.
 * @param {string} role - Role slug.
 * @return {boolean} True for super admins.
 */
export function canManageAdmins(role) {
  return role === ADMIN_ROLES.SUPER_ADMIN;
}

/**
 * Which pages each role may open.
 *
 * Derived from the role guards on the Cloud Functions each page calls, so a
 * role only sees screens where its actions would actually succeed. Showing a
 * page whose every button returns permission-denied is worse than hiding it.
 *
 * This is navigation, not security. The callables and the Firestore rules are
 * the real boundary; this stops an admin wandering into a screen they cannot
 * use.
 *
 * Super admins are absent deliberately — they are allowed everything, handled
 * in canAccessRoute below.
 */
export const ROLE_ROUTES = {
  [ADMIN_ROLES.FINANCE_ADMIN]: [
    "/dashboard",
    // resendPaymentReminder
    "/transactions",
    // adjustWalletBalance, approveWalletWithdrawal
    "/wallets",
    // updateCommissionSettings, generateT4AReport, holdProviderPayout
    "/finance/commissions",
    "/finance/reports",
    "/platform/settings",
  ],
  [ADMIN_ROLES.COMPLIANCE_ADMIN]: [
    "/dashboard",
    // updateAccountStatus, updateUserConsent, exportUserData
    "/accounts",
    // reviewKycSubmission
    "/compliance/kyc",
    // claimDispute, resolveDispute, postDisputeMessage
    "/compliance/disputes",
    "/compliance/logs",
    // moderateListing, moderateReview, resolveReport
    "/platform/moderation",
    "/platform/settings",
  ],
  [ADMIN_ROLES.SUPPORT_ADMIN]: [
    "/dashboard",
    // inviteUser, resetUserPassword, updateAccountStatus, updateUserConsent
    "/accounts",
    // claimDispute, resolveDispute, postDisputeMessage
    "/compliance/disputes",
    // resendPaymentReminder
    "/transactions",
    "/platform/settings",
  ],
  [ADMIN_ROLES.MODERATOR]: [
    "/dashboard",
    // moderateListing, moderateReview, resolveReport
    "/platform/moderation",
    // the category and sub-category callables
    "/platform/categories",
    "/platform/settings",
  ],
};

/**
 * May this role open this path?
 *
 * @param {string} role - Role slug.
 * @param {string} href - Route, e.g. "/finance/reports".
 * @return {boolean} True when permitted.
 */
export function canAccessRoute(role, href) {
  if (role === ADMIN_ROLES.SUPER_ADMIN) return true;
  const allowed = ROLE_ROUTES[role];
  // An unrecognised role gets nothing rather than everything — a typo in a
  // role slug must not hand out the whole panel.
  if (!allowed) return false;
  // Dashboard links carry query strings ("/wallets?tab=credit"), so compare
  // the path alone.
  const path = String(href || "").split(/[?#]/)[0];
  return allowed.some((base) => path === base || path.startsWith(`${base}/`));
}
