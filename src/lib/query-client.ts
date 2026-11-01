import { QueryClient } from "@tanstack/react-query";
import { QUERY_STALE_TIME_MS } from "@/constants/timing";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 minutes
      staleTime: QUERY_STALE_TIME_MS,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
