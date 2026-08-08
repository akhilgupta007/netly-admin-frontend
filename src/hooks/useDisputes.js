"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchDisputesFromFirestore,
  fetchDisputeByIdFromFirestore,
  fetchDisputeChatFromFirestore,
} from "@/services/firestoreServices";

/**
 * All disputes, newest first.
 * @return {object} Disputes and query state.
 */
export function useDisputes() {
  const query = useQuery({
    queryKey: ["disputes"],
    queryFn: fetchDisputesFromFirestore,
    staleTime: 1000 * 30,
  });
  return {
    disputes: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * One dispute by id.
 * @param {string} id - Dispute document id.
 * @return {object} The dispute and query state.
 */
export function useDispute(id) {
  const query = useQuery({
    queryKey: ["dispute", id],
    queryFn: () => fetchDisputeByIdFromFirestore(id),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
  return {
    dispute: query.data || null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    notFound: query.isSuccess && query.data === null,
  };
}

/**
 * The chat thread behind a dispute.
 *
 * Polled rather than live: a compliance reviewer needs the conversation to move
 * while they read it, and one-shot reads keep us off realtime listeners.
 * @param {object} dispute - The dispute, for its bookingId and clientId.
 * @return {object} Thread messages and query state.
 */
export function useDisputeChat(dispute) {
  const query = useQuery({
    queryKey: ["disputeChat", dispute?.bookingId],
    queryFn: () =>
      fetchDisputeChatFromFirestore({
        bookingId: dispute.bookingId,
        clientId: dispute.clientId,
        // Needed to resolve the direct_{client}_{provider} thread id.
        providerId: dispute.providerId,
      }),
    enabled: Boolean(dispute?.bookingId),
    refetchInterval: 15000,
    staleTime: 1000 * 10,
  });
  return {
    chatId: query.data?.chatId || null,
    messages: query.data?.messages || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  };
}
