"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchDisputesFromFirestore,
  fetchDisputeByIdFromFirestore,
  fetchDisputeChatFromFirestore,
  fetchDisputeThreadFromFirestore,
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
 * The dispute's own group chat — client, provider and NETLY support.
 *
 * This is the thread an admin acts on. useDisputeChat below returns the
 * separate booking conversation, which the panel shows read-only for context.
 *
 * @param {object} dispute - The dispute record.
 * @return {object} Query state plus messages.
 */
export function useDisputeThread(dispute) {
  const query = useQuery({
    queryKey: ["disputeThread", dispute?.id],
    queryFn: () =>
      fetchDisputeThreadFromFirestore({
        disputeId: dispute.id,
        clientId: dispute.clientId,
        providerId: dispute.providerId,
      }),
    enabled: Boolean(dispute?.id),
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

/**
 * The booking conversation between the client and provider.
 *
 * Shown read-only alongside the dispute thread for context. Polled rather than
 * live: a reviewer needs it to move while they read, without a listener.
 *
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
