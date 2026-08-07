"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboardMetricsFromFirestore,
  fetchUnmetDemandFromFirestore,
} from "@/services/firestoreServices";

/**
 * Aggregated dashboard metrics for a date range.
 * @param {object} range - { startDate, endDate }.
 * @return {object} Metrics and query state.
 */
export function useDashboardMetrics(range) {
  const query = useQuery({
    // Serialise the dates so the key is stable across renders.
    queryKey: [
      "dashboardMetrics",
      range?.startDate?.toISOString?.() || null,
      range?.endDate?.toISOString?.() || null,
    ],
    queryFn: () => fetchDashboardMetricsFromFirestore(range),
    staleTime: 1000 * 60,
  });

  return {
    metrics: query.data || null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * Unmet demand signals — cities, searches and services the marketplace could
 * not serve.
 *
 * @param {object} options - Extra react-query options.
 * @return {object} Query state plus the ranked lists.
 */
export function useUnmetDemand(options = {}) {
  const query = useQuery({
    queryKey: ["unmetDemand"],
    queryFn: () => fetchUnmetDemandFromFirestore(),
    ...options,
  });

  return {
    ...query,
    cities: query.data?.cities ?? [],
    searches: query.data?.searches ?? [],
    services: query.data?.services ?? [],
    total: query.data?.total ?? 0,
  };
}
