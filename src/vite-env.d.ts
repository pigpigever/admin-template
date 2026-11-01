/// <reference types="vite/client" />

declare module "*.po" {
  import { type Messages } from "@lingui/core";
  export const messages: Messages;
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
