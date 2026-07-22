"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProvidersFromFirestore } from "@/services/firestoreServices";

const EMPTY_RESULT = { items: [], total: 0, totalPages: 1 };

export function useProviders(params = {}) {
  const query = useQuery({
    queryKey: ["providers", params],
    queryFn: () => fetchProvidersFromFirestore(params),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const result = query.data || EMPTY_RESULT;

  return {
    providers: result.items || [],
    total: result.total || 0,
    totalPages: result.totalPages || 1,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}
