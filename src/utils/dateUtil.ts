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
 * Tarih aralığı uzunluğuna göre granularity tahmini
 * Akıllı granularity belirleme: Kullanıcının seçim tipine göre uygun gösterim
 * @param after Başlangıç tarihi (YYYY-MM-DD)
 * @param before Bitiş tarihi (YYYY-MM-DD)
 * @returns Tahmin edilen granularity
 */
export function estimateGranularity(
  after: string,
  before: string
): "daily" | "monthly" {
  const afterDate = parseDate(after);
  const beforeDate = parseDate(before);
  const days = differenceInDays(beforeDate, afterDate) + 1;

  // Tarih aralığı analizi
  const afterDay = afterDate.getDate();
  const beforeDay = beforeDate.getDate();
  const afterMonth = afterDate.getMonth();
  const beforeMonth = beforeDate.getMonth();
  const afterYear = afterDate.getFullYear();
  const beforeYear = beforeDate.getFullYear();

  // Yıl seçimi kontrolü (1 yıldan fazla)
  if (days > 365) {
    return "monthly"; // Birden fazla yıl → Aylık göster
  }

  // Tam yıl seçimi kontrolü (örn: 01.01.2024 - 31.12.2024)
  if (
    afterDay === 1 &&
    afterMonth === 0 && // Ocak
    beforeDay === 31 &&
    beforeMonth === 11 && // Aralık
    days >= 365
  ) {
    return "monthly"; // Tam yıl → Aylık göster
  }

  // Birkaç ay seçimi kontrolü (2 aydan fazla)
  if (days > 60) {
    return "monthly"; // 2+ ay → Aylık göster
  }

  // Tam ay seçimi kontrolü (örn: 01.03.2025 - 31.03.2025)
  const isFullMonth =
    afterDay === 1 &&
    afterMonth === beforeMonth &&
    beforeDay >= 28 && // Şubat için 28, diğerleri için 30-31
    days >= 28 &&
    days <= 31;

  if (isFullMonth && days >= 28) {
    return "daily"; // Tek tam ay → Günlük göster
  }

  // Hafta seçimi kontrolü (5-10 gün arası)
  if (days >= 5 && days <= 10) {
    return "daily"; // Haftalık seçim → Günlük göster
  }

  // Kısa seçimler (1-4 gün)
  if (days <= 4) {
    return "daily"; // Çok kısa → Günlük göster
  }

  // Orta uzunluk seçimler (11-60 gün)
  if (days <= 60) {
    return "daily"; // 2 aya kadar → Günlük göster
  }

  // Default: Günlük
  return "daily";
}
