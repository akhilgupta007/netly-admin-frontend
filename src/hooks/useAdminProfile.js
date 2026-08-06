"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAdminProfileFromFirestore } from "@/services/firestoreServices";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * The signed-in admin's own profile document.
 *
 * The auth token only carries uid/email/role, so the name and phone have to
 * come from Firestore.
 *
 * @param {object} options - Extra react-query options.
 * @return {object} Query state plus the profile.
 */
export function useAdminProfile(options = {}) {
  const uid = useAuthStore((s) => s.uid);

  const query = useQuery({
    queryKey: ["adminProfile", uid],
    queryFn: () => fetchAdminProfileFromFirestore(uid),
    enabled: Boolean(uid),
    ...options,
  });

  return { ...query, profile: query.data ?? null, uid };
}
