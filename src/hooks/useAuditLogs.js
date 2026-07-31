"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAuditLogsFromFirestore } from "@/services/firestoreServices";

/**
 * Audit log entries, newest first.
 *
 * Read-only by design — entries are written server-side by every admin
 * mutation and are never edited from the panel.
 * @param {object} params - Passed through to the query (e.g. { max }).
 * @return {object} Log rows and query state.
 */
export function useAuditLogs(params = {}) {
  const query = useQuery({
    queryKey: ["auditLogs", params],
    queryFn: () => fetchAuditLogsFromFirestore(params),
    // Short window: a reviewer often refreshes right after acting.
    staleTime: 1000 * 30,
  });

  return {
    logs: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
