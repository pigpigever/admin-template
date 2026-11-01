import { createRouter } from "@tanstack/react-router";
import { type QueryClient } from "@tanstack/react-query";
import { queryClient as defaultQueryClient } from "./query-client";
import { routeTree } from "@/routeTree.gen";

export function createAppRouter(queryClient: QueryClient = defaultQueryClient) {
  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
  });
  return router;
}

export type AppRouter = ReturnType<typeof createAppRouter>;
