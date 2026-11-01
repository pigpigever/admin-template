import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import { type Locale } from "@/i18n";

export const antdLocales: Record<Locale, typeof enUS> = {
  en: enUS,
  zh: zhCN,
};
