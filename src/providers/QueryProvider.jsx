"use client";

import React, { useState } from "react";
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

export default function QueryProvider({ children }) {
  const [queryClient] = useState(() => {
    // The notification bell lists what is still waiting on an admin — open
    // disputes, pending refunds, unreviewed KYC. Resolving one of those is
    // always a mutation, so any successful mutation may have just emptied a
    // row from that list.
    //
    // Doing this here rather than in each action's onSuccess means the bell
    // cannot fall out of step with a screen someone adds later, and costs one
    // lightweight query per action.
    const mutationCache = new MutationCache({
      onSuccess: () => {
        client.invalidateQueries({ queryKey: ["adminNotifications"] });
      },
    });

    const client = new QueryClient({
      mutationCache,
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutes cache
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
    });

    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
