const ONBOARDING_STORAGE_KEY_PREFIX = "davinci_onboarding_last_seen";

function getOnboardingStorageKey(userId: string) {
  return `${ONBOARDING_STORAGE_KEY_PREFIX}_${userId}`;
}

export function getSeenReleaseIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(getOnboardingStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

export function markReleaseSeen(userId: string, releaseId: string) {
  const seen = getSeenReleaseIds(userId);
  if (!seen.includes(releaseId)) {
    seen.push(releaseId);
  }
  localStorage.setItem(getOnboardingStorageKey(userId), JSON.stringify(seen));
}

/**
 * localStorage.clear() öncesi tüm onboarding key'lerini yedekler,
 * clear sonrası geri yazar. Böylece hiçbir kullanıcının kaydı kaybolmaz.
 */
export function clearLocalStoragePreservingOnboarding() {
  const backup: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(ONBOARDING_STORAGE_KEY_PREFIX)) {
      backup[key] = localStorage.getItem(key)!;
    }
  }
  localStorage.clear();
  Object.entries(backup).forEach(([k, v]) => localStorage.setItem(k, v));
}
