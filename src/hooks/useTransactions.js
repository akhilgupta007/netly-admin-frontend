"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchTransactionsFromFirestore,
  fetchTransactionByIdFromFirestore,
} from "@/services/firestoreServices";

const EMPTY = { items: [], total: 0, totalPages: 1 };

/**
 * Paginated transactions (bookings with payment detail).
 * @param {object} params - Search / filter / pagination options.
 * @return {object} Rows and query state.
 */
export function useTransactions(params = {}) {
  const query = useQuery({
    queryKey: ["transactions", params],
    queryFn: () => fetchTransactionsFromFirestore(params),
    staleTime: 1000 * 30,
  });
  const result = query.data || EMPTY;
  return {
    transactions: result.items,
    total: result.total,
    totalPages: result.totalPages,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * One transaction by booking id.
 * @param {string} id - Booking document id.
 * @return {object} The transaction and query state.
 */
export function useTransaction(id) {
  const query = useQuery({
    queryKey: ["transaction", id],
    queryFn: () => fetchTransactionByIdFromFirestore(id),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
  return {
    transaction: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    notFound: query.isSuccess && query.data === null,
  };
}
