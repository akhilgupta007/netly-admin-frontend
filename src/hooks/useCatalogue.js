"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchCategoriesFromFirestore,
  fetchCommissionSettingsFromFirestore,
  fetchFeeHistoryFromFirestore,
} from "@/services/firestoreServices";

/**
 * The service catalogue — categories with their sub-services and usage counts.
 *
 * @param {object} options - Extra react-query options.
 * @return {object} Query state plus the categories.
 */
export function useCategories(options = {}) {
  const query = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategoriesFromFirestore,
    ...options,
  });

  return { ...query, categories: query.data ?? [] };
}

/**
 * The platform's fee rates.
 *
 * @param {object} options - Extra react-query options.
 * @return {object} Query state plus the rates.
 */
export function useCommissionSettings(options = {}) {
  const query = useQuery({
    queryKey: ["commissionSettings"],
    queryFn: fetchCommissionSettingsFromFirestore,
    ...options,
  });

  return { ...query, settings: query.data ?? null };
}

/**
 * Rate-change history, sourced from the audit log.
 *
 * @param {object} options - Extra react-query options.
 * @return {object} Query state plus the entries.
 */
export function useFeeHistory(options = {}) {
  const query = useQuery({
    queryKey: ["feeHistory"],
    queryFn: () => fetchFeeHistoryFromFirestore(),
    ...options,
  });

  return { ...query, history: query.data ?? [] };
}
