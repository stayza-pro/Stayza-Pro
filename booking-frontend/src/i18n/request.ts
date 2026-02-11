import enMessages from "@/messages/en.json";
import frMessages from "@/messages/fr.json";
import ptMessages from "@/messages/pt.json";
import { defaultLocale, normalizeLocale, type AppLocale } from "./routing";

type MessageDictionary = Record<string, unknown>;

const messagesByLocale: Record<AppLocale, MessageDictionary> = {
  en: enMessages as MessageDictionary,
  fr: frMessages as MessageDictionary,
  pt: ptMessages as MessageDictionary,
};

export const getMessagesForLocale = (locale?: string | null): MessageDictionary => {
  const normalized = normalizeLocale(locale);
  return messagesByLocale[normalized] ?? messagesByLocale[defaultLocale];
};

export default async function getRequestConfig(locale?: string | null) {
  const normalizedLocale = normalizeLocale(locale);

  return {
    locale: normalizedLocale,
    messages: getMessagesForLocale(normalizedLocale),
  };
}
