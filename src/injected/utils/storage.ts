/**
 * User Account Storage Isolation Service
 * Prefixes localStorage keys with the active Google Account email or profile index.
 * Falls back transparently to global keys in test or pre-login environments.
 */

export function getActiveUserIdentifier(): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return '';
  }

  try {
    // 1. Try to extract email from Google Account button aria-label or data attributes
    const accountButton = document.querySelector<HTMLElement>(
      'header a[href*="SignOutOptions"], [data-email], a[aria-label*="@"], div[aria-label*="@"]'
    );

    if (accountButton) {
      const emailAttr = accountButton.getAttribute('data-email');
      if (emailAttr && emailAttr.includes('@')) {
        return emailAttr.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      }

      const ariaLabel = accountButton.getAttribute('aria-label') || '';
      const emailMatch = ariaLabel.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        return emailMatch[1].toLowerCase().replace(/[^a-z0-9_]/g, '_');
      }
    }

    // 2. Extract multi-account path index from URL (/calendar/u/0/r)
    const pathMatch = window.location.pathname.match(/\/calendar\/u\/(\d+)\//);
    if (pathMatch) {
      return `u${pathMatch[1]}`;
    }
  } catch (_) {
    // Fallback on any error
  }

  return '';
}

export function getIsolatedKey(baseKey: string, customUserId?: string | null): string {
  const userId = customUserId !== undefined ? (customUserId || '') : getActiveUserIdentifier();
  return userId ? `gcal_${userId}_${baseKey.replace(/^gcal_/, '')}` : baseKey;
}

export function getIsolatedItem(baseKey: string, customUserId?: string | null): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const isolatedKey = getIsolatedKey(baseKey, customUserId);
    const isolatedVal = localStorage.getItem(isolatedKey);
    if (isolatedVal !== null) return isolatedVal;

    // Fallback to legacy un-prefixed key
    return localStorage.getItem(baseKey);
  } catch {
    return null;
  }
}

export function setIsolatedItem(baseKey: string, value: string, customUserId?: string | null): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const isolatedKey = getIsolatedKey(baseKey, customUserId);
    localStorage.setItem(isolatedKey, value);
    // Also mirror to baseKey for backwards compatibility if no user detected
    if (isolatedKey === baseKey) {
      localStorage.setItem(baseKey, value);
    }
  } catch (_) {}
}

export function removeIsolatedItem(baseKey: string, customUserId?: string | null): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const isolatedKey = getIsolatedKey(baseKey, customUserId);
    localStorage.removeItem(isolatedKey);
    if (isolatedKey !== baseKey) {
      localStorage.removeItem(baseKey);
    }
  } catch (_) {}
}
