export const QUERY_STALE_TIME = {
  session: 10 * 60 * 1000,
  catalogs: 10 * 60 * 1000,
  lists: 2 * 60 * 1000,
} as const;

export const defaultQueryOptions = {
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  retry: 1,
} as const;
