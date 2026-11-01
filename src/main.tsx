import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, App as AntdApp } from "antd";
import enUS from "antd/locale/en_US";
import dayjs from "dayjs";

import "@tanstack/react-query-devtools";

import { createAppRouter } from "@/lib/router";
import { queryClient } from "@/lib/query-client";
import { I18nProvider } from "@/i18n";
import { cssVar } from "@/lib/theme";
import { env } from "@/lib/env";
import "@/lib/request";
import "dayjs/locale/en";
import "./index.css";

// Init router with query client context
const router = createAppRouter(queryClient);

// Theme color source of truth: `@theme` block in src/index.css
const primaryColor = cssVar("--color-primary");

dayjs.locale("en");
document.title = env.VITE_APP_TITLE;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ConfigProvider
          locale={enUS}
          theme={{
            token: {
              colorPrimary: primaryColor || undefined,
              borderRadius: 6,
            },
          }}
        >
          <AntdApp>
            <RouterProvider router={router} />
          </AntdApp>
        </ConfigProvider>
      </I18nProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
