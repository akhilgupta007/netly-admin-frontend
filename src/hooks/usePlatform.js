"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchFlaggedContentFromFirestore,
  fetchReviewsFromFirestore,
  fetchServiceListingsFromFirestore,
  fetchUserStatsFromFirestore,
} from "@/services/firestoreServices";

/**
 * Provider-created service listings.
 *
 * @param {object} params - Filter/pagination options.
 * @param {object} options - Extra react-query options.
 * @return {object} Query state plus rows and the category list.
 */
export function useServiceListings(params = {}, options = {}) {
  const query = useQuery({
    queryKey: ["serviceListings", params],
    queryFn: () => fetchServiceListingsFromFirestore(params),
    ...options,
  });

  return {
    ...query,
    listings: query.data?.items ?? [],
    totalCount: query.data?.total ?? 0,
    totalPages: query.data?.totalPages ?? 1,
    categories: query.data?.categories ?? ["All"],
  };
}

/**
 * Client reviews. Pass flaggedOnly for the moderation queue.
 *
 * @param {object} params - Filter/pagination options.
 * @param {object} options - Extra react-query options.
 * @return {object} Query state plus rows and counts.
 */
export function useReviews(params = {}, options = {}) {
  const query = useQuery({
    queryKey: ["reviews", params],
    queryFn: () => fetchReviewsFromFirestore(params),
    ...options,
  });

  return {
    ...query,
    reviews: query.data?.items ?? [],
    totalCount: query.data?.total ?? 0,
    totalPages: query.data?.totalPages ?? 1,
    counts: query.data?.counts ?? null,
  };
}

/**
 * User growth and activity statistics.
 *
 * @param {object} options - Extra react-query options.
 * @return {object} Query state plus totals, cities and the month series.
 */
export function useUserStats(options = {}) {
  const query = useQuery({
    queryKey: ["userStats"],
    queryFn: fetchUserStatsFromFirestore,
    ...options,
  });

  return {
    ...query,
    totals: query.data?.totals ?? null,
    cities: query.data?.cities ?? [],
    months: query.data?.months ?? [],
  };
}

/**
 * The flagged-content queue — user reports and flagged reviews, merged.
 *
 * @param {object} params - Filter/pagination options.
 * @param {object} options - Extra react-query options.
 * @return {object} Query state plus rows and counts.
 */
export function useFlaggedContent(params = {}, options = {}) {
  const query = useQuery({
    queryKey: ["flaggedContent", params],
    queryFn: () => fetchFlaggedContentFromFirestore(params),
    ...options,
  });

  return {
    ...query,
    flagged: query.data?.items ?? [],
    totalCount: query.data?.total ?? 0,
    totalPages: query.data?.totalPages ?? 1,
    counts: query.data?.counts ?? null,
  };
}
