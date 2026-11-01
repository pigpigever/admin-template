import { createRouter, type RouterHistory } from "@tanstack/react-router";
import { type QueryClient } from "@tanstack/react-query";
import { queryClient as defaultQueryClient } from "./query-client";
import { routeTree } from "@/routeTree.gen";

interface CreateAppRouterOptions {
  history?: RouterHistory;
}

export function createAppRouter(
  queryClient: QueryClient = defaultQueryClient,
  { history }: CreateAppRouterOptions = {}
) {
  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
    ...(history ? { history } : {}),
  });
  return router;
}

export type AppRouter = ReturnType<typeof createAppRouter>;
