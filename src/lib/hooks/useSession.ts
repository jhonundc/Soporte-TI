"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSessionClient } from "@/lib/auth/session-client";
import { queryKeys } from "@/lib/query-keys";

export function useSession() {
  return useQuery({
    queryKey: queryKeys.session(),
    queryFn: fetchSessionClient,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
