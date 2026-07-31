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
