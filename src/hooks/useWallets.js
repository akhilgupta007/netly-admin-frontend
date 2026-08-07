"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchPayoutLogsFromFirestore,
  fetchWalletCreditRequestsFromFirestore,
  fetchWalletHistoryFromFirestore,
  fetchWalletsFromFirestore,
  fetchWithdrawalRequestsFromFirestore,
} from "@/services/firestoreServices";

const EMPTY = { items: [], total: 0, totalPages: 1 };

/**
 * Wallet balances across clients and providers.
 * @param {object} params - Search / filter / pagination options.
 * @param {object} options - Extra react-query options.
 * @return {object} Wallet rows and query state.
 */
export function useWallets(params = {}, options = {}) {
  const query = useQuery({
    queryKey: ["wallets", params],
    queryFn: () => fetchWalletsFromFirestore(params),
    staleTime: 1000 * 30,
    ...options,
  });
  const result = query.data || EMPTY;
  return {
    wallets: result.items,
    total: result.total,
    totalPages: result.totalPages,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * The wallet credit (refund) approval queue.
 * @param {object} params - Search / filter / pagination options.
 * @param {object} options - Extra react-query options.
 * @return {object} Request rows and query state.
 */
export function useWalletCreditRequests(params = {}, options = {}) {
  const query = useQuery({
    queryKey: ["walletCreditRequests", params],
    queryFn: () => fetchWalletCreditRequestsFromFirestore(params),
    staleTime: 1000 * 30,
    ...options,
  });
  const result = query.data || EMPTY;
  return {
    requests: result.items,
    total: result.total,
    totalPages: result.totalPages,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * Completed provider payouts, written by processFridayPayouts.
 * @param {object} params - Search / filter / pagination options.
 * @param {object} options - Extra react-query options.
 * @return {object} Payout rows and query state.
 */
export function usePayoutLogs(params = {}, options = {}) {
  const query = useQuery({
    queryKey: ["payoutLogs", params],
    queryFn: () => fetchPayoutLogsFromFirestore(params),
    staleTime: 1000 * 60,
    ...options,
  });
  const result = query.data || EMPTY;
  return {
    payouts: result.items,
    total: result.total,
    totalPages: result.totalPages,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * One account's wallet ledger, for the history modal.
 *
 * Only fetches while a wallet is selected.
 * @param {object} wallet - The selected wallet row ({ uid, accountType }).
 * @return {object} Ledger entries and query state.
 */
export function useWalletHistory(wallet) {
  const query = useQuery({
    queryKey: ["walletHistory", wallet?.uid, wallet?.accountType],
    queryFn: () =>
      fetchWalletHistoryFromFirestore({
        uid: wallet.uid,
        accountType: wallet.accountType,
      }),
    enabled: Boolean(wallet?.uid),
    staleTime: 1000 * 30,
  });

  return {
    history: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * Client withdrawal requests awaiting an admin decision.
 *
 * @param {object} params - Filter/pagination options.
 * @param {object} options - Extra react-query options.
 * @return {object} Query state plus rows and queue totals.
 */
export function useWithdrawalRequests(params = {}, options = {}) {
  const query = useQuery({
    queryKey: ["withdrawalRequests", params],
    queryFn: () => fetchWithdrawalRequestsFromFirestore(params),
    ...options,
  });

  return {
    ...query,
    requests: query.data?.items ?? [],
    totalCount: query.data?.total ?? 0,
    totalPages: query.data?.totalPages ?? 1,
    totals: query.data?.totals ?? null,
  };
}
