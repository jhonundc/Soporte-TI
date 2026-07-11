"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { defaultQueryOptions, QUERY_STALE_TIME } from "@/lib/query-config";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
<<<<<<< HEAD
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutos
        gcTime: 30 * 60 * 1000, // 30 minutos
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: (failureCount) => failureCount < 2,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
=======
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            ...defaultQueryOptions,
            staleTime: QUERY_STALE_TIME.lists,
            gcTime: 15 * 60 * 1000,
          },
        },
      })
>>>>>>> 730492ed4a0e4fe8e1003e665c1386ac4efaa3ce
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
