import {
  differenceInDays,
  endOfDay,
  endOfISOWeek,
  endOfMonth,
  format,
  parse,
  startOfDay,
  startOfISOWeek,
  startOfMonth,
  subMonths,
  subWeeks,
} from "date-fns";

const DATE_FORMAT = "yyyy-MM-dd";

export enum DateFilter {
  SINGLE_DAY = "1",
  THIS_WEEK = "2",
  LAST_WEEK = "3",
  THIS_MONTH = "4",
  LAST_MONTH = "5",
  MANUAL = "0",
}

export function formatDate(date: Date) {
  return format(date, DATE_FORMAT);
}

export function parseDate(date?: string) {
  if (!date) return new Date();
  return parse(date, DATE_FORMAT, new Date());
}

export function isToday(date: string) {
  return formatDate(new Date()) === date;
}

export function getStartEndDates(filter: string) {
  const filterType = filter as DateFilter;
  let startDate = "";
  let endDate;
  if (filterType === DateFilter.SINGLE_DAY) {
    startDate = format(startOfDay(new Date()), DATE_FORMAT);
    endDate = format(endOfDay(new Date()), DATE_FORMAT);
  } else if (filterType === DateFilter.THIS_WEEK) {
    startDate = format(startOfISOWeek(new Date()), DATE_FORMAT);
    endDate = undefined;
  } else if (filterType === DateFilter.LAST_WEEK) {
    startDate = format(startOfISOWeek(subWeeks(new Date(), 1)), DATE_FORMAT);
    endDate = format(endOfISOWeek(subWeeks(new Date(), 1)), DATE_FORMAT);
  } else if (filterType === DateFilter.THIS_MONTH) {
    startDate = format(startOfMonth(new Date()), DATE_FORMAT);
    endDate = undefined;
  } else if (filterType === DateFilter.LAST_MONTH) {
    startDate = format(startOfMonth(subMonths(new Date(), 1)), DATE_FORMAT);
    endDate = format(endOfMonth(subMonths(new Date(), 1)), DATE_FORMAT);
  } else if (filterType === DateFilter.MANUAL) {
    // Do nothing
  }
  return { startDate, endDate };
}

/**
 * Seçilen dönem ile aynı uzunlukta geçmiş dönemi hesaplar
 * Örnek: 1 Kas - 29 Kas seçilirse → 1 Eki - 29 Eki döndürür
 * @param primaryAfter Başlangıç tarihi (YYYY-MM-DD)
 * @param primaryBefore Bitiş tarihi (YYYY-MM-DD)
 * @returns Önceki dönemin başlangıç ve bitiş tarihleri
 */
export function calculatePreviousPeriod(
  primaryAfter: string,
  primaryBefore: string
): { secondaryAfter: string; secondaryBefore: string } {
  const afterDate = parseDate(primaryAfter);
  const beforeDate = parseDate(primaryBefore);

  // Dönem uzunluğunu hesapla (gün cinsinden)
  const periodLength = differenceInDays(beforeDate, afterDate) + 1;

  // Akıllı periyot belirleme
  // 1-7 gün: Haftalık (7 gün geriye)
  // 8-35 gün: Aylık (1 ay geriye)
  // 36-60 gün: 2 Aylık (2 ay geriye)
  // 60+ gün: Yıllık (1 yıl geriye)

  if (periodLength <= 7) {
    // 7 gün veya daha az: 1 hafta geriye git
    const secondaryAfter = subWeeks(afterDate, 1);
    const secondaryBefore = subWeeks(beforeDate, 1);

    return {
      secondaryAfter: formatDate(secondaryAfter),
      secondaryBefore: formatDate(secondaryBefore),
    };
  } else if (periodLength <= 35) {
    // 8-35 gün arası: 1 ay geriye git
    const secondaryAfter = subMonths(afterDate, 1);
    const secondaryBefore = subMonths(beforeDate, 1);

    return {
      secondaryAfter: formatDate(secondaryAfter),
      secondaryBefore: formatDate(secondaryBefore),
    };
  } else if (periodLength <= 60) {
    // 36-60 gün arası: 2 ay geriye git
    const secondaryAfter = subMonths(afterDate, 2);
    const secondaryBefore = subMonths(beforeDate, 2);

    return {
      secondaryAfter: formatDate(secondaryAfter),
      secondaryBefore: formatDate(secondaryBefore),
    };
  } else {
    // 60+ gün: Yıllık karşılaştırma yapmak daha mantıklı
    // Aylık hesaplama yerine 1 yıl geriye git
    const secondaryAfter = subMonths(afterDate, 12);
    const secondaryBefore = subMonths(beforeDate, 12);

    return {
      secondaryAfter: formatDate(secondaryAfter),
      secondaryBefore: formatDate(secondaryBefore),
    };
  }
}

/**
 * Tarih aralığı uzunluğuna göre granularity tahmini (backend zaten belirliyor, bu opsiyonel)
 * @param after Başlangıç tarihi (YYYY-MM-DD)
 * @param before Bitiş tarihi (YYYY-MM-DD)
 * @returns Tahmin edilen granularity
 */
export function estimateGranularity(
  after: string,
  before: string
): "daily" | "weekly" | "monthly" {
  const afterDate = parseDate(after);
  const beforeDate = parseDate(before);
  const days = differenceInDays(beforeDate, afterDate) + 1;

  if (days <= 7) {
    return "daily";
  } else if (days <= 60) {
    return "weekly";
  } else {
    return "monthly";
  }
}
