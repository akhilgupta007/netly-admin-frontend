"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAdminsFromFirestore } from "@/services/firestoreServices";

/**
 * Admin accounts for the Admin Settings table.
 *
 * Read-only — the invite / role-change / revoke mutations are callables in
 * netly-functions. Callers invalidate ["admins"] after a mutation.
 * @return {object} Admin rows and query state.
 */
export function useAdmins() {
  const query = useQuery({
    queryKey: ["admins"],
    queryFn: fetchAdminsFromFirestore,
    staleTime: 1000 * 60,
  });

  return {
    admins: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
