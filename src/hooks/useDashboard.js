"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboardMetricsFromFirestore } from "@/services/firestoreServices";

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
    isError: query.isError,
    error: query.error,
  };
}
