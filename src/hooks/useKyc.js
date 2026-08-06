"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchKycSubmissionsFromFirestore } from "@/services/firestoreServices";

const EMPTY_RESULT = { items: [], total: 0, totalPages: 1 };

export function useKyc(params = {}) {
  const query = useQuery({
    queryKey: ["kycSubmissions", params],
    queryFn: () => fetchKycSubmissionsFromFirestore(params),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const result = query.data || EMPTY_RESULT;

  return {
    kycList: result.items || [],
    total: result.total || 0,
    totalPages: result.totalPages || 1,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}
