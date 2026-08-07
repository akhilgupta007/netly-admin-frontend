"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchAccountActivityFromFirestore,
  fetchUsersFromFirestore,
} from "@/services/firestoreServices";

const EMPTY_ARRAY = [];

export function useUsers() {
  const query = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsersFromFirestore,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  return {
    users: query.data || EMPTY_ARRAY,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFromFirestore: true
  };
}

/**
 * Activity for one account, loaded when a detail modal opens.
 *
 * @param {object} params - {uid, accountType}.
 * @param {object} options - Extra react-query options.
 * @return {object} Query state plus the activity.
 */
export function useAccountActivity({ uid, accountType } = {}, options = {}) {
  const query = useQuery({
    queryKey: ["accountActivity", uid, accountType],
    queryFn: () => fetchAccountActivityFromFirestore({ uid, accountType }),
    enabled: Boolean(uid),
    ...options,
  });

  return { ...query, activity: query.data ?? null };
}
