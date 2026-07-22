"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchUsersFromFirestore } from "@/services/firestoreServices";

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
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFromFirestore: true
  };
}
