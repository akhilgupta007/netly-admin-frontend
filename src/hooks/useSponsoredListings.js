"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSponsoredListingsFromFirestore } from "@/services/firestoreServices";

const EMPTY = {
  items: [],
  total: 0,
  totalPages: 1,
  counts: {
    total: 0,
    active: 0,
    inactive: 0,
    expired: 0,
    websiteClicks: 0,
    callClicks: 0,
    expiringSoon: 0,
  },
};

/**
 * Admin-created sponsored listings.
 *
 * @param {object} params - Search / filter / pagination options.
 * @param {object} options - Extra react-query options.
 * @return {object} Rows, counts and query state.
 */
export function useSponsoredListings(params = {}, options = {}) {
  const query = useQuery({
    queryKey: ["sponsoredListings", params],
    queryFn: () => fetchSponsoredListingsFromFirestore(params),
    staleTime: 1000 * 30,
    ...options,
  });

  const data = query.data || EMPTY;

  return {
    ...query,
    listings: data.items ?? [],
    total: data.total ?? 0,
    totalPages: data.totalPages ?? 1,
    counts: data.counts ?? EMPTY.counts,
  };
}
