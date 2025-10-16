import { Notification } from "../types";

export const getNotificationLanguageMessage = (
  userLang: string | undefined,
  notification: Notification
) => {
  const lang = userLang;

  return lang === "tr-TR"
    ? notification.messageTr || notification.message
    : notification.messageEn || notification.message;
};
