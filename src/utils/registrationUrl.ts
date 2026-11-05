import { RegistrationSource } from "../types/tournament";

// Herkese açık turnuva kayıt formu; source başvurunun nereden geldiğini gösterir
export const registrationUrl = (slug: string, source: RegistrationSource) =>
  `${window.location.origin}/tournament/${slug}?source=${source}`;
