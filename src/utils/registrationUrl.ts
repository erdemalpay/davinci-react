import { PublicRoutes } from "../navigation/constants";
import { RegistrationSource } from "../types/tournament";

// Herkese açık turnuva kayıt formu; source başvurunun nereden geldiğini gösterir
export const registrationUrl = (slug: string, source: RegistrationSource) =>
  `${window.location.origin}/tournament/${slug}?source=${source}`;

// Kasadaki QR'ın ve afişteki QR'ın açtığı herkese açık etkinlikler sayfası
export const eventsUrl = () =>
  `${window.location.origin}${PublicRoutes.Events}`;
