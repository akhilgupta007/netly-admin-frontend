"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchPayoutQueueFromFirestore,
  fetchFinanceReportsFromFirestore,
  fetchMonthlyAccountingFromFirestore,
  fetchFeeReportFromFirestore,
} from "@/services/firestoreServices";

/**
 * Provider payout queue — who is owed what under the weekly model.
 *
 * @param {object} params - Filter/pagination options.
 * @param {object} options - Extra react-query options, e.g. {enabled}.
 * @return {object} Query state plus rows and totals.
 */
export function usePayoutQueue(params = {}, options = {}) {
  const query = useQuery({
    queryKey: ["payoutQueue", params],
    queryFn: () => fetchPayoutQueueFromFirestore(params),
    ...options,
  });

  return {
    ...query,
    payouts: query.data?.items ?? [],
    totalCount: query.data?.totalCount ?? 0,
    totalPages: query.data?.totalPages ?? 1,
    totals: query.data?.totals ?? null,
  };
}

/**
 * All four finance report tabs share one aggregation over bookings.
 *
 * @param {object} params - {startDate, endDate}.
 * @param {object} options - Extra react-query options.
 * @return {object} Query state plus the four series and totals.
 */
export function useFinanceReports(params = {}, options = {}) {
  const query = useQuery({
    queryKey: ["financeReports", params],
    queryFn: () => fetchFinanceReportsFromFirestore(params),
    ...options,
  });

  return {
    ...query,
    volume: query.data?.volume ?? [],
    revenue: query.data?.revenue ?? [],
    funding: query.data?.funding ?? [],
    refunds: query.data?.refunds ?? [],
    totals: query.data?.totals ?? null,
  };
}

/**
 * Monthly accounting — transaction list plus a 12-month roll-up.
 *
 * @param {object} params - {searchTerm, year, page, limit}.
 * @param {object} options - Extra react-query options.
 * @return {object} Query state plus rows and the month series.
 */
export function useMonthlyAccounting(params = {}, options = {}) {
  const query = useQuery({
    queryKey: ["monthlyAccounting", params],
    queryFn: () => fetchMonthlyAccountingFromFirestore(params),
    ...options,
  });

  return {
    ...query,
    transactions: query.data?.items ?? [],
    totalCount: query.data?.totalCount ?? 0,
    totalPages: query.data?.totalPages ?? 1,
    months: query.data?.months ?? [],
  };
}

/**
 * Fee report — platform take split by side.
 *
 * @param {object} params - {startDate, endDate}.
 * @param {object} options - Extra react-query options.
 * @return {object} Query state plus series and totals.
 */
export function useFeeReport(params = {}, options = {}) {
  const query = useQuery({
    queryKey: ["feeReport", params],
    queryFn: () => fetchFeeReportFromFirestore(params),
    ...options,
  });

  return {
    ...query,
    series: query.data?.series ?? [],
    totals: query.data?.totals ?? null,
  };
}
