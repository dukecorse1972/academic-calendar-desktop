/**
 * Safe DOM manipulation helpers compatible with strict Content Security Policy (CSP)
 * and Trusted Types required by Google Calendar.
 */

let trustedPolicy: { createHTML: (html: string) => any } | null = null;

try {
  if (typeof window !== 'undefined' && (window as any).trustedTypes?.createPolicy) {
    trustedPolicy = (window as any).trustedTypes.createPolicy('gcal-safe-policy', {
      createHTML: (s: string) => s
    });
  }
} catch {
  // Policy may already exist or creation restricted by CSP
}

/**
 * Safely sets the innerHTML of an element, adhering to Trusted Types if enforced.
 */
export function safeSetInnerHTML(element: Element, html: string): void {
  // 1. Try using the trusted policy if available
  if (trustedPolicy) {
    try {
      element.innerHTML = trustedPolicy.createHTML(html);
      return;
    } catch {
      // Fall through to contextual fragment / DOMParser
    }
  }

  // 2. Try standard innerHTML (works if CSP header stripped)
  try {
    element.innerHTML = html;
    return;
  } catch {
    // Fall through
  }

  // 3. Fallback: Parse via DOMParser and append child nodes directly
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    element.textContent = '';
    while (doc.body.firstChild) {
      element.appendChild(doc.body.firstChild);
    }
  } catch (err) {
    console.error('[DOM Utils] Failed to set HTML safely:', err);
  }
}

/**
 * Safely escapes HTML special characters to prevent DOM-based XSS when interpolating
 * dynamic strings into HTML templates.
 */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
