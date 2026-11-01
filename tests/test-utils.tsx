import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import {
  RouterProvider,
  createMemoryHistory,
} from "@tanstack/react-router";
import { App as AntdApp } from "antd";
import { I18nProvider } from "@/i18n";
import { createAppRouter } from "@/lib/router";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactNode,
  { queryClient = createTestQueryClient() } = {}
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AntdApp>{ui}</AntdApp>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export function renderRoute(
  route: string,
  { queryClient = createTestQueryClient() } = {}
) {
  const router = createAppRouter(queryClient, {
    history: createMemoryHistory({ initialEntries: [route] }),
  });
  render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AntdApp>
          <RouterProvider router={router} />
        </AntdApp>
      </I18nProvider>
    </QueryClientProvider>
  );
  return { router, queryClient };
}
