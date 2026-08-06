"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchDataAccessLogsFromFirestore,
  fetchConsentRecordsFromFirestore,
} from "@/services/firestoreServices";

/**
 * Data access log entries — who viewed personal data.
 * @return {object} Log rows and query state.
 */
export function useDataAccessLogs() {
  const query = useQuery({
    queryKey: ["dataAccessLogs"],
    queryFn: () => fetchDataAccessLogsFromFirestore(),
    staleTime: 1000 * 30,
  });
  return {
    logs: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * Consent records across clients and providers.
 * @return {object} Consent rows and query state.
 */
export function useConsentRecords() {
  const query = useQuery({
    queryKey: ["consentRecords"],
    queryFn: fetchConsentRecordsFromFirestore,
    staleTime: 1000 * 60,
  });
  return {
    records: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  };
}
