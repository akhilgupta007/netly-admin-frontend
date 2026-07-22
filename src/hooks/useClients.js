"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchClientsFromFirestore } from "@/services/firestoreServices";

const EMPTY_RESULT = { items: [], total: 0, totalPages: 1 };

export function useClients(params = {}) {
  const query = useQuery({
    queryKey: ["clients", params],
    queryFn: () => fetchClientsFromFirestore(params),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const result = query.data || EMPTY_RESULT;

  return {
    clients: result.items || [],
    total: result.total || 0,
    totalPages: result.totalPages || 1,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}
