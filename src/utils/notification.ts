import { Notification } from "../types";
import i18n from "./i18n";

export const getNotificationLanguageMessage = (
  userLang: string | undefined,
  notification: Notification
) => {
  const lang = userLang === "tr-TR" ? "tr" : "en";
  if (typeof notification.message === "string") {
    return notification.message;
  }

  const { key, params } = notification.message;
  return i18n.t(key, { ...params, lng: lang });
};
