import { defineConfig } from "@lingui/conf";

export default defineConfig({
  locales: ["en", "zh"],
  format: "po",
  sourceLocale: "en",
  fallbackLocales: {
    default: "en",
  },
  catalogs: [
    {
      path: "<rootDir>/src/i18n/locales/{locale}/messages",
      include: ["src"],
      exclude: ["**/node_modules/**"],
    },
  ],
});
