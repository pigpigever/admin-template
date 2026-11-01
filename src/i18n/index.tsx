import { i18n } from "@lingui/core";
import { I18nProvider as LinguiI18nProvider } from "@lingui/react";
import { messages as enMessages } from "./locales/en/messages.po";
import { messages as zhMessages } from "./locales/zh/messages.po";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { ConfigProvider } from "antd";
import dayjs from "dayjs";
import { antdLocales } from "@/constants/locale";

export type Locale = "en" | "zh";

i18n.load({
  en: enMessages,
  zh: zhMessages,
});
i18n.activate("en");

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    i18n.activate(newLocale);
    dayjs.locale(newLocale === "zh" ? "zh-cn" : "en");
    document.documentElement.lang = newLocale;
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return (
    <LinguiI18nProvider i18n={i18n}>
      <I18nContext.Provider value={value}>
        <ConfigProvider locale={antdLocales[locale]}>
          {children}
        </ConfigProvider>
      </I18nContext.Provider>
    </LinguiI18nProvider>
  );
}

// Re-export useLingui for convenience
export { useLingui } from "@lingui/react";
